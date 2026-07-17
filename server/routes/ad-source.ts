import express, { Router } from 'express';
import { db } from '../db';
import { authMiddleware, getDeveloper } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

// ============ helpers ============
// 把 ad_source 行 enrich 上 trafficGroupBindings + storeDimParams
// ad_source 行的最小字段契约（用 type intersection 让 placement_id 在 strict 模式下也被识别）
type AdSourceRow = Record<string, unknown> & {
  id: number;
  placement_id?: number | null;
  store_dim_params?: unknown;
};
type BindingRow = {
  id: number;
  ad_source_id: number;
  traffic_group_id: number;
  status: number | null;
  price: number | null;
  hour_limit: number | null;
  day_limit: number | null;
  interval_sec: number | null;
  traffic_group?: { id: number; group_name: string } | { id: number; group_name: string }[] | null;
};
type BindingInput = {
  traffic_group_id: number;
  status?: number;
  price?: number | string | null;
  hour_limit?: number | string | null;
  day_limit?: number | string | null;
  interval_sec?: number | string | null;
};

// 把 ad_source 行的 placement_id (bigint = placement.id) 翻译成 placement.placement_id (text = pl_xxx)
// 修复弹窗编辑时用 number 查不到 traffic_group 的 bug（traffic_group.placement_id 是 text 列）
type WithPlacementId = { placement_id?: number | null };

async function attachPlacementCodes<T extends WithPlacementId>(items: T[]): Promise<Array<T & { placement_code?: string | null }>> {
  if (!items || items.length === 0) return items as Array<T & { placement_code?: string | null }>;
  const placementIds = Array.from(
    new Set(items.map((r) => r.placement_id).filter((v): v is number => typeof v === 'number' && !Number.isNaN(v))),
  );
  if (placementIds.length === 0) {
    return items.map((r) => ({ ...r, placement_code: null })) as Array<T & { placement_code?: string | null }>;
  }
  // placement.id (bigint) ↔ placement.placement_id (text)
  const { data: placements } = await db
    .from('placement')
    .select('id, placement_id')
    .in('id', placementIds);
  const idToCode = new Map<number, string>();
  for (const p of placements || []) {
    idToCode.set(Number((p as { id: number }).id), String((p as { placement_id: string }).placement_id));
  }
  return items.map((r) => ({
    ...r,
    placement_code: r.placement_id != null ? idToCode.get(Number(r.placement_id)) ?? null : null,
  })) as Array<T & { placement_code?: string | null }>;
}

async function enrichAdSource(row: AdSourceRow | null) {
  if (!row) return row;
  // store_dim_params
  const sdp = row.store_dim_params ?? null;
  // traffic_group_bindings（不用内嵌 join：FK 已 drop，traffic_group_id=0 时返 null；改用两次单独 query）
  const { data: bindings, error: be } = await db
    .from('ad_source_traffic_group')
    .select('*')
    .eq('ad_source_id', row.id);
  if (be) {
    return { ...row, store_dim_params: sdp, traffic_group_bindings: [] };
  }
  // 单独查 traffic_group 拿 group_name；id=0 视为"默认分组"
  const tgIds = Array.from(new Set(((bindings || []) as BindingRow[]).map((b) => b.traffic_group_id).filter((v) => v != null))) as number[];
  const tgMap = new Map<number, string>();
  if (tgIds.length > 0) {
    const { data: tgs } = await db.from('traffic_group').select('id, group_name').in('id', tgIds);
    for (const t of (tgs || []) as Array<{ id: number; group_name: string }>) {
      tgMap.set(t.id, t.group_name);
    }
  }
  const list = ((bindings || []) as BindingRow[]).map((b) => ({
    ...b,
    group_name: b.traffic_group_id === 0 ? '默认分组' : (tgMap.get(b.traffic_group_id) || ''),
  }));
  const [enriched] = await attachPlacementCodes([row]);
  return { ...enriched, store_dim_params: sdp, traffic_group_bindings: list };
}

