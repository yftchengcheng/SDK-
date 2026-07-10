import express, { Router } from 'express';
import { db } from '../db';
import { authMiddleware, getDeveloper } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

// List all networks (builtin + custom)
router.get('/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);

    // Get builtin networks (network_type=1) + user's custom networks (network_type=2)
    const { data, error } = await db.from('ad_network_def')
      .select('*')
      .or(`network_type.eq.1,created_by.eq.${developerId}`)
      .eq('status', 1)
      .order('network_type', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data || [] });
  } catch (err) {
    console.error('List networks error:', err);
    fail(res, 500, '获取网络列表失败');
  }
});

// List custom networks
router.get('/custom/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { page = 1, pageSize = 20 } = req.query as Record<string, string>;

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await db.from('ad_network_def')
      .select('*', { count: 'exact' })
      .eq('created_by', developerId)
      .eq('network_type', 2)
      .order('created_at', { ascending: false })
      .range((p - 1) * ps, p * ps - 1);

    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('List custom networks error:', err);
    fail(res, 500, '获取自定义网络列表失败');
  }
});

// Create custom network
router.post('/custom/create', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { networkName, adapterClassInit, adapterClassBanner, adapterClassInterstitial, adapterClassRewarded, adapterClassNative, adapterClassSplash, supportsBidding } = req.body;

    if (!networkName) {
      fail(res, 400, '网络名称不能为空');
      return;
    }

    // Generate a unique network code
    const networkCode = `CUSTOM_${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await db.from('ad_network_def').insert({
      network_code: networkCode,
      network_name: networkName,
      network_type: 2,
      adapter_class_init: adapterClassInit || null,
      adapter_class_banner: adapterClassBanner || null,
      adapter_class_interstitial: adapterClassInterstitial || null,
      adapter_class_rewarded: adapterClassRewarded || null,
      adapter_class_native: adapterClassNative || null,
      adapter_class_splash: adapterClassSplash || null,
      supports_bidding: supportsBidding ? 1 : 0,
      created_by: developerId,
    }).select().single();

    if (error) throw new Error(`Insert failed: ${error.message}`);

    success(res, data, '创建成功');
  } catch (err) {
    console.error('Create custom network error:', err);
    fail(res, 500, '创建自定义网络失败');
  }
});

// Update custom network
router.post('/custom/update', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id, networkName, adapterClassInit, adapterClassBanner, adapterClassInterstitial, adapterClassRewarded, adapterClassNative, adapterClassSplash, supportsBidding, status } = req.body;

    if (!id) {
      fail(res, 400, '缺少网络id');
      return;
    }

    // Verify ownership
    const { data: existing, error: checkError } = await db.from('ad_network_def').select('created_by').eq('id', id).single();
    if (checkError || !existing || existing.created_by !== developerId) {
      fail(res, 403, '无权操作此网络');
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (networkName !== undefined) updateData.network_name = networkName;
    if (adapterClassInit !== undefined) updateData.adapter_class_init = adapterClassInit;
    if (adapterClassBanner !== undefined) updateData.adapter_class_banner = adapterClassBanner;
    if (adapterClassInterstitial !== undefined) updateData.adapter_class_interstitial = adapterClassInterstitial;
    if (adapterClassRewarded !== undefined) updateData.adapter_class_rewarded = adapterClassRewarded;
    if (adapterClassNative !== undefined) updateData.adapter_class_native = adapterClassNative;
    if (adapterClassSplash !== undefined) updateData.adapter_class_splash = adapterClassSplash;
    if (supportsBidding !== undefined) updateData.supports_bidding = supportsBidding ? 1 : 0;
    if (status !== undefined) updateData.status = status;

    const { error } = await db.from('ad_network_def').update(updateData).eq('id', id);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '更新成功');
  } catch (err) {
    console.error('Update custom network error:', err);
    fail(res, 500, '更新自定义网络失败');
  }
});

// RESTful: PUT /api/v1/console/network/custom/:id  (frontend 用此路径)
router.put('/custom/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.params;
    const { networkName, networkCode, adapterClassInit, adapterClassBanner, adapterClassInterstitial, adapterClassRewarded, adapterClassNative, adapterClassSplash, supportsBidding, status } = req.body as Record<string, unknown>;
    if (!id) return fail(res, 400, '缺少网络id');

    const { data: existing, error: checkError } = await db.from('ad_network_def').select('created_by').eq('id', Number(id)).single();
    if (checkError || !existing || existing.created_by !== developerId) {
      fail(res, 403, '无权操作此网络');
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (networkName !== undefined) updateData.network_name = String(networkName);
    if (networkCode !== undefined) updateData.network_code = String(networkCode);
    if (adapterClassInit !== undefined) updateData.adapter_class_init = adapterClassInit ? String(adapterClassInit) : null;
    if (adapterClassBanner !== undefined) updateData.adapter_class_banner = adapterClassBanner ? String(adapterClassBanner) : null;
    if (adapterClassInterstitial !== undefined) updateData.adapter_class_interstitial = adapterClassInterstitial ? String(adapterClassInterstitial) : null;
    if (adapterClassRewarded !== undefined) updateData.adapter_class_rewarded = adapterClassRewarded ? String(adapterClassRewarded) : null;
    if (adapterClassNative !== undefined) updateData.adapter_class_native = adapterClassNative ? String(adapterClassNative) : null;
    if (adapterClassSplash !== undefined) updateData.adapter_class_splash = adapterClassSplash ? String(adapterClassSplash) : null;
    if (supportsBidding !== undefined) updateData.supports_bidding = supportsBidding ? 1 : 0;
    if (status !== undefined) updateData.status = Number(status);

    const { error } = await db.from('ad_network_def').update(updateData).eq('id', Number(id));
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '更新成功');
  } catch (err) {
    console.error('Update custom network (RESTful) error:', err);
    fail(res, 500, '更新自定义网络失败');
  }
});

// RESTful: DELETE /api/v1/console/network/custom/:id
router.delete('/custom/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.params;
    if (!id) return fail(res, 400, '缺少网络id');

    const { data: existing, error: checkError } = await db.from('ad_network_def').select('created_by').eq('id', Number(id)).single();
    if (checkError || !existing || existing.created_by !== developerId) {
      fail(res, 403, '无权操作此网络');
      return;
    }

    const { error } = await db.from('ad_network_def').delete().eq('id', Number(id));
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, null, '删除成功');
  } catch (err) {
    console.error('Delete custom network (RESTful) error:', err);
    fail(res, 500, '删除自定义网络失败');
  }
});

// Get custom network detail
router.get('/custom/detail', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.query as Record<string, string>;
    if (!id) {
      fail(res, 400, '缺少网络id');
      return;
    }

    const { data, error } = await db.from('ad_network_def').select('*').eq('id', Number(id)).single();
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, data);
  } catch (err) {
    console.error('Get network detail error:', err);
    fail(res, 500, '获取网络详情失败');
  }
});

// Adapter version list
router.get('/custom/adapter/versions', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { networkDefId, page = 1, pageSize = 20 } = req.query as Record<string, string>;

    if (!networkDefId) {
      fail(res, 400, '缺少networkDefId');
      return;
    }

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await db.from('custom_adapter_version')
      .select('*', { count: 'exact' })
      .eq('network_def_id', Number(networkDefId))
      .order('created_at', { ascending: false })
      .range((p - 1) * ps, p * ps - 1);

    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('Adapter versions error:', err);
    fail(res, 500, '获取Adapter版本列表失败');
  }
});

// Upload adapter (create version record)
router.post('/custom/adapter/upload', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { networkDefId, version, fileName, fileUrl, fileSize, fileMd5, sdkMinVersion, changelog } = req.body;

    if (!networkDefId || !version || !fileName || !fileUrl) {
      fail(res, 400, '缺少必填参数');
      return;
    }

    const { data, error } = await db.from('custom_adapter_version').insert({
      network_def_id: Number(networkDefId),
      developer_id: developerId,
      version,
      file_name: fileName,
      file_url: fileUrl,
      file_size: fileSize || null,
      file_md5: fileMd5 || null,
      sdk_min_version: sdkMinVersion || null,
      changelog: changelog || null,
      status: 1, // pending review
    }).select().single();

    if (error) throw new Error(`Insert failed: ${error.message}`);

    success(res, data, '上传成功');
  } catch (err) {
    console.error('Upload adapter error:', err);
    fail(res, 500, '上传Adapter失败');
  }
});

// Update adapter status (review)
router.put('/custom/adapter/status', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { id, status, reviewComment } = req.body;
    if (!id || !status) {
      fail(res, 400, '缺少必填参数');
      return;
    }

    const updateData: Record<string, unknown> = { status: Number(status) };
    if (reviewComment !== undefined) updateData.review_comment = reviewComment;
    if (Number(status) === 2 || Number(status) === 4) {
      updateData.reviewed_at = new Date().toISOString();
    }

    const { error } = await db.from('custom_adapter_version').update(updateData).eq('id', Number(id));
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '状态更新成功');
  } catch (err) {
    console.error('Update adapter status error:', err);
    fail(res, 500, '更新状态失败');
  }
});

// RESTful: DELETE /api/v1/console/network/adapter/:id  (frontend 用此路径)
router.delete('/adapter/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.params;
    if (!id) return fail(res, 400, '缺少adapter id');

    // Step 1: 取 adapter 记录 (single)
    const { data: adapter } = await db.from('custom_adapter_version')
      .select('id, network_def_id')
      .eq('id', Number(id))
      .maybeSingle();
    if (!adapter) {
      fail(res, 404, 'Adapter 不存在');
      return;
    }

    // Step 2: 校验所属网络是否属于当前 developer
    const { data: net } = await db.from('ad_network_def')
      .select('created_by')
      .eq('id', adapter.network_def_id)
      .maybeSingle();
    if (!net || net.created_by !== developerId) {
      fail(res, 403, '无权操作此 Adapter');
      return;
    }

    const { error } = await db.from('custom_adapter_version').delete().eq('id', Number(id));
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, null, '删除成功');
  } catch (err) {
    console.error('Delete adapter (RESTful) error:', err);
    fail(res, 500, '删除Adapter失败');
  }
});

// RESTful: GET /api/v1/console/network/adapter/list?networkDefId=... (frontend 期望)
router.get('/adapter/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { networkDefId, page = 1, pageSize = 20 } = req.query as Record<string, string>;
    if (!networkDefId) return fail(res, 400, '缺少networkDefId');

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await db.from('custom_adapter_version')
      .select('*', { count: 'exact' })
      .eq('network_def_id', Number(networkDefId))
      .order('created_at', { ascending: false })
      .range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('Adapter list (RESTful) error:', err);
    fail(res, 500, '获取Adapter版本列表失败');
  }
});

// RESTful: POST /api/v1/console/network/adapter/upload
router.post('/adapter/upload', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { networkDefId, version, fileName, fileUrl, fileSize, fileMd5, sdkMinVersion, changelog } = req.body;
    if (!networkDefId || !version || !fileName || !fileUrl) return fail(res, 400, '缺少必填参数');

    const { data, error } = await db.from('custom_adapter_version').insert({
      network_def_id: Number(networkDefId),
      developer_id: developerId,
      version,
      file_name: fileName,
      file_url: fileUrl,
      file_size: fileSize || null,
      file_md5: fileMd5 || null,
      sdk_min_version: sdkMinVersion || null,
      changelog: changelog || null,
      status: 1,
    }).select().single();
    if (error) throw new Error(`Insert failed: ${error.message}`);

    success(res, data, '上传成功');
  } catch (err) {
    console.error('Adapter upload (RESTful) error:', err);
    fail(res, 500, '上传Adapter失败');
  }
});

// RESTful: GET /api/v1/console/network/adapter/download/:id
router.get('/adapter/download/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    if (!id) return fail(res, 400, '缺少adapter id');

    const { data, error } = await db.from('custom_adapter_version')
      .select('file_name, file_url')
      .eq('id', Number(id))
      .maybeSingle();
    if (error) throw new Error(`Query failed: ${error.message}`);
    if (!data) return fail(res, 404, 'Adapter 不存在');

    // Simulate file content (实际生产从对象存储拉取)
    const { data: fileData } = await db.storage.from('adapter').download(data.file_url).catch(() => ({ data: null }));
    const fileContent = fileData ? await fileData.text() : `// Mock content for ${data.file_name} (${data.file_url})`;
    success(res, { file_name: data.file_name, file_content: fileContent });
  } catch (err) {
    console.error('Adapter download (RESTful) error:', err);
    fail(res, 500, '下载Adapter失败');
  }
});

