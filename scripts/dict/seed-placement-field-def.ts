// scripts/dict/seed-placement-field-def.ts
// 重建 placement_field_def 字段规则
// 二维矩阵：format × access_type（1=SDK / 2=API）
// 来源：用户描述"广告位管理-创建广告位：SDK对接" + 真实前端字段
// 删除了之前错误的 4 个 api_* 字段（属于 ad_network 不属于 placement）

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });
const supabaseClient = createClient(
  process.env.COZE_SUPABASE_URL!,
  process.env.COZE_SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface FieldRow {
  field_name: string;
  display_name: string;
  field_type: 'select' | 'radio' | 'input' | 'switch';
  required: boolean;
  options_json: { value: number | string; label: string }[];
  sort_order: number;
  note?: string;
}

// 工具：拼 radio/select options
const opts = (rows: [number | string, string][]) =>
  rows.map(([value, label]) => ({ value, label }));

// === 各 format 字段集（SDK + API） ===
// 字段只与 format 有关；access_type 决定该字段是否出现

// format=1 横幅
const F1_SDK: FieldRow[] = [
  { field_name: 'ad_size', display_name: '广告展示大小', field_type: 'radio', required: true, options_json: opts([[1, '横幅 640x100'], [2, '中幅 300x250'], [3, '中幅 728x90']]), sort_order: 1 },
  { field_name: 'refresh_interval', display_name: '刷新间隔（秒）', field_type: 'input', required: false, options_json: [], sort_order: 2, note: '0=不刷新' },
  { field_name: 'show_close', display_name: '是否显示关闭按钮', field_type: 'switch', required: false, options_json: [], sort_order: 3 },
];
const F1_API: FieldRow[] = F1_SDK; // API 接入字段集相同

// format=2 插屏
const F2_SDK: FieldRow[] = [
  { field_name: 'ad_size', display_name: '广告展示大小', field_type: 'radio', required: true, options_json: opts([[1, '半屏'], [2, '全屏'], [3, '优选']]), sort_order: 1 },
  { field_name: 'material_type', display_name: '素材形式', field_type: 'radio', required: true, options_json: opts([[1, '图片'], [2, '视频'], [3, '视频+图片']]), sort_order: 2 },
  { field_name: 'show_close', display_name: '是否显示关闭按钮', field_type: 'switch', required: false, options_json: [], sort_order: 3 },
  { field_name: 'close_delay', display_name: '关闭按钮延迟（秒）', field_type: 'input', required: false, options_json: [], sort_order: 4, note: '0=立即可关' },
  { field_name: 'screen_orientation', display_name: '屏幕方向', field_type: 'radio', required: true, options_json: opts([[0, '竖屏'], [1, '横屏'], [2, '横竖兼容']]), sort_order: 5, note: '仅 SDK 接入' },
];
const F2_API: FieldRow[] = F2_SDK.filter(f => f.field_name !== 'screen_orientation');

// format=3 开屏
const F3_SDK: FieldRow[] = [
  { field_name: 'skip_time', display_name: '跳过倒计时（秒）', field_type: 'input', required: true, options_json: [], sort_order: 1 },
  { field_name: 'show_skip', display_name: '是否显示跳过', field_type: 'switch', required: false, options_json: [], sort_order: 2 },
  { field_name: 'material_type', display_name: '素材形式', field_type: 'radio', required: true, options_json: opts([[1, '图片'], [2, '视频']]), sort_order: 3 },
  { field_name: 'screen_orientation', display_name: '屏幕方向', field_type: 'radio', required: true, options_json: opts([[0, '竖屏'], [1, '横屏'], [2, '横竖兼容']]), sort_order: 4, note: '仅 SDK 接入' },
];
const F3_API: FieldRow[] = F3_SDK.filter(f => f.field_name !== 'screen_orientation');

// format=4 原生
const F4_SDK: FieldRow[] = [
  { field_name: 'template_style', display_name: '模版样式', field_type: 'radio', required: true, options_json: opts([
    [1, '1图1文'], [2, '1图2文'], [3, '1图3文'], [4, '1图1图标1文'], [5, '1图1图标2文'],
    [6, '3图1文'], [7, '1图标2文'], [8, '3图1图标2文'], [9, '1图1图标2文1按钮'],
    [10, '图片'], [11, '1视频1封面1文'], [12, '1视频1封面1图标2文'], [13, '1视频1封面'],
  ]), sort_order: 1 },
  { field_name: 'material_type', display_name: '素材形式', field_type: 'radio', required: true, options_json: opts([[1, '图片'], [2, '视频'], [3, '视频+图片']]), sort_order: 2 },
  { field_name: 'video_mute', display_name: '视频静音', field_type: 'radio', required: false, options_json: opts([[0, '否'], [1, '是']]), sort_order: 3, note: '仅 SDK 接入' },
  { field_name: 'auto_play', display_name: '自动播放', field_type: 'radio', required: false, options_json: opts([[1, '总是'], [2, '仅WIFI'], [3, '点击播放']]), sort_order: 4, note: '仅 SDK 接入' },
  { field_name: 'screen_orientation', display_name: '屏幕方向', field_type: 'radio', required: true, options_json: opts([[0, '竖屏'], [1, '横屏'], [2, '横竖兼容']]), sort_order: 5, note: '仅 SDK 接入' },
];
const F4_API: FieldRow[] = F4_SDK.filter(f => !['video_mute', 'auto_play', 'screen_orientation'].includes(f.field_name));

// format=5 激励视频
const F5_SDK: FieldRow[] = [
  { field_name: 'ad_size', display_name: '广告展示大小', field_type: 'radio', required: true, options_json: opts([[1, '竖版'], [2, '横版']]), sort_order: 1 },
  { field_name: 'material_type', display_name: '素材形式', field_type: 'radio', required: true, options_json: opts([[1, '图片'], [2, '视频'], [3, '视频+图片']]), sort_order: 2 },
  { field_name: 'reward_amount', display_name: '激励数量', field_type: 'input', required: true, options_json: [], sort_order: 3 },
  { field_name: 'reward_unit', display_name: '激励单位', field_type: 'input', required: true, options_json: [], sort_order: 4, note: '如"金币"或"积分"' },
  { field_name: 'skip_allowed', display_name: '是否可跳过', field_type: 'switch', required: false, options_json: [], sort_order: 5 },
  { field_name: 'close_delay', display_name: '关闭按钮延迟（秒）', field_type: 'input', required: false, options_json: [], sort_order: 6, note: '0=立即可关' },
  { field_name: 'screen_orientation', display_name: '屏幕方向', field_type: 'radio', required: true, options_json: opts([[0, '竖屏'], [1, '横屏'], [2, '横竖兼容']]), sort_order: 7, note: '仅 SDK 接入' },
];
const F5_API: FieldRow[] = F5_SDK.filter(f => f.field_name !== 'screen_orientation');

const MATRIX: { format: number; access_type: number; rows: FieldRow[] }[] = [
  { format: 1, access_type: 1, rows: F1_SDK },
  { format: 1, access_type: 2, rows: F1_API },
  { format: 2, access_type: 1, rows: F2_SDK },
  { format: 2, access_type: 2, rows: F2_API },
  { format: 3, access_type: 1, rows: F3_SDK },
  { format: 3, access_type: 2, rows: F3_API },
  { format: 4, access_type: 1, rows: F4_SDK },
  { format: 4, access_type: 2, rows: F4_API },
  { format: 5, access_type: 1, rows: F5_SDK },
  { format: 5, access_type: 2, rows: F5_API },
];

async function seed() {
  const inserts: any[] = [];
  for (const m of MATRIX) {
    for (const r of m.rows) {
      inserts.push({
        id: uuidv4(),
        format: m.format,
        access_type: m.access_type,
        field_name: r.field_name,
        display_name: r.display_name,
        field_type: r.field_type,
        required: r.required,
        options_json: r.options_json,
        sort_order: r.sort_order,
        note: r.note ?? null,
        is_active: true,
      });
    }
  }
  console.log(`准备插入 ${inserts.length} 行 placement_field_def...`);
  const { data, error } = await supabaseClient
    .from('placement_field_def')
    .insert(inserts)
    .select('id');
  if (error) {
    console.error('❌ 插入失败:', error);
    process.exit(1);
  }
  console.log(`✅ 成功插入 ${data.length} 行`);
  const { count } = await supabaseClient.from('placement_field_def').select('*', { count: 'exact', head: true });
  console.log(`📊 placement_field_def 总行数: ${count}`);
}

seed().catch(err => {
  console.error('❌ seed 失败:', err);
  process.exit(1);
});
