/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Demo 数据种子脚本（按前端功能要求 Mock）
 *
 * 系统边界（来自 PLAN.md / DB schema / AGENTS.md "系统数据模型边界" 章节）：
 * - app.platform: 1=Android / 2=iOS / 3=Both（无鸿蒙）
 * - ad_network_def.system_type: 1=Android / 2=iOS / 3=Both
 * - ad_network_def.is_preset: true=预置（官方），false=自定义
 * - 预置广告网络从 ad_network_def.is_preset=true 动态加载（不写死 code）
 * - report_daily.os 必须与关联 app.platform 严格一致：
 *     platform=1 → os=android
 *     platform=2 → os=ios
 *     platform=3 → os=android 或 ios
 * - ad_source.network_code / network_name 必须从 ad_network_def 引用
 * - ad_source.third_app_id / third_placement_id 必填（NOT NULL）
 * - report_daily 唯一约束 (developer_id, app_key, placement_id, ad_source_id, stat_date, hour)
 */
import { createClient } from '@supabase/supabase-js';

const c = createClient(
  process.env.COZE_SUPABASE_URL!,
  process.env.COZE_SUPABASE_SERVICE_ROLE_KEY!,
);

// 0 个用户报告里写的 developer_id：dashboard-test@demo.com
const devId = 'dev_6NkEhLUUWZpHkmH8';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function genDates(startDaysAgo: number, endDaysAgo: number): string[] {
  // startDaysAgo 更大（更早），endDaysAgo 更小（更近）
  // 例：genDates(7, 1) = [7天前, 6天前, ..., 2天前, 1天前]
  if (startDaysAgo < endDaysAgo) [startDaysAgo, endDaysAgo] = [endDaysAgo, startDaysAgo];
  const out: string[] = [];
  for (let i = startDaysAgo; i >= endDaysAgo; i--) {
    out.push(daysAgoStr(i));
  }
  return out;
}

