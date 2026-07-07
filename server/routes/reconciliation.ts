import express, { Router } from 'express';
import { db } from '../db';
import { authMiddleware, getDeveloper } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

// Get reconciliation data
router.get('/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, networkCode, startDate, endDate, page = 1, pageSize = 20 } = req.query as Record<string, string>;

    const today = new Date();
    const start = startDate || new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0];
    const end = endDate || today.toISOString().split('T')[0];

    // Get SDK reported data
    let sdkQuery = db.from('report_daily').select('*').eq('developer_id', developerId).gte('stat_date', start).lte('stat_date', end);
    if (appKey) sdkQuery = sdkQuery.eq('app_key', appKey);

    const { data: sdkData, error: sdkError } = await sdkQuery;
    if (sdkError) throw new Error(`SDK query failed: ${sdkError.message}`);

    // Get custom network reported data (as "API" side data for comparison)
    let apiQuery = db.from('custom_network_report').select('*').eq('developer_id', developerId).gte('stat_date', start).lte('stat_date', end);
    if (appKey) apiQuery = apiQuery.eq('app_key', appKey);

    const { data: apiData, error: apiError } = await apiQuery;
    if (apiError) throw new Error(`API query failed: ${apiError.message}`);

    // Build reconciliation by combining data
    const reconciliationMap: Record<string, {
      networkDefId: number;
      statDate: string;
      appKey: string;
      placementId: string;
      sdkImpressions: number;
      apiImpressions: number;
      sdkRevenue: number;
      apiRevenue: number;
    }> = {};

    for (const row of (sdkData || [])) {
      const key = `${row.app_key}_${row.placement_id}_${row.ad_source_id}_${row.stat_date}`;
      if (!reconciliationMap[key]) {
        reconciliationMap[key] = {
          networkDefId: Number(row.ad_source_id),
          statDate: row.stat_date as string,
          appKey: row.app_key as string,
          placementId: row.placement_id as string,
          sdkImpressions: 0,
          apiImpressions: 0,
          sdkRevenue: 0,
          apiRevenue: 0,
        };
      }
      reconciliationMap[key].sdkImpressions += Number(row.impressions || 0);
      reconciliationMap[key].sdkRevenue += Number(row.revenue || 0);
    }

    for (const row of (apiData || [])) {
      const key = `${row.app_key}_${row.placement_id}_${row.network_def_id}_${row.stat_date}`;
      if (!reconciliationMap[key]) {
        reconciliationMap[key] = {
          networkDefId: Number(row.network_def_id),
          statDate: row.stat_date as string,
          appKey: row.app_key as string,
          placementId: row.placement_id as string,
          sdkImpressions: 0,
          apiImpressions: 0,
          sdkRevenue: 0,
          apiRevenue: 0,
        };
      }
      reconciliationMap[key].apiImpressions += Number(row.impressions || 0);
      reconciliationMap[key].apiRevenue += Number(row.revenue || 0);
    }

    let list = Object.values(reconciliationMap);

    if (networkCode) {
      // Filter by network code if needed
      const { data: networkDefs } = await db.from('ad_network_def').select('id').eq('network_code', networkCode);
      const networkIds = (networkDefs || []).map((n: { id: number }) => n.id);
      list = list.filter(item => networkIds.includes(item.networkDefId));
    }

    // Calculate diff rates and status
    const result = list.map(item => {
      const impressionDiff = item.apiImpressions > 0
        ? Number(((item.sdkImpressions - item.apiImpressions) / item.apiImpressions * 100).toFixed(2))
        : 0;
      const revenueDiff = item.apiRevenue > 0
        ? Number(((item.sdkRevenue - item.apiRevenue) / item.apiRevenue * 100).toFixed(2))
        : 0;

      let status = 'pending';
      if (item.apiImpressions > 0 || item.apiRevenue > 0) {
        status = Math.abs(impressionDiff) <= 5 && Math.abs(revenueDiff) <= 5 ? 'matched' : 'abnormal';
      }

      return {
        ...item,
        impressionDiffRate: impressionDiff,
        revenueDiffRate: revenueDiff,
        status,
      };
    });

    // Paginate
    const p = Number(page);
    const ps = Number(pageSize);
    const total = result.length;
    const paginated = result.slice((p - 1) * ps, p * ps);

    success(res, { list: paginated, total, page: p, pageSize: ps });
  } catch (err) {
    console.error('Reconciliation list error:', err);
    fail(res, 500, '获取对账数据失败');
  }
});

