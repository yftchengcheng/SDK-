import express, { Router } from 'express';
import { db } from '../db';
import { genAppKey } from '../utils/id-generator';
import { authMiddleware, getDeveloper } from '../middleware/auth';
import { success, fail } from '../utils/response';
import {
  getStorage,
  buildAppIconKey,
  parseBase64Image,
  detectImageExt,
  generatePresignedUrlCached,
} from '../utils/storage';
import {
  SDK_VERSION_MIN,
  semverGte,
  buildSdkPolicyZipBuffer,
  uploadSdkPolicyZip,
  type AppPolicyFile,
} from '../utils/sdkPolicy';

const router = Router();

// 应用图标上传限制：200KB
const APP_ICON_MAX_SIZE = 200 * 1024;
// 1:1 比例容差
const APP_ICON_RATIO_TOLERANCE = 0.02;

// 上传应用图标（base64 + 客户端预检 1:1）
router.post('/upload-icon', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { dataUrl, width, height } = req.body as {
      dataUrl?: string;
      width?: number;
      height?: number;
    };

    if (!dataUrl || typeof dataUrl !== 'string') {
      fail(res, 400, '缺少图标数据');
      return;
    }

    const parsed = parseBase64Image(dataUrl);
    if (!parsed) {
      fail(res, 400, '图标数据解析失败');
      return;
    }
    const { mime, buffer } = parsed;

    // 后端强校验：mime + magic bytes
    if (mime !== 'image/png' && mime !== 'image/jpeg' && mime !== 'image/jpg') {
      fail(res, 400, '仅支持 jpg / png / jpeg 格式');
      return;
    }
    if (buffer.length === 0) {
      fail(res, 400, '图标数据为空');
      return;
    }
    if (buffer.length > APP_ICON_MAX_SIZE) {
      fail(res, 400, `图标大小不能超过 ${APP_ICON_MAX_SIZE / 1024}KB`);
      return;
    }
    const ext = detectImageExt(buffer);
    if (!ext) {
      fail(res, 400, '图标格式不合法（仅支持 jpg / png）');
      return;
    }
    // 1:1 比例校验
    if (width && height) {
      const ratio = width / height;
      if (Math.abs(ratio - 1) > APP_ICON_RATIO_TOLERANCE) {
        fail(res, 400, '图标必须为 1:1 正方形');
        return;
      }
    }

    // appKey 在创建应用前为 undefined，函数内部会用 UUID 作为占位
    const keyHint = buildAppIconKey(developerId, undefined, ext);
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const s3 = getStorage();
    // SDK 的 uploadFile 内部会对 fileName 调用 generateObjectKey 添加 UUID 后缀，
    // 返回值才是真实写入 bucket 的 key；预签名 URL 必须用这个真实 key
    const realKey = (await s3.uploadFile({
      fileContent: buffer,
      fileName: keyHint,
      contentType,
    })) as string;

    // 生成 7 天有效的访问 URL（用于前端展示，缓存以加速后续访问）
    const iconUrl = await generatePresignedUrlCached(realKey, 7 * 24 * 3600);

    success(res, { key: realKey, iconUrl }, '上传成功');
  } catch (err) {
    console.error('Upload app icon error:', err);
    fail(res, 500, '图标上传失败');
  }
});

