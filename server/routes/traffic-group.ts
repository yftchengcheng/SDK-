import express, { Router } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

// List traffic groups
router.get('/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { placementId, page = 1, pageSize = 20 } = req.query as Record<string, string>;

    if (!placementId) {
      fail(res, 400, '缺少placementId');
      return;
    }

    const p = Number(page);
    const ps = Number(pageSize);

    const { data, count, error } = await db.from('traffic_group')
      .select('*', { count: 'exact' })
      .eq('placement_id', placementId)
      .order('priority', { ascending: true })
      .range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('List traffic groups error:', err);
    fail(res, 500, '获取流量分组列表失败');
  }
});

// Create traffic group
router.post('/create', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { placementId, groupName, conditions, priority, waterfallConfigId } = req.body;

    if (!placementId || !groupName || !conditions) {
      fail(res, 400, '缺少必填字段');
      return;
    }

    const { data, error } = await db.from('traffic_group').insert({
      placement_id: placementId,
      group_name: groupName,
      conditions: typeof conditions === 'string' ? conditions : JSON.stringify(conditions),
      priority: priority || 0,
      waterfall_config_id: waterfallConfigId || 0,
    }).select().single();
    if (error) throw new Error(`Insert failed: ${error.message}`);

    success(res, data, '创建成功');
  } catch (err) {
    console.error('Create traffic group error:', err);
    fail(res, 500, '创建流量分组失败');
  }
});

// Update traffic group
router.put('/update', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { id, groupName, conditions, priority, waterfallConfigId, status } = req.body;

    if (!id) {
      fail(res, 400, '缺少id');
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (groupName !== undefined) updateData.group_name = groupName;
    if (conditions !== undefined) updateData.conditions = typeof conditions === 'string' ? conditions : JSON.stringify(conditions);
    if (priority !== undefined) updateData.priority = priority;
    if (waterfallConfigId !== undefined) updateData.waterfall_config_id = waterfallConfigId;
    if (status !== undefined) updateData.status = status;

    const { error } = await db.from('traffic_group').update(updateData).eq('id', id);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '更新成功');
  } catch (err) {
    console.error('Update traffic group error:', err);
    fail(res, 500, '更新流量分组失败');
  }
});

// Delete traffic group
router.delete('/delete', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.query as Record<string, string>;

    if (!id) {
      fail(res, 400, '缺少id');
      return;
    }

    const { error } = await db.from('traffic_group').delete().eq('id', Number(id));
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, null, '删除成功');
  } catch (err) {
    console.error('Delete traffic group error:', err);
    fail(res, 500, '删除流量分组失败');
  }
});

// RESTful: PUT /api/v1/console/traffic-group/:id  (frontend 用此路径)
router.put('/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { groupName, conditions, priority, waterfallConfigId, status } = req.body;
    if (!id) return fail(res, 400, '缺少id');

    const updateData: Record<string, unknown> = {};
    if (groupName !== undefined) updateData.group_name = groupName;
    if (conditions !== undefined) updateData.conditions = typeof conditions === 'string' ? conditions : JSON.stringify(conditions);
    if (priority !== undefined) updateData.priority = priority;
    if (waterfallConfigId !== undefined) updateData.waterfall_config_id = waterfallConfigId;
    if (status !== undefined) updateData.status = status;

    const { error } = await db.from('traffic_group').update(updateData).eq('id', Number(id));
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '更新成功');
  } catch (err) {
    console.error('Update traffic group (RESTful) error:', err);
    fail(res, 500, '更新流量分组失败');
  }
});

// RESTful: DELETE /api/v1/console/traffic-group/:id
router.delete('/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    if (!id) return fail(res, 400, '缺少id');

    const { error } = await db.from('traffic_group').delete().eq('id', Number(id));
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, null, '删除成功');
  } catch (err) {
    console.error('Delete traffic group (RESTful) error:', err);
    fail(res, 500, '删除流量分组失败');
  }
});

export default router;