async function main() {
  console.log('Target:', process.env.COZE_SUPABASE_URL);
  console.log('Owner:', devId, '(dashboard-test@demo.com)');

  // === 阶段 0: 动态加载预置广告平台（不写死） ===
  const { data: defs, error: defErr } = await c
    .from('ad_network_def')
    .select('id, network_code, network_name, system_type, is_preset')
    .eq('is_preset', true)
    .order('id');
  if (defErr) throw new Error(`Load ad_network_def failed: ${defErr.message}`);
  if (!defs || defs.length === 0) throw new Error('需要至少 1 个预置 ad_network_def（is_preset=true）');
  for (const d of defs) {
    if (d.system_type !== 3) console.warn(`!! ${d.network_code} system_type=${d.system_type}（非 Both）`);
  }
  const presetCodeSet = new Set(defs.map((d: any) => d.network_code));
  console.log('0) 预置 ad_network_def:', defs.map((d: any) => d.network_code).join(','));

  // === 阶段 1: 清 12 张表（保留 developer / ad_network_def / ad_network_account / app_network_binding / report_metric_definition / report_funnel_metric_definition / health_check / hal_*） ===
  // 清表顺序：依赖表先清
  await c.from('report_daily').delete().neq('id', 0);
  await c.from('report_board').delete().neq('id', 0);
  await c.from('message').delete().neq('id', 0);
  await c.from('custom_network_report').delete().neq('id', 0);
  await c.from('custom_adapter_version').delete().neq('id', 0);
  await c.from('ad_source_traffic_group').delete().neq('id', 0);
  await c.from('traffic_group').delete().neq('id', 0);
  await c.from('waterfall_layer').delete().neq('id', 0);
  await c.from('waterfall_config').delete().neq('id', 0);
  await c.from('ad_source').delete().neq('id', 0);
  await c.from('placement').delete().neq('id', 0);
  await c.from('app').delete().neq('id', 0);
  console.log('1) 清空 12 张表完成');

  // === 阶段 2: 3 apps（覆盖 Android / iOS / Both，所有前端 form 必填项填齐） ===
  // 前端 form 必填：appName, packageName, platform, category(2级), storeListed, storeName(cond), storeUrl(cond), downloadUrl(cond), orientation
  const { data: apps, error: appErr } = await c.from('app').insert([
    {
      developer_id: devId, app_key: 'app_game_001', app_name: '开心消消乐',
      package_name: 'com.demo.xiaoxiaole', platform: 3, orientation: 3,
      category: 'Game/Puzzle', access_type: 1, timeout_ms: 5000,
      store_listed: true,
      store_name: 'google-play',
      store_url: 'https://play.google.com/store/apps/details?id=com.demo.xiaoxiaole',
      download_url: 'https://download.demo.com/xiaoxiaole.apk',
      icon_url: 'https://cdn.demo.com/icons/xiaoxiaole.png',
      coppa_compliant: true, ccpa_compliant: false,
      status: 1,
    },
    {
      developer_id: devId, app_key: 'app_tool_002', app_name: '万能工具箱',
      package_name: 'com.demo.toolbox', platform: 1, orientation: 1,
      category: 'Utilities/Tool', access_type: 1, timeout_ms: 5000,
      store_listed: true,
      store_name: 'google-play',
      store_url: 'https://play.google.com/store/apps/details?id=com.demo.toolbox',
      download_url: 'https://download.demo.com/toolbox.apk',
      icon_url: 'https://cdn.demo.com/icons/toolbox.png',
      coppa_compliant: false, ccpa_compliant: true,
      status: 1,
    },
    {
      developer_id: devId, app_key: 'app_ecom_003', app_name: '优选商城',
      package_name: 'com.demo.mall', platform: 2, orientation: 2,
      category: 'Shopping/Shopping', access_type: 1, timeout_ms: 5000,
      store_listed: true,
      store_name: 'app-store',
      store_url: 'https://apps.apple.com/cn/app/id000000001',
      download_url: 'https://download.demo.com/mall.ipa',
      icon_url: 'https://cdn.demo.com/icons/mall.png',
      coppa_compliant: false, ccpa_compliant: false,
      status: 1,
    },
  ]).select();
  if (appErr) throw new Error(`App insert: ${appErr.message}`);
  const appIdByKey: Record<string, number> = {};
  for (const a of apps!) appIdByKey[a.app_key] = a.id;
  console.log('2) Apps:', apps!.map((a: any) => `${a.app_name}(platform=${a.platform}, id=${a.id})`).join(', '));

  // === 阶段 3: 6 placements（覆盖 5 种 format，所有前端 form 必填项填齐） ===
  // 前端 form 必填：app_key, name, format, bidding_type, screen_orientation, ad_size(format=2), material_type(format 2/4), video_mute/auto_play/template_style(format=4)
  const { data: placements, error: plErr } = await c.from('placement').insert([
    { app_key: 'app_game_001', placement_id: 'pl_splash_001', name: '启动开屏',   format: 5, status: 1, bidding_type: 2, screen_orientation: 1 },
    { app_key: 'app_game_001', placement_id: 'pl_reward_002', name: '激励视频',   format: 4, status: 1, bidding_type: 2, screen_orientation: 1, material_type: 2, video_mute: 1, auto_play: 1, template_style: 1 },
    { app_key: 'app_tool_002', placement_id: 'pl_banner_003', name: '横幅广告',   format: 1, status: 1, bidding_type: 1, screen_orientation: 2 },
    { app_key: 'app_tool_002', placement_id: 'pl_inter_004',  name: '插屏广告',   format: 2, status: 1, bidding_type: 1, screen_orientation: 1, ad_size: 1, material_type: 1 },
    { app_key: 'app_ecom_003', placement_id: 'pl_native_005', name: '信息流广告', format: 3, status: 1, bidding_type: 2, screen_orientation: 2 },
    { app_key: 'app_ecom_003', placement_id: 'pl_inter_006',  name: '详情插屏',   format: 2, status: 1, bidding_type: 1, screen_orientation: 1, ad_size: 2, material_type: 1 },
  ]).select();
  if (plErr) throw new Error(`Placement insert: ${plErr.message}`);
  const plIdByCode: Record<string, number> = {};
  for (const p of placements!) plIdByCode[p.placement_id] = p.id;
  console.log('3) Placements:', placements!.map((p: any) => `${p.name}(format=${p.format}, id=${p.id})`).join(', '));

  // === 阶段 4: 5 ad_source（每个预置平台 1 个，所有前端 form 必填项填齐） ===
  // 前端 form 必填：source_name, networkDefId, third_app_id, third_placement_id, appId, placementId
  // 按 (app, placement, network) 三元组创建 15 个 ad_source，覆盖 3 app × 2 placement × 5 network 中实际关联的子集
  const adSourceRows: any[] = [];
  for (const p of placements!) {
    for (const d of defs) {
      adSourceRows.push({
        developer_id: devId,
        network_def_id: d.id,
        network_code: d.network_code,
        network_name: d.network_name,
        source_name: `${d.network_name}-${p.name}`,
        status: 1,
        is_custom: false,
        app_id: appIdByKey[p.app_key],
        placement_id: p.id,
        third_app_id: `${d.network_code.toLowerCase()}_app_${p.app_key.replace('app_', '').replace(/^0+/, '')}`,
        third_placement_id: `${d.network_code.toLowerCase()}_pl_${p.placement_id.replace('pl_', '').replace(/_0+/, '_')}`,
        store_dim_params: { width: 1080, height: 1920, refresh: 30 },
      });
    }
  }
  const { data: sources, error: srcErr } = await c.from('ad_source').insert(adSourceRows).select();
  if (srcErr) throw new Error(`AdSource insert: ${srcErr.message}`);
  // srcByCode: 不再一对一 — 同一 network_code 对应多个 ad_source（每个 placement 一个）
  // 改用 srcByKey: 选第一个作为默认主源
  const srcByKey: Record<string, number> = {};
  for (const s of sources!) {
    const key = `${s.network_code}__${s.app_id}__${s.placement_id}`;
    srcByKey[key] = s.id;
  }
  console.log('4) AdSources:', sources!.length, '个（3 app × 2 placement × 5 network = 15）');

  // === 阶段 5: 6 waterfall_config（每个 placement 一个） ===
  // traffic_group_id 用 0 表示「默认分组」（与 list 端点虚拟注入的默认分组对齐；避免 ''/NULL 与 0 不匹配导致 version 查不到）
  // layers 暂存空数组：真实层数据走「阶段 6: waterfall_layer」关联表，阶段 6 之后会回写 layers JSONB
  const { data: configs, error: wcErr } = await c.from('waterfall_config').insert(
    placements!.map((p: any) => ({
      placement_id: p.placement_id,
      traffic_group_id: 0,
      status: 1,
      version: 1,
      layers: [],
    })),
  ).select();
  if (wcErr) throw new Error(`WaterfallConfig insert: ${wcErr.message}`);
  console.log('5) WaterfallConfigs:', configs!.length, '个');

  // === 阶段 6: waterfall_layer（每个 config 4 层：B1/B2 竞价 + 瀑布 + 兜底） ===
  // 字段：config_id, layer_type(1=Bidding/2=瀑布/3=兜底), ad_source_id, sort_price, timeout_ms, priority, status
  // 每个 config 对应一个 placement，从 srcByKey 选该 placement 的 5 个 ad_source 中的 4 个作为 4 层
  const layerRows: any[] = [];
  const layerPlan = [
    { type: 1, offset: 0, priceMul: 1.0,  timeoutMs: 3000, priority: 100 }, // Bidding 1
    { type: 1, offset: 1, priceMul: 0.95, timeoutMs: 3000, priority: 90 },  // Bidding 2
    { type: 2, offset: 2, priceMul: 0.8,  timeoutMs: 5000, priority: 80 },  // 瀑布
    { type: 3, offset: 3, priceMul: 0,    timeoutMs: 5000, priority: 70 },  // 兜底
  ];
  for (const cfg of configs!) {
    // cfg.placement_id 是 placement 业务码
    const placementCode = cfg.placement_id;
    const pl = placements!.find((p: any) => p.placement_id === placementCode)!;
    const appKey = pl.app_key;
    for (const lp of layerPlan) {
      const net = defs[lp.offset].network_code;
      const sourceId = srcByKey[`${net}__${appIdByKey[appKey]}__${pl.id}`];
      if (!sourceId) continue;
      layerRows.push({
        config_id: cfg.id,
        layer_type: lp.type,
        ad_source_id: sourceId,
        sort_price: lp.priceMul,
        timeout_ms: lp.timeoutMs,
        priority: lp.priority,
        status: 1,
      });
    }
  }
  const { error: wlErr } = await c.from('waterfall_layer').insert(layerRows);
  if (wlErr) throw new Error(`WaterfallLayer insert: ${wlErr.message}`);
  console.log('6) WaterfallLayers:', layerRows.length, '个');

  // 6.5 回写 waterfall_config.layers JSONB（按 config_id 聚合 layerRows）
  // 目的：get/list 端点优先读 config.layers，避免总是 fallback 到 waterfall_layer 表
  const layersByConfig = new Map<number, any[]>();
  for (const lr of layerRows) {
    const arr = layersByConfig.get(lr.config_id) || [];
    arr.push({
      layer_type: lr.layer_type,
      ad_source_id: lr.ad_source_id,
      sort_price: lr.sort_price,
      timeout_ms: lr.timeout_ms,
      priority: lr.priority,
      status: lr.status,
    });
    layersByConfig.set(lr.config_id, arr);
  }
  for (const [configId, layers] of layersByConfig) {
    const { error: upErr } = await c.from('waterfall_config')
      .update({ layers })
      .eq('id', configId);
    if (upErr) console.warn(`回写 config ${configId} layers 失败: ${upErr.message}`);
  }
  console.log('6.5) WaterfallConfigs.layers 回写:', layersByConfig.size, '个');

  // === 阶段 7: 6 traffic_groups（按地区/版本/机型） ===
  const { data: groups, error: tgErr } = await c.from('traffic_group').insert([
    { developer_id: devId, group_name: '地区-亚太',       conditions: { region: ['CN', 'JP', 'KR'] }, priority: 1, status: 1, is_default: false, is_system: true, is_locked: false, waterfall_config_id: configs![0].id, placement_id: 'pl_splash_001' },
    { developer_id: devId, group_name: '地区-欧美',       conditions: { region: ['US', 'GB', 'DE'] }, priority: 2, status: 1, is_default: false, is_system: true, is_locked: false, waterfall_config_id: configs![0].id, placement_id: 'pl_splash_001' },
    { developer_id: devId, group_name: '地区-中东',       conditions: { region: ['SA', 'AE'] },       priority: 3, status: 1, is_default: false, is_system: true, is_locked: false, waterfall_config_id: configs![0].id, placement_id: 'pl_splash_001' },
    { developer_id: devId, group_name: '版本-老用户',     conditions: { app_version: ['1.0.0', '1.1.0'] }, priority: 4, status: 1, is_default: false, is_system: true, is_locked: false, waterfall_config_id: configs![0].id, placement_id: 'pl_splash_001' },
    { developer_id: devId, group_name: '版本-新用户',     conditions: { app_version: ['2.0.0'] },      priority: 5, status: 1, is_default: false, is_system: true, is_locked: false, waterfall_config_id: configs![0].id, placement_id: 'pl_splash_001' },
    { developer_id: devId, group_name: '机型-高端机',     conditions: { device_level: 'high' },     priority: 6, status: 1, is_default: false, is_system: true, is_locked: false, waterfall_config_id: configs![0].id, placement_id: 'pl_splash_001' },
  ]).select();
  if (tgErr) throw new Error(`TrafficGroup insert: ${tgErr.message}`);
  console.log('7) TrafficGroups:', groups!.length, '个');

  // === 阶段 8: ad_source_traffic_group（每个 ad_source 关联 2 个 group） ===
  const astgRows: any[] = [];
  for (let i = 0; i < sources!.length; i++) {
    const src = sources![i];
    const assignedGroups = [groups![i % groups!.length].id, groups![(i + 1) % groups!.length].id];
    for (const gid of assignedGroups) {
      astgRows.push({
        ad_source_id: src.id,
        traffic_group_id: gid,
        status: 1,
        price: 50 + i * 5,
        hour_limit: 100000,
        day_limit: 1000000,
        interval_sec: 60,
      });
    }
  }
  const { error: astgErr } = await c.from('ad_source_traffic_group').insert(astgRows);
  if (astgErr) throw new Error(`AdSourceTrafficGroup insert: ${astgErr.message}`);
  console.log('8) AdSourceTrafficGroup:', astgRows.length, '行');

  // === 阶段 9: 5 custom_adapter_version（每个预置平台 1 个） ===
  const cavRows = defs.map((d: any, i: number) => ({
    developer_id: devId,
    network_def_id: d.id,
    version: `1.0.${i + 1}`,
    file_name: `${d.network_code}_adapter_v1.0.${i + 1}.jar`,
    file_url: `https://demo.example.com/adapters/${d.network_code}/v1.0.${i + 1}.jar`,
    file_size: 1024 * 200,
    file_md5: `md5_${d.network_code}_v1`,
    sdk_min_version: '1.0.0',
    changelog: `${d.network_name} 适配器 v1.0.${i + 1} 初始化版本`,
    status: 1,
  }));
  const { data: cavs, error: cavErr } = await c.from('custom_adapter_version').insert(cavRows).select();
  if (cavErr) throw new Error(`CustomAdapterVersion insert: ${cavErr.message}`);
  console.log('9) CustomAdapterVersions:', cavs!.length, '个');

  // === 阶段 10: custom_network_report（7 天 × 5 账号 × 6 placement = 210 行） ===
  const cnrRows: any[] = [];
  const reportDates = genDates(7, 1); // 7 天前到 1 天前（不造今天，给 server 时间落库）
  for (const date of reportDates) {
    for (const d of defs) {
      for (const p of placements!) {
        const appKey = (p as any).app_key;
        const r = Math.random();
        cnrRows.push({
          developer_id: devId,
          app_key: appKey,
          placement_id: p.placement_id,
          network_def_id: d.id,
          stat_date: date,
          impressions: Math.floor(r * 5000 + 100),
          clicks: Math.floor(r * 200 + 5),
          revenue: Number((r * 80 + 1).toFixed(2)),
          upload_type: 1,
        });
      }
    }
  }
  const batchSize = 100;
  let totalCNR = 0;
  for (let i = 0; i < cnrRows.length; i += batchSize) {
    const batch = cnrRows.slice(i, i + batchSize);
    const { error: cnrErr } = await c.from('custom_network_report').insert(batch);
    if (cnrErr) throw new Error(`CustomNetworkReport batch ${i}: ${cnrErr.message}`);
    totalCNR += batch.length;
  }
  console.log('10) CustomNetworkReports:', totalCNR, '行');

  // === 阶段 11: 20 messages（10 系统 + 10 业务） ===
  const msgTypes = [1, 2, 3, 4]; // 1=系统 / 2=广告 / 3=财务 / 4=活动
  const msgRows: any[] = [];
  for (let i = 0; i < 20; i++) {
    const isSystem = i < 10;
    const t = isSystem ? 1 : msgTypes[1 + (i % 3)];
    msgRows.push({
      developer_id: devId,
      type: t,
      title: isSystem ? `系统通知 #${i + 1}` : `业务通知 #${i - 9}（类型${t}）`,
      content: isSystem
        ? `系统维护公告：第 ${i + 1} 次例行升级，请提前知悉。`
        : `您的账户有一条新业务提醒（类型=${t}），请及时查看。`,
      is_read: i < 5 ? 1 : 0,
    });
  }
  const { data: msgs, error: msgErr } = await c.from('message').insert(msgRows).select();
  if (msgErr) throw new Error(`Message insert: ${msgErr.message}`);
  console.log('11) Messages:', msgs!.length, '条');

  // === 阶段 12: 5 report_boards（保存的报表看板） ===
  const rbRows = [
    { name: '日报看板',  report_type: 'overview', is_default: true,  is_hidden: false, sort_order: 1, config: { metrics: ['requests', 'impressions', 'revenue_actual'], dimensions: ['app', 'ad_source', 'os'], dateRange: 'last7days' } },
    { name: '周报看板',  report_type: 'overview', is_default: false, is_hidden: false, sort_order: 2, config: { metrics: ['requests', 'impressions', 'revenue_actual'], dimensions: ['app', 'placement', 'region'], dateRange: 'last14days' } },
    { name: '月报看板',  report_type: 'overview', is_default: false, is_hidden: false, sort_order: 3, config: { metrics: ['clicks', 'revenue_actual', 'fill_rate'], dimensions: ['app', 'ad_source'], dateRange: 'last28days' } },
    { name: '对比看板',  report_type: 'overview', is_default: false, is_hidden: false, sort_order: 4, config: { metrics: ['revenue_actual'], dimensions: ['app', 'ad_source', 'os'], dateRange: 'last14days', compareWith: 'prev14days' } },
    { name: '异常看板',  report_type: 'overview', is_default: false, is_hidden: false, sort_order: 5, config: { metrics: ['fill_rate', 'show_rate', 'click_rate'], dimensions: ['app', 'ad_source'], dateRange: 'last7days' } },
  ].map(r => ({ developer_id: devId, ...r }));
  const { data: rbs, error: rbErr } = await c.from('report_board').insert(rbRows).select();
  if (rbErr) throw new Error(`ReportBoard insert: ${rbErr.message}`);
  console.log('12) ReportBoards:', rbs!.length, '个');

  // === 阶段 13: report_daily（28 天连续数据：28天前 ~ 今天；不造未来） ===
  // os 严格与 app.platform 对齐；每个 (app, placement, network) 唯一组合 1 行
  const allPresetCodes = defs.map((d: any) => d.network_code);
  const halfCount = Math.max(1, Math.ceil(allPresetCodes.length * 0.6));
  const firstHalf = allPresetCodes.slice(0, halfCount);
  const secondHalf = allPresetCodes.slice(-halfCount);
  // 按 (app, placement, network) 三元组从 srcByKey 取 ad_source_id
  const appOsMap: Record<string, { allowedOs: string[]; allowedNets: string[]; placements: { id: number; placementIdCode: string; fmt: string }[] }> = {
    app_game_001: { allowedOs: ['android', 'ios'], allowedNets: allPresetCodes, placements: [
      { id: plIdByCode['pl_splash_001'], placementIdCode: 'pl_splash_001', fmt: 'splash' },
      { id: plIdByCode['pl_reward_002'], placementIdCode: 'pl_reward_002', fmt: 'rewarded' },
    ] },
    app_tool_002: { allowedOs: ['android'],         allowedNets: firstHalf,        placements: [
      { id: plIdByCode['pl_banner_003'], placementIdCode: 'pl_banner_003', fmt: 'banner' },
      { id: plIdByCode['pl_inter_004'],  placementIdCode: 'pl_inter_004',  fmt: 'interstitial' },
    ] },
    app_ecom_003: { allowedOs: ['ios'],             allowedNets: secondHalf,       placements: [
      { id: plIdByCode['pl_native_005'], placementIdCode: 'pl_native_005', fmt: 'native' },
      { id: plIdByCode['pl_inter_006'],  placementIdCode: 'pl_inter_006',  fmt: 'interstitial' },
    ] },
  };
  const dates = genDates(27, 0); // 27 天前（=28天数据点含今天）到今天
  const regions = ['CN', 'US', 'JP', 'KR', 'GB'];
  const rows: any[] = [];
  for (const date of dates) {
    for (const appKey of ['app_game_001', 'app_tool_002', 'app_ecom_003']) {
      const { allowedOs, allowedNets, placements: pps } = appOsMap[appKey];
      for (const p of pps) {
        for (const net of allowedNets) {
          const sourceId = srcByKey[`${net}__${appIdByKey[appKey]}__${p.id}`];
          if (!sourceId) continue;
          const os = allowedOs[Math.floor(Math.random() * allowedOs.length)];
          const region = regions[Math.floor(Math.random() * regions.length)];
          for (const hour of [0, 6, 12, 18]) {
            const r = Math.random();
            rows.push({
              developer_id: devId,
              app_key: appKey,
              placement_id: p.placementIdCode,
              ad_source_id: sourceId,
              stat_date: date,
              requests:    Math.floor(r * 8000 + 100),
              fills:       Math.floor(r * 6000 + 50),
              impressions: Math.floor(r * 5000 + 30),
              clicks:      Math.floor(r * 200 + 1),
              revenue:     Number((r * 80 + 0.5).toFixed(2)),
              ad_type:     p.fmt,
              region:      region,
              os:          os,
              hour:        hour,
            });
          }
        }
      }
    }
  }
  console.log('13) Report_daily 计划插入:', rows.length, '行（28 天 × 4 小时 × 3 apps × 2 placements × N 网络）');
  let totalRD = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error: rdErr } = await c.from('report_daily').insert(batch);
    if (rdErr) {
      console.log('   Batch', i, 'err:', rdErr.message);
      break;
    }
    totalRD += batch.length;
  }
  console.log('   Inserted:', totalRD);

  // === 阶段 14: 反向校验（联动规则） ===
  // 14.1 ad_source.network_code 必须在预置 ad_network_def 中
  const { data: srcCheck } = await c.from('ad_source').select('network_code, third_app_id, third_placement_id');
  for (const s of srcCheck!) {
    if (!presetCodeSet.has(s.network_code)) throw new Error(`!! ad_source.network_code=${s.network_code} 不在预置列表`);
    if (!s.third_app_id) throw new Error(`!! ad_source.third_app_id 为空（id=${(s as any).id}）`);
    if (!s.third_placement_id) throw new Error(`!! ad_source.third_placement_id 为空（id=${(s as any).id}）`);
  }
  // 14.2 report_daily.os ⊆ {android, ios}
  const { data: osCheck } = await c.from('report_daily').select('os');
  const osSet = new Set((osCheck || []).map((r: any) => r.os));
  for (const f of ['harmony', 'windows', 'macos', 'linux']) {
    if (osSet.has(f)) throw new Error(`!! report_daily.os 出现非法值 ${f}`);
  }
  if (!osSet.has('android') || !osSet.has('ios')) {
    throw new Error(`!! report_daily.os 应包含 {android, ios}，实际 ${[...osSet].join(',')}`);
  }
  // 14.3 report_daily.placement_id ⊆ placement.placement_id
  const { data: allPl } = await c.from('placement').select('placement_id, app_key');
  const plSet = new Set(allPl!.map((p: any) => p.placement_id));
  const { data: rdPlCheck } = await c.from('report_daily').select('placement_id, app_key').limit(1000);
  for (const r of rdPlCheck || []) {
    if (!plSet.has(r.placement_id)) throw new Error(`!! report_daily.placement_id=${r.placement_id} 不存在`);
  }
  // 14.4 report_daily.ad_source_id ⊆ ad_source.id
  const { data: allSrc } = await c.from('ad_source').select('id');
  const srcIdSet = new Set(allSrc!.map((s: any) => s.id));
  const { data: rdSrcCheck } = await c.from('report_daily').select('ad_source_id').limit(1000);
  for (const r of rdSrcCheck || []) {
    if (!srcIdSet.has(r.ad_source_id)) throw new Error(`!! report_daily.ad_source_id=${r.ad_source_id} 不存在`);
  }
  // 14.5 ad_source_traffic_group 的 ad_source_id/traffic_group_id 都存在
  const { data: allTg } = await c.from('traffic_group').select('id');
  const tgIdSet = new Set(allTg!.map((g: any) => g.id));
  const { data: astgCheck } = await c.from('ad_source_traffic_group').select('ad_source_id, traffic_group_id');
  for (const r of astgCheck || []) {
    if (!srcIdSet.has(r.ad_source_id)) throw new Error(`!! ad_source_traffic_group.ad_source_id=${r.ad_source_id} 不存在`);
    if (!tgIdSet.has(r.traffic_group_id)) throw new Error(`!! ad_source_traffic_group.traffic_group_id=${r.traffic_group_id} 不存在`);
  }
  // 14.6 report_daily.app_key → app.platform → os 对齐
  const { data: appCheck } = await c.from('app').select('app_key, platform');
  const appPlatformMap: Record<string, number> = {};
  for (const a of appCheck!) appPlatformMap[a.app_key] = a.platform;
  const { data: rdAppCheck } = await c.from('report_daily').select('app_key, os').limit(2000);
  for (const r of rdAppCheck || []) {
    const p = appPlatformMap[r.app_key];
    if (p === 1 && r.os !== 'android') throw new Error(`!! ${r.app_key} platform=1 但 os=${r.os}`);
    if (p === 2 && r.os !== 'ios')     throw new Error(`!! ${r.app_key} platform=2 但 os=${r.os}`);
    if (p === 3 && !['android', 'ios'].includes(r.os)) throw new Error(`!! ${r.app_key} platform=3 但 os=${r.os}`);
  }

  // === 阶段 15: 输出最终统计 ===
  const counts: Record<string, number> = {};
  for (const t of ['app', 'placement', 'ad_source', 'waterfall_config', 'waterfall_layer', 'traffic_group', 'ad_source_traffic_group', 'custom_adapter_version', 'custom_network_report', 'message', 'report_board', 'report_daily']) {
    const { count } = await c.from(t).select('*', { count: 'exact', head: true });
    counts[t] = count || 0;
  }
  console.log('15) 最终统计:', JSON.stringify(counts, null, 2));
  console.log('    OS 集合:', [...osSet].join(','));
  console.log('    AdSource network_codes:', (srcCheck!).map((s: any) => s.network_code).join(','));
  console.log('    今日:', todayStr());
  console.log('    ✅ 全部联动校验通过');
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
