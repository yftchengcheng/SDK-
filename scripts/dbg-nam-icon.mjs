// Diagnose: which network rows are missing iconUrlResolved, and is icon_url present in DB?
const BASE = 'http://localhost:5000';
const reg = await fetch(`${BASE}/api/v1/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'dbg-' + Date.now() + '@x.com', password: 'Test123456',
    company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
  }),
}).then(r => r.json());
const token = reg.data?.token;
const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

// 1. List all networks (preset + custom)
const nets = await fetch(`${BASE}/api/v1/console/network/list`, { headers: H }).then(r => r.json());
console.log('=== /network/list ===');
console.log('total:', nets.data?.list?.length);
for (const n of (nets.data?.list || []).slice(0, 8)) {
  console.log(`  [id=${n.id}] code=${n.network_code} name=${n.network_name} is_preset=${n.is_preset}`);
  console.log(`     icon_url=${JSON.stringify(n.icon_url)} iconUrlResolved=${n.iconUrlResolved ? n.iconUrlResolved.slice(0, 80) + '...' : 'null'}`);
}

// 2. List accounts
const accs = await fetch(`${BASE}/api/v1/console/network/account/list?page=1&pageSize=50`, { headers: H }).then(r => r.json());
console.log('\n=== /account/list ===');
console.log('total:', accs.data?.list?.length);
for (const a of (accs.data?.list || []).slice(0, 8)) {
  console.log(`  [id=${a.id}] account_name=${a.account_name} network_def_id=${a.network_def_id}`);
  console.log(`     network_name=${a.network_name} network_code=${a.network_code}`);
  console.log(`     network_icon_url=${JSON.stringify(a.network_icon_url)}`);
  console.log(`     networkIconResolved=${a.networkIconResolved ? a.networkIconResolved.slice(0, 80) + '...' : 'null'}`);
}
