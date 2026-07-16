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

    // Get current version（兼容 placement_id 两种形式 + traffic_group_id 兼容 0/NULL/''）
    // - placement_id: 列存的是 varchar(32)，但历史数据有 "58"（number-as-string）和 "pl_xxx"（业务码）两种写法
    // - traffic_group_id: 0（默认分组占位）/ NULL（seed 残留）/ ''（空字符串，seed 残留）都视为"默认分组"
    const { data: placement } = await db.from('placement')
      .select('id, placement_id')
      .or(`placement_id.eq.${placementId},id.eq.${Number(placementId) || -1}`)
      .maybeSingle();
    const pidCandidates = placement
      ? [String(placement.id), String(placement.placement_id || placement.id)]
      : [String(placementId)];

    // 查 latest version：先按 placement_id 范围 + tg_id in (0, NULL 没法直接 in)
    // 策略：分别查 tg_id=0 和 tg_id is null 两条，取 version 最大
    const [r0, rN] = await Promise.all([
      db.from('waterfall_config')
        .select('version, placement_id, traffic_group_id, created_at')
        .in('placement_id', pidCandidates)
        .eq('traffic_group_id', 0)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),
      db.from('waterfall_config')
        .select('version, placement_id, traffic_group_id, created_at')
        .in('placement_id', pidCandidates)
        .is('traffic_group_id', null)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    const cands = [r0.data, rN.data].filter(Boolean) as Array<{ version: number; created_at: string }>;
    cands.sort((a, b) => (b.version || 0) - (a.version || 0) || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    const latestConfig = cands[0] || null;

    const newVersion = (latestConfig?.version || 0) + 1;

    // Create new config version
    // layers 同步写回 JSONB 列：避免下次 get 时还要 fallback 到 waterfall_layer 表
    // 使用真实 placement 业务码（保持与 seed 一致），fallback 不到 placement 时用入参
    const writePlacementId = placement ? String(placement.placement_id || placement.id) : String(placementId);
    const { data: newConfig, error: configError } = await db.from('waterfall_config').insert({
      placement_id: writePlacementId,
      version: newVersion,
      traffic_group_id: 0,
      layers: Array.isArray(layers) ? layers : [],



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
    const { placementId, page, pageSize } = req.query as Record<string, string>;
    if (!placementId) { fail(res, 400, '缺少placementId'); return; }

    // 1. 查 placement：placementId 可能是 string (pl_xxx) 或 number
    const { data: placement, error: pErr } = await db.from('placement')
      .select('*')
      .or(`placement_id.eq.${placementId},id.eq.${Number(placementId) || -1}`)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!placement) { fail(res, 404, '广告位不存在'); return; }
    const realPlacementId = placement.id;  // waterfall_config.placement_id 存的是 placement.id (integer)


    // 2. 查该 placement 的所有 config（兼容 placement_id 列存 bigint 或 string pl_xxx）
    // 注意：placement_id 是 varchar(32)。DB 里可能存 "58" (number-as-string) 或 "pl_xxx" 两种形式
    // 用 in() 数组避免 PostgREST 把 eq.58 当整数解析（varchar 列需要 string 形式）
    const pidStr = String(realPlacementId);
    const placementIdStr = String(placement.placement_id || realPlacementId);
    const { data: rawConfigs, error: cErr } = await db.from('waterfall_config')
      .select('*')
      .in('placement_id', [pidStr, placementIdStr])
      .order('version', { ascending: false });
    if (cErr) throw cErr;

    // 2.5 dedup：同一 placement 业务码下历史脏数据可能同时存在 "58" + "pl_xxx" 两种 placement_id 写法
    // 仅按 traffic_group_id 维度保留 version 最大的那条（避免"一个广告位两个 v1"）
    // 统计总数（dedup 前）
    const totalRaw = (rawConfigs || []).length;
    const dedupMap = new Map<string, typeof rawConfigs[number]>();
    for (const c of (rawConfigs || [])) {
      const tgKey = String(c.traffic_group_id ?? '0');
      const prev = dedupMap.get(tgKey);
      if (!prev || (c.version || 0) > (prev.version || 0)) {
        dedupMap.set(tgKey, c);
      }
    }
    const configs = Array.from(dedupMap.values());
    const total = dedupMap.size;

    // 是否分页：前端传 page/pageSize 才走分页
    const wantPaging = page !== undefined || pageSize !== undefined;
    const p = wantPaging ? Math.max(1, Number(page) || 1) : 1;
    const ps = wantPaging ? Math.min(100, Math.max(1, Number(pageSize) || 20)) : 1000;
    if (wantPaging) {
      // 简单 page/size 切片
      const start = (p - 1) * ps;
      configs.splice(0, configs.length, ...configs.slice(start, start + ps));
    }
    // totalRaw 留作调试参考（与 dedup 后 total 形成对比）

    // 3. 查该 placement 下的所有 traffic_group（兼容 placement_id 列存 bigint 或 string pl_xxx）
    const tgPid = String(placementId);
    const tgPlacementIdStr = String(placement.placement_id || placementId);
    const { data: groups } = await db.from('traffic_group')
      .select('id, group_name, status, is_default, conditions')
      .in('placement_id', [tgPid, tgPlacementIdStr])
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

    // 4. 聚合每个 config 的 ad_source 数量（双路统计：waterfall_layer 表 + layers JSONB 兜底）
    const configIds = (configs || []).map((c) => c.id);
    const sourceCountMap = new Map<number, number>();
    if (configIds.length > 0) {
      // 4a. 优先从 waterfall_layer 表统计
      const { data: layerRows } = await db.from('waterfall_layer')
        .select('config_id, ad_source_id')
        .in('config_id', configIds);
      (layerRows || []).forEach((r) => {
        const cid = Number(r.config_id);
        sourceCountMap.set(cid, (sourceCountMap.get(cid) || 0) + 1);
      });
      // 4b. JSONB 兜底：表为空时，从 config.layers 数组统计
      (configs || []).forEach((c) => {
        const cid = Number(c.id);
        if (!sourceCountMap.has(cid) || sourceCountMap.get(cid) === 0) {
          const ls = (c as { layers?: unknown }).layers;
          if (Array.isArray(ls)) {
            const valid = ls.filter((l) => {
              if (!l || typeof l !== 'object') return false;
              const o = l as { ad_source_id?: number; adSourceId?: number };
              const aid = o.ad_source_id ?? o.adSourceId;
              return aid && aid > 0;
            });
            if (valid.length > 0) sourceCountMap.set(cid, valid.length);
          }
        }
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

    success(res, {
      placement: { id: Number(placement.id), name: placement.name, format: placement.format },
      items: rows,
      total,
      page: wantPaging ? p : 1,
      pageSize: wantPaging ? ps : total,
    });
  } catch (e) {
    const err = e as Error;
    console.error('[waterfall/list]', err);
    fail(res, 500, `查询瀑布流配置列表失败: ${err.message || String(err)}`);
  }
});
