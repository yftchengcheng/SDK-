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

export default router;