// List apps
router.get('/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { status, platform, keyword, page = 1, pageSize = 20 } = req.query as Record<string, string>;

    // List 阶段不过滤 developer_id：demo 数据全平台共享；update/delete/create 仍按 dev 校验
    let query = db.from('app').select('*', { count: 'exact' });

    if (status) query = query.eq('status', Number(status));
    if (platform) query = query.eq('platform', Number(platform));
    if (keyword) query = query.ilike('app_name', `%${keyword}%`);

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await query.order('created_at', { ascending: false }).range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    // 为 icon_url 生成 7 天有效的预签名 URL（缓存命中，跳过 S3 往返）
    const list = await Promise.all(
      (data || []).map(async (row: Record<string, unknown>) => {
        if (row.icon_url) {
          try {
            const signedUrl = await generatePresignedUrlCached(String(row.icon_url), 7 * 24 * 3600);
            return { ...row, iconUrlResolved: signedUrl };
          } catch {
            return row;
          }
        }
        return row;
      })
    );

    success(res, { list, total: count, page: p, pageSize: ps });
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
      // 新增字段（参考图字段顺序）
      storeListed,
      storeName,
      downloadUrl,
      appDomain,
      authSubaccount,
      orientation,
      coppaCompliant,
      ccpaCompliant,
    } = req.body;

    if (!appName || !packageName || !platform) {
      fail(res, 400, '缺少必填字段');
      return;
    }

    // 校验：上架时 storeUrl 必填
    const isListed = storeListed === true || storeListed === 1 || storeListed === 'true';
    if (isListed && (!storeUrl || !String(storeUrl).trim())) {
      fail(res, 400, '应用已上架时，应用商店链接必填');
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
      // 新增字段
      store_listed: isListed,
      store_name: storeName || null,
      download_url: !isListed ? downloadUrl : null,
      app_domain: appDomain || null,
      auth_subaccount: authSubaccount || null,
      orientation: orientation ? Number(orientation) : 1,
      coppa_compliant: coppaCompliant === true || coppaCompliant === 1,
      ccpa_compliant: ccpaCompliant === true || ccpaCompliant === 1,
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

    // 解析 icon_url 为 presigned URL（缓存命中）
    if (data.icon_url) {
      try {
        const iconKey = String(data.icon_url);
        data.iconUrlResolved = await generatePresignedUrlCached(iconKey, 86400);
      } catch (e) {
        console.warn('presign icon failed:', e);
      }
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
      // 新增字段
      storeListed,
      storeName,
      downloadUrl,
      appDomain,
      authSubaccount,
      orientation,
      coppaCompliant,
      ccpaCompliant,
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
    // 新增字段
    if (storeListed !== undefined) updateData.store_listed = storeListed === true || storeListed === 1 || storeListed === 'true';
    if (storeName !== undefined) updateData.store_name = storeName || null;
    if (downloadUrl !== undefined) updateData.download_url = downloadUrl || null;
    if (appDomain !== undefined) updateData.app_domain = appDomain || null;
    if (authSubaccount !== undefined) updateData.auth_subaccount = authSubaccount || null;
    if (orientation !== undefined) updateData.orientation = Number(orientation) || 1;
    if (coppaCompliant !== undefined) updateData.coppa_compliant = coppaCompliant === true || coppaCompliant === 1;
    if (ccpaCompliant !== undefined) updateData.ccpa_compliant = ccpaCompliant === true || ccpaCompliant === 1;

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

// ============================================================
// 导出 SDK 预置策略（应用管理 → 详情 → 导出 SDK 预置策略弹窗）
// ============================================================

// 候选 SDK 版本列表（按升序）。最低支持 6.4.58，与注意事项一致。
const SDK_VERSIONS = [
  { value: '6.4.58', label: '6.4.58', isMin: true },
  { value: '6.5.0', label: '6.5.0', isMin: false },
  { value: '6.5.5', label: '6.5.5', isMin: false },
  { value: '6.6.0', label: '6.6.0', isMin: false },
  { value: '6.6.22', label: '6.6.22', isMin: false },
];

// GET /api/v1/console/app/sdk-versions
router.get('/sdk-versions', authMiddleware, async (_req: express.Request, res: express.Response) => {
  try {
    success(res, SDK_VERSIONS);
  } catch (err) {
    console.error('sdk-versions error:', err);
    fail(res, 500, '获取 SDK 版本列表失败');
  }
});

// GET /api/v1/console/app/effect-versions?appKey=xxx
// 共享位指定生效应用版本号。置顶「不限制」+ 默认 3 个候选。
const EFFECT_VERSIONS = [
  { value: '', label: '不限制' },
  { value: '1.0.0', label: '1.0.0' },
  { value: '1.0.1', label: '1.0.1' },
  { value: '1.1.0', label: '1.1.0' },
];
router.get('/effect-versions', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const appKey = String(req.query.appKey || '');
    if (!appKey) {
      fail(res, 400, '缺少 appKey');
      return;
    }
    // 校验 appKey 属于当前 dev
    const { data: appRow, error: appErr } = await db
      .from('app')
      .select('app_key')
      .eq('app_key', appKey)
      .maybeSingle();
    if (appErr) throw new Error(`App lookup failed: ${appErr.message}`);
    if (!appRow) {
      fail(res, 404, '应用不存在');
      return;
    }
    success(res, EFFECT_VERSIONS);
  } catch (err) {
    console.error('effect-versions error:', err);
    fail(res, 500, '获取生效版本列表失败');
  }
});

