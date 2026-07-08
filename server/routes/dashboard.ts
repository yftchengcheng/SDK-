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

    // 补齐日期范围：每一天都生成一条记录（无数据补 0），保证前端 chart X 轴连续
    success(res, fillDateRange(result, start, end, { revenue: 0, impressions: 0, fillRate: 0, eCPM: 0, clicks: 0 }));
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
    success(res, fillDateRange(result, start, end, { revenue: 0 }));
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
    success(res, fillDateRange(result, start, end, { impressions: 0, fillRate: 0 }));
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

// Ad source comparison (revenue & impressions per source)
router.get('/source-comparison', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, startDate, endDate } = req.query as Record<string, string>;

    const today = new Date();
    const start = startDate || new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const end = endDate || today.toISOString().split('T')[0];

    let query = db.from('report_daily')
      .select('ad_source_id, revenue, impressions, clicks, requests, fills')
      .eq('developer_id', developerId)
      .gte('stat_date', start)
      .lte('stat_date', end);
    if (appKey) query = query.eq('app_key', appKey);

    const { data, error } = await query;
    if (error) throw new Error(`Query failed: ${error.message}`);

    const sourceMap: Record<string, { revenue: number; impressions: number; clicks: number; requests: number; fills: number }> = {};
    for (const row of (data || [])) {
      const sid = (row.ad_source_id as string) || 'unknown';
      if (!sourceMap[sid]) sourceMap[sid] = { revenue: 0, impressions: 0, clicks: 0, requests: 0, fills: 0 };
      sourceMap[sid].revenue += Number(row.revenue || 0);
      sourceMap[sid].impressions += Number(row.impressions || 0);
      sourceMap[sid].clicks += Number(row.clicks || 0);
      sourceMap[sid].requests += Number(row.requests || 0);
      sourceMap[sid].fills += Number(row.fills || 0);
    }

    // Lookup source names
    const sourceIds = Object.keys(sourceMap);
    const nameMap: Record<string, string> = {};
    if (sourceIds.length > 0) {
      const { data: sources } = await db.from('ad_source').select('id, name').in('id', sourceIds);
      for (const s of (sources || [])) {
        nameMap[s.id as string] = (s.name as string) || s.id as string;
      }
    }

    const ranking = Object.entries(sourceMap)
      .map(([sourceId, d]) => ({
        sourceId,
        name: nameMap[sourceId] || sourceId,
        revenue: Number(d.revenue.toFixed(2)),
        impressions: d.impressions,
        clicks: d.clicks,
        ctr: d.impressions > 0 ? Number((d.clicks / d.impressions * 100).toFixed(2)) : 0,
        fillRate: d.requests > 0 ? Number((d.fills / d.requests * 100).toFixed(2)) : 0,
        eCPM: d.impressions > 0 ? Number((d.revenue / d.impressions * 1000).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    success(res, ranking);
  } catch (err) {
    console.error('Source comparison error:', err);
    fail(res, 500, '获取广告源对比失败');
  }
});

// Anomaly detection: sudden drops in revenue or fill rate
router.get('/anomalies', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);

    // Compare last 3 days vs prior 7 days baseline
    const today = new Date();
    const last3End = today.toISOString().split('T')[0];
    const last3Start = new Date(today.getTime() - 2 * 86400000).toISOString().split('T')[0];
    const baselineStart = new Date(today.getTime() - 9 * 86400000).toISOString().split('T')[0];
    const baselineEnd = new Date(today.getTime() - 3 * 86400000).toISOString().split('T')[0];

    const { data: recentRows, error: e1 } = await db.from('report_daily')
      .select('placement_id, revenue, impressions, requests, fills')
      .eq('developer_id', developerId)
      .gte('stat_date', last3Start)
      .lte('stat_date', last3End);
    if (e1) throw new Error(`Query failed: ${e1.message}`);

    const { data: baselineRows, error: e2 } = await db.from('report_daily')
      .select('placement_id, revenue, impressions, requests, fills')
      .eq('developer_id', developerId)
      .gte('stat_date', baselineStart)
      .lte('stat_date', baselineEnd);
    if (e2) throw new Error(`Query failed: ${e2.message}`);

    const aggregate = (rows: Array<Record<string, unknown>>) => {
      const m: Record<string, { revenue: number; impressions: number; requests: number; fills: number }> = {};
      for (const r of rows) {
        const pid = r.placement_id as string;
        if (!m[pid]) m[pid] = { revenue: 0, impressions: 0, requests: 0, fills: 0 };
        m[pid].revenue += Number(r.revenue || 0);
        m[pid].impressions += Number(r.impressions || 0);
        m[pid].requests += Number(r.requests || 0);
        m[pid].fills += Number(r.fills || 0);
      }
      return m;
    };

    const recent = aggregate(recentRows || []);
    const baseline = aggregate(baselineRows || []);

    const anomalies: Array<{ placementId: string; type: string; change: number; recent: number; baseline: number }> = [];
    for (const pid of Object.keys(recent)) {
      const r = recent[pid];
      const b = baseline[pid];
      if (!b || b.revenue === 0) continue;
      const revenueDrop = (r.revenue - b.revenue / 7 * 3) / (b.revenue / 7 * 3) * 100;
      const recentFillRate = r.requests > 0 ? (r.fills / r.requests * 100) : 0;
      const baselineFillRate = b.requests > 0 ? (b.fills / b.requests * 100) : 0;
      if (revenueDrop < -30) {
        anomalies.push({ placementId: pid, type: 'revenue_drop', change: Number(revenueDrop.toFixed(1)), recent: Number(r.revenue.toFixed(2)), baseline: Number((b.revenue / 7 * 3).toFixed(2)) });
      }
      if (baselineFillRate - recentFillRate > 20 && recentFillRate < 50) {
        anomalies.push({ placementId: pid, type: 'fill_rate_drop', change: Number((recentFillRate - baselineFillRate).toFixed(1)), recent: Number(recentFillRate.toFixed(2)), baseline: Number(baselineFillRate.toFixed(2)) });
      }
    }

    success(res, anomalies.slice(0, 10));
  } catch (err) {
    console.error('Anomaly detection error:', err);
    fail(res, 500, '获取异常数据失败');
  }
});

export default router;