// RESTful: POST /api/v1/console/network/adapter/review/:id
router.post('/adapter/review/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;
    if (!id) return fail(res, 400, '缺少adapter id');
    if (status !== 2 && status !== 3) return fail(res, 400, 'status 必须是 2(通过) 或 3(驳回)');

    const { data, error } = await db.from('custom_adapter_version').update({
      status: Number(status),
      review_comment: remark || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', Number(id)).select().single();
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, data, status === 2 ? '审核通过' : '已驳回');
  } catch (err) {
    console.error('Adapter review (RESTful) error:', err);
    fail(res, 500, '审核失败');
  }
});

// Bind network to app
router.post('/app/bind', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, networkDefId, adapterVersionId, networkAppId, extraParams } = req.body;
    if (!appKey || !networkDefId) {
      fail(res, 400, '缺少必填参数');
      return;
    }
    // 平台应用 ID 缺省回退为 appKey（用于简化关联流程，后续可在网络平台详情补填）
    const finalNetworkAppId = (networkAppId && String(networkAppId).trim()) || appKey;

    // Verify app ownership
    const { data: appData } = await db.from('app').select('developer_id').eq('app_key', appKey).single();
    if (!appData || appData.developer_id !== developerId) {
      fail(res, 403, '无权操作此应用');
      return;
    }

    const { data, error } = await db.from('app_network_binding').insert({
      app_key: appKey,
      network_def_id: Number(networkDefId),
      adapter_version_id: adapterVersionId ? Number(adapterVersionId) : 0,
      network_app_id: finalNetworkAppId,
      extra_params: extraParams || null,
    }).select().single();

    if (error) {
      if (error.code === '23505') {
        fail(res, 409, '该网络已关联此应用');
        return;
      }
      throw new Error(`Insert failed: ${error.message}`);
    }

    success(res, data, '关联成功');
  } catch (err) {
    console.error('Bind network error:', err);
    fail(res, 500, '关联网络失败');
  }
});

