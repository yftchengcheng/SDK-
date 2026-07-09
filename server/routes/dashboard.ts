import express, { Router } from 'express';
import { db } from '../db';
import { authMiddleware, getDeveloper } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

/**
 * 把日期范围内每一天都补一条记录，无数据的日期用 fillDefaults 补 0。
 * 用于趋势类接口：保证前端 ECharts X 轴连续不出现"只显示一个日期"。
 */
function fillDateRange<T extends { date: string }>(
  rows: T[],
  start: string,
  end: string,
  fillDefaults: Omit<T, 'date'>,
): T[] {
  const map = new Map(rows.map(r => [r.date, r]));
  const filled: T[] = [];
  const startMs = new Date(start + 'T00:00:00Z').getTime();
  const endMs = new Date(end + 'T00:00:00Z').getTime();
  for (let t = startMs; t <= endMs; t += 86400000) {
    const d = new Date(t).toISOString().split('T')[0];
    const found = map.get(d);
    filled.push(found || ({ date: d, ...fillDefaults } as T));
  }
  return filled;
}

/** yyyy-mm-dd (UTC 0 点) */
function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** 给定 UTC 0 点日期，返回 dayOffset 后的日期（offset=-1 即昨天） */
function shiftDate(d: Date, dayOffset: number): Date {
  return new Date(d.getTime() + dayOffset * 86400000);
}

/** 当月 1 号 yyyy-mm-dd */
function startOfMonth(d: Date): string {
  return fmtDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
}

/** 上月 1 号 yyyy-mm-dd */
function startOfLastMonth(d: Date): string {
  return fmtDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)));
}

/** 上月最后一天 yyyy-mm-dd */
function endOfLastMonth(d: Date): string {
  return fmtDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0)));
}

/**
 * 汇总一个日期段内 developer 的总收益 / 展示 / 预估收益 / DAU
 * - revenue / impressions 取自 report_daily 真实列
 * - estimatedRevenue = revenue × 1.0（与已实现收益保持一致；为后续真实接入预留位）
 * - dau = impressions ÷ 100（粗估：平均每 100 次展示折算 1 个 DAU，仅供占位）
 * 说明：report_daily 当前无 dau / estimated_revenue 字段；这两个 metric 在前端
 * 显式标注为「估算」并展示公式，避免给用户造成"真实 DAU"误导。
 */
async function aggregateRange(
  developerId: string,
  start: string,
  end: string,
): Promise<{ revenue: number; impressions: number; estimatedRevenue: number; dau: number }> {
  const { data, error } = await db
    .from('report_daily')
    .select('revenue, impressions')
    .eq('developer_id', developerId)
    .gte('stat_date', start)
    .lte('stat_date', end);
  if (error) throw new Error(`Query failed: ${error.message}`);
  const rows = (data || []) as unknown as Array<Record<string, unknown>>;
  const revenue = Number(rows.reduce((s, r) => s + Number(r.revenue || 0), 0).toFixed(2));
  const impressions = rows.reduce((s, r) => s + Number(r.impressions || 0), 0);
  return {
    revenue,
    impressions,
    estimatedRevenue: Number((revenue * 1.0).toFixed(2)),
    dau: Math.round(impressions / 100),
  };
}

/** metric → report_daily 列名映射 + 估算公式
 * - revenue / impressions : 真实列
 * - estimatedRevenue : revenue × 1.0
 * - dau : impressions ÷ 100
 */
function metricToColumn(m: string): string {
  if (m === 'revenue' || m === 'estimatedRevenue') return 'revenue';
  if (m === 'dau') return 'impressions';
  return 'impressions';
}

/** 把列原始值转换为 metric 最终值（应用估算公式） */
function rawToMetric(m: string, raw: number): number {
  if (m === 'revenue' || m === 'estimatedRevenue') return Number(raw.toFixed(2));
  if (m === 'dau') return Math.round(raw / 100);
  return raw;
}

/** 数字 round 到 metric 精度 */
function roundMetric(m: string, v: number): number {
  if (m === 'revenue' || m === 'estimatedRevenue') return Number(v.toFixed(2));
  return Math.round(v);
}

/** dimension → 实体配置（含表名 / ID 列 / 名称列）
 * - virtual=true 表示该维度在 report_daily 表中无对应列（adType/region/os），
 *   此时 ranking/trend 接口会直接返回空数据，前端按"暂无数据"渲染
 */
