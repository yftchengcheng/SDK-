// E2E: register → create custom network with HTTP icon → create account → list
const BASE = 'http://localhost:5000';
const reg = await fetch(`${BASE}/api/v1/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'e2e2-' + Date.now() + '@x.com', password: 'Test123456',
    company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
  }),
}).then(r => r.json());
const token = reg.data?.token;
const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

// 1) network list (preset + custom)
const nets = await fetch(`${BASE}/api/v1/console/network/list`, { headers: H }).then(r => r.json());
console.log('=== /network/list ===');
for (const n of (nets.data?.list || [])) {
  console.log(`  id=${n.id} code=${n.network_code} iconUrlResolved=${n.iconUrlResolved}`);
}

// 2) Pick CSJ, create account
const csj = (nets.data?.list || []).find(n => n.network_code === 'CSJ');
console.log('CSJ iconUrlResolved:', csj?.iconUrlResolved);

const acc = await fetch(`${BASE}/api/v1/console/network/account/create`, {
  method: 'POST', headers: H,
  body: JSON.stringify({
    network_def_id: csj.id,
    account_name: '穿山甲测试账号',
    account_id: 'csj-test-001',
    credentials: { app_id: 'fake_app_id' },
  }),
}).then(r => r.json());
console.log('=== create account ===', JSON.stringify(acc).slice(0, 200));

// 3) list accounts — check icon fields
const list = await fetch(`${BASE}/api/v1/console/network/account/list?page=1&pageSize=20`, { headers: H }).then(r => r.json());
console.log('=== /account/list ===');
for (const a of (list.data?.list || [])) {
  console.log(`  account=${a.account_name}`);
  console.log(`    network_def_id=${a.network_def_id} network_name=${a.network_name} network_code=${a.network_code}`);
  console.log(`    network_icon_url=${a.network_icon_url}`);
  console.log(`    networkIconResolved=${a.networkIconResolved}`);
  console.log(`    iconUrlResolved=${a.iconUrlResolved} (row's own icon_url, not network's)`);
}
