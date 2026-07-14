// E2E: 验证 ad-source create + list 的 storeDimParams + trafficGroupBindings 往返
const PORT = process.env.DEPLOY_RUN_PORT || 5000;
const BASE = `http://localhost:${PORT}`;
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PW || 'Test123456';
const APP_ID = Number(process.env.APP_ID);
const PL_ID = Number(process.env.PL_ID);
const TG_ID = Number(process.env.TG_ID);
const NET_ID = Number(process.env.NET_ID);

console.log('[chk-bind] env:', { email, APP_ID, PL_ID, TG_ID, NET_ID });

async function main() {
  // 1. login
  const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const login = await loginRes.json();
  if (!login.data?.token) {
    console.log('[chk-bind] ❌ login fail:', login);
    process.exit(1);
  }
  const token = login.data.token;
  const cookie = `auth_token=${token}`;
  console.log('[chk-bind] ✅ login token len:', token.length);

  // 2. create ad-source (custom, 走 create-custom)
  const storeDimParams = [
    { key: 'slot_id', value: '888888' },
    { key: 'ad_unit_id', value: 'a-001' },
  ];
  const trafficGroupBindings = [
    { trafficGroupId: TG_ID, status: 1, price: 12.5, hourLimit: 1000, dayLimit: 5000, intervalSec: 30 },
  ];
  const createRes = await fetch(`${BASE}/api/v1/console/ad-source/create-custom`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({
      appId: APP_ID,
      placementId: PL_ID,
      networkDefId: NET_ID,
      networkCode: `custom_${NET_ID}`,
      networkName: 'E2E-Test-Net',
      thirdAppId: 'e2e_third_app_1',
      thirdPlacementId: 'e2e_third_pl_1',
      sourceName: 'E2E-Src-With-Bindings',
      extra: JSON.stringify({ timeout: 5000 }),
      storeDimParams,
      trafficGroupBindings,
    }),
  });
  const createBody = await createRes.json();
  console.log('[chk-bind] create-custom status:', createRes.status, JSON.stringify(createBody).slice(0, 400));
  if (!createBody.data?.id) { console.log('[chk-bind] ❌ create fail'); process.exit(1); }
  const adSourceId = createBody.data.id;

  // 3. list 查询
  const listRes = await fetch(`${BASE}/api/v1/console/ad-source/list?appId=${APP_ID}&page=1&pageSize=20`, {
    headers: { 'Cookie': cookie },
  });
  const listBody = await listRes.json();
  console.log('[chk-bind] list status:', listRes.status, 'total:', listBody.data?.total);
  const row = (listBody.data?.items || []).find((r) => r.id === adSourceId);
  if (!row) { console.log('[chk-bind] ❌ ad-source not in list'); process.exit(1); }
  console.log('[chk-bind] row.store_dim_params:', JSON.stringify(row.store_dim_params));
  console.log('[chk-bind] row.trafficGroupBindings:', JSON.stringify(row.trafficGroupBindings));

  // 4. DB 验证 (直查)
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.COZE_SUPABASE_URL;
  const key = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
  const supa = createClient(url, key, { auth: { persistSession: false } });
  const { data: adsRow } = await supa.from('ad_source').select('store_dim_params').eq('id', adSourceId).single();
  const { data: bindingRows } = await supa.from('ad_source_traffic_group').select('*').eq('ad_source_id', adSourceId);
  console.log('[chk-bind] db store_dim_params:', JSON.stringify(adsRow?.store_dim_params));
  console.log('[chk-bind] db bindings:', JSON.stringify(bindingRows));

  // 5. 校验
  const passed = JSON.stringify(adsRow?.store_dim_params) === JSON.stringify(storeDimParams)
              && (bindingRows?.length === 1)
              && (bindingRows[0].traffic_group_id === TG_ID)
              && (Number(bindingRows[0].price) === 12.5)
              && (bindingRows[0].hour_limit === 1000);
  if (passed) {
    console.log('[chk-bind] ✅ PASS');
    process.exit(0);
  } else {
    console.log('[chk-bind] ❌ FAIL');
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
