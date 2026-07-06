import express, { Router } from 'express';
import { db } from '../db';
import { authMiddleware, getDeveloper } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

// List ad sources
router.get('/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { networkCode, status, page = 1, pageSize = 20 } = req.query as Record<string, string>;

    let query = db.from('ad_source').select('*', { count: 'exact' }).eq('developer_id', developerId);

    if (networkCode) query = query.eq('network_code', networkCode);
    if (status) query = query.eq('status', Number(status));

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await query.order('created_at', { ascending: false }).range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('List ad sources error:', err);
    fail(res, 500, '获取广告源列表失败');
  }
});

// Create ad source
router.post('/create', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { networkCode, networkName, sourceName, thirdAppId, thirdPlacementId, extra } = req.body;

    if (!networkCode || !sourceName || !thirdAppId || !thirdPlacementId) {
      fail(res, 400, '缺少必填字段');
      return;
    }

    const { data, error } = await db.from('ad_source').insert({
      developer_id: developerId,
      network_code: networkCode,
      network_name: networkName || networkCode,
      source_name: sourceName,
      third_app_id: thirdAppId,
      third_placement_id: thirdPlacementId,
      extra: extra || null,
    }).select().single();
    if (error) throw new Error(`Insert failed: ${error.message}`);

    success(res, data, '创建成功');
  } catch (err) {
    console.error('Create ad source error:', err);
    fail(res, 500, '创建广告源失败');
  }
});

// Update ad source
router.put('/update', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id, sourceName, thirdAppId, thirdPlacementId, extra, status } = req.body;

    if (!id) {
      fail(res, 400, '缺少id');
      return;
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (sourceName !== undefined) updateData.source_name = sourceName;
    if (thirdAppId !== undefined) updateData.third_app_id = thirdAppId;
    if (thirdPlacementId !== undefined) updateData.third_placement_id = thirdPlacementId;
    if (extra !== undefined) updateData.extra = extra;
    if (status !== undefined) updateData.status = status;

    const { error } = await db.from('ad_source').update(updateData).eq('id', id).eq('developer_id', developerId);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '更新成功');
  } catch (err) {
    console.error('Update ad source error:', err);
    fail(res, 500, '更新广告源失败');
  }
});

// Delete ad source
router.delete('/delete', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.query as Record<string, string>;

    if (!id) {
      fail(res, 400, '缺少id');
      return;
    }

    const { error } = await db.from('ad_source').delete().eq('id', Number(id)).eq('developer_id', developerId);
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, null, '删除成功');
  } catch (err) {
    console.error('Delete ad source error:', err);
    fail(res, 500, '删除广告源失败');
  }
});

// Get network definitions
router.get('/networks', authMiddleware, async (_req: express.Request, res: express.Response) => {
  try {
    const { data, error } = await db.from('ad_network_def').select('*').eq('status', 1).order('network_type', { ascending: true });
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, data);
  } catch (err) {
    console.error('Get networks error:', err);
    fail(res, 500, '获取广告网络列表失败');
  }
});

export default router;
