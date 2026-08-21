/**
 * 阶段 1.2: enum_dict seed
 * 灌 22 个字典族 + 107 个枚举值（从 enum-labels.ts 抄）
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '../../.env.local'), override: true });

const supabase = createClient(
  process.env.COZE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } },
);

type DictRow = { dict_code: string; value: number; label: string; sort_order: number };

const DATA: DictRow[] = [
  // app.platform
  ...['Android', 'iOS', '双端'].map((label, idx) => ({ dict_code: 'app.platform', value: idx + 1, label, sort_order: idx + 1 })),
  // app.access_type
  ...['自有', '联运', '合作'].map((label, idx) => ({ dict_code: 'app.access_type', value: idx + 1, label, sort_order: idx + 1 })),
  // app.status (复用通用 status)
  { dict_code: 'app.status', value: 1, label: '启用', sort_order: 1 },
  { dict_code: 'app.status', value: 2, label: '停用', sort_order: 2 },
  // placement.format
  ...['横幅', '插屏', '开屏', '原生', '视频'].map((label, idx) => ({ dict_code: 'placement.format', value: idx + 1, label, sort_order: idx + 1 })),
  // placement.bidding_type
  { dict_code: 'placement.bidding_type', value: 1, label: '固价', sort_order: 1 },
  { dict_code: 'placement.bidding_type', value: 2, label: '竞价', sort_order: 2 },
  // placement.screen_orientation (DB 存 0=竖屏/1=横屏/2=不限)
  { dict_code: 'placement.screen_orientation', value: 0, label: '竖屏', sort_order: 1 },
  { dict_code: 'placement.screen_orientation', value: 1, label: '横屏', sort_order: 2 },
  { dict_code: 'placement.screen_orientation', value: 2, label: '不限', sort_order: 3 },
  // placement.ad_size
  ...['半屏', '全屏', '优选'].map((label, idx) => ({ dict_code: 'placement.ad_size', value: idx + 1, label, sort_order: idx + 1 })),
  // placement.material_type
  ...['图片', '视频', '视频+图片'].map((label, idx) => ({ dict_code: 'placement.material_type', value: idx + 1, label, sort_order: idx + 1 })),
  // placement.auto_play
  ...['总是', '仅WiFi', '点击播放'].map((label, idx) => ({ dict_code: 'placement.auto_play', value: idx + 1, label, sort_order: idx + 1 })),
  // placement.template_style
  { dict_code: 'placement.template_style', value: 1, label: '1图1文', sort_order: 1 },
  { dict_code: 'placement.template_style', value: 2, label: '1图2文', sort_order: 2 },
  { dict_code: 'placement.template_style', value: 3, label: '1图3文', sort_order: 3 },
  { dict_code: 'placement.template_style', value: 4, label: '1图1图标1文', sort_order: 4 },
  { dict_code: 'placement.template_style', value: 5, label: '1图1图标2文', sort_order: 5 },
  { dict_code: 'placement.template_style', value: 6, label: '3图1文', sort_order: 6 },
  { dict_code: 'placement.template_style', value: 7, label: '1图标2文', sort_order: 7 },
  { dict_code: 'placement.template_style', value: 8, label: '3图1图标2文', sort_order: 8 },
  { dict_code: 'placement.template_style', value: 9, label: '1图1图标2文1按钮', sort_order: 9 },
  { dict_code: 'placement.template_style', value: 10, label: '图片', sort_order: 10 },
  { dict_code: 'placement.template_style', value: 11, label: '1视频1封面1文', sort_order: 11 },
  { dict_code: 'placement.template_style', value: 12, label: '1视频1封面1图标2文', sort_order: 12 },
  { dict_code: 'placement.template_style', value: 13, label: '1视频1封面', sort_order: 13 },
  // placement.status
  { dict_code: 'placement.status', value: 1, label: '启用', sort_order: 1 },
  { dict_code: 'placement.status', value: 2, label: '停用', sort_order: 2 },
  // ad_source.status / traffic_group.status / waterfall_*.status
  ...(['ad_source.status', 'traffic_group.status', 'ad_network_def.status', 'ad_network_account.status', 'waterfall_config.status', 'waterfall_layer.status', 'developer.status']
    .flatMap((dict_code) => [
      { dict_code, value: 1, label: '启用', sort_order: 1 },
      { dict_code, value: 2, label: '停用', sort_order: 2 },
    ])),
  // ad_network_def.system_type
  ...['Android', 'iOS', '双端'].map((label, idx) => ({ dict_code: 'ad_network_def.system_type', value: idx + 1, label, sort_order: idx + 1 })),
  // ad_network_def.is_preset
  { dict_code: 'ad_network_def.is_preset', value: 1, label: '预置', sort_order: 1 },
  { dict_code: 'ad_network_def.is_preset', value: 2, label: '自定义', sort_order: 2 },
  // message.type
  ...['系统通知', '运营公告', '收益提醒', '异常告警'].map((label, idx) => ({ dict_code: 'message.type', value: idx + 1, label, sort_order: idx + 1 })),
  // message.is_read
  { dict_code: 'message.is_read', value: 0, label: '未读', sort_order: 1 },
  { dict_code: 'message.is_read', value: 1, label: '已读', sort_order: 2 },
  // message.priority
  ...['低', '中', '高'].map((label, idx) => ({ dict_code: 'message.priority', value: idx + 1, label, sort_order: idx + 1 })),
  // developer.role
  { dict_code: 'developer.role', value: 1, label: '开发者', sort_order: 1 },
  { dict_code: 'developer.role', value: 2, label: '管理员', sort_order: 2 },
  // report_daily.ad_type (string)
  ...[
    { v: 1, l: '横幅广告' }, { v: 2, l: '插屏广告' }, { v: 3, l: '信息流广告' },
    { v: 4, l: '激励视频' }, { v: 5, l: '开屏广告' },
  ].map((x, idx) => ({ dict_code: 'report_daily.ad_type', value: x.v, label: x.l, sort_order: idx + 1 })),
  // report_daily.os
  { dict_code: 'report_daily.os', value: 1, label: 'Android', sort_order: 1 },
  { dict_code: 'report_daily.os', value: 2, label: 'iOS', sort_order: 2 },
  // report_daily.region
  ...[
    { v: 1, l: '中国' }, { v: 2, l: '中国香港' }, { v: 3, l: '中国台湾' },
    { v: 4, l: '美国' }, { v: 5, l: '日本' }, { v: 6, l: '韩国' },
    { v: 7, l: '英国' }, { v: 8, l: '印度' }, { v: 9, l: '德国' },
    { v: 10, l: '法国' }, { v: 11, l: '巴西' }, { v: 12, l: '俄罗斯' },
    { v: 13, l: '加拿大' }, { v: 14, l: '澳大利亚' }, { v: 15, l: '新加坡' },
    { v: 16, l: '印度尼西亚' }, { v: 17, l: '泰国' }, { v: 18, l: '越南' },
    { v: 19, l: '马来西亚' }, { v: 20, l: '菲律宾' }, { v: 21, l: '墨西哥' },
    { v: 22, l: '西班牙' }, { v: 23, l: '意大利' }, { v: 24, l: '土耳其' },
    { v: 25, l: '沙特阿拉伯' }, { v: 26, l: '阿联酋' }, { v: 27, l: '埃及' },
    { v: 28, l: '南非' }, { v: 29, l: '阿根廷' },
  ].map((x) => ({ dict_code: 'report_daily.region', value: x.v, label: x.l, sort_order: x.v })),
];

async function main() {
  console.log(`[seed-enum-dict] inserting ${DATA.length} rows...`);
  // 1) 清空再灌（保证幂等）
  const { error: delErr } = await supabase.from('enum_dict').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) { console.error('[seed-enum-dict] delete failed:', delErr); process.exit(1); }
  // 2) 分批插入
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < DATA.length; i += BATCH) {
    const batch = DATA.slice(i, i + BATCH);
    const { error } = await supabase.from('enum_dict').insert(batch);
    if (error) { console.error(`[seed-enum-dict] batch ${i} failed:`, error); process.exit(1); }
    inserted += batch.length;
  }
  console.log(`[seed-enum-dict] done: ${inserted}/${DATA.length} rows`);
  // 3) 校验
  const { count } = await supabase.from('enum_dict').select('id', { count: 'exact', head: true });
  console.log(`[seed-enum-dict] table count: ${count}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