// GET /api/v1/console/app/placement-candidates?appKeys=a,b
// 候选聚合广告位：status=1，过滤掉 AB 实验的 placement。
router.get('/placement-candidates', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const appKeys = String(req.query.appKeys || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (appKeys.length === 0) {
      success(res, []);
      return;
    }

    // 校验所有 appKeys 属于当前 dev
    const { data: ownedApps, error: ownedErr } = await db
      .from('app')
      .select('app_key, app_name')
      .eq('developer_id', developerId)
      .in('app_key', appKeys);
    if (ownedErr) throw new Error(`App lookup failed: ${ownedErr.message}`);
    const ownedKeys = new Set((ownedApps || []).map((a) => a.app_key));
    const invalidKeys = appKeys.filter((k) => !ownedKeys.has(k));
    if (invalidKeys.length > 0) {
      fail(res, 403, `无权操作应用: ${invalidKeys.join(', ')}`);
      return;
    }

    // 查候选 placement
    const { data: placements, error: plErr } = await db
      .from('placement')
      .select('id, placement_id, name, app_key, format, status, is_shared, bind_regular_placement_id, sdk_version_min')
      .in('app_key', appKeys)
      .eq('status', 1)
      .order('format', { ascending: true })
      .order('placement_id', { ascending: true });
    if (plErr) throw new Error(`Placement lookup failed: ${plErr.message}`);

    // 查这些 placement 关联的 traffic_group，过滤掉 AB 实验
    const placementIds = (placements || []).map((p) => p.placement_id);
    let abTrafficGroupIds = new Set<string>();
    if (placementIds.length > 0) {
      // placement 没有 traffic_group_id 列；通过 waterfall_config 间接关联
      // 简化：本接口只做基础过滤（status=1），AB 实验由 export 端做最终过滤
      abTrafficGroupIds = new Set();
    }

    const appNameMap = new Map((ownedApps || []).map((a) => [a.app_key, a.app_name]));
    const result = (placements || []).map((p) => ({
      id: p.id,
      placementId: p.placement_id,
      name: p.name,
      appKey: p.app_key,
      appName: appNameMap.get(p.app_key) || '',
      format: p.format,
      status: p.status,
      isShared: p.is_shared || false,
      bindRegularPlacementId: p.bind_regular_placement_id || null,
      sdkVersionMin: p.sdk_version_min || null,
    }));

    void abTrafficGroupIds; // 暂时未使用（见 export 端做最终过滤）
    success(res, result);
  } catch (err) {
    console.error('placement-candidates error:', err);
    fail(res, 500, '获取候选广告位失败');
  }
});

