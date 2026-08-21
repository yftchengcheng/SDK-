/**
 * 阶段 1.3: placement_field_def seed
 * 5 format × 2 access_type × 6~8 字段 ≈ 80 行
 * 字段规则来源：
 *   - 后端 INSERT (server/routes/placement.ts) — 权威必填规则
 *   - PlacementDrawer form 默认值 — 同步默认值
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env'), quiet: true });
dotenv.config({ path: resolve(__dirname, '../../.env.local'), quiet: true, override: true });

const supabase = createClient(
  process.env.COZE_SUPABASE_URL || '',
  process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } },
);

type FieldRow = {
  format: number;
  access_type: number;
  field_name: string;
  display_name: string;
  field_type: 'input' | 'select' | 'radio' | 'switch';
  required: boolean;
  options_json: Array<{ value: number | string; label: string }>;
  sort_order: number;
  note: string | null;
};

const BANNER: Array<Omit<FieldRow, 'format' | 'access_type'>> = [
  { field_name: 'ad_size', display_name: '广告位尺寸', field_type: 'select', required: true,
    options_json: [{ value: 1, label: '640x100' }, { value: 2, label: '728x90' }, { value: 3, label: '300x250' }], sort_order: 1, note: null },
  { field_name: 'refresh_interval', display_name: '刷新间隔（秒）', field_type: 'input', required: false,
    options_json: [], sort_order: 2, note: '0=不刷新' },
  { field_name: 'show_close', display_name: '是否显示关闭按钮', field_type: 'switch', required: false,
    options_json: [], sort_order: 3, note: null },
];

const INTERSTITIAL: Array<Omit<FieldRow, 'format' | 'access_type'>> = [
  { field_name: 'ad_size', display_name: '广告位尺寸', field_type: 'select', required: true,
    options_json: [{ value: 1, label: '半屏' }, { value: 2, label: '全屏' }, { value: 3, label: '优选' }], sort_order: 1, note: null },
  { field_name: 'material_type', display_name: '素材形式', field_type: 'select', required: true,
    options_json: [{ value: 1, label: '图片' }, { value: 2, label: '视频' }, { value: 3, label: '视频+图片' }], sort_order: 2, note: null },
  { field_name: 'show_close', display_name: '是否显示关闭按钮', field_type: 'switch', required: false,
    options_json: [], sort_order: 3, note: null },
  { field_name: 'close_delay', display_name: '关闭按钮延迟（秒）', field_type: 'input', required: false,
    options_json: [], sort_order: 4, note: '0=立即可关' },
];

const SPLASH: Array<Omit<FieldRow, 'format' | 'access_type'>> = [
  { field_name: 'skip_time', display_name: '跳过倒计时（秒）', field_type: 'input', required: true,
    options_json: [], sort_order: 1, note: null },
  { field_name: 'show_skip', display_name: '是否显示跳过', field_type: 'switch', required: false,
    options_json: [], sort_order: 2, note: null },
  { field_name: 'material_type', display_name: '素材形式', field_type: 'select', required: true,
    options_json: [{ value: 1, label: '图片' }, { value: 2, label: '视频' }], sort_order: 3, note: null },
];

const NATIVE: Array<Omit<FieldRow, 'format' | 'access_type'>> = [
  { field_name: 'template_style', display_name: '模版样式', field_type: 'select', required: true,
    options_json: [
      { value: 1, label: '1图1文' }, { value: 2, label: '1图2文' }, { value: 3, label: '1图3文' },
      { value: 4, label: '1图1图标1文' }, { value: 5, label: '1图1图标2文' },
      { value: 6, label: '3图1文' }, { value: 7, label: '1图标2文' }, { value: 8, label: '3图1图标2文' },
      { value: 9, label: '1图1图标2文1按钮' }, { value: 10, label: '图片' },
      { value: 11, label: '1视频1封面1文' }, { value: 12, label: '1视频1封面1图标2文' },
      { value: 13, label: '1视频1封面' },
    ], sort_order: 1, note: null },
  { field_name: 'auto_play', display_name: '自动播放', field_type: 'select', required: false,
    options_json: [{ value: 1, label: '总是' }, { value: 2, label: '仅WiFi' }, { value: 3, label: '点击播放' }], sort_order: 2, note: '视频模版有效' },
];

const REWARDED: Array<Omit<FieldRow, 'format' | 'access_type'>> = [
  { field_name: 'ad_size', display_name: '广告位尺寸', field_type: 'select', required: true,
    options_json: [{ value: 1, label: '竖版' }, { value: 2, label: '横版' }], sort_order: 1, note: null },
  { field_name: 'material_type', display_name: '素材形式', field_type: 'select', required: true,
    options_json: [{ value: 1, label: '图片' }, { value: 2, label: '视频' }, { value: 3, label: '视频+图片' }], sort_order: 2, note: null },
  { field_name: 'reward_amount', display_name: '激励数量', field_type: 'input', required: true,
    options_json: [], sort_order: 3, note: '用户看完广告获得奖励的数量' },
  { field_name: 'reward_unit', display_name: '激励单位', field_type: 'input', required: true,
    options_json: [], sort_order: 4, note: '如"金币/积分"' },
  { field_name: 'skip_allowed', display_name: '是否可跳过', field_type: 'switch', required: false,
    options_json: [], sort_order: 5, note: null },
  { field_name: 'close_delay', display_name: '关闭按钮延迟（秒）', field_type: 'input', required: false,
    options_json: [], sort_order: 6, note: '0=立即可关' },
];

// API 接入方式的额外字段（API 多了 server_callback_url / request_param 等）
const API_EXTRA: Array<Omit<FieldRow, 'format' | 'access_type'>> = [
  { field_name: 'api_endpoint', display_name: '服务端接口地址', field_type: 'input', required: true,
    options_json: [], sort_order: 90, note: 'API 接入必填' },
  { field_name: 'api_method', display_name: '请求方法', field_type: 'radio', required: true,
    options_json: [{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }], sort_order: 91, note: null },
  { field_name: 'api_auth_header', display_name: '鉴权 Header', field_type: 'input', required: false,
    options_json: [], sort_order: 92, note: '如 "Authorization: Bearer xxx"' },
  { field_name: 'api_callback_url', display_name: '曝光/点击回调', field_type: 'input', required: false,
    options_json: [], sort_order: 93, note: null },
];

const FORMAT_MAP: Record<number, Array<Omit<FieldRow, 'format' | 'access_type'>>> = {
  1: BANNER,
  2: INTERSTITIAL,
  3: SPLASH,
  4: NATIVE,
  5: REWARDED,
};

function buildRows(): FieldRow[] {
  const rows: FieldRow[] = [];
  for (const [formatStr, baseFields] of Object.entries(FORMAT_MAP)) {
    const format = Number(formatStr);
    // SDK 接入
    for (const f of baseFields) {
      rows.push({ ...f, format, access_type: 1 });
    }
    // API 接入：基础字段 + API 扩展字段
    for (const f of baseFields) {
      rows.push({ ...f, format, access_type: 2 });
    }
    for (const f of API_EXTRA) {
      rows.push({ ...f, format, access_type: 2 });
    }
  }
  return rows;
}

async function main() {
  const rows = buildRows();
  console.log(`[seed-pfd] building ${rows.length} rows...`);
  // 1) 清空
  const { error: delErr } = await supabase.from('placement_field_def').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) { console.error('[seed-pfd] delete failed:', delErr); process.exit(1); }
  // 2) 插入
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('placement_field_def').insert(batch);
    if (error) { console.error(`[seed-pfd] batch ${i} failed:`, error); process.exit(1); }
    inserted += batch.length;
  }
  console.log(`[seed-pfd] done: ${inserted}/${rows.length} rows`);
  // 3) 校验
  const { count } = await supabase.from('placement_field_def').select('id', { count: 'exact', head: true });
  const { data: byFormat } = await supabase.from('placement_field_def').select('format,access_type');
  const stats: Record<string, number> = {};
  for (const r of byFormat ?? []) {
    const k = `${r.format}:${r.access_type}`;
    stats[k] = (stats[k] ?? 0) + 1;
  }
  console.log('[seed-pfd] breakdown:', stats);
  console.log(`[seed-pfd] table count: ${count}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
