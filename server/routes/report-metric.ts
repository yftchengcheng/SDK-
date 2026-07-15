/**
 * 数据报表 - 指标字典管理 API
 * 路由前缀: /api/v1/console/report/metric
 */
import { Router } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

// 所有接口需要登录
router.use(authMiddleware);

/**
 * GET /list
 * 列出所有指标（按 category + sub_category 分组）
 * Query: ?category=taku_user&is_active=true&is_system=false
 */
router.get('/list', async (req, res) => {
  try {
    const { category, is_active, is_system } = req.query;
    let query = db
      .from('report_metric_definition')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });

    if (category) query = query.eq('category', category as string);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
    if (is_system !== undefined) query = query.eq('is_system', is_system === 'true');

    const { data, error } = await query;
    if (error) {
      console.error('[report-metric/list]', error);
      return fail(res, 500, (error as Error).message);
    }
    return success(res, data ?? []);
  } catch (e) {
    console.error('[report-metric] catch:', e);
    return fail(res, 500, (e as Error).message);
  }
});

/**
 * GET /categories
 * 列出所有 category + sub_category（用于前端动态渲染指标弹窗）
 */
router.get('/categories', async (_req, res) => {
  try {
    const { data, error } = await db
      .from('report_metric_definition')
      .select('category, sub_category, value_type, sort_order')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });
    if (error) {
      console.error('[report-metric/categories]', error);
      return fail(res, 500, (error as Error).message);
    }

    // 聚合为 { category, subCategories: [{name, valueTypes: []}] }
    const grouped: Record<string, { category: string; subCategories: Record<string, Set<string>> }> = {};
    for (const row of data ?? []) {
      if (!grouped[row.category]) {
        grouped[row.category] = { category: row.category, subCategories: {} };
      }
      const sub = row.sub_category || '_default';
      if (!grouped[row.category].subCategories[sub]) {
        grouped[row.category].subCategories[sub] = new Set();
      }
      if (row.value_type) {
        grouped[row.category].subCategories[sub].add(row.value_type);
      }
    }

    const result = Object.values(grouped).map(g => ({
      category: g.category,
      subCategories: Object.entries(g.subCategories).map(([name, types]) => ({
        name,
        valueTypes: Array.from(types),
      })),
    }));

    return success(res, result);
  } catch (e) {
    console.error('[report-metric] list catch:', e);
    return fail(res, 500, (e as Error).message);
  }
});

/**
 * POST /create
 * 创建自定义指标（仅 admin）
 * Body: { code, name, category, sub_category, value_type, unit, format, formula, required_fields, description, sort_order? }
 */
router.post('/create', requireRole('admin'), async (req, res) => {
  try {
    const { code, name, category, sub_category, value_type, unit, format, formula, required_fields, description, sort_order } = (req as any).body as Record<string, any>;

    // 基础校验
    if (!code || !name || !category || !format) {
      return fail(res, 400, '缺少必填字段：code/name/category/format');
    }
    if (!['actual', 'estimated'].includes(value_type)) {
      return fail(res, 400, 'value_type 必须为 actual 或 estimated');
    }
    if (!['number', 'percent', 'currency', 'decimal(2)', 'decimal(4)', 'ms'].includes(format)) {
      return fail(res, 400, 'format 不合法');
    }

    const { data, error } = await db
      .from('report_metric_definition')
      .insert({
        code,
        name,
        category,
        sub_category: sub_category ?? null,
        value_type,
        unit: unit ?? null,
        format,
        formula: formula ?? null,
        required_fields: required_fields ?? null,
        description: description ?? null,
        sort_order: sort_order ?? 0,
        is_active: true,
        is_system: false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return fail(res, 400, `code "${code}" 已存在`);
      }
      throw error;
    }
    return success(res, data);
  } catch (e) {
    console.error('[report-metric] update catch:', e);
    return fail(res, 500, (e as Error).message);
  }
});

/**
 * PATCH /update/:id
 * 更新指标（admin 可改所有；developer 不能改系统指标）
 * Body: 任意字段
 */
router.patch('/update/:id', requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return fail(res, 400, 'id 非法');

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const allowedFields = ['name', 'sub_category', 'unit', 'format', 'formula', 'required_fields', 'sort_order', 'is_active', 'description'];
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    const { data, error } = await db
      .from('report_metric_definition')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return success(res, data);
  } catch (e) {
    return fail(res, 500, (e as Error).message || '操作失败');
  }
});

/**
 * DELETE /delete/:id
 * 删除指标（仅非系统指标，admin）
 */
router.delete('/delete/:id', requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return fail(res, 400, 'id 非法');

    // 校验非系统
    const { data: row } = await db
      .from('report_metric_definition')
      .select('is_system')
      .eq('id', id)
      .single();

    if (!row) return fail(res, 400, '指标不存在');
    if (row.is_system) return fail(res, 400, '系统指标不可删除');

    const { error } = await db
      .from('report_metric_definition')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return success(res, { id, deleted: true });
  } catch (e) {
    return fail(res, 500, (e as Error).message || '操作失败');
  }
});

export default router;