async function enrichListWithBindings(items: AdSourceRow[]) {
  if (!items || items.length === 0) return [];
  const ids = items.map((r) => r.id);
  // 不用内嵌 join：FK 已 drop，traffic_group_id=0 返 null；改用两次单独 query
  const { data: rows, error } = await db
    .from('ad_source_traffic_group')
    .select('*')
    .in('ad_source_id', ids);
  let withBindings: Array<AdSourceRow & { traffic_group_bindings: Array<BindingRow & { group_name: string }> }>;
  if (error) {
    withBindings = items.map((r) => ({ ...r, traffic_group_bindings: [] }));
  } else {
    // 单独查 traffic_group 拿 group_name
    const tgIds = Array.from(new Set(((rows || []) as BindingRow[]).map((b) => b.traffic_group_id).filter((v) => v != null))) as number[];
    const tgMap = new Map<number, string>();
    if (tgIds.length > 0) {
      const { data: tgs } = await db.from('traffic_group').select('id, group_name').in('id', tgIds);
      for (const t of (tgs || []) as Array<{ id: number; group_name: string }>) {
        tgMap.set(t.id, t.group_name);
      }
    }
    const bySource = new Map<number, Array<BindingRow & { group_name: string }>>();
    for (const b of (rows || []) as BindingRow[]) {
      const list = bySource.get(b.ad_source_id) || [];
      list.push({
        ...b,
        group_name: b.traffic_group_id === 0 ? '默认分组' : (tgMap.get(b.traffic_group_id) || ''),
      });
      bySource.set(b.ad_source_id, list);
    }
    withBindings = items.map((r) => ({
      ...r,
      traffic_group_bindings: bySource.get(r.id) || [],
    }));
  }
  return attachPlacementCodes(withBindings);
}

// 全删后插
async function replaceTrafficGroupBindings(sourceId: number, bindings: BindingInput[]) {
  // 1) 删
  const { error: de } = await db
    .from('ad_source_traffic_group')
    .delete()
    .eq('ad_source_id', sourceId);
  if (de) throw new Error(`Delete bindings failed: ${de.message}`);
  // 2) 插
  if (!bindings || bindings.length === 0) return;
  // 注意：默认分组 traffic_group_id=0 是合法值（约定），不能 falsy 过滤
  const rows = bindings
    .filter((b) => b && b.traffic_group_id != null)
    .map((b) => ({
      ad_source_id: sourceId,
      traffic_group_id: Number(b.traffic_group_id),
      status: Number(b.status ?? 1),
      price: b.price === null || b.price === undefined || b.price === '' ? null : Number(b.price),
      hour_limit: b.hour_limit === null || b.hour_limit === undefined || b.hour_limit === '' ? null : Number(b.hour_limit),
      day_limit: b.day_limit === null || b.day_limit === undefined || b.day_limit === '' ? null : Number(b.day_limit),
      interval_sec: b.interval_sec === null || b.interval_sec === undefined || b.interval_sec === '' ? null : Number(b.interval_sec),
    }));
  if (rows.length === 0) return;
  const { error: ie } = await db.from('ad_source_traffic_group').insert(rows);
  if (ie) throw new Error(`Insert bindings failed: ${ie.message}`);
}

// ============ List ad sources ============
router.get('/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { networkCode, networkDefId, appId, placementId, status, page = 1, pageSize = 20 } = req.query as Record<string, string>;

    // List 阶段不过滤 developer_id：demo 数据全平台共享；create/update/delete 仍按 dev 校验
    let query = db.from('ad_source').select('*', { count: 'exact' });

    if (networkCode && networkCode !== 'undefined') query = query.eq('network_code', networkCode);
    if (networkDefId && networkDefId !== 'undefined') {
      // networkDefId → network_code 映射：custom_<id> 是自定义网络，前缀 ad_network_def.id 写入
      // 由于 ad_source 的 network_code 既可能是 'YLH' 也可能是 'custom_123'，需要支持按 network_def_id
      // 简化方案：直接根据 networkDefId 生成 custom_<id> 作为 networkCode 过滤
      query = query.eq('network_code', `custom_${networkDefId}`);
    }
    if (appId && appId !== 'undefined') {
      const n = Number(appId);
      if (!Number.isNaN(n)) query = query.eq('app_id', n);
    }
    if (placementId && placementId !== 'undefined') {
      const n = Number(placementId);
      if (!Number.isNaN(n)) query = query.eq('placement_id', n);
    }
    if (status && status !== 'undefined') query = query.eq('status', Number(status));

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await query.order('created_at', { ascending: false }).range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    const enriched = await enrichListWithBindings(data || []);
    success(res, { list: enriched, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('List ad sources error:', err);
    fail(res, 500, '获取广告源列表失败');
  }
});