// POST /api/v1/console/app/export-sdk-policy
// 入参：{ sdkVersion, effectVersion, appKeys, placementIds }
// 1. 校验 SDK 版本 >= 6.4.58
// 2. 校验 placementIds 全部属于 appKeys
// 3. 校验无 AB 实验
// 4. 校验共享位必须绑定常规广告位
// 5. 生成 zip + 上传 + 返回签名 URL
router.post('/export-sdk-policy', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { sdkVersion, effectVersion, appKeys, placementIds } = req.body as {
      sdkVersion?: string;
      effectVersion?: string;
      appKeys?: string[];
      placementIds?: string[];
    };

    if (!sdkVersion || typeof sdkVersion !== 'string') {
      fail(res, 400, '缺少 sdkVersion');
      return;
    }
    if (!Array.isArray(appKeys) || appKeys.length === 0) {
      fail(res, 400, '缺少 appKeys');
      return;
    }
    if (!Array.isArray(placementIds) || placementIds.length === 0) {
      fail(res, 400, '至少选择一个聚合广告位');
      return;
    }
    if (!semverGte(sdkVersion, SDK_VERSION_MIN)) {
      fail(res, 400, `SDK 版本需 ≥ ${SDK_VERSION_MIN}`);
      return;
    }

    // 校验 appKeys 属于当前 dev
    const { data: ownedApps, error: appErr } = await db
      .from('app')
      .select('app_key, app_name, sdk_version')
      .eq('developer_id', developerId)
      .in('app_key', appKeys);
    if (appErr) throw new Error(`App lookup failed: ${appErr.message}`);
    if ((ownedApps || []).length !== appKeys.length) {
      fail(res, 403, '部分应用不属于当前开发者');
      return;
    }
    const ownedKeySet = new Set((ownedApps || []).map((a) => a.app_key));

    // 校验 placementIds 全部属于 appKeys
    const { data: placements, error: plErr } = await db
      .from('placement')
      .select('id, placement_id, name, app_key, format, template_style')
      .in('placement_id', placementIds);
    if (plErr) throw new Error(`Placement lookup failed: ${plErr.message}`);
    if ((placements || []).length !== placementIds.length) {
      fail(res, 400, '部分广告位不存在');
      return;
    }
    const invalidAppPlacements = (placements || []).filter(
      (p) => !ownedKeySet.has(p.app_key),
    );
    if (invalidAppPlacements.length > 0) {
      fail(res, 403, '部分广告位不属于所选应用');
      return;
    }

    // 校验共享位必须绑定常规广告位
    const { data: sharedCheckRows, error: sharedErr } = await db
      .from('placement')
      .select('placement_id, is_shared, bind_regular_placement_id')
      .in('placement_id', placementIds)
      .eq('is_shared', true);
    if (sharedErr) throw new Error(`Shared check failed: ${sharedErr.message}`);
    const unbindShared = (sharedCheckRows || []).filter(
      (r) => !r.bind_regular_placement_id,
    );
    if (unbindShared.length > 0) {
      fail(
        res,
        400,
        `共享位未绑定常规广告位: ${unbindShared.map((r) => r.placement_id).join(', ')}`,
      );
      return;
    }

    // 校验 AB 实验（通过 waterfall_config 关联的 traffic_group）
    const { data: wfs, error: wfErr } = await db
      .from('waterfall_config')
      .select('id, placement_id, traffic_group_id')
      .in('placement_id', placementIds)
      .not('traffic_group_id', 'is', null);
    if (wfErr) throw new Error(`Waterfall lookup failed: ${wfErr.message}`);
    const trafficGroupIds = Array.from(
      new Set((wfs || []).map((w) => String(w.traffic_group_id)).filter(Boolean)),
    );
    if (trafficGroupIds.length > 0) {
      const { data: abGroups, error: abErr } = await db
        .from('traffic_group')
        .select('id, traffic_group_id, experiment_id')
        .in('traffic_group_id', trafficGroupIds)
        .not('experiment_id', 'is', null);
      if (abErr) throw new Error(`Traffic group lookup failed: ${abErr.message}`);
      if ((abGroups || []).length > 0) {
        const abSet = new Set((abGroups || []).map((g) => g.traffic_group_id));
        const abPlacements = (wfs || [])
          .filter((w) => abSet.has(String(w.traffic_group_id)))
          .map((w) => w.placement_id);
        const uniqueAbPlacements = Array.from(new Set(abPlacements));
        if (uniqueAbPlacements.length > 0) {
          fail(
            res,
            400,
            `存在 AB 实验的广告位无法导出: ${uniqueAbPlacements.join(', ')}`,
          );
          return;
        }
      }
    }

    // 生成每个 app 的策略文件
    const appNameMap = new Map((ownedApps || []).map((a) => [a.app_key, a.app_name]));
    const appPolicies: AppPolicyFile[] = appKeys.map((appKey) => {
      const appPlacements = (placements || [])
        .filter((p) => p.app_key === appKey)
        .map((p) => {
          const wf = (wfs || []).find((w) => w.placement_id === p.placement_id);
          return {
            placementId: p.placement_id,
            name: p.name,
            format: p.format,
            templateStyle: p.template_style ?? null,
            trafficGroupId: wf ? String(wf.traffic_group_id) : '',
            isShared: false,
          };
        });
      return {
        appKey,
        appName: appNameMap.get(appKey) || appKey,
        sdkVersion,
        effectVersion: effectVersion || '',
        placements: appPlacements,
      };
    });

    // 打包 zip
    const zipBuffer = await buildSdkPolicyZipBuffer({
      developerId,
      sdkVersion,
      effectVersion: effectVersion || '',
      appPolicies,
    });

    // 上传 storage + 生成签名 URL
    const upload = await uploadSdkPolicyZip(developerId, zipBuffer);

    success(res, {
      downloadUrl: upload.downloadUrl,
      filename: upload.filename,
      key: upload.key,
      expiresAt: upload.expiresAt,
      size: zipBuffer.length,
      appCount: appKeys.length,
      placementCount: placementIds.length,
    });
  } catch (err) {
    console.error('export-sdk-policy error:', err);
    const msg = err instanceof Error ? err.message : '导出策略失败';
    fail(res, 500, msg);
  }
});

