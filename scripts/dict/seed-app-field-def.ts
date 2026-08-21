/**
 * 阶段 1.4: app_field_def seed
 * App 表字段默认值 + 必填规则（来源：AppDrawer.vue form 初始化 + 后端 INSERT）
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

type AppFieldRow = {
  field_name: string;
  display_name: string;
  default_value: unknown;
  required: boolean;
  note: string | null;
  sort_order: number;
};

const DATA: AppFieldRow[] = [
  { field_name: 'app_key', display_name: 'AppKey', default_value: null, required: true, note: '系统生成，全局唯一', sort_order: 1 },
  { field_name: 'app_name', display_name: '应用名称', default_value: null, required: true, note: null, sort_order: 2 },
  { field_name: 'package_name', display_name: '包名/Bundle ID', default_value: null, required: true, note: 'Android: package / iOS: bundle id', sort_order: 3 },
  { field_name: 'platform', display_name: '平台', default_value: 1, required: true, note: '1=Android / 2=iOS / 3=双端', sort_order: 4 },
  { field_name: 'access_type', display_name: '接入方式', default_value: 1, required: true, note: '1=自有 / 2=联运 / 3=合作（继承自 developer）', sort_order: 5 },
  { field_name: 'status', display_name: '状态', default_value: 1, required: true, note: '1=启用 / 2=停用', sort_order: 6 },
  { field_name: 'description', display_name: '备注', default_value: '', required: false, note: null, sort_order: 7 },
];

async function main() {
  console.log(`[seed-afd] inserting ${DATA.length} rows...`);
  const { error: delErr } = await supabase.from('app_field_def').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) { console.error('[seed-afd] delete failed:', delErr); process.exit(1); }
  const { error } = await supabase.from('app_field_def').insert(DATA);
  if (error) { console.error('[seed-afd] insert failed:', error); process.exit(1); }
  const { count } = await supabase.from('app_field_def').select('id', { count: 'exact', head: true });
  console.log(`[seed-afd] done: ${count} rows`);
}

main().catch((e) => { console.error(e); process.exit(1); });
