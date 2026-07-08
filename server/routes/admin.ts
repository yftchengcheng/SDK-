/**
 * 平台超级管理员路由
 * - GET    /api/v1/console/admin/developers        开发者列表（搜索/分页）
 * - PATCH  /api/v1/console/admin/developers/:id/role   修改角色
 * - PATCH  /api/v1/console/admin/developers/:id/status 启停账号
 *
 * 入口使用 requireRole('admin') 守卫，普通 developer 访问直接 403。
 */
import express from 'express';
import { authMiddleware, requireRole, getDeveloper } from '../middleware/auth.js';
import { fail, success } from '../utils/response.js';
import { getSupabaseClient } from '../utils/supabase-client.js';

const router = express.Router();

// 全部接口需登录 + admin 角色
router.use(authMiddleware);
router.use(requireRole('admin'));

/**
 * GET /api/v1/console/admin/developers
 *  ?page=1&pageSize=20&q=email关键字
 *  永远附带当前操作人 + 统计（总计/活跃/管理员）
 */
router.get('/developers', async (req: express.Request, res: express.Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize ?? '20'), 10) || 20));
    const q = (req.query.q ?? '').toString().trim();

    const db = getSupabaseClient();
    let query = db.from('developer').select(
      'developer_id, email, company, contact_name, phone, role, status, access_type, created_at, updated_at',
      { count: 'exact' }
    );

    if (q) {
      // 邮箱或公司名模糊匹配
      query = query.or(`email.ilike.%${q}%,company.ilike.%${q}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw new Error(`Query failed: ${error.message}`);

    // 全局统计（不跟随分页）
    const [totalRow, activeRow, adminRow] = await Promise.all([
      db.from('developer').select('developer_id', { count: 'exact', head: true }),
      db.from('developer').select('developer_id', { count: 'exact', head: true }).eq('status', 1),
      db.from('developer').select('developer_id', { count: 'exact', head: true }).eq('role', 'admin'),
    ]);

    const list = (data ?? []).map((row) => ({
      developerId: row.developer_id,
      email: row.email,
      company: row.company ?? null,
      contactName: row.contact_name ?? null,
      phone: row.phone ?? null,
      role: row.role ?? 'developer',
      status: row.status,
      accessType: row.access_type ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? null,
    }));

    success(res, {
      list,
      total: count ?? 0,
      page,
      pageSize,
      stats: {
        total: totalRow.count ?? 0,
        active: activeRow.count ?? 0,
        admins: adminRow.count ?? 0,
      },
    });
  } catch (err) {
    console.error('Admin list developers error:', err);
    fail(res, 500, '获取开发者列表失败');
  }
});

/**
 * PATCH /api/v1/console/admin/developers/:id/role
 * body: { role: 'developer' | 'admin' }
 *
 * 禁止 admin 把自己的角色降级（防止锁死无人能恢复）
 */
router.patch('/developers/:id/role', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { developerId: operatorId } = getDeveloper(req);
    const targetRole = String(req.body?.role ?? '');

    if (targetRole !== 'developer' && targetRole !== 'admin') {
      fail(res, 400, 'role 必须是 developer 或 admin');
      return;
    }
    if (id === operatorId && targetRole !== 'admin') {
      fail(res, 400, '不能修改自己的角色');
      return;
    }

    const db = getSupabaseClient();
    const { data, error } = await db
      .from('developer')
      .update({ role: targetRole, updated_at: new Date().toISOString() })
      .eq('developer_id', id)
      .select('developer_id, email, role')
      .maybeSingle();

    if (error) throw new Error(`Update failed: ${error.message}`);
    if (!data) {
      fail(res, 404, '开发者不存在');
      return;
    }

    success(res, {
      developerId: data.developer_id,
      email: data.email,
      role: data.role,
    });
  } catch (err) {
    console.error('Admin update role error:', err);
    fail(res, 500, '修改角色失败');
  }
});

/**
 * PATCH /api/v1/console/admin/developers/:id/status
 * body: { status: 1 | 2 }   1=启用  2=停用
 *
 * 不能停用自己
 */
router.patch('/developers/:id/status', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { developerId: operatorId } = getDeveloper(req);
    const targetStatus = Number(req.body?.status);

    if (targetStatus !== 1 && targetStatus !== 2) {
      fail(res, 400, 'status 必须是 1（启用）或 2（停用）');
      return;
    }
    if (id === operatorId && targetStatus === 2) {
      fail(res, 400, '不能停用自己的账号');
      return;
    }

    const db = getSupabaseClient();
    const { data, error } = await db
      .from('developer')
      .update({ status: targetStatus, updated_at: new Date().toISOString() })
      .eq('developer_id', id)
      .select('developer_id, email, status')
      .maybeSingle();

    if (error) throw new Error(`Update failed: ${error.message}`);
    if (!data) {
      fail(res, 404, '开发者不存在');
      return;
    }

    success(res, {
      developerId: data.developer_id,
      email: data.email,
      status: data.status,
    });
  } catch (err) {
    console.error('Admin update status error:', err);
    fail(res, 500, '修改状态失败');
  }
});

export default router;