// Create ad source
router.post('/create', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { networkCode, networkName, sourceName, thirdAppId, thirdPlacementId, extra, appId, placementId, storeDimParams, trafficGroupBindings } = req.body;

    if (!networkCode || !sourceName || !thirdAppId || !thirdPlacementId) {
      fail(res, 400, '缺少必填字段');
      return;
    }

    const insertData: Record<string, unknown> = {
      developer_id: developerId,
      network_code: networkCode,
      network_name: networkName || networkCode,
      source_name: sourceName,
      third_app_id: thirdAppId,
      third_placement_id: thirdPlacementId,
      extra: extra || null,
    };
    if (appId !== undefined && appId !== null && appId !== '') insertData.app_id = Number(appId);
    if (placementId !== undefined && placementId !== null && placementId !== '') insertData.placement_id = Number(placementId);
    if (storeDimParams !== undefined) insertData.store_dim_params = storeDimParams || null;

    const { data, error } = await db.from('ad_source').insert(insertData).select().single();
    if (error) throw new Error(`Insert failed: ${error.message}`);

    // 同步流量分组绑定
    if (Array.isArray(trafficGroupBindings) && trafficGroupBindings.length > 0) {
      await replaceTrafficGroupBindings(data.id, trafficGroupBindings);
    }

    const enriched = await enrichAdSource(data);
    success(res, enriched, '创建成功');
  } catch (err) {
    console.error('Create ad source error:', err);
    fail(res, 500, '创建广告源失败');
  }
});

// Update ad source
router.put('/update', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id, sourceName, thirdAppId, thirdPlacementId, extra, status } = req.body;

    if (!id) {
      fail(res, 400, '缺少id');
      return;
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (sourceName !== undefined) updateData.source_name = sourceName;
    if (thirdAppId !== undefined) updateData.third_app_id = thirdAppId;
    if (thirdPlacementId !== undefined) updateData.third_placement_id = thirdPlacementId;
    if (extra !== undefined) updateData.extra = extra;
    if (status !== undefined) updateData.status = status;

    const { error } = await db.from('ad_source').update(updateData).eq('id', id).eq('developer_id', developerId);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '更新成功');
  } catch (err) {
    console.error('Update ad source error:', err);
    fail(res, 500, '更新广告源失败');
  }
});

// Delete ad source
router.delete('/delete', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.query as Record<string, string>;

    if (!id) {
      fail(res, 400, '缺少id');
      return;
    }

    const { error } = await db.from('ad_source').delete().eq('id', Number(id)).eq('developer_id', developerId);
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, null, '删除成功');
  } catch (err) {
    console.error('Delete ad source error:', err);
    fail(res, 500, '删除广告源失败');
  }
});

