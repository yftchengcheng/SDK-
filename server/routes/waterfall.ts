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
