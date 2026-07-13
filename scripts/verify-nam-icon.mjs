// Lightweight smoke for /account/list networkIconResolved
const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'nam-icon-' + Date.now() + '@x.com',
    password: 'Test123456',
    company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
  }),
}).then(r => r.json());

const token = reg.data?.token;
if (!token) { console.error('register failed', reg); process.exit(1); }

// Create a custom network with an icon_url
const createNet = await fetch('http://localhost:5000/api/v1/console/network/custom/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
  body: JSON.stringify({
    network_code: 'NAM_ICON_TEST_' + Date.now(),
    network_name: '图标测试平台',
    adapter_class_init_android: 'com.test.NamIconInit',
    icon_url: 'https://placehold.co/64x64/png',
  }),
}).then(r => r.json());
console.log('createNet:', JSON.stringify(createNet));
const networkId = createNet.data?.id;

// Create an account under that network
const createAcc = await fetch('http://localhost:5000/api/v1/console/network/account/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
  body: JSON.stringify({
    network_def_id: networkId,
    account_name: '图标测试账号',
    account_id: 'acc-001',
    credentials: { api_key: 'fake_key_for_test' },
  }),
}).then(r => r.json());
console.log('account created id=', createAcc.data?.id);

// List accounts — must include networkIconResolved
const list = await fetch('http://localhost:5000/api/v1/console/network/account/list?page=1&pageSize=20', {
  headers: { Authorization: 'Bearer ' + token },
}).then(r => r.json());
const row = list.data?.list?.[0];
console.log('first row keys:', Object.keys(row || {}).join(','));
console.log('  networkIconResolved:', row?.networkIconResolved);
console.log('  network_icon_url:', row?.network_icon_url);
console.log('  network_name:', row?.network_name);

const ok = row?.networkIconResolved && row?.network_icon_url && row?.network_name;
console.log(ok ? '✅ PASS' : '❌ FAIL');
process.exit(ok ? 0 : 1);
