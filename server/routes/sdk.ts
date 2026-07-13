import express, { Router } from 'express';
import { db } from '../db';
import { success, fail } from '../utils/response';

const router = Router();

// SDK config endpoint
router.get('/config', async (req: express.Request, res: express.Response) => {
  try {
    const { app_key: appKey } = req.query as Record<string, string>;

    if (!appKey) {
      fail(res, 400, '缺少app_key');
      return;
    }

    // Get app info
    const { data: app, error: appError } = await db.from('app').select('*').eq('app_key', appKey).eq('status', 1).maybeSingle();
    if (appError) throw new Error(`Query app failed: ${appError.message}`);

    if (!app) {
      fail(res, 400, 'APP_KEY无效或应用已禁用');
      return;
    }

    // Get placements for this app
    const { data: placements, error: plError } = await db.from('placement').select('*').eq('app_key', appKey).eq('status', 1);
    if (plError) throw new Error(`Query placements failed: ${plError.message}`);

    // For each placement, get the latest waterfall config + layers
    const placementConfigs = [];
    for (const placement of (placements || [])) {
      const { data: config } = await db.from('waterfall_config')
        .select('*')
        .eq('placement_id', placement.placement_id)
        .eq('traffic_group_id', 0)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      let layers: unknown[] = [];
      if (config) {
        const { data: layerData } = await db.from('waterfall_layer')
          .select('*')
          .eq('config_id', config.id)
          .order('layer_type', { ascending: true })
          .order('priority', { ascending: true });
        layers = layerData || [];
      }

      placementConfigs.push({
        placementId: placement.placement_id,
        name: placement.name,
        format: placement.format,
        configVersion: config?.version || 0,
        strategy: buildStrategy(layers as Record<string, unknown>[]),
      });
    }

    // Get custom adapters for this app
    // 过滤规则：app.platform 与 network_def.system_type 匹配
    //   - system_type = 3 (Both) → 任何 platform 都匹配
    //   - system_type = 1 (Android) → app.platform 必须 = 1
    //   - system_type = 2 (iOS) → app.platform 必须 = 2
    // 响应结构：adapterClasses 拆为 android / ios 两个子对象
    //   iOS 客户端只会收到 ios 子对象有值；Android 客户端反之
    //   但为方便服务端日志/调试，仍返回完整结构，客户端按 platform 取
    const { data: bindings } = await db.from('app_network_binding').select('*').eq('app_key', appKey).eq('status', 1);
    const customAdapters = [];
    if (bindings && bindings.length > 0) {
      for (const binding of bindings) {
        const { data: networkDef } = await db.from('ad_network_def').select('*').eq('id', binding.network_def_id).maybeSingle();
        if (!networkDef) continue;
        // system_type 过滤：Both(3) 永远通过；否则必须严格匹配 app.platform
        const defSysType = networkDef.system_type ?? 3;
        if (defSysType !== 3 && defSysType !== app.platform) {
          continue; // 跳过系统类型不匹配的 Adapter
        }
        // 仅下发当前 app.platform 对应系统的字段，避免泄漏另一系统的内部类名
        const sysKey = app.platform === 1 ? 'android' : app.platform === 2 ? 'ios' : null;
        if (!sysKey) continue;
        const adapterMap: Record<string, string | null> = {
          init: networkDef[`adapter_class_init_${sysKey}`] ?? null,
          banner: networkDef[`adapter_class_banner_${sysKey}`] ?? null,
          interstitial: networkDef[`adapter_class_interstitial_${sysKey}`] ?? null,
          rewarded: networkDef[`adapter_class_rewarded_${sysKey}`] ?? null,
          native: networkDef[`adapter_class_native_${sysKey}`] ?? null,
          splash: networkDef[`adapter_class_splash_${sysKey}`] ?? null,
        };
        customAdapters.push({
          networkCode: networkDef.network_code,
          networkName: networkDef.network_name,
          systemType: defSysType,
          currentSystem: sysKey,
          adapterClasses: adapterMap,
          supportsBidding: networkDef.supports_bidding === 1,
        });
      }
    }

    success(res, {
      developerId: app.developer_id,
      appKey: app.app_key,
      placements: placementConfigs,
      customAdapters,
      reportUrl: '/api/v1/report',
    });
  } catch (err) {
    console.error('SDK config error:', err);
    fail(res, 500, '获取配置失败');
  }
});

function buildStrategy(layers: Record<string, unknown>[]) {
  const biddingSources = layers.filter(l => l.layer_type === 1);
  const standardSources = layers.filter(l => l.layer_type === 2);
  const fallbackSources = layers.filter(l => l.layer_type === 3);

  const strategyLayers = [];

  if (biddingSources.length > 0) {
    strategyLayers.push({
      layerId: 'l1',
      type: 'bidding',
      sources: biddingSources.map(s => ({
        adSourceId: s.ad_source_id,
        sortPrice: s.sort_price,
        timeout: s.timeout_ms,
      })),
    });
  }

  if (standardSources.length > 0) {
    strategyLayers.push({
      layerId: 'l2',
      type: 'standard',
      sources: standardSources.map(s => ({
        adSourceId: s.ad_source_id,
        sortPrice: s.sort_price,
        timeout: s.timeout_ms,
      })),
    });
  }

  if (fallbackSources.length > 0) {
    strategyLayers.push({
      layerId: 'l3',
      type: 'fallback',
      sources: fallbackSources.map(s => ({
        adSourceId: s.ad_source_id,
        sortPrice: s.sort_price,
        timeout: s.timeout_ms,
      })),
    });
  }

  return {
    type: 'hybrid',
    parallelCount: 3,
    layers: strategyLayers,
  };
}

export default router;