// Import third-party network report data
router.post('/import', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { rows } = req.body as {
      rows: Array<{
        stat_date: string;
        app_key: string;
        placement_id: string;
        network_def_id: string | number;
        impressions?: number;
        clicks?: number;
        revenue?: number;
        upload_type?: number;
      }>;
    };

    if (!Array.isArray(rows) || rows.length === 0) {
      return fail(res, 400, '导入数据不能为空');
    }

    const records = rows.map((r) => ({
      developer_id: developerId,
      app_key: r.app_key,
      placement_id: r.placement_id,
      network_def_id: Number(r.network_def_id),
      stat_date: r.stat_date,
      impressions: Number(r.impressions) || 0,
      clicks: Number(r.clicks) || 0,
      revenue: Number(r.revenue) || 0,
      upload_type: r.upload_type ?? 1,
    }));

    const { data, error } = await db
      .from('custom_network_report')
      .upsert(records, { onConflict: 'developer_id,app_key,placement_id,network_def_id,stat_date' })
      .select();

    if (error) throw new Error(`导入失败: ${error.message}`);

    success(res, { imported: data?.length || 0 });
  } catch (err) {
    console.error('Reconciliation import error:', err);
    fail(res, 500, (err as Error).message || '导入失败');
  }
});

// Export reconciliation data as CSV
router.get('/export', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { startDate, endDate } = req.query as Record<string, string>;

    const today = new Date();
    const start = startDate || new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0];
    const end = endDate || today.toISOString().split('T')[0];

    const { data, error } = await db
      .from('custom_network_report')
      .select('*')
      .eq('developer_id', developerId)
      .gte('stat_date', start)
      .lte('stat_date', end)
      .order('stat_date', { ascending: false });

    if (error) throw new Error(`查询失败: ${error.message}`);

    // CSV header
    const headers = [
      '日期',
      '应用Key',
      '广告位ID',
      '广告网络ID',
      '网络展示量',
      '网络点击量',
      '网络收益(元)',
      '上传类型',
      '导入时间',
    ];

    // Build CSV with UTF-8 BOM for Excel compatibility
    const escape = (v: unknown): string => {
      if (v == null) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines = [headers.join(',')];
    (data || []).forEach((r: Record<string, unknown>) => {
      lines.push(
        [
          r.stat_date,
          r.app_key,
          r.placement_id,
          r.network_def_id,
          r.impressions,
          r.clicks,
          r.revenue,
          r.upload_type,
          r.created_at,
        ].map(escape).join(','),
      );
    });

    const csv = '\uFEFF' + lines.join('\n');
    const filename = `reconciliation_${start}_${end}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error('Reconciliation export error:', err);
    fail(res, 500, (err as Error).message || '导出失败');
  }
});

// Resolve a reconciliation dispute (mark as resolved with comment)
router.post('/resolve', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, placementId, networkDefId, statDate, comment } = req.body as {
      appKey: string;
      placementId: string;
      networkDefId: number | string;
      statDate: string;
      comment?: string;
    };

    if (!appKey || !placementId || !networkDefId || !statDate) {
      return fail(res, 400, '缺少必填参数');
    }

    // Mark custom_network_report as resolved by appending a comment in changelog field via update
    const { data, error } = await db
      .from('custom_network_report')
      .update({
        upload_type: 3, // 3 = resolved/disputed adjustment
        updated_at: new Date().toISOString(),
      })
      .eq('developer_id', developerId)
      .eq('app_key', appKey)
      .eq('placement_id', placementId)
      .eq('network_def_id', Number(networkDefId))
      .eq('stat_date', statDate)
      .select();

    if (error) throw new Error(`更新失败: ${error.message}`);

    success(res, { resolved: data?.length || 0, comment: comment || null });
  } catch (err) {
    console.error('Reconciliation resolve error:', err);
    fail(res, 500, (err as Error).message || '解决失败');
  }
});

export default router;