// Unbind network from app
router.post('/app/unbind', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, networkDefId } = req.body;

    if (!appKey || !networkDefId) {
      fail(res, 400, '缺少必填参数');
      return;
    }

    // Verify app ownership
    const { data: appData } = await db.from('app').select('developer_id').eq('app_key', appKey).single();
    if (!appData || appData.developer_id !== developerId) {
      fail(res, 403, '无权操作此应用');
      return;
    }

    const { error } = await db.from('app_network_binding').delete().eq('app_key', appKey).eq('network_def_id', Number(networkDefId));
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, null, '解除关联成功');
  } catch (err) {
    console.error('Unbind network error:', err);
    fail(res, 500, '解除关联失败');
  }
});

// List app network bindings
router.get('/app/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { appKey } = req.query as Record<string, string>;
    if (!appKey) {
      fail(res, 400, '缺少appKey');
      return;
    }

    const { data, error } = await db.from('app_network_binding').select('*').eq('app_key', appKey);
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, data);
  } catch (err) {
    console.error('List app networks error:', err);
    fail(res, 500, '获取应用网络列表失败');
  }
});

// Upload custom network report data
router.post('/custom/report/upload', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, placementId, networkDefId, statDate, impressions, clicks, revenue, uploadType } = req.body;

    if (!appKey || !placementId || !networkDefId || !statDate) {
      fail(res, 400, '缺少必填参数');
      return;
    }

    const { error } = await db.from('custom_network_report').upsert({
      developer_id: developerId,
      app_key: appKey,
      placement_id: placementId,
      network_def_id: Number(networkDefId),
      stat_date: statDate,
      impressions: Number(impressions || 0),
      clicks: Number(clicks || 0),
      revenue: Number(revenue || 0),
      upload_type: Number(uploadType || 1),
    }, { onConflict: 'developer_id,app_key,placement_id,network_def_id,stat_date' });

    if (error) throw new Error(`Upsert failed: ${error.message}`);

    success(res, null, '上传成功');
  } catch (err) {
    console.error('Upload custom report error:', err);
    fail(res, 500, '上传数据失败');
  }
});

