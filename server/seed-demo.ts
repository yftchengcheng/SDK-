/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Demo 数据种子脚本
 *
 * 系统边界（来自 PLAN.md / DB schema）：
 * - app.platform: 1=Android / 2=iOS / 3=Both（无鸿蒙）
 * - ad_network_def.system_type: 1=Android / 2=iOS / 3=Both（无鸿蒙）
 * - ad_network_def.is_preset: true=预置（官方），false=自定义
 * - 预置广告网络从 ad_network_def.is_preset=true 动态加载（不写死 code 列表）
 * - report_daily.os 必须与关联 app.platform 严格一致：
 *     platform=1 → os=android
 *     platform=2 → os=ios
 *     platform=3 → os=android 或 ios 均可
 * - ad_source.network_code / network_name 必须从 ad_network_def 引用
 *   （即 network_code 在 ad_network_def 中 is_preset=true 的 code 集合）
 */
import { createClient } from '@supabase/supabase-js';

const c = createClient(
  process.env.COZE_SUPABASE_URL!,
  process.env.COZE_SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  console.log('Target:', process.env.COZE_SUPABASE_URL);
  const devId = 'dev_W7dOvj90HaEGi3Ez';
  console.log('Owner:', devId);

  // 0) 动态读取所有预置 ad_network_def（is_preset=true）
  //    保证 link 的 network_def_id 是真实存在的；不写死 5 个 code
  const { data: defs, error: defErr } = await c
    .from('ad_network_def')
    .select('id, network_code, network_name, system_type, is_preset')
    .eq('is_preset', true)
    .order('id');
  if (defErr) throw new Error(`Load ad_network_def failed: ${defErr.message}`);
  if (!defs || defs.length === 0) {
    throw new Error('需要至少 1 个预置 ad_network_def（is_preset=true），实际 0');
  }
  // 验证预置平台都是 Both（system_type=3）才通用
  for (const d of defs) {
    if (d.system_type !== 3) {
      console.warn(`!! ${d.network_code} system_type=${d.system_type}（非 Both，可能影响 demo 联动）`);
    }
  }
  const defByCode: Record<string, { id: number; network_code: string; network_name: string }> = {};
  for (const d of defs) defByCode[d.network_code] = d;
  console.log('0) 预置 ad_network_def 已加载（动态从 DB 读）:', Object.keys(defByCode).join(','));

  // 1) 清 4 张表（保留 902 个 developer + 5 个预置 ad_network_def + traffic_group + 消息等）
  await c.from('report_daily').delete().neq('id', 0);
  await c.from('ad_source').delete().neq('id', 0);
  await c.from('placement').delete().neq('id', 0);
  await c.from('app').delete().neq('id', 0);
  console.log('1) 清空 app/placement/ad_source/report_daily 完成');

  // 2) 3 apps（覆盖 Android / iOS / Both 三种 platform）
  const { data: apps, error: appErr } = await c.from('app').insert([
    {
      developer_id: devId,
      app_key: 'app_game_001',
      app_name: '开心消消乐',
      package_name: 'com.demo.xiaoxiaole',
      platform: 3, // 双端（Android + iOS）
      category: '游戏',
      status: 1,
      timeout_ms: 5000,
      store_listed: true,
      store_name: '应用宝',
      access_type: 1,
    },
    {
      developer_id: devId,
      app_key: 'app_tool_002',
      app_name: '万能工具箱',
      package_name: 'com.demo.toolbox',
      platform: 1, // Android
      category: '工具',
      status: 1,
      timeout_ms: 5000,
      store_listed: true,
      store_name: '应用宝',
      access_type: 1,
    },
    {
      developer_id: devId,
      app_key: 'app_ecom_003',
      app_name: '优选商城',
      package_name: 'com.demo.mall',
      platform: 2, // iOS
      category: '电商',
      status: 1,
      timeout_ms: 5000,
      store_listed: true,
      store_name: 'App Store',
      access_type: 1,
    },
  ]).select();
  if (appErr) throw new Error(`App insert failed: ${appErr.message}`);
  if (!apps || apps.length !== 3) throw new Error(`期望 3 apps，实际 ${apps?.length}`);
  console.log('2) Apps:', apps.map(a => `${a.app_name}(platform=${a.platform})`).join(', '));

  // 3) 6 placements（按广告位类型 + 关联 app）
  const { data: placements, error: plErr } = await c.from('placement').insert([
    { app_key: 'app_game_001', placement_id: 'pl_splash_001', name: '启动开屏',   format: 5, status: 1, bidding_type: 1, screen_orientation: 0 },
    { app_key: 'app_game_001', placement_id: 'pl_reward_002', name: '激励视频',   format: 4, status: 1, bidding_type: 2, screen_orientation: 1 },
    { app_key: 'app_tool_002', placement_id: 'pl_banner_003', name: '横幅广告',   format: 1, status: 1, bidding_type: 1, screen_orientation: 0 },
    { app_key: 'app_tool_002', placement_id: 'pl_inter_004',  name: '插屏广告',   format: 2, status: 1, bidding_type: 1, screen_orientation: 1 },
    { app_key: 'app_ecom_003', placement_id: 'pl_native_005', name: '信息流广告', format: 3, status: 1, bidding_type: 2, screen_orientation: 0 },
    { app_key: 'app_ecom_003', placement_id: 'pl_inter_006',  name: '详情插屏',   format: 2, status: 1, bidding_type: 1, screen_orientation: 0 },
  ]).select();
  if (plErr) throw new Error(`Placement insert failed: ${plErr.message}`);
  if (!placements || placements.length !== 6) throw new Error(`期望 6 placements，实际 ${placements?.length}`);
  console.log('3) Placements:', placements.length, '个');

  // 4) ad_source：每个预置 ad_network_def 生成一条 source
  //    关键：network_code / network_name / network_def_id 必须从 ad_network_def 引用
  //    第三方 app_id / placement_id 用占位业务码
  const adSourceRows = defs.map((d: { id: number; network_code: string; network_name: string }) => ({
    developer_id: devId,
    network_def_id: d.id,
    network_code: d.network_code,
    network_name: d.network_name,
    source_name: `${d.network_name}-默认`,
    status: 1,
    is_custom: false,
    third_app_id: `${d.network_code.toLowerCase()}_app_001`,
    third_placement_id: `${d.network_code.toLowerCase()}_pl_001`,
  }));
  const { data: sources, error: srcErr } = await c.from('ad_source').insert(adSourceRows).select();
  if (srcErr) throw new Error(`AdSource insert failed: ${srcErr.message}`);
  if (!sources || sources.length === 0) throw new Error(`ad_source insert 失败，0 条`);
  const srcByCode: Record<string, number> = {};
  for (const s of sources) srcByCode[s.network_code] = s.id;
  console.log('4) Ad sources:', sources.map(s => `${s.network_code}(id=${s.id})`).join(', '));

  // 5) report_daily：os 严格与 app.platform 对齐
  //    联动规则（按 defs 动态分片，不硬编码 code）：
  //    - 双端 app (platform=3) → 关联所有预置平台，os ∈ {android, ios}
  //    - 单端 Android app (platform=1) → 关联前 60% 预置平台，os = android
  //    - 单端 iOS app (platform=2) → 关联后 60% 预置平台，os = ios
  const allPresetCodes = defs.map((d: any) => d.network_code);
  const halfCount = Math.max(1, Math.ceil(allPresetCodes.length * 0.6));
  const firstHalf = allPresetCodes.slice(0, halfCount);
  const secondHalf = allPresetCodes.slice(-halfCount);
  const appOsMap: Record<string, { allowedOs: string[]; allowedNets: string[] }> = {
    app_game_001: { allowedOs: ['android', 'ios'], allowedNets: allPresetCodes }, // 双端 → 全部
    app_tool_002: { allowedOs: ['android'],     allowedNets: firstHalf },        // Android → 前 60%
    app_ecom_003: { allowedOs: ['ios'],         allowedNets: secondHalf },       // iOS → 后 60%
  };
  const appPlacementMap: Record<string, { id: string; fmt: string }[]> = {
    app_game_001: [{ id: 'pl_splash_001', fmt: 'splash' }, { id: 'pl_reward_002', fmt: 'rewarded' }],
    app_tool_002: [{ id: 'pl_banner_003', fmt: 'banner' }, { id: 'pl_inter_004', fmt: 'interstitial' }],
    app_ecom_003: [{ id: 'pl_native_005', fmt: 'native' }, { id: 'pl_inter_006', fmt: 'interstitial' }],
  };

  const dates: string[] = [];
  for (let d = new Date('2026-06-15'); d <= new Date('2026-07-08'); d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  const regions = ['CN', 'US', 'JP']; // 国家与 OS 无关

  const rows: any[] = [];
  for (const date of dates) {
    for (const appKey of ['app_game_001', 'app_tool_002', 'app_ecom_003']) {
      const { allowedOs, allowedNets } = appOsMap[appKey];
      const placements = appPlacementMap[appKey];
      for (const p of placements) {
        for (const net of allowedNets) {
          const sourceId = srcByCode[net];
          if (!sourceId) throw new Error(`ad_source 缺 ${net}`);
          // 每个 (date, app, placement, ad_source) 唯一组合，os 在 allowedOs 中随机
          const os = allowedOs[Math.floor(Math.random() * allowedOs.length)];
          const region = regions[Math.floor(Math.random() * regions.length)];
          for (const hour of [0, 6, 12, 18]) {
            const r = Math.random();
            rows.push({
              developer_id: devId,
              app_key: appKey,
              placement_id: p.id,
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
  console.log('5) Rows planned:', rows.length);

  const batchSize = 200;
  let totalInserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error: rdErr } = await c.from('report_daily').insert(batch);
    if (rdErr) {
      console.log('   Batch', i, 'err:', rdErr.message);
      break;
    }
    totalInserted += batch.length;
  }
  console.log('   Inserted:', totalInserted);

  // 6) 校验：os 不应出现 harmony / windows / macos / linux；ad_source.network_code 应在预置 5 个内
  const { data: osCheck } = await c.from('report_daily').select('os');
  const osSet = new Set((osCheck || []).map(r => r.os));
  const forbidden = ['harmony', 'windows', 'macos', 'linux'];
  for (const f of forbidden) {
    if (osSet.has(f)) throw new Error(`!! report_daily.os 出现非法值 ${f}`);
  }
  if (osSet.size > 2 || !osSet.has('android') || !osSet.has('ios')) {
    throw new Error(`!! report_daily.os 应为 {android, ios} 集合，实际 ${[...osSet].join(',')}`);
  }
  // 校验：ad_source.network_code 必须在预置 ad_network_def 中（动态从 DB 读，不硬编码）
  const { data: presetDefs } = await c.from('ad_network_def').select('network_code').eq('is_preset', true);
  const presetCodeSet = new Set((presetDefs || []).map((d: any) => d.network_code));
  const { data: srcCheck } = await c.from('ad_source').select('network_code');
  for (const s of srcCheck || []) {
    if (!presetCodeSet.has(s.network_code)) {
      throw new Error(`!! ad_source.network_code=${s.network_code} 不在预置列表内（is_preset=true）`);
    }
  }

  // 7) 输出最终统计
  const { count: ac } = await c.from('app').select('*', { count: 'exact', head: true });
  const { count: pc } = await c.from('placement').select('*', { count: 'exact', head: true });
  const { count: sc } = await c.from('ad_source').select('*', { count: 'exact', head: true });
  const { count: rc } = await c.from('report_daily').select('*', { count: 'exact', head: true });
  console.log('7) 校验通过:', { app: ac, placement: pc, ad_source: sc, report_daily: rc });
  console.log('   OS 集合:', [...osSet].join(','));
  console.log('   Ad source network_codes:', (srcCheck || []).map(s => s.network_code).join(','));
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
