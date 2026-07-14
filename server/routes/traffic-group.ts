import express, { Router } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

/**
 * 始终在结果中合成「默认分组」记录（traffic_group_id=0）
 * postgrest schema cache 沙箱环境无法实时刷新，
 * 所以默认分组采用「应用层注入 + traffic_group_id=0 隐式约定」方式实现。
 */
const DEFAULT_GROUP_VIRTUAL = {
  id: 0,
  group_name: '默认分组',
  is_default: true,
  is_system: true,
  is_locked: true,
  priority: 0,
  status: 1,
  conditions: null,
};

// List traffic groups
router.get('/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { placementId, developerId, page = 1, pageSize = 20 } = req.query as Record<string, string>;
    // 显式传 developerId 走全量（admin 场景），否则只取当前 placement 下的
    const filters: Record<string, unknown> = {};
    if (placementId) filters.placement_id = placementId;
    if (developerId) filters.developer_id = developerId;

    const p = Number(page) || 1;
    const ps = Number(pageSize) || 20;

    let query = db.from('traffic_group').select('*', { count: 'exact' });
    Object.entries(filters).forEach(([k, v]) => { query = query.eq(k, v); });
    const { data, count, error } = await query
      .order('priority', { ascending: true })
      .order('id', { ascending: true })
      .range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    // 应用层注入「默认分组」到列表头部（仅当按 placement 过滤时）
    let list: unknown[] = data || [];
    if (placementId && !developerId) {
      const hasDefault = (data || []).some((g: { id: number; is_default?: boolean }) => g.id === 0 || g.is_default === true);
      if (!hasDefault) {
        list = [DEFAULT_GROUP_VIRTUAL, ...list];
      }
    }
    success(res, { list, total: count, page: p, pageSize: ps });
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
    if (!id) { fail(res, 400, '缺少id'); return; }
    // 不允许更新「默认分组」(id=0)
    if (Number(id) === 0) { fail(res, 400, '默认分组不可编辑'); return; }

    const update: Record<string, unknown> = {};
    if (groupName !== undefined) update.group_name = groupName;
    if (conditions !== undefined) update.conditions = typeof conditions === 'string' ? conditions : JSON.stringify(conditions);
    if (priority !== undefined) update.priority = priority;
    if (waterfallConfigId !== undefined) update.waterfall_config_id = waterfallConfigId;
    if (status !== undefined) update.status = status;
    update.updated_at = new Date().toISOString();

    const { data, error } = await db.from('traffic_group').update(update).eq('id', Number(id)).select().single();
    if (error) throw new Error(`Update failed: ${error.message}`);
    success(res, data, '更新成功');
  } catch (err) {
    console.error('Update traffic group error:', err);
    fail(res, 500, '更新流量分组失败');
  }
});

// Delete traffic group
router.delete('/delete/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    if (Number(id) === 0) { fail(res, 400, '默认分组不可删除'); return; }

    const { error } = await db.from('traffic_group').delete().eq('id', Number(id));
    if (error) throw new Error(`Delete failed: ${error.message}`);
    success(res, null, '删除成功');
  } catch (err) {
    console.error('Delete traffic group error:', err);
    fail(res, 500, '删除流量分组失败');
  }
});

export default router;
