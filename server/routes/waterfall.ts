import express, { Router } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

// Get waterfall config for a placement
router.get('/get', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { placementId, trafficGroupId } = req.query as Record<string, string>;

    if (!placementId) {
      fail(res, 400, '缺少placementId');
      return;
    }

    const groupId = trafficGroupId ? Number(trafficGroupId) : 0;

    // Get latest config
    const { data: config, error } = await db.from('waterfall_config')
      .select('*')
      .eq('placement_id', placementId)
      .eq('traffic_group_id', groupId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Query failed: ${error.message}`);

    if (!config) {
      success(res, { config: null, layers: [] });
      return;
    }

    // Get layers
    const { data: layers, error: layerError } = await db.from('waterfall_layer')
      .select('*')
      .eq('config_id', config.id)
      .order('layer_type', { ascending: true })
      .order('priority', { ascending: true });
    if (layerError) throw new Error(`Query layers failed: ${layerError.message}`);

    success(res, { config, layers: layers || [] });
  } catch (err) {
    console.error('Get waterfall error:', err);
    fail(res, 500, '获取瀑布流配置失败');
  }
});

// Update waterfall config
router.post('/update', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { placementId, trafficGroupId = 0, layers } = req.body;

    if (!placementId || !layers || !Array.isArray(layers)) {
      fail(res, 400, '缺少必填字段');
      return;
    }

    // Get current version
    const { data: latestConfig } = await db.from('waterfall_config')
      .select('version')
      .eq('placement_id', placementId)
      .eq('traffic_group_id', trafficGroupId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newVersion = (latestConfig?.version || 0) + 1;

    // Create new config version
    const { data: newConfig, error: configError } = await db.from('waterfall_config').insert({
      placement_id: placementId,
      version: newVersion,
      traffic_group_id: trafficGroupId,
    }).select().single();
    if (configError) throw new Error(`Insert config failed: ${configError.message}`);

    // Insert layers（兼容前端 layerType / layer_type 两种命名）
    const layerRows = layers.map((layer: {
      layerType?: number;
      layer_type?: number;
      adSourceId: number;
      ad_source_id?: number;
      sortPrice?: number;
      sort_price?: number;
      timeoutMs?: number;
      timeout_ms?: number;
      priority?: number;
    }, index: number) => ({
      config_id: newConfig.id,
      layer_type: layer.layerType ?? layer.layer_type ?? 0,
      ad_source_id: layer.adSourceId ?? layer.ad_source_id ?? 0,
      sort_price: layer.sortPrice ?? layer.sort_price ?? 0,
      timeout_ms: layer.timeoutMs ?? layer.timeout_ms ?? 3000,
      priority: layer.priority ?? index,
      status: 1,
    }));

    if (layerRows.length > 0) {
      const { error: layerError } = await db.from('waterfall_layer').insert(layerRows);
      if (layerError) throw new Error(`Insert layers failed: ${layerError.message}`);
    }

    success(res, { configId: newConfig.id, version: newVersion }, '保存成功');
  } catch (err) {
    console.error('Update waterfall error:', err);
    fail(res, 500, '更新瀑布流配置失败');
  }
});

// Get config history
router.get('/history', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { placementId, trafficGroupId = 0, page = 1, pageSize = 10 } = req.query as Record<string, string>;

    if (!placementId) {
      fail(res, 400, '缺少placementId');
      return;
    }

    const p = Number(page);
    const ps = Number(pageSize);

    const { data, count, error } = await db.from('waterfall_config')
      .select('*', { count: 'exact' })
      .eq('placement_id', placementId)
      .eq('traffic_group_id', Number(trafficGroupId))
      .order('version', { ascending: false })
      .range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('Get waterfall history error:', err);
    fail(res, 500, '获取配置历史失败');
  }
});

export default router;

// 列出某个 placement 的所有 traffic_group 配置（每个 traffic_group 一行）
router.get('/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { placementId } = req.query as Record<string, string>;
    if (!placementId) { fail(res, 400, '缺少placementId'); return; }

    // 1. 查 placement
    const { data: placement, error: pErr } = await db.from('placement')
      .select('*').eq('id', Number(placementId)).maybeSingle();
    if (pErr) throw pErr;
    if (!placement) { fail(res, 404, '广告位不存在'); return; }


    // 2. 查该 placement 的所有 config（兼容 placement_id 列存 bigint 或 string pl_xxx）
    const pid = Number(placementId);
    const placementIdStr = String(placement.placement_id || placementId);
    const { data: configs, error: cErr } = await db.from('waterfall_config')
      .select('*')
      .or(`placement_id.eq.${pid},placement_id.eq.${placementIdStr}`)
      .order('id', { ascending: false });
    if (cErr) throw cErr;

    // 3. 查该 placement 下的所有 traffic_group（traffic_group 表只关联 placement，没有 developer_id 字段）
    const { data: groups } = await db.from('traffic_group')
      .select('id, group_name, status')
      .eq('placement_id', placementIdStr)
      .order('id', { ascending: false });
    console.log('[waterfall/list] placementIdStr=' + placementIdStr + ' groups count=' + (groups || []).length);

    const groupMap = new Map((groups || []).map((g) => [String(g.id), g]));

    // 4. 聚合每个 config 的 ad_source 数量
    const configIds = (configs || []).map((c) => c.id);
    const sourceCountMap = new Map<number, number>();
    if (configIds.length > 0) {
      const { data: layerRows } = await db.from('waterfall_layer')
        .select('config_id, ad_source_id')
        .in('config_id', configIds);
      (layerRows || []).forEach((r) => {
        const cid = Number(r.config_id);
        sourceCountMap.set(cid, (sourceCountMap.get(cid) || 0) + 1);
      });
    }

    // 5. 拼接：包括「默认分组（traffic_group_id=0）」和「已有 traffic_group」分组
    const rows = (configs || []).map((c) => {
      const gid = Number(c.traffic_group_id || 0);
      const g = gid === 0 ? null : groupMap.get(String(gid)) || groupMap.get(String(gid) as string);
      return {
        config_id: Number(c.id),
        placement_id: String(c.placement_id),
        traffic_group_id: gid,
        traffic_group_name: g?.group_name || '默认分组',
        traffic_group_status: g?.status ?? null,
        version: c.version || 1,
        status: c.status ?? 1,
        ad_source_count: sourceCountMap.get(Number(c.id)) || 0,
        created_at: c.created_at,
        updated_at: c.updated_at,
      };
    });

    success(res, { placement: { id: Number(placement.id), name: placement.name, format: placement.format }, items: rows });
  } catch (e) {
    const err = e as Error;
    console.error('[waterfall/list]', err);
    fail(res, 500, `查询瀑布流配置列表失败: ${err.message || String(err)}`);
  }
});