// Query custom network report data
router.get('/custom/report/query', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, networkDefId, startDate, endDate, page = 1, pageSize = 20 } = req.query as Record<string, string>;

    let query = db.from('custom_network_report').select('*', { count: 'exact' }).eq('developer_id', developerId);

    if (appKey) query = query.eq('app_key', appKey);
    if (networkDefId) query = query.eq('network_def_id', Number(networkDefId));
    if (startDate) query = query.gte('stat_date', startDate);
    if (endDate) query = query.lte('stat_date', endDate);

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await query.order('stat_date', { ascending: false }).range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('Query custom report error:', err);
    fail(res, 500, '查询数据失败');
  }
});

// ============== 广告网络账号（6 步对接流程 步骤 2） ==============

// Create network account
router.post('/account/create', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { networkDefId, appId, accountName, accountId, credentials, status, remark } = req.body as Record<string, unknown>;

    if (!networkDefId) return fail(res, 400, '网络定义 ID 不能为空');
    if (!accountName) return fail(res, 400, '账号名称不能为空');

    const insertData = {
      developer_id: developerId,
      network_def_id: Number(networkDefId),
      app_id: appId ? Number(appId) : null,
      account_name: String(accountName),
      account_id: accountId ? String(accountId) : null,
      credentials: credentials || {},
      status: status ? Number(status) : 1,
      remark: remark ? String(remark) : null,
    };

    const { data, error } = await db.from('ad_network_account').insert(insertData).select().single();
    if (error) throw new Error(`Insert failed: ${error.message}`);

    success(res, data);
  } catch (err) {
    console.error('Create network account error:', err);
    fail(res, 500, '创建账号失败');
  }
});

