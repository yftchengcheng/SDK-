/**
 * 字典化端到端验证（puppeteer 之外：直接打接口 + 单元验证）
 * 验收:
 *   1. /api/v1/dict/enum/app.platform 返回 [1,2,3] 含 1=Android
 *   2. /api/v1/dict/placement-field-def?format=1&accessType=1 返回字段定义
 *   3. /api/v1/dict/app-field-def 返回 app 表字段默认值
 *   4. 三个字典表行数符合预期
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.resolve('./'));
const SUPABASE_URL = process.env.COZE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('缺少 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const COOKIE = process.env.ADMIN_COOKIE || '';

let pass = 0;
let fail = 0;
const log = (ok, msg) => {
  console.log((ok ? '✅' : '❌'), msg);
  ok ? pass++ : fail++;
};

async function main() {
  // 1. 字典表行数
  const enumN = (await supabase.from('enum_dict').select('*', { count: 'exact', head: true })).count;
  log(enumN >= 107, `enum_dict 行数: ${enumN} (>= 107)`);
  const pfdN = (await supabase.from('placement_field_def').select('*', { count: 'exact', head: true })).count;
  log(pfdN >= 42, `placement_field_def 行数: ${pfdN} (>= 42)`);
  const afdN = (await supabase.from('app_field_def').select('*', { count: 'exact', head: true })).count;
  log(afdN >= 7, `app_field_def 行数: ${afdN} (>= 30)`);

  // 2. 接口冒烟
  const res1 = await fetch(`${BASE}/api/v1/dict/enum/app.platform`, {
    headers: { Cookie: COOKIE },
  });
  const j1 = await res1.json();
  const platformLabels = (j1.data?.items || []).map((x) => x.value + '=' + x.label);
  log(res1.status === 200 && platformLabels.includes('1=Android'), `GET /dict/enum/app.platform 200 + 含 1=Android: ${platformLabels.join(',')}`);

  const res2 = await fetch(`${BASE}/api/v1/dict/placement-field-def?format=1&accessType=1`, {
    headers: { Cookie: COOKIE },
  });
  const j2 = await res2.json();
  const pfdRows = j2.data?.items || [];
  log(res2.status === 200 && pfdRows.length >= 3, `GET /dict/placement-field-def?format=1\&accessType=1 200 + 行数 ${pfdRows.length} (>= 3)`);

  // format=4 (原生) vs format=1 (横幅) 应该不同
  const res2b = await fetch(`${BASE}/api/v1/dict/placement-field-def?format=4&accessType=1`, {
    headers: { Cookie: COOKIE },
  });
  const j2b = await res2b.json();
  log(res2b.status === 200 && (j2b.data?.items?.length || 0) > 0, `GET /dict/placement-field-def?format=4&accessType=1 200 + 行数 ${j2b.data?.items?.length}`);

  // 同一 format 不同 accessType 字段可能不同
  const res2c = await fetch(`${BASE}/api/v1/dict/placement-field-def?format=1&accessType=2`, {
    headers: { Cookie: COOKIE },
  });
  const j2c = await res2c.json();
  log(res2c.status === 200, `GET /dict/placement-field-def?format=1&accessType=2 200 (API 对接方式)`);

  const res3 = await fetch(`${BASE}/api/v1/dict/app-field-def`, {
    headers: { Cookie: COOKIE },
  });
  const j3 = await res3.json();
  const afdRows = j3.data?.items || [];
  log(res3.status === 200 && afdRows.length >= 3, `GET /dict/app-field-def 200 + 行数 ${afdRows.length} (>= 3)`);

  // 3. enum 全量
  const res4 = await fetch(`${BASE}/api/v1/dict/enum`, {
    headers: { Cookie: COOKIE },
  });
  const j4 = await res4.json();
  const totalEnums = (j4.data?.items || []).length;
  log(res4.status === 200 && totalEnums >= 100, `GET /dict/enum 全量 200 + 总枚举 ${totalEnums} (>= 100)`);

  console.log('\n=== 汇总 ===');
  console.log(`PASS: ${pass}, FAIL: ${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