interface DimConfig {
  table: string | null;        // 关联 entity 表（用于 enrichNames），null 表示无关联表
  idCol: string;               // entity 表的主键 / 唯一标识列（用于 enrichNames）
  nameCol: string;             // entity 表的友好名列（用于 enrichNames）
  reportCol: string;           // report_daily 中该维度的列名（用于主查询 select / group by）
  virtual: boolean;            // true = 维度不参与聚合（保留兼容，新维度都用 false）
  isSoftDim?: boolean;         // true = report_daily 自带列，无独立 entity 表，id 即 name
}
function dimensionConfig(dim: string): DimConfig | null {
  const map: Record<string, DimConfig> = {
    app:       { table: 'app',       idCol: 'app_key',       nameCol: 'app_name',    reportCol: 'app_key',       virtual: false },
    placement: { table: 'placement', idCol: 'placement_id',  nameCol: 'name',        reportCol: 'placement_id',  virtual: false },
    network:   { table: 'ad_source', idCol: 'id',            nameCol: 'source_name', reportCol: 'ad_source_id',  virtual: false },
    adType:    { table: null,        idCol: 'ad_type',       nameCol: 'ad_type',     reportCol: 'ad_type',       virtual: false, isSoftDim: true },
    region:    { table: null,        idCol: 'region',        nameCol: 'region',      reportCol: 'region',        virtual: false, isSoftDim: true },
    os:        { table: null,        idCol: 'os',            nameCol: 'os',          reportCol: 'os',            virtual: false, isSoftDim: true },
  };
  return map[dim] || null;
}

/** 批量查表，把 entity id 映射为友好名（软维度直接用 id 当 name） */
async function enrichNames(cfg: DimConfig, ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {};
  if (cfg.isSoftDim) {
    const m: Record<string, string> = {};
    for (const id of ids) m[id] = id;
    return m;
  }
  if (!cfg.table) return {};
  const selectCols = cfg.idCol === cfg.nameCol ? cfg.idCol : `${cfg.idCol}, ${cfg.nameCol}`;
  const { data, error } = await db.from(cfg.table).select(selectCols).in(cfg.idCol, ids);
  if (error) {
    console.error(`enrichNames(${cfg.table}) error:`, error.message);
    return {};
  }
  const m: Record<string, string> = {};
  for (const r of (data || []) as unknown as Array<Record<string, unknown>>) {
    m[String(r[cfg.idCol])] = String(r[cfg.nameCol] || r[cfg.idCol]);
  }
  return m;
}

// ============================================================================
// /overview —— 收入详情（昨天 / 前天 / 本月 / 上月）
// ============================================================================
router.get('/overview', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);

    const today = new Date();
    const todayStr = fmtDate(today);
    const yesterdayStr = fmtDate(shiftDate(today, -1));
    const dayBeforeStr = fmtDate(shiftDate(today, -2));

    const thisMonthStart = startOfMonth(today);
    const lastMonthStart = startOfLastMonth(today);
    const lastMonthEnd = endOfLastMonth(today);

    // 并发查 4 个段
    const [yesterday, dayBefore, thisMonth, lastMonth] = await Promise.all([
      aggregateRange(developerId, yesterdayStr, yesterdayStr),
      aggregateRange(developerId, dayBeforeStr, dayBeforeStr),
      aggregateRange(developerId, thisMonthStart, todayStr),
      aggregateRange(developerId, lastMonthStart, lastMonthEnd),
    ]);

    // 4 个 stat-card：每个只含 revenue + 期间
    const stats = [
      {
        key: 'yesterday',
        label: '昨天',
        period: yesterdayStr,
        revenue: yesterday.revenue,
      },
      {
        key: 'dayBefore',
        label: '前天',
        period: dayBeforeStr,
        revenue: dayBefore.revenue,
      },
      {
        key: 'thisMonth',
        label: '本月',
        period: `${thisMonthStart} 至 ${todayStr}`,
        revenue: thisMonth.revenue,
      },
      {
        key: 'lastMonth',
        label: '上月',
        period: `${lastMonthStart} 至 ${lastMonthEnd}`,
        revenue: lastMonth.revenue,
      },
    ];

    success(res, { stats });
  } catch (err) {
    console.error('Dashboard overview error:', err);
    fail(res, 500, '获取收入详情失败');
  }
});

