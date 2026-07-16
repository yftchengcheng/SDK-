/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';

const c = createClient(
  process.env.COZE_SUPABASE_URL!,
  process.env.COZE_SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Target:', process.env.COZE_SUPABASE_URL);

  const devId = 'dev_W7dOvj90HaEGi3Ez';
  console.log('Owner:', devId);

  // 1) 清 4 张表
  await c.from('report_daily').delete().neq('id', 0);
  await c.from('ad_source').delete().neq('id', 0);
  await c.from('placement').delete().neq('id', 0);
  await c.from('app').delete().neq('id', 0);
  console.log('1) 清空完成');

  // 2) 3 apps
  const { data: apps, error: appErr } = await c.from('app').insert([
    { developer_id: devId, app_key: 'app_game_001', app_name: '开心消消乐', package_name: 'com.demo.xiaoxiaole', platform: 3, category: '游戏', status: 1, timeout_ms: 5000, store_listed: true, store_name: '应用宝' },
    { developer_id: devId, app_key: 'app_tool_002', app_name: '万能工具箱', package_name: 'com.demo.toolbox',     platform: 1, category: '工具', status: 1, timeout_ms: 5000, store_listed: true, store_name: '应用宝' },
    { developer_id: devId, app_key: 'app_ecom_003', app_name: '优选商城',   package_name: 'com.demo.mall',         platform: 2, category: '电商', status: 1, timeout_ms: 5000, store_listed: true, store_name: 'App Store' }
  ]).select();
  console.log('2) Apps:', apps?.length, appErr?.message);

  // 3) 6 placements
  const { data: placements, error: plErr } = await c.from('placement').insert([
    { app_key: 'app_game_001', placement_id: 'pl_splash_001', name: '启动开屏',   format: 5, status: 1, bidding_type: 1, screen_orientation: 0 },
    { app_key: 'app_game_001', placement_id: 'pl_reward_002', name: '激励视频',   format: 4, status: 1, bidding_type: 2, screen_orientation: 1 },
    { app_key: 'app_tool_002', placement_id: 'pl_banner_003', name: '横幅广告',   format: 1, status: 1, bidding_type: 1, screen_orientation: 0 },
    { app_key: 'app_tool_002', placement_id: 'pl_inter_004',  name: '插屏广告',   format: 2, status: 1, bidding_type: 1, screen_orientation: 1 },
    { app_key: 'app_ecom_003', placement_id: 'pl_native_005', name: '信息流广告', format: 3, status: 1, bidding_type: 2, screen_orientation: 0 },
    { app_key: 'app_ecom_003', placement_id: 'pl_inter_006',  name: '详情插屏',   format: 2, status: 1, bidding_type: 1, screen_orientation: 0 }
  ]).select();
  console.log('3) Placements:', placements?.length, plErr?.message);

  // 4) 5 ad_sources（含必填 third_app_id / third_placement_id）
  const { data: sources, error: srcErr } = await c.from('ad_source').insert([
    { developer_id: devId, network_code: 'pangle',    network_name: 'Pangle (穿山甲)', source_name: '穿山甲-默认', status: 1, is_custom: false, third_app_id: 'pangle_app_001',    third_placement_id: 'pangle_pl_001' },
    { developer_id: devId, network_code: 'csj',       network_name: 'CSJ (优量汇)',   source_name: '优量汇-默认', status: 1, is_custom: false, third_app_id: 'csj_app_001',       third_placement_id: 'csj_pl_001' },
    { developer_id: devId, network_code: 'admob',     network_name: 'Google AdMob',   source_name: 'AdMob-默认',  status: 1, is_custom: false, third_app_id: 'admob_app_001',     third_placement_id: 'admob_pl_001' },
    { developer_id: devId, network_code: 'mintegral', network_name: 'Mintegral',      source_name: 'Mintegral-默认', status: 1, is_custom: false, third_app_id: 'mintegral_app_001', third_placement_id: 'mintegral_pl_001' },
    { developer_id: devId, network_code: 'inmobi',    network_name: 'InMobi',         source_name: 'InMobi-默认', status: 1, is_custom: false, third_app_id: 'inmobi_app_001',    third_placement_id: 'inmobi_pl_001' }
  ]).select();
  console.log('4) Ad sources:', sources?.length, srcErr?.message);

  // 5) 联动灌 report_daily（每个唯一组合只生成 1 行，region/os 随机）
  const appOsMap: Record<string, string[]> = {
    'app_game_001': ['android', 'ios'],
    'app_tool_002': ['android'],
    'app_ecom_003': ['ios', 'harmony']
  };
  const appNetworkMap: Record<string, string[]> = {
    'app_game_001': ['pangle', 'mintegral', 'csj'],
    'app_tool_002': ['csj', 'inmobi', 'pangle'],
    'app_ecom_003': ['admob', 'mintegral', 'csj']
  };
  const appPlacementMap: Record<string, { id: string; fmt: string }[]> = {
    'app_game_001': [{ id: 'pl_splash_001', fmt: 'splash' }, { id: 'pl_reward_002', fmt: 'rewarded' }],
    'app_tool_002': [{ id: 'pl_banner_003', fmt: 'banner' }, { id: 'pl_inter_004', fmt: 'interstitial' }],
    'app_ecom_003': [{ id: 'pl_native_005', fmt: 'native' }, { id: 'pl_inter_006', fmt: 'interstitial' }]
  };
  const networkToId: Record<string, number> = {};
  for (const s of sources || []) networkToId[s.network_code] = s.id;

  const dates: string[] = [];
  for (let d = new Date('2026-06-15'); d <= new Date('2026-07-08'); d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  const regions = ['CN', 'US', 'JP'];
  const rows: any[] = [];
  for (const date of dates) {
    for (const appKey of ['app_game_001', 'app_tool_002', 'app_ecom_003']) {
      const allowedOs = appOsMap[appKey];
      const placements = appPlacementMap[appKey];
      for (const p of placements) {
        for (const net of appNetworkMap[appKey]) {
          const sourceId = networkToId[net];
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
              hour:        hour
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

  // 6) 校验
  const { count: ac } = await c.from('app').select('*', { count: 'exact', head: true });
  const { count: pc } = await c.from('placement').select('*', { count: 'exact', head: true });
  const { count: sc } = await c.from('ad_source').select('*', { count: 'exact', head: true });
  const { count: rc } = await c.from('report_daily').select('*', { count: 'exact', head: true });
  console.log('6) 校验:', { app: ac, placement: pc, ad_source: sc, report_daily: rc });
}
main().catch(e => { console.error('ERROR:', e); process.exit(1); });
