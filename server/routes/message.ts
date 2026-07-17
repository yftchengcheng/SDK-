import express, { Router } from 'express';
import { db } from '../db';
import { authMiddleware, getDeveloper } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

// List messages
router.get('/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { type, isRead, page, pageSize } = req.query as Record<string, string>;

    // 健壮解析 page / pageSize：NaN/负数/0 fallback 到默认
    const p = (() => {
      const n = parseInt(String(page ?? '1'), 10);
      return Number.isFinite(n) && n >= 1 ? n : 1;
    })();
    const ps = (() => {
      const n = parseInt(String(pageSize ?? '20'), 10);
      if (!Number.isFinite(n) || n < 1) return 20;
      if (n > 100) return 100;
      return n;
    })();

    let query = db.from('message').select('*', { count: 'exact' }).eq('developer_id', developerId);

    // 健壮解析 type / isRead：非数字忽略过滤（避免 NaN 触发 Supabase 报错）
    const typeNum = type !== undefined && type !== '' ? parseInt(type, 10) : NaN;
    if (Number.isFinite(typeNum)) query = query.eq('type', typeNum);
    const isReadNum = isRead !== undefined && isRead !== '' ? parseInt(isRead, 10) : NaN;
    if (Number.isFinite(isReadNum)) query = query.eq('is_read', isReadNum);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('List messages error:', err);
    fail(res, 500, '获取消息列表失败');
  }
});

// Mark message as read
router.put('/read', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.body;

    if (!id) {
      fail(res, 400, '缺少消息id');
      return;
    }

    const { error } = await db.from('message').update({ is_read: 1 }).eq('id', id).eq('developer_id', developerId);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '标记成功');
  } catch (err) {
    console.error('Mark read error:', err);
    fail(res, 500, '标记已读失败');
  }
});

// Mark all as read
router.put('/read-all', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);

    const { error } = await db.from('message').update({ is_read: 1 }).eq('developer_id', developerId).eq('is_read', 0);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '全部标记已读');
  } catch (err) {
    console.error('Mark all read error:', err);
    fail(res, 500, '全部标记已读失败');
  }
});

// RESTful: PUT /api/v1/console/message/:id/read  (frontend 用此路径)
router.put('/:id/read', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.params;
    if (!id) return fail(res, 400, '缺少消息id');

    const { error } = await db.from('message').update({ is_read: 1 }).eq('id', Number(id)).eq('developer_id', developerId);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '标记成功');
  } catch (err) {
    console.error('Mark read (RESTful) error:', err);
    fail(res, 500, '标记已读失败');
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);

    const { count, error } = await db.from('message').select('*', { count: 'exact', head: true }).eq('developer_id', developerId).eq('is_read', 0);
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { unreadCount: count });
  } catch (err) {
    console.error('Unread count error:', err);
    fail(res, 500, '获取未读数失败');
  }
});

export default router;