// ============================================================================
// /trend —— 数据趋势（dimension + metric + dateRange）
//   - dimension=summary : 单 series
//   - 其他 dimension   : 多 series（按实体聚合 top 5）
// ============================================================================
router.get('/trend', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { dimension, metric, startDate, endDate } = req.query as Record<string, string>;

    const m = (metric || 'revenue') as string;
    const dim = (dimension || 'summary') as string;
    const metricCol = metricToColumn(m);

    const today = new Date();
    const start = startDate || fmtDate(shiftDate(today, -6));
    const end = endDate || fmtDate(today);

    // summary：单 series
    if (dim === 'summary') {
      const { data, error } = await db
        .from('report_daily')
        .select(`stat_date, ${metricCol}`)
        .eq('developer_id', developerId)
        .gte('stat_date', start)
        .lte('stat_date', end)
        .order('stat_date', { ascending: true });
      if (error) throw new Error(`Query failed: ${error.message}`);

      const map: Record<string, number> = {};
      for (const r of (data || []) as unknown as Array<Record<string, unknown>>) {
        const d = r.stat_date as string;
        map[d] = (map[d] || 0) + Number(r[metricCol] || 0);
      }
      const rows = Object.entries(map).map(([date, v]) => ({ date, value: roundMetric(m, rawToMetric(m, v)) }));
      const filled = fillDateRange(rows, start, end, { value: 0 });
      return success(res, { dimension: dim, metric: m, points: filled });
    }

    // 多 series：按 dimension 聚合
    const cfg = dimensionConfig(dim);
    if (!cfg) return fail(res, 400, `不支持的 dimension: ${dim}`);

    // 软维度（adType/region/os）：report_daily 表中无对应列，直接返回空
    if (cfg.virtual) {
      const dates = fillDateRange<{ date: string; value: number }>([], start, end, { value: 0 }).map((p) => p.date);
      return success(res, { dimension: dim, metric: m, dates, series: [] });
    }

    const { data, error } = await db
      .from('report_daily')
      .select(`stat_date, ${cfg.reportCol}, ${metricCol}`)
      .eq('developer_id', developerId)
      .gte('stat_date', start)
      .lte('stat_date', end)
      .order('stat_date', { ascending: true });
    if (error) throw new Error(`Query failed: ${error.message}`);

    // 1) 找 top 5 实体
    const entityTotals: Record<string, number> = {};
    for (const r of (data || []) as unknown as Array<Record<string, unknown>>) {
      const e = String(r[cfg.reportCol] || 'unknown');
      entityTotals[e] = (entityTotals[e] || 0) + Number(r[metricCol] || 0);
    }
    const topEntities = Object.entries(entityTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([e]) => e);

    // 2) 批量查表取名称
    const nameMap = await enrichNames(cfg, topEntities);

    // 3) 按 entity + date 聚合
    const byEntityDate: Record<string, Record<string, number>> = {};
    for (const r of (data || []) as unknown as Array<Record<string, unknown>>) {
      const e = String(r[cfg.reportCol || cfg.idCol] || 'unknown');
      if (!topEntities.includes(e)) continue;
      const d = r.stat_date as string;
      if (!byEntityDate[e]) byEntityDate[e] = {};
      byEntityDate[e][d] = (byEntityDate[e][d] || 0) + Number(r[metricCol] || 0);
    }

    // 4) 每个 entity 一个 series（X 轴按日期补齐）
    const dates = fillDateRange<{ date: string; value: number }>([], start, end, { value: 0 }).map((p) => p.date);
    const series = topEntities.map((e) => {
      const perDate = byEntityDate[e] || {};
      return {
        name: nameMap[e] || e,
        data: dates.map((d) => roundMetric(m, rawToMetric(m, perDate[d] || 0))),
      };
    });

    return success(res, { dimension: dim, metric: m, dates, series });
  } catch (err) {
    console.error('Dashboard trend error:', err);
    fail(res, 500, '获取趋势数据失败');
  }
});

// ============================================================================
// /ranking/:dimension —— 6 维度排行（dimension + metric + dateRange + limit）
// ============================================================================
router.get('/ranking/:dimension', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const dim = req.params.dimension as string;
    const { metric, startDate, endDate, limit } = req.query as Record<string, string>;

    const m = (metric || 'revenue') as string;
    const cfg = dimensionConfig(dim);
    if (!cfg) return fail(res, 400, `不支持的 dimension: ${dim}`);

    // 软维度（adType/region/os）：report_daily 表中无对应列，直接返回空
    if (cfg.virtual) {
      return success(res, { dimension: dim, metric: m, ranking: [] });
    }

    const metricCol = metricToColumn(m);
    const topN = Math.min(Math.max(Number(limit) || 10, 1), 50);

    const today = new Date();
    const start = startDate || fmtDate(shiftDate(today, -6));
    const end = endDate || fmtDate(today);

    const { data, error } = await db
      .from('report_daily')
      .select(`${cfg.reportCol || cfg.idCol}, ${metricCol}`)
      .eq('developer_id', developerId)
      .gte('stat_date', start)
      .lte('stat_date', end);
    if (error) throw new Error(`Query failed: ${error.message}`);

    const totals: Record<string, number> = {};
    for (const r of (data || []) as unknown as Array<Record<string, unknown>>) {
      const e = String(r[cfg.reportCol || cfg.idCol] || 'unknown');
      totals[e] = (totals[e] || 0) + Number(r[metricCol] || 0);
    }

    // 查 name
    const ids = Object.keys(totals);
    const nameMap = await enrichNames(cfg, ids);

    const ranking = Object.entries(totals)
      .map(([entity, value]) => ({
        entity,
        name: nameMap[entity] || entity,
        value: roundMetric(m, rawToMetric(m, value)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);

    success(res, { dimension: dim, metric: m, ranking });
  } catch (err) {
    console.error('Dashboard ranking error:', err);
    fail(res, 500, '获取排行数据失败');
  }
});

export default router;