// RESTful: PUT /api/v1/console/ad-source/:id  (frontend 用此路径)
router.put('/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.params;
    const body = req.body as Record<string, unknown>;
    // 兼容 snake_case 和 camelCase 两种入参风格
    const sourceName = (body.sourceName ?? body.source_name) as string | undefined;
    const thirdAppId = (body.thirdAppId ?? body.third_app_id) as string | undefined;
    const thirdPlacementId = (body.thirdPlacementId ?? body.third_placement_id) as string | undefined;
    const extra = body.extra;
    const status = body.status as number | undefined;
    const networkCode = (body.networkCode ?? body.network_code) as string | undefined;
    const networkName = (body.networkName ?? body.network_name) as string | undefined;
    const appIdRaw = (body.appId ?? body.app_id) as number | string | null | undefined;
    const placementIdRaw = (body.placementId ?? body.placement_id) as number | string | null | undefined;
    if (!id) return fail(res, 400, '缺少id');

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (sourceName !== undefined) updateData.source_name = sourceName;
    if (thirdAppId !== undefined) updateData.third_app_id = thirdAppId;
    if (thirdPlacementId !== undefined) updateData.third_placement_id = thirdPlacementId;
    if (extra !== undefined) updateData.extra = extra;
    if (status !== undefined) updateData.status = status;
    if (networkCode !== undefined) updateData.network_code = networkCode;
    if (networkName !== undefined) updateData.network_name = networkName;
    if (appIdRaw !== undefined) {
      updateData.app_id = appIdRaw === null || appIdRaw === '' ? null : Number(appIdRaw);
    }
    if (placementIdRaw !== undefined) {
      updateData.placement_id = placementIdRaw === null || placementIdRaw === '' ? null : Number(placementIdRaw);
    }

    const { error } = await db.from('ad_source').update(updateData).eq('id', Number(id)).eq('developer_id', developerId);
    if (error) throw new Error(`Update failed: ${error.message}`);

    // 同步流量分组绑定（如果传了）
    if (body.trafficGroupBindings !== undefined) {
      const bindings = Array.isArray(body.trafficGroupBindings) ? body.trafficGroupBindings : [];
      await replaceTrafficGroupBindings(Number(id), bindings);
    }

    // 回查带 bindings 的全量数据
    const { data: row } = await db.from('ad_source').select('*').eq('id', Number(id)).eq('developer_id', developerId).single();
    const enriched = row ? await enrichAdSource(row) : null;

    success(res, enriched, '更新成功');
  } catch (err) {
    console.error('Update ad source (RESTful) error:', err);
    fail(res, 500, '更新广告源失败');
  }
});

// RESTful: DELETE /api/v1/console/ad-source/:id
router.delete('/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.params;
    if (!id) return fail(res, 400, '缺少id');

    const { error } = await db.from('ad_source').delete().eq('id', Number(id)).eq('developer_id', developerId);
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, null, '删除成功');
  } catch (err) {
    console.error('Delete ad source (RESTful) error:', err);
    fail(res, 500, '删除广告源失败');
  }
});

// Get network definitions
router.get('/networks', authMiddleware, async (_req: express.Request, res: express.Response) => {
  try {
    const { data, error } = await db.from('ad_network_def').select('*').eq('status', 1).order('is_preset', { ascending: false });
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, data);
  } catch (err) {
    console.error('Get networks error:', err);
    fail(res, 500, '获取广告网络列表失败');
  }
});

// Create custom ad source (associated with custom network, step 4 of 6-step integration)
router.post('/create-custom', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { networkDefId, sourceName, thirdAppId, thirdPlacementId, appId, placementId, extra, storeDimParams, trafficGroupBindings } = req.body as Record<string, unknown>;

    if (!networkDefId) return fail(res, 400, '自定义网络 ID 不能为空');
    if (!sourceName) return fail(res, 400, '广告源名称不能为空');
    if (!thirdAppId) return fail(res, 400, '广告网络应用 ID 不能为空');
    if (!thirdPlacementId) return fail(res, 400, '广告网络广告位 ID 不能为空');

    // Fetch custom network info
    const { data: network, error: netErr } = await db.from('ad_network_def')
      .select('*').eq('id', Number(networkDefId)).single();
    if (netErr || !network) return fail(res, 400, '自定义网络不存在');

    // Build network_code from custom network id
    const networkCode = `custom_${networkDefId}`;

    const insertData: Record<string, unknown> = {
      developer_id: developerId,
      network_def_id: Number(networkDefId),
      network_code: networkCode,
      network_name: network.network_name,
      source_name: sourceName,
      third_app_id: thirdAppId,
      third_placement_id: thirdPlacementId,
      app_id: appId ? Number(appId) : null,
      placement_id: placementId ? Number(placementId) : null,
      extra: extra || null,
      is_custom: true,
    };
    if (storeDimParams !== undefined) insertData.store_dim_params = storeDimParams || null;

    const { data, error } = await db.from('ad_source').insert(insertData).select().single();
    if (error) throw new Error(`Insert failed: ${error.message}`);

    if (Array.isArray(trafficGroupBindings) && trafficGroupBindings.length > 0) {
      await replaceTrafficGroupBindings(data.id, trafficGroupBindings);
    }

    const enriched = await enrichAdSource(data);
    success(res, enriched);
  } catch (err) {
    console.error('Create custom ad source error:', err);
    fail(res, 500, '创建自定义广告源失败');
  }
});

export default router;
