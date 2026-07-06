import express, { Router } from 'express';
import { db } from '../db';
import { success, fail } from '../utils/response';

const router = Router();

// Batch report endpoint (SDK上报)
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const { events } = req.body as { events: Record<string, unknown>[] };

    if (!events || !Array.isArray(events) || events.length === 0) {
      fail(res, 400, '缺少上报数据');
      return;
    }

    // Validate each event has required tokens
    for (const event of events) {
      if (!event.developerId || !event.appKey || !event.placementId) {
        fail(res, 400, '每条上报必须包含developerId、appKey、placementId');
        return;
      }
    }

    // Process events - aggregate into report_daily
    for (const event of events) {
      const date = new Date().toISOString().split('T')[0];
      const developerId = event.developerId as string;
      const appKey = event.appKey as string;
      const placementId = event.placementId as string;
      const adSourceId = (event.adSourceId as number) || 0;
      const eventType = event.eventType as string;

      // Try to upsert the daily record
      const { data: existing } = await db.from('report_daily')
        .select('*')
        .eq('developer_id', developerId)
        .eq('app_key', appKey)
        .eq('placement_id', placementId)
        .eq('ad_source_id', adSourceId)
        .eq('stat_date', date)
        .maybeSingle();

      if (existing) {
        const updateData: Record<string, unknown> = {};
        if (eventType === 'request') updateData.requests = (existing.requests || 0) + 1;
        if (eventType === 'fill') updateData.fills = (existing.fills || 0) + 1;
        if (eventType === 'impression') {
          updateData.impressions = (existing.impressions || 0) + 1;
          if (event.revenue) updateData.revenue = Number(existing.revenue || 0) + Number(event.revenue);
        }
        if (eventType === 'click') updateData.clicks = (existing.clicks || 0) + 1;

        if (Object.keys(updateData).length > 0) {
          await db.from('report_daily').update(updateData)
            .eq('developer_id', developerId)
            .eq('app_key', appKey)
            .eq('placement_id', placementId)
            .eq('ad_source_id', adSourceId)
            .eq('stat_date', date);
        }
      } else {
        const insertData: Record<string, unknown> = {
          developer_id: developerId,
          app_key: appKey,
          placement_id: placementId,
          ad_source_id: adSourceId,
          stat_date: date,
          requests: 0,
          fills: 0,
          impressions: 0,
          clicks: 0,
          revenue: 0,
        };
        if (eventType === 'request') insertData.requests = 1;
        if (eventType === 'fill') insertData.fills = 1;
        if (eventType === 'impression') {
          insertData.impressions = 1;
          if (event.revenue) insertData.revenue = Number(event.revenue);
        }
        if (eventType === 'click') insertData.clicks = 1;

        await db.from('report_daily').insert(insertData);
      }
    }

    success(res, { processed: events.length }, '上报成功');
  } catch (err) {
    console.error('Report error:', err);
    fail(res, 500, '数据上报失败');
  }
});

// Daily report query
router.get('/daily', async (req: express.Request, res: express.Response) => {
  try {
    const { developerId, appKey, placementId, startDate, endDate, page = 1, pageSize = 20 } = req.query as Record<string, string>;

    if (!developerId) {
      fail(res, 400, '缺少developerId');
      return;
    }

    let query = db.from('report_daily').select('*', { count: 'exact' }).eq('developer_id', developerId);

    if (appKey) query = query.eq('app_key', appKey);
    if (placementId) query = query.eq('placement_id', placementId);
    if (startDate) query = query.gte('stat_date', startDate);
    if (endDate) query = query.lte('stat_date', endDate);

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await query.order('stat_date', { ascending: false }).range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('Daily report error:', err);
    fail(res, 500, '获取日报表失败');
  }
});

export default router;
