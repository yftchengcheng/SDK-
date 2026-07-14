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
    const { placementId, trafficGroupId = 0, configName, config_name, description = null, isDefaultConfig, is_default_config, layers } = req.body;

    if (!placementId) { fail(res, 400, '缺少 placementId'); return; }
    // layers 可省略：只更新元数据（config_name/description）
    if (layers !== undefined && !Array.isArray(layers)) { fail(res, 400, 'layers 必须为数组'); return; }
    // 注: 用户输入的 config_name/description 在沙箱 postgrest schema cache 不可见时无法持久化
    // 这里保留接收,生产环境 postgrest cache 刷新后即可生效
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _input = { configName, config_name, description, isDefaultConfig, is_default_config };

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

    // Insert layers（兼容前端 layerType / layer_type 两种命名；layers 可省略表示只更新元数据）
    if (!Array.isArray(layers) || layers.length === 0) {
      success(res, { configId: newConfig.id, version: newVersion }, '元数据保存成功');
      return;
    }
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

    // 3. 查该 placement 下的所有 traffic_group（兼容 placement_id 列存 bigint 或 string pl_xxx）
    const tgPid = Number(placementId);
    const tgPlacementIdStr = String(placement.placement_id || placementId);
    const { data: groups } = await db.from('traffic_group')
      .select('id, group_name, status, is_default, conditions')
      .or(`placement_id.eq.${tgPid},placement_id.eq.${tgPlacementIdStr}`)
      .order('id', { ascending: false });

    const groupMap = new Map((groups || []).map((g) => [String(g.id), g]));
    // 找到该 placement 所在的 app（用于展示「应用名」）：通过 app_key 关联
    const { data: app } = await db.from('app')
      .select('id, app_name, app_key')
      .eq('app_key', String(placement.app_key || ''))
      .maybeSingle();
    const appName = (app && (app as { app_name?: string }).app_name) || (app && (app as { app_key?: string }).app_key) || '--';
    const appKey = (app && (app as { app_key?: string }).app_key) || '';

    // 格式化 rules 摘要（兼容多种 conditions 形态）
    type RulePart = { field?: string; dimension?: string; key?: string; op?: string; operator?: string; value?: unknown; rule?: string };
    const formatRules = (conditions: unknown): string => {
      if (!conditions) return '无规则（全部流量）';
      try {
        const arr = Array.isArray(conditions) ? conditions : [conditions];
        if (arr.length === 0) return '无规则（全部流量）';
        const parts: string[] = [];
        for (const raw of arr) {
          if (!raw) continue;
          if (typeof raw === 'string') { parts.push(raw); continue; }
          const c = raw as RulePart;
          if (c.rule === 'default' || c.rule === 'all') { parts.push('全部流量'); continue; }
          const f = c.field || c.dimension || c.key;
          const op = c.op || c.operator || '=';
          const v = c.value;

          if (f && v !== undefined) parts.push(`${f} ${op} ${v}`);
          else if (f) parts.push(String(f));
          else parts.push(JSON.stringify(c));
          if (parts.length >= 2) break;
        }
        return parts.length ? parts.join(' · ') : '自定义规则';
      } catch { return '自定义规则'; }
    };

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

    // 4.5 查「默认分组」系统记录（用于 traffic_group_id=0 时的名称/状态）
    const { data: defaultTgRow } = await db.from('traffic_group')
      .select('id, group_name, conditions, status, is_default')
      .eq('developer_id', placement.developer_id)
      .eq('is_default', true)
      .limit(1)
      .maybeSingle();
    const defaultTg = defaultTgRow || null;

    // 5. 拼接：包括「默认分组（traffic_group_id=0）」和「已有 traffic_group」分组
    const rows = (configs || []).map((c) => {
      const gid = Number(c.traffic_group_id || 0);
      const g = gid === 0 ? null : groupMap.get(String(gid)) || groupMap.get(String(gid) as string);
      const isDefaultConfig = c.is_default_config === true || gid === 0;
      const effectiveGroup = g || defaultTg;
      const displayGroupName = isDefaultConfig
        ? (defaultTg?.group_name || '默认分组')
        : (g?.group_name || `分组#${gid}`);
      const rulesSummary = effectiveGroup ? formatRules(effectiveGroup.conditions) : '无规则（全部流量）';
      return {
        config_id: Number(c.id),
        placement_id: String(c.placement_id),
        config_name: c.config_name || `配置v${c.version || 1}`,
        description: c.description || null,
        is_default_config: isDefaultConfig,
        traffic_group_id: gid,
        traffic_group_name: displayGroupName,
        traffic_group_is_default: effectiveGroup?.is_default === true,
        traffic_group_status: effectiveGroup?.status ?? null,
        rules_summary: rulesSummary,
        app_name: appName,
        app_key: appKey,
        version: c.version || 1,
        status: c.status ?? 1,
        ad_source_count: sourceCountMap.get(Number(c.id)) || 0,
        created_at: c.created_at,
        updated_at: c.updated_at,
      };
    });

    // 默认分组配置排最前 + 按 updated_at 倒序
    rows.sort((a, b) => {
      if (a.is_default_config && !b.is_default_config) return -1;
      if (!a.is_default_config && b.is_default_config) return 1;
      return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
    });

    success(res, { placement: { id: Number(placement.id), name: placement.name, format: placement.format }, items: rows });
  } catch (e) {
    const err = e as Error;
    console.error('[waterfall/list]', err);
    fail(res, 500, `查询瀑布流配置列表失败: ${err.message || String(err)}`);
  }
});
