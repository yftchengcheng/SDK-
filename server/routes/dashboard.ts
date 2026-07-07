import express, { Router } from 'express';
import { db } from '../db';
import { authMiddleware, getDeveloper } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

// Dashboard overview
router.get('/overview', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, placementId, startDate, endDate } = req.query as Record<string, string>;

    const today = new Date().toISOString().split('T')[0];
    const start = startDate || today;
    const end = endDate || today;

    let query = db.from('report_daily').select('*').eq('developer_id', developerId).gte('stat_date', start).lte('stat_date', end);
    if (appKey) query = query.eq('app_key', appKey);
    if (placementId) query = query.eq('placement_id', placementId);

    const { data, error } = await query;
    if (error) throw new Error(`Query failed: ${error.message}`);

    const rows = data || [];
    const totalRevenue = rows.reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.revenue || 0), 0);
    const totalImpressions = rows.reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.impressions || 0), 0);
    const totalRequests = rows.reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.requests || 0), 0);
    const totalFills = rows.reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.fills || 0), 0);
    const fillRate = totalRequests > 0 ? (totalFills / totalRequests * 100) : 0;
    const eCPM = totalImpressions > 0 ? (totalRevenue / totalImpressions * 1000) : 0;

    // Active placements
    const activePlacementIds = new Set(rows.filter((r: Record<string, unknown>) => Number(r.impressions || 0) > 0).map((r: Record<string, unknown>) => r.placement_id));

    success(res, {
      todayRevenue: totalRevenue.toFixed(2),
      todayImpressions: totalImpressions,
      fillRate: fillRate.toFixed(2),
      eCPM: eCPM.toFixed(2),
      activePlacements: activePlacementIds.size,
    });
  } catch (err) {
    console.error('Dashboard overview error:', err);
    fail(res, 500, '获取看板数据失败');
  }
});

// Unified trend data (for frontend dashboard)
router.get('/trend', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, placementId, startDate, endDate } = req.query as Record<string, string>;

    const today = new Date();
    const start = startDate || new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const end = endDate || today.toISOString().split('T')[0];

    let query = db.from('report_daily').select('stat_date, revenue, impressions, requests, fills, clicks').eq('developer_id', developerId).gte('stat_date', start).lte('stat_date', end);
    if (appKey) query = query.eq('app_key', appKey);
    if (placementId) query = query.eq('placement_id', placementId);

    const { data, error } = await query.order('stat_date', { ascending: true });
    if (error) throw new Error(`Query failed: ${error.message}`);

    const dateMap: Record<string, { revenue: number; impressions: number; requests: number; fills: number; clicks: number }> = {};
    for (const row of (data || [])) {
      const date = row.stat_date as string;
      if (!dateMap[date]) dateMap[date] = { revenue: 0, impressions: 0, requests: 0, fills: 0, clicks: 0 };
      dateMap[date].revenue += Number(row.revenue || 0);
      dateMap[date].impressions += Number(row.impressions || 0);
      dateMap[date].requests += Number(row.requests || 0);
      dateMap[date].fills += Number(row.fills || 0);
      dateMap[date].clicks += Number(row.clicks || 0);
    }

    const result = Object.entries(dateMap).map(([date, d]) => ({
      date,
      revenue: Number(d.revenue.toFixed(2)),
      impressions: d.impressions,
      fillRate: d.requests > 0 ? Number((d.fills / d.requests * 100).toFixed(2)) : 0,
      eCPM: d.impressions > 0 ? Number((d.revenue / d.impressions * 1000).toFixed(2)) : 0,
      clicks: d.clicks,
    }));
    success(res, result);
  } catch (err) {
    console.error('Dashboard trend error:', err);
    fail(res, 500, '获取趋势数据失败');
  }
});

// Revenue trend
router.get('/revenue-trend', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, startDate, endDate } = req.query as Record<string, string>;

    const today = new Date();
    const start = startDate || new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const end = endDate || today.toISOString().split('T')[0];

    let query = db.from('report_daily').select('stat_date, revenue').eq('developer_id', developerId).gte('stat_date', start).lte('stat_date', end);
    if (appKey) query = query.eq('app_key', appKey);

    const { data, error } = await query.order('stat_date', { ascending: true });
    if (error) throw new Error(`Query failed: ${error.message}`);

    // Aggregate by date
    const dateMap: Record<string, number> = {};
    for (const row of (data || [])) {
      const date = row.stat_date as string;
      dateMap[date] = (dateMap[date] || 0) + Number(row.revenue || 0);
    }

    const result = Object.entries(dateMap).map(([date, revenue]) => ({ date, revenue: Number(revenue.toFixed(2)) }));
    success(res, result);
  } catch (err) {
    console.error('Revenue trend error:', err);
    fail(res, 500, '获取收益趋势失败');
  }
});

// Impressions & fill rate trend
router.get('/impressions-trend', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, startDate, endDate } = req.query as Record<string, string>;

    const today = new Date();
    const start = startDate || new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const end = endDate || today.toISOString().split('T')[0];

    let query = db.from('report_daily').select('stat_date, impressions, requests, fills').eq('developer_id', developerId).gte('stat_date', start).lte('stat_date', end);
    if (appKey) query = query.eq('app_key', appKey);

    const { data, error } = await query.order('stat_date', { ascending: true });
    if (error) throw new Error(`Query failed: ${error.message}`);

    const dateMap: Record<string, { impressions: number; requests: number; fills: number }> = {};
    for (const row of (data || [])) {
      const date = row.stat_date as string;
      if (!dateMap[date]) dateMap[date] = { impressions: 0, requests: 0, fills: 0 };
      dateMap[date].impressions += Number(row.impressions || 0);
      dateMap[date].requests += Number(row.requests || 0);
      dateMap[date].fills += Number(row.fills || 0);
    }

    const result = Object.entries(dateMap).map(([date, d]) => ({
      date,
      impressions: d.impressions,
      fillRate: d.requests > 0 ? Number((d.fills / d.requests * 100).toFixed(2)) : 0,
    }));
    success(res, result);
  } catch (err) {
    console.error('Impressions trend error:', err);
    fail(res, 500, '获取展示趋势失败');
  }
});

// Placement ranking
router.get('/placement-ranking', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { startDate, endDate } = req.query as Record<string, string>;

    const today = new Date();
    const start = startDate || new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const end = endDate || today.toISOString().split('T')[0];

    const { data, error } = await db.from('report_daily')
      .select('placement_id, revenue')
      .eq('developer_id', developerId)
      .gte('stat_date', start)
      .lte('stat_date', end);
    if (error) throw new Error(`Query failed: ${error.message}`);

    const placementMap: Record<string, number> = {};
    for (const row of (data || [])) {
      const pid = row.placement_id as string;
      placementMap[pid] = (placementMap[pid] || 0) + Number(row.revenue || 0);
    }

    const ranking = Object.entries(placementMap)
      .map(([placementId, revenue]) => ({ placementId, revenue: Number(revenue.toFixed(2)) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    success(res, ranking);
  } catch (err) {
    console.error('Placement ranking error:', err);
    fail(res, 500, '获取广告位排行失败');
  }
});

export default router;
