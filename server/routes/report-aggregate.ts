import type { AuthRequest } from '../middleware/auth';
/**
 * 报表聚合 API
 * 路由前缀：/api/v1/console/report
 *
 * - POST /aggregate   聚合查询（综合报表 / 用户行为）
 * - POST /export/csv  导出 CSV
 * - POST /export/excel 导出 Excel（暂以 CSV 实现）
 * - POST /export/pdf  导出 PDF（HTML → PDF 占位）
 */
import { Router, type Request, type Response } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { success as ok, fail } from '../utils/response';
import nodeCache from '../utils/cache';
import { randomUUID } from 'crypto';

const router = Router();
router.use(authMiddleware);

/**
 * 日期范围 → { startDate, endDate } (YYYY-MM-DD)
 */
function dateRangeOf(range: string): { startDate: string; endDate: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const end = new Date(today);
  const start = new Date(today);
  switch (range) {
    case 'today':
      return { startDate: fmt(start), endDate: fmt(end) };
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      return { startDate: fmt(start), endDate: fmt(end) };
    case '7d':
      start.setDate(start.getDate() - 6);
      return { startDate: fmt(start), endDate: fmt(end) };
    case '30d':
      start.setDate(start.getDate() - 29);
      return { startDate: fmt(start), endDate: fmt(end) };
    case 'month': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: fmt(s), endDate: fmt(end) };
    }
    case 'lastMonth': {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: fmt(s), endDate: fmt(e) };
    }
    default:
      start.setDate(start.getDate() - 6);
      return { startDate: fmt(start), endDate: fmt(end) };
  }
}

/**
 * 缓存 key 构造
 */
const cacheKey = (boardId: number | undefined, dimensions: string[], metrics: string[], filters: any, reportType: string): string => {
  return `agg:${reportType}:${boardId || 0}:${dimensions.sort().join(',')}:${metrics.sort().join(',')}:${JSON.stringify(filters || {})}`;
};

/**
 * 模拟聚合（实际场景对接 report_daily + waterfall_data + 用户行为日志）
 * 现在的实现：从 report_daily 读 + group by dimension
 */
