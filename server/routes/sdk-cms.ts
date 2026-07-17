/**
 * SDK CMS 路由
 * - 公开：SDK 下载、版本列表、技术文档、隐私政策
 * - admin：版本管理、文档管理、隐私政策管理
 */
import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

// ============= 公开接口（无需鉴权，公开只读） =============

/** GET /api/v1/sdk/releases?platform=1 - 获取 SDK 版本列表（含最新） */
router.get('/releases', async (req: Request, res: Response) => {
  try {
    const platform = req.query.platform ? Number(req.query.platform) : null;
    let query = db
      .from('sdk_release')
      .select('id, platform, version, version_code, changelog, download_url, file_size, file_md5, sdk_min_version, min_os_version, release_type, is_latest, is_force_update, release_date, status')
      .eq('status', 1)
      .order('release_date', { ascending: false });

    if (platform !== null && (platform === 1 || platform === 2)) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;
    if (error) return fail(res, 1, error.message);
    success(res, data || []);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** GET /api/v1/sdk/releases/latest?platform=1 - 获取最新版本 */
router.get('/releases/latest', async (req: Request, res: Response) => {
  try {
    const platform = req.query.platform ? Number(req.query.platform) : 1;
    const { data, error } = await db
      .from('sdk_release')
      .select('id, platform, version, changelog, download_url, file_size, file_md5, sdk_min_version, min_os_version, is_latest, is_force_update, release_date')
      .eq('platform', platform)
      .eq('is_latest', true)
      .eq('status', 1)
      .maybeSingle();

    if (error) return fail(res, 1, error.message);
    success(res, data);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** GET /api/v1/sdk/releases/:id - 版本详情 */
router.get('/releases/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await db
      .from('sdk_release')
      .select('*')
      .eq('id', Number(req.params.id))
      .maybeSingle();

    if (error) return fail(res, 1, error.message);
    if (!data) return fail(res, 404, 'Release not found');
    success(res, data);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** POST /api/v1/sdk/releases/:id/download - 下载计数 + 重定向 */
router.post('/releases/:id/download', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    // 拿 download_url
    const { data: release, error } = await db
      .from('sdk_release')
      .select('download_url, version, platform')
      .eq('id', id)
      .maybeSingle();
    if (error) return fail(res, 1, error.message);
    if (!release) return fail(res, 404, 'Release not found');

    // 计数 +1（fire-and-forget）
    db.rpc('increment_download_count', { p_release_id: id }).then(() => {}, () => {});

    success(res, {
      download_url: release.download_url,
      version: release.version,
      platform: release.platform,
    });
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** GET /api/v1/sdk/doc-categories - 文档分类列表 */
router.get('/doc-categories', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await db
      .from('sdk_doc_category')
      .select('id, name, code, description, icon, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) return fail(res, 1, error.message);
    success(res, data || []);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** GET /api/v1/sdk/docs?category_id=xx - 文档列表（按分类筛选） */
router.get('/docs', async (req: Request, res: Response) => {
  try {
    let query = db
      .from('sdk_doc')
      .select('id, category_id, title, slug, excerpt, cover_url, sort_order, view_count, is_featured, published_at, created_at, content_format')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false });

    if (req.query.category_id) {
      query = query.eq('category_id', Number(req.query.category_id));
    }

    const { data, error } = await query;
    if (error) return fail(res, 1, error.message);
    success(res, data || []);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** GET /api/v1/sdk/docs/:id - 文档详情 */
router.get('/docs/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await db
      .from('sdk_doc')
      .select('*')
      .eq('id', Number(req.params.id))
      .eq('is_published', true)
      .maybeSingle();

    if (error) return fail(res, 1, error.message);
    if (!data) return fail(res, 404, 'Doc not found');

    // view_count +1
    db.rpc('increment_doc_view_count', { p_doc_id: Number(req.params.id) }).then(() => {}, () => {});

    success(res, data);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** GET /api/v1/sdk/privacy/policy?platform=1 - 获取当前生效的隐私政策 */
router.get('/privacy/policy', async (req: Request, res: Response) => {
  try {
    let query = db
      .from('sdk_privacy_policy')
      .select('*')
      .eq('status', 1)
      .order('effective_date', { ascending: false })
      .limit(1);

    const platform = req.query.platform ? Number(req.query.platform) : null;
    if (platform === 1 || platform === 2) {
      query = query.or(`platform.is.null,platform.eq.${platform}`);
    }

    const { data, error } = await query.maybeSingle();
    if (error) return fail(res, 1, error.message);
    success(res, data);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** POST /api/v1/sdk/privacy/consent - 用户同意记录 */
router.post('/privacy/consent', async (req: Request, res: Response) => {
  try {
    const { privacy_id, developer_id, ip_address, user_agent } = req.body || {};
    if (!privacy_id || !developer_id) {
      return fail(res, 400, 'privacy_id and developer_id required');
    }
    const { error } = await db
      .from('sdk_privacy_consent')
      .upsert({ privacy_id, developer_id, ip_address, user_agent }, { onConflict: 'developer_id,privacy_id' });
    if (error) return fail(res, 1, error.message);
    success(res, { consented: true });
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

// ============= Admin 接口（需 admin 角色） =============

// 所有 /admin/sdk 路径加鉴权
router.use('/admin', authMiddleware, requireRole('admin'));

/** GET /api/v1/sdk/admin/releases - 后台 SDK 版本列表（全部） */
router.get('/admin/releases', async (req: Request, res: Response) => {
  try {
    let query = db
      .from('sdk_release')
      .select('*')
      .order('platform', { ascending: true })
      .order('release_date', { ascending: false });
    if (req.query.platform) query = query.eq('platform', Number(req.query.platform));
    const { data, error } = await query;
    if (error) return fail(res, 1, error.message);
    success(res, data || []);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** POST /api/v1/sdk/admin/releases - 创建版本 */
router.post('/admin/releases', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const { data, error } = await db
      .from('sdk_release')
      .insert(body)
      .select()
      .single();
    if (error) return fail(res, 1, error.message);
    success(res, data);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** PUT /api/v1/sdk/admin/releases/:id - 更新版本 */
router.put('/admin/releases/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await db
      .from('sdk_release')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', Number(req.params.id))
      .select()
      .single();
    if (error) return fail(res, 1, error.message);
    success(res, data);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** DELETE /api/v1/sdk/admin/releases/:id - 删除版本 */
router.delete('/admin/releases/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await db
      .from('sdk_release')
      .delete()
      .eq('id', Number(req.params.id));
    if (error) return fail(res, 1, error.message);
    success(res, { deleted: true });
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** GET /api/v1/sdk/admin/docs - 全部文档（草稿+已发布） */
router.get('/admin/docs', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await db
      .from('sdk_doc')
      .select('id, category_id, title, slug, is_published, is_featured, view_count, sort_order, published_at, created_at, updated_at')
      .order('category_id', { ascending: true })
      .order('sort_order', { ascending: true });
    if (error) return fail(res, 1, error.message);
    success(res, data || []);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** POST /api/v1/sdk/admin/docs - 创建文档 */
router.post('/admin/docs', async (req: Request, res: Response) => {
  try {
    const { data, error } = await db
      .from('sdk_doc')
      .insert({ ...req.body, author_id: (req as any).user?.id || 'admin' })
      .select()
      .single();
    if (error) return fail(res, 1, error.message);
    success(res, data);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** PUT /api/v1/sdk/admin/docs/:id - 更新文档 */
router.put('/admin/docs/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await db
      .from('sdk_doc')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', Number(req.params.id))
      .select()
      .single();
    if (error) return fail(res, 1, error.message);
    success(res, data);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** DELETE /api/v1/sdk/admin/docs/:id - 删除文档 */
router.delete('/admin/docs/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await db
      .from('sdk_doc')
      .delete()
      .eq('id', Number(req.params.id));
    if (error) return fail(res, 1, error.message);
    success(res, { deleted: true });
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** GET /api/v1/sdk/admin/privacy - 隐私政策列表 */
router.get('/admin/privacy', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await db
      .from('sdk_privacy_policy')
      .select('*')
      .order('effective_date', { ascending: false });
    if (error) return fail(res, 1, error.message);
    success(res, data || []);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** POST /api/v1/sdk/admin/privacy - 创建隐私政策 */
router.post('/admin/privacy', async (req: Request, res: Response) => {
  try {
    const { data, error } = await db
      .from('sdk_privacy_policy')
      .insert({ ...req.body, created_by: (req as any).user?.id || 'admin' })
      .select()
      .single();
    if (error) return fail(res, 1, error.message);
    success(res, data);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

/** PUT /api/v1/sdk/admin/privacy/:id - 更新隐私政策 */
router.put('/admin/privacy/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await db
      .from('sdk_privacy_policy')
      .update(req.body)
      .eq('id', Number(req.params.id))
      .select()
      .single();
    if (error) return fail(res, 1, error.message);
    success(res, data);
  } catch (e: any) {
    fail(res, 500, e.message || 'Internal error');
  }
});

export default router;
