import express, { Router } from 'express';
import { db } from '../db';
import { genAppKey } from '../utils/id-generator';
import { authMiddleware, getDeveloper } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

// List apps
router.get('/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { status, platform, keyword, page = 1, pageSize = 20 } = req.query as Record<string, string>;

    let query = db.from('app').select('*', { count: 'exact' }).eq('developer_id', developerId);

    if (status) query = query.eq('status', Number(status));
    if (platform) query = query.eq('platform', Number(platform));
    if (keyword) query = query.ilike('app_name', `%${keyword}%`);

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await query.order('created_at', { ascending: false }).range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('List apps error:', err);
    fail(res, 500, '获取应用列表失败');
  }
});

// Create app
router.post('/create', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const {
      appName,
      packageName,
      platform,
      category,
      iconUrl,
      timeoutMs,
      storeUrl,
      wechatAppId,
      wechatUniversalLink,
    } = req.body;

    if (!appName || !packageName || !platform) {
      fail(res, 400, '缺少必填字段');
      return;
    }

    // 取开发者账户的对接方式（注册时已锁定，1=SDK / 2=API）
    const { data: dev, error: devError } = await db
      .from('developer')
      .select('access_type')
      .eq('developer_id', developerId)
      .maybeSingle();
    if (devError) throw new Error(`Query failed: ${devError.message}`);
    if (!dev) {
      fail(res, 404, '开发者账户不存在');
      return;
    }
    const accessType = dev.access_type as number;

    // 校验：iOS + SDK 接入时若填写微信 APP ID，则 Universal Link 必填（两者配套）
    if (accessType === 1 && Number(platform) === 2) {
      const hasAppId = wechatAppId && String(wechatAppId).trim();
      const hasUniLink = wechatUniversalLink && String(wechatUniversalLink).trim();
      if (hasAppId && !hasUniLink) {
        fail(res, 400, 'iOS + SDK 接入时，微信 APP ID 与 Universal Link 需同时填写');
        return;
      }
      if (hasUniLink && !hasAppId) {
        fail(res, 400, 'iOS + SDK 接入时，微信 APP ID 与 Universal Link 需同时填写');
        return;
      }
    }

    const appKey = genAppKey();
    const normalizedTimeout = Number(timeoutMs);
    const safeTimeout = Number.isFinite(normalizedTimeout) && normalizedTimeout > 0
      ? Math.min(Math.max(Math.round(normalizedTimeout), 100), 60000)
      : 1000;

    const { data, error } = await db.from('app').insert({
      developer_id: developerId,
      app_key: appKey,
      app_name: appName,
      package_name: packageName,
      platform,
      access_type: accessType,
      category: category || null,
      icon_url: iconUrl || null,
      timeout_ms: safeTimeout,
      store_url: storeUrl || null,
      wechat_app_id: accessType === 1 ? wechatAppId : null,
      wechat_universal_link: accessType === 1 && Number(platform) === 2 ? wechatUniversalLink : null,
    }).select().single();
    if (error) throw new Error(`Insert failed: ${error.message}`);

    success(res, data, '创建成功');
  } catch (err) {
    console.error('Create app error:', err);
    fail(res, 500, '创建应用失败');
  }
});

// Get app detail
router.get('/detail', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey } = req.query as Record<string, string>;

    if (!appKey) {
      fail(res, 400, '缺少appKey');
      return;
    }

    const { data, error } = await db.from('app').select('*').eq('app_key', appKey).eq('developer_id', developerId).maybeSingle();
    if (error) throw new Error(`Query failed: ${error.message}`);

    if (!data) {
      fail(res, 404, '应用不存在');
      return;
    }

    success(res, data);
  } catch (err) {
    console.error('Get app detail error:', err);
    fail(res, 500, '获取应用详情失败');
  }
});

// Update app
router.put('/update', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const {
      appKey,
      appName,
      category,
      iconUrl,
      timeoutMs,
      storeUrl,
      wechatAppId,
      wechatUniversalLink,
      packageName,
    } = req.body;

    if (!appKey) {
      fail(res, 400, '缺少appKey');
      return;
    }

    // 先取当前应用，确认 access_type + platform 用于条件校验
    const { data: existing, error: existErr } = await db
      .from('app')
      .select('access_type, platform')
      .eq('app_key', appKey)
      .eq('developer_id', developerId)
      .maybeSingle();
    if (existErr) throw new Error(`Query failed: ${existErr.message}`);
    if (!existing) {
      fail(res, 404, '应用不存在');
      return;
    }

    // 校验：SDK 接入时必须填微信 APP ID；iOS + SDK 接入时必须填微信 Universal Link
    if (existing.access_type === 1) {
      if (wechatAppId !== undefined && (!wechatAppId || !String(wechatAppId).trim())) {
        fail(res, 400, 'SDK 接入必须填写微信 APP ID');
        return;
      }
      if (existing.platform === 2) {
        if (wechatUniversalLink !== undefined && (!wechatUniversalLink || !String(wechatUniversalLink).trim())) {
          fail(res, 400, 'iOS + SDK 接入必须填写微信 Universal Link');
          return;
        }
      }
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (appName !== undefined) updateData.app_name = appName;
    if (packageName !== undefined) updateData.package_name = packageName;
    if (category !== undefined) updateData.category = category;
    if (iconUrl !== undefined) updateData.icon_url = iconUrl;
    if (timeoutMs !== undefined) {
      const n = Number(timeoutMs);
      if (Number.isFinite(n) && n > 0) {
        updateData.timeout_ms = Math.min(Math.max(Math.round(n), 100), 60000);
      }
    }
    if (storeUrl !== undefined) updateData.store_url = storeUrl;
    if (wechatAppId !== undefined) updateData.wechat_app_id = wechatAppId;
    if (wechatUniversalLink !== undefined) updateData.wechat_universal_link = wechatUniversalLink;

    const { error } = await db.from('app').update(updateData).eq('app_key', appKey).eq('developer_id', developerId);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '更新成功');
  } catch (err) {
    console.error('Update app error:', err);
    fail(res, 500, '更新应用失败');
  }
});

// Toggle app status
router.put('/toggle-status', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, status } = req.body;

    if (!appKey || !status) {
      fail(res, 400, '缺少必填字段');
      return;
    }

    const { error } = await db.from('app').update({ status, updated_at: new Date().toISOString() }).eq('app_key', appKey).eq('developer_id', developerId);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '状态更新成功');
  } catch (err) {
    console.error('Toggle app status error:', err);
    fail(res, 500, '状态更新失败');
  }
});

// Delete app
router.delete('/delete', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey } = req.query as Record<string, string>;

    if (!appKey) {
      fail(res, 400, '缺少appKey');
      return;
    }

    // Check if app has placements
    const { count, error: countError } = await db.from('placement').select('*', { count: 'exact', head: true }).eq('app_key', appKey);
    if (countError) throw new Error(`Count failed: ${countError.message}`);

    if (count && count > 0) {
      fail(res, 400, '该应用下还有广告位，无法删除');
      return;
    }

    const { error } = await db.from('app').delete().eq('app_key', appKey).eq('developer_id', developerId);
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, null, '删除成功');
  } catch (err) {
    console.error('Delete app error:', err);
    fail(res, 500, '删除应用失败');
  }
});

export default router;