async function aggregate(
  dimensions: string[],
  metrics: string[],
  filters: { dateRange?: string; appIds?: string[]; placementIds?: string[]; adSourceIds?: string[] },
  reportType: string,
): Promise<Array<Record<string, string | number>>> {
  const { startDate, endDate } = dateRangeOf(filters.dateRange || '7d');

  // 仅按日期维度（最常见）
  if (dimensions.includes('date') && dimensions.length === 1) {
    const { data, error } = await db
      .from('report_daily')
      .select('stat_date, app_key, placement_id, ad_source_id, region, requests, fills, impressions, clicks, revenue')
      .gte('stat_date', startDate)
      .lte('stat_date', endDate)
      .limit(5000);
    if (error) throw error;

    const buckets = new Map<string, Record<string, string | number>>();
    (data || []).forEach((row: any) => {
      const key = row.stat_date;
      if (!buckets.has(key)) {
        const b: Record<string, string | number> = { date: key };
        metrics.forEach((m) => { b[m] = 0; });
        buckets.set(key, b);
      }
      const b = buckets.get(key)!;
      metrics.forEach((m) => {
        b[m] = (Number(b[m] || 0) + mockMetric(m, row)) as number;
      });
    });
    return Array.from(buckets.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  // 其他维度：返回空数组（占位）
  return [];
}

/**
 * 单 metric 的 mock 值生成（带真实 row 数据）
 */
function mockMetric(code: string, row: any): number {
  if (code === 'revenue_actual') return Number(row.revenue || 0);
  if (code === 'impressions') return Number(row.impressions || 0);
  if (code === 'clicks') return Number(row.clicks || 0);
  if (code === 'requests') return Number(row.requests || 0);
  if (code === 'fill_rate') {
    const req = Number(row.requests || 0);
    const fill = Number(row.fills || 0);
    return req > 0 ? Math.round((fill / req) * 10000) / 100 : 0; // 返回百分比 0-100，保留 2 位小数
  }
  if (code === 'ecpm') {
    const rev = Number(row.revenue || 0);
    const imp = Number(row.impressions || 0);
    return imp > 0 ? Math.round((rev / imp) * 1000 * 100) / 100 : 0;
  }
  // 其他指标：返回真实列的值（如果有）或 0
  if (row[code] !== undefined) return Number(row[code] || 0);
  return 0;
}

/**
 * POST /aggregate
 */
router.post('/aggregate', async (req: Request, res: Response) => {
  try {
    const { board_id, dimensions = ['date'], metrics = [], filters = {}, report_type = 'overview' } = req.body || {};
    if (!Array.isArray(metrics) || metrics.length === 0) {
      return fail(res, 400, '请至少选择一个指标');
    }

    const key = cacheKey(board_id, dimensions, metrics, filters, report_type);
    const cached = nodeCache.get(key);
    if (cached) {
      return ok(res, { rows: cached, cached: true });
    }

    const rows = await aggregate(dimensions, metrics, filters, report_type);
    // 5 分钟缓存
    nodeCache.set(key, rows, 300);
    return ok(res, { rows, cached: false });
  } catch (e: any) {
    console.error('aggregate error:', e);
    return fail(res, 500, e?.message || '查询失败');
  }
});

/**
 * POST /export/csv|excel（占位：CSV 实现）
 */
async function exportCsv(req: any, res: any) {
  try {
    const { board_id, dimensions = ['date'], metrics = [], filters = {} } = req.body || {};
    if (!Array.isArray(metrics) || metrics.length === 0) {
      return fail(res, 400, '请至少选择一个指标');
    }
    const rows = await aggregate(dimensions, metrics, filters, 'overview');
    const dim = dimensions[0] || 'date';
    const head = [dim, ...metrics].join(',');
    const lines = rows.map((row) => [row[dim], ...metrics.map((m: string) => row[m] || 0)].join(','));
    const csv = '\uFEFF' + [head, ...lines].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="report_${Date.now()}.csv"`);
    res.send(csv);
  } catch (e: any) {
    return fail(res, 500, e?.message || '导出失败');
  }
}

router.post('/export/csv', exportCsv);
router.post('/export/excel', exportCsv);

/**
 * POST /export/pdf
 * 生成 HTML，附带下载链接
 * 真实场景：puppeteer 渲染；当前占位返回 HTML 链接
 */
router.post('/export/pdf', async (req: Request, res: Response) => {
  try {
    const { board_id, dimensions = ['date'], metrics = [], filters = {} } = req.body || {};
    const rows = await aggregate(dimensions, metrics, filters, 'overview');
    const dim = dimensions[0] || 'date';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>报表</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; }
table { border-collapse: collapse; width: 100%; margin-top: 16px; }
th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: right; }
th { background: #1E3A8A; color: white; text-align: center; }
</style></head><body>
<h1>数据报表</h1>
<p>导出时间：${new Date().toLocaleString('zh-CN')}</p>
<table><thead><tr><th>${dim}</th>${metrics.map((m: string) => `<th>${m}</th>`).join('')}</tr></thead>
<tbody>${rows.map((r) => `<tr><td>${r[dim]}</td>${metrics.map((m: string) => `<td>${r[m] || 0}</td>`).join('')}</tr>`).join('')}</tbody>
</table></body></html>`;
    // 写到 /tmp，让前端 fetch + blob 下载
    const filename = `report_${randomUUID().slice(0, 8)}.html`;
    const fs = await import('fs');
    fs.writeFileSync(`/tmp/${filename}`, html, 'utf-8');
    // 生产环境必须返回真实 PDF，dev 环境用 HTML 占位
    return ok(res, {
      url: `/api/v1/console/report/export/download/${filename}`,
      format: 'html',
      note: '生产环境应使用 puppeteer 生成 PDF；dev 环境以 HTML 占位',
    });
  } catch (e: any) {
    return fail(res, 500, e?.message || '导出失败');
  }
});

/**
 * GET /export/download/:filename
 * 读取 /tmp 下的导出文件
 */
import path from 'path';
router.get('/export/download/:filename', async (req: Request, res: Response) => {
  const filename = String(req.params.filename || '').replace(/[^a-zA-Z0-9_\-\.]/g, '');
  if (!filename) return fail(res, 400, 'filename invalid');
  const filepath = path.join('/tmp', filename);
  if (!filepath.startsWith('/tmp/')) return fail(res, 400, 'invalid path');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.sendFile(filepath);
});

export default router;
