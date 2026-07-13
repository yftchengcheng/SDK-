// E2E test: 应用绑定自定义广告平台 + 账号 + K-V 参数
const BASE = 'http://localhost:5000';

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const json = await res.json();
  return { status: res.status, json };
}

const stamp = Date.now();
const ts = String(stamp).slice(-9);
const email = `bind_${ts}@t.com`;

console.log('=== 1) Register developer ===');
const reg = await api('/api/v1/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    email, password: 'Test1234', company: 'T', companyShortName: 'T', contactName: 'T', phone: '13800138000',
  }),
});
console.log(JSON.stringify(reg.json));
const TOKEN = reg.json.data.token;

const authHeader = { Authorization: `Bearer ${TOKEN}` };

console.log('\n=== 2) Create app ===');
const app = await api('/api/v1/console/app/create', {
  method: 'POST',
  headers: authHeader,
  body: JSON.stringify({ appName: `bdtest${ts}`, packageName: `com.bd${ts}`, platform: 1 }),
});
console.log(JSON.stringify(app.json));
const APPKEY = app.json.data.app_key;

console.log('\n=== 3) Create custom network ===');
const net = await api('/api/v1/console/network/custom/create', {
  method: 'POST',
  headers: authHeader,
  body: JSON.stringify({ networkName: `BDtest${ts}`, networkCode: `bdtest_${ts}`, adapter_class_init_android: 'com.demo.MyInitAdapter' }),
});
console.log(JSON.stringify(net.json));
const CUSTID = net.json.data.id;

console.log('\n=== 4) Create custom account ===');
const acct = await api('/api/v1/console/network/account/create', {
  method: 'POST',
  headers: authHeader,
  body: JSON.stringify({ account_name: '测试账号', network_def_id: CUSTID, credentials: {} }),
});
console.log(JSON.stringify(acct.json));
const ACCTID = acct.json.data.id;

console.log('\n=== 5) Bind with custom (accountId + appDimParams) ===');
const bind = await api('/api/v1/console/network/app/bind', {
  method: 'POST',
  headers: authHeader,
  body: JSON.stringify({
    appKey: APPKEY,
    networkDefId: CUSTID,
    networkAppId: 'app_demo_001',
    accountId: ACCTID,
    appDimParams: { 'app ID': '123456', channel: 'huawei' },
  }),
});
console.log(JSON.stringify(bind.json, null, 2));
if (bind.json.code !== 0) {
  console.error('❌ Bind failed');
  process.exit(1);
}

console.log('\n=== 6) List bindings for this network ===');
const list = await api(`/api/v1/console/network/app/list?networkDefId=${CUSTID}`, {
  method: 'GET',
  headers: authHeader,
});
console.log(JSON.stringify(list.json, null, 2));

const item = list.json.data?.list?.[0];
if (!item) {
  console.error('❌ No binding returned');
  process.exit(1);
}
if (item.account_id !== ACCTID) {
  console.error(`❌ account_id mismatch: expected ${ACCTID}, got ${item.account_id}`);
  process.exit(1);
}
const appDimParams = item.extra_params?.app_dim_params;
if (!appDimParams || appDimParams['app ID'] !== '123456' || appDimParams.channel !== 'huawei') {
  console.error('❌ app_dim_params not persisted correctly:', JSON.stringify(appDimParams));
  process.exit(1);
}

console.log('\n✅ ALL CHECKS PASSED');
console.log('  - binding.account_id =', item.account_id);
console.log('  - binding.extra_params.app_dim_params =', JSON.stringify(appDimParams));