// List network accounts
router.get('/account/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { networkDefId, appId, status, page = 1, pageSize = 20 } = req.query as Record<string, string>;

    let query = db.from('ad_network_account').select('*', { count: 'exact' }).eq('developer_id', developerId);
    if (networkDefId) query = query.eq('network_def_id', Number(networkDefId));
    if (appId) query = query.eq('app_id', Number(appId));
    if (status) query = query.eq('status', Number(status));

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await query.order('created_at', { ascending: false }).range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('List network accounts error:', err);
    fail(res, 500, '获取账号列表失败');
  }
});

// Get network account detail
router.get('/account/detail', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.query as Record<string, string>;
    if (!id) return fail(res, 400, '账号 ID 不能为空');

    const { data, error } = await db.from('ad_network_account')
      .select('*')
      .eq('id', Number(id))
      .eq('developer_id', developerId)
      .single();
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, data);
  } catch (err) {
    console.error('Detail network account error:', err);
    fail(res, 500, '获取账号详情失败');
  }
});

// Update network account
router.patch('/account/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.params;
    const { accountName, accountId, credentials, status, appId, remark } = req.body as Record<string, unknown>;
    if (!id) return fail(res, 400, '账号 ID 不能为空');

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (accountName !== undefined) updateData.account_name = String(accountName);
    if (accountId !== undefined) updateData.account_id = accountId ? String(accountId) : null;
    if (credentials !== undefined) updateData.credentials = credentials;
    if (status !== undefined) updateData.status = Number(status);
    if (appId !== undefined) updateData.app_id = appId ? Number(appId) : null;
    if (remark !== undefined) updateData.remark = remark ? String(remark) : null;

    const { data, error } = await db.from('ad_network_account')
      .update(updateData)
      .eq('id', Number(id))
      .eq('developer_id', developerId)
      .select()
      .single();
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, data);
  } catch (err) {
    console.error('Update network account error:', err);
    fail(res, 500, '更新账号失败');
  }
});

// Delete network account
router.delete('/account/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.params;
    if (!id) return fail(res, 400, '账号 ID 不能为空');

    const { error } = await db.from('ad_network_account')
      .delete()
      .eq('id', Number(id))
      .eq('developer_id', developerId);
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, { id: Number(id) });
  } catch (err) {
    console.error('Delete network account error:', err);
    fail(res, 500, '删除账号失败');
  }
});

export default router;