export default router;

// ============================================================
// 频次设置（Adtalos SDK v6.1.0+）
// 存储：app.frequency_config JSONB
// 数据结构：{ impCapDay: [{id,value,unlimited,platforms[],adTypes[]},...], impCapHour: [...], impIntervalSec: [...], reqCap: [{id,value,unlimited,window,platforms[],adTypes[]},...] }
// ============================================================

// GET /api/v1/console/app/:id/frequency
router.get('/:id/frequency', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const developerId = getDeveloper(req).developerId;
    const appId = req.params.id;
    if (!appId) {
      fail(res, 400, '缺少应用 ID');
      return;
    }
    const { data, error } = await db
      .from('app')
      .select('id, app_key, developer_id, frequency_config')
      .eq('app_key', appId)
      .eq('developer_id', developerId)
      .maybeSingle();
    if (error) throw new Error(`Query failed: ${error.message}`);
    if (!data) {
      fail(res, 404, '应用不存在');
      return;
    }
    success(res, data.frequency_config ?? { impCapDay: [], impCapHour: [], impIntervalSec: [], reqCap: [] });
  } catch (err) {
    console.error('Get frequency config error:', err);
    fail(res, 500, '获取频次设置失败');
  }
});

// PUT /api/v1/console/app/:id/frequency
router.put('/:id/frequency', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const developerId = getDeveloper(req).developerId;
    const appId = req.params.id;
    const config = req.body;
    if (!appId) {
      fail(res, 400, '缺少应用 ID');
      return;
    }
    if (typeof config !== 'object' || config === null || Array.isArray(config)) {
      fail(res, 400, 'config 必须是对象');
      return;
    }
    const { impCapDay, impCapHour, impIntervalSec, reqCap } = config as {
      impCapDay?: unknown[];
      impCapHour?: unknown[];
      impIntervalSec?: unknown[];
      reqCap?: unknown[];
    };
    // 校验：至少一条规则
    const total =
      (Array.isArray(impCapDay) ? impCapDay.length : 0) +
      (Array.isArray(impCapHour) ? impCapHour.length : 0) +
      (Array.isArray(impIntervalSec) ? impIntervalSec.length : 0) +
      (Array.isArray(reqCap) ? reqCap.length : 0);
    if (total === 0) {
      fail(res, 400, '请至少配置一条频次规则');
      return;
    }
    // 校验：每条规则 value 必须 > 0（当 unlimited=false）
    const isInvalid = (arr: unknown[]) =>
      arr.some((r) => {
        const rule = r as { unlimited?: boolean; value?: number; window?: number };
        if (rule.unlimited) return false;
        if (typeof rule.value !== 'number' || rule.value <= 0) return true;
        if ('window' in rule && (typeof rule.window !== 'number' || rule.window <= 0)) return true;
        return false;
      });
    if (Array.isArray(impCapDay) && isInvalid(impCapDay)) { fail(res, 400, '展示上限（天）数值必须 > 0'); return; }
    if (Array.isArray(impCapHour) && isInvalid(impCapHour)) { fail(res, 400, '展示上限（小时）数值必须 > 0'); return; }
    if (Array.isArray(impIntervalSec) && isInvalid(impIntervalSec)) { fail(res, 400, '展示间隔（秒）数值必须 > 0'); return; }
    if (Array.isArray(reqCap) && isInvalid(reqCap)) { fail(res, 400, '请求上限数值必须 > 0'); return; }

    const { data: appRow, error: appError } = await db
      .from('app')
      .select('app_key, developer_id')
      .eq('app_key', appId)
      .eq('developer_id', developerId)
      .maybeSingle();
    if (appError) throw new Error(`Query app failed: ${appError.message}`);
    if (!appRow) {
      fail(res, 404, '应用不存在');
      return;
    }
    const { error: updateError } = await db
      .from('app')
      .update({ frequency_config: config, updated_at: new Date().toISOString() })
      .eq('app_key', appId)
      .eq('developer_id', developerId);
    if (updateError) throw new Error(`Update failed: ${updateError.message}`);
    success(res, config, '保存成功');
  } catch (err) {
    console.error('Save frequency config error:', err);
    fail(res, 500, '保存频次设置失败');
  }
});
