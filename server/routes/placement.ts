import express, { Router } from 'express';
import { db } from '../db';
import { genPlacementId } from '../utils/id-generator';
import { authMiddleware, getDeveloper, getDeveloperContext } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

// List placements
router.get('/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appId, appKey, status, format, page = 1, pageSize = 20 } = req.query as Record<string, string>;

    // Get apps for this developer first
    const { data: apps } = await db.from('app').select('id, app_key').eq('developer_id', developerId);
    const appKeys = (apps || []).map((a: { app_key: string }) => a.app_key);

    if (appKeys.length === 0) {
      success(res, { list: [], total: 0, page: Number(page), pageSize: Number(pageSize) });
      return;
    }

    let query = db.from('placement').select('*', { count: 'exact' }).in('app_key', appKeys);

    if (appId) {
      // appId → app_key 转换
      const target = (apps || []).find((a: { id: number; app_key: string }) => a.id === Number(appId));
      if (target) query = query.eq('app_key', target.app_key);
      else { success(res, { list: [], total: 0, page: Number(page), pageSize: Number(pageSize) }); return; }
    }
    if (appKey) query = query.eq('app_key', appKey);
    if (status) query = query.eq('status', Number(status));
    if (format) query = query.eq('format', Number(format));

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await query.order('created_at', { ascending: false }).range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('List placements error:', err);
    fail(res, 500, '获取广告位列表失败');
  }
});

// Create placement
router.post('/create', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId, accessType } = await getDeveloperContext(req);
    const {
      appKey, name, format,
      biddingType, screenOrientation, adSize, materialType, videoMute, autoPlay, templateStyle,
    } = req.body;

    if (!appKey || !name || !format) {
      fail(res, 400, '缺少必填字段');
      return;
    }

    // Verify app belongs to developer
    const { data: app } = await db.from('app').select('app_key').eq('app_key', appKey).eq('developer_id', developerId).maybeSingle();
    if (!app) {
      fail(res, 403, '无权操作该应用');
      return;
    }

    const placementId = genPlacementId();

    // API 接入(accessType=2) 时不允许填写 screen_orientation / video_mute / auto_play
    const isSDK = accessType !== 2;
    const insertData: Record<string, unknown> = {
      app_key: appKey,
      placement_id: placementId,
      name,
      format,
    };
    if (biddingType !== undefined && biddingType !== null) insertData.bidding_type = biddingType;
    if (isSDK && screenOrientation !== undefined && screenOrientation !== null) insertData.screen_orientation = screenOrientation;
    if (adSize !== undefined && adSize !== null) insertData.ad_size = adSize;
    if (materialType !== undefined && materialType !== null) insertData.material_type = materialType;
    if (isSDK && videoMute !== undefined && videoMute !== null) insertData.video_mute = videoMute ? 1 : 0;
    if (isSDK && autoPlay !== undefined && autoPlay !== null) insertData.auto_play = autoPlay ? 1 : 0;
    if (templateStyle !== undefined && templateStyle !== null) insertData.template_style = templateStyle;

    const { data, error } = await db.from('placement').insert(insertData).select().single();
    if (error) throw new Error(`Insert failed: ${error.message}`);

    success(res, data, '创建成功');
  } catch (err) {
    console.error('Create placement error:', err);
    fail(res, 500, '创建广告位失败');
  }
});

// Get placement detail
router.get('/detail', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { placementId } = req.query as Record<string, string>;

    if (!placementId) {
      fail(res, 400, '缺少placementId');
      return;
    }

    const { data, error } = await db.from('placement').select('*').eq('placement_id', placementId).maybeSingle();
    if (error) throw new Error(`Query failed: ${error.message}`);

    if (!data) {
      fail(res, 404, '广告位不存在');
      return;
    }

    success(res, data);
  } catch (err) {
    console.error('Get placement detail error:', err);
    fail(res, 500, '获取广告位详情失败');
  }
});

// Update placement
router.put('/update', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { accessType } = await getDeveloperContext(req);
    const {
      placementId, name, format, status,
      biddingType, screenOrientation, adSize, materialType, videoMute, autoPlay, templateStyle,
    } = req.body;

    if (!placementId) {
      fail(res, 400, '缺少placementId');
      return;
    }

    const isSDK = accessType !== 2;
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (format !== undefined) updateData.format = format;
    if (status !== undefined) updateData.status = status;
    if (biddingType !== undefined) updateData.bidding_type = biddingType;
    if (isSDK && screenOrientation !== undefined) updateData.screen_orientation = screenOrientation;
    if (adSize !== undefined) updateData.ad_size = adSize;
    if (materialType !== undefined) updateData.material_type = materialType;
    if (isSDK && videoMute !== undefined) updateData.video_mute = videoMute ? 1 : 0;
    if (isSDK && autoPlay !== undefined) updateData.auto_play = autoPlay ? 1 : 0;
    if (templateStyle !== undefined) updateData.template_style = templateStyle;

    const { error } = await db.from('placement').update(updateData).eq('placement_id', placementId);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '更新成功');
  } catch (err) {
    console.error('Update placement error:', err);
    fail(res, 500, '更新广告位失败');
  }
});

// Delete placement
router.delete('/delete', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { placementId } = req.query as Record<string, string>;

    if (!placementId) {
      fail(res, 400, '缺少placementId');
      return;
    }

    const { error } = await db.from('placement').delete().eq('placement_id', placementId);
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, null, '删除成功');
  } catch (err) {
    console.error('Delete placement error:', err);
    fail(res, 500, '删除广告位失败');
  }
});

export default router;
