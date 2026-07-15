/**
 * 数据报表 - 看版（保存的指标配置）CRUD API
 * 路由前缀: /api/v1/console/report/board
 *
 * 表结构（report_board）：
 *   id, developer_id, name, report_type, is_default, is_hidden, config(jsonb), sort_order, created_at, updated_at
 */
import { Router } from 'express';
import { db } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();
router.use(authMiddleware);

/**
 * GET /list
 * 列出当前用户的所有看版
 * Query: ?report_type=overview|funnel|behavior
 */
router.get('/list', async (req, res) => {
  try {
    const developerId = (req as unknown as AuthRequest).developerId;
    const { report_type, include_hidden } = req.query;
    let q = db
      .from('report_board')
      .select('*')
      .eq('developer_id', developerId)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    if (report_type) q = q.eq('report_type', report_type as string);
    if (include_hidden !== 'true') q = q.eq('is_hidden', false);

    const { data, error } = await q;
    if (error) {
      console.error('[report/board/list]', error);
      return fail(res, 500, (error as Error).message);
    }
    return success(res, data ?? []);
  } catch (e) {
    return fail(res, 500, (e as Error).message);
  }
});

/**
 * GET /detail/:id
 */
router.get('/detail/:id', async (req, res) => {
  try {
    const developerId = (req as unknown as AuthRequest).developerId;
    const { id } = req.params;
    const { data, error } = await db
      .from('report_board')
      .select('*')
      .eq('id', id)
      .eq('developer_id', developerId)
      .maybeSingle();
    if (error) return fail(res, 500, (error as Error).message);
    if (!data) return fail(res, 404, '看版不存在或无权限');
    return success(res, data);
  } catch (e) {
    return fail(res, 500, (e as Error).message);
  }
});

/**
 * POST /create
 * Body: { name, report_type, config: {dimensions, metrics, filters, layout}, sort_order?, is_hidden? }
 */
router.post('/create', async (req, res) => {
  try {
    const developerId = (req as unknown as AuthRequest).developerId;
    const { name, report_type, config, sort_order, is_hidden } = req.body ?? {};
    if (!name || !report_type) return fail(res, 400, 'name 和 report_type 必填');
    if (!config || typeof config !== 'object') return fail(res, 400, 'config 必填（对象）');

    const insert = {
      developer_id: developerId,
      name,
      report_type,
      is_default: false,
      is_hidden: !!is_hidden,
      config,
      sort_order: sort_order ?? 100,
    };
    const { data, error } = await db
      .from('report_board')
      .insert(insert)
      .select('*')
      .single();
    if (error) {
      console.error('[report/board/create]', error);
      return fail(res, 500, (error as Error).message);
    }
    return success(res, data);
  } catch (e) {
    return fail(res, 500, (e as Error).message);
  }
});

/**
 * PATCH /update/:id
 */
router.patch('/update/:id', async (req, res) => {
  try {
    const developerId = (req as unknown as AuthRequest).developerId;
    const { id } = req.params;
    const allowed = ['name', 'config', 'sort_order', 'is_hidden'];
    const patch: Record<string, unknown> = {};
    for (const k of allowed) {
      if (req.body && req.body[k] !== undefined) patch[k] = req.body[k];
    }
    patch.updated_at = new Date().toISOString();

    const { data, error } = await db
      .from('report_board')
      .update(patch)
      .eq('id', id)
      .eq('developer_id', developerId)
      .select('*')
      .maybeSingle();
    if (error) {
      console.error('[report/board/update]', error);
      return fail(res, 500, (error as Error).message);
    }
    if (!data) return fail(res, 404, '看版不存在或无权限');
    return success(res, data);
  } catch (e) {
    return fail(res, 500, (e as Error).message);
  }
});

/**
 * DELETE /delete/:id
 * 不允许删除 is_default=true 的看版
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    const developerId = (req as unknown as AuthRequest).developerId;
    const { id } = req.params;
    const { data: target } = await db
      .from('report_board')
      .select('is_default, name')
      .eq('id', id)
      .eq('developer_id', developerId)
      .maybeSingle();
    if (!target) return fail(res, 404, '看版不存在或无权限');
    if (target.is_default) return fail(res, 400, '默认看版不可删除');

    const { error } = await db
      .from('report_board')
      .delete()
      .eq('id', id)
      .eq('developer_id', developerId);
    if (error) {
      console.error('[report/board/delete]', error);
      return fail(res, 500, (error as Error).message);
    }
    return success(res, { id, name: target.name, deleted: true });
  } catch (e) {
    return fail(res, 500, (e as Error).message);
  }
});

/**
 * POST /duplicate/:id
 */
router.post('/duplicate/:id', async (req, res) => {
  try {
    const developerId = (req as unknown as AuthRequest).developerId;
    const { id } = req.params;
    const { data: src, error: readErr } = await db
      .from('report_board')
      .select('*')
      .eq('id', id)
      .eq('developer_id', developerId)
      .maybeSingle();
    if (readErr) return fail(res, 500, readErr.message);
    if (!src) return fail(res, 404, '看版不存在或无权限');

    const { id: _id, created_at: _c, updated_at: _u, ...rest } = src;
    const copy = {
      ...rest,
      name: `${src.name} - 副本`,
      is_default: false,
    };
    const { data, error } = await db
      .from('report_board')
      .insert(copy)
      .select('*')
      .single();
    if (error) {
      console.error('[report/board/duplicate]', error);
      return fail(res, 500, (error as Error).message);
    }
    return success(res, data);
  } catch (e) {
    return fail(res, 500, (e as Error).message);
  }
});

export default router;
