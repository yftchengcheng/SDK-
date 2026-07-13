/**
 * E2E 测试：自定义广告平台 Adapter 类名按系统拆分（per-system）
 *
 * 覆盖场景：
 *   1. 仅 Android init → system_type=1
 *   2. 仅 iOS init → system_type=2
 *   3. Android+iOS init → system_type=3
 *   4. 都不填 → 拒绝
 *   5. 格式错误（Android / iOS 各一条）→ 拒绝
 *   6. SDK config 端点：iOS App 不会收到 Android-only 网络
 *   7. SDK config 端点：iOS App 收到 iOS init；Android App 收到 Android init
 *   8. 编辑：从仅 Android 改为 iOS+Android
 *
 * 用法：node scripts/test-per-system-adapter.mjs
 */
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = 'http://localhost:5000';

function genCode(label) {
  // 长度限制 3-32 位
  // CUSTOM_PS_<label>_<rnd> → 14 + label + 1 + 5 = 20+label
  // label 取 4 字符以内
  // 后端会 toUpperCase，所以这里直接生成大写
  const short = label.slice(0, 4).toUpperCase();
  return `CUSTOM_PS_${short}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

let token = '';
let appKey = ''; // iOS app
let appKeyAndroid = ''; // Android app

// ========== Helpers ==========
async function http(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ...json };
}

function ok(label, cond, detail = '') {
  const status = cond ? '✅' : '❌';
  console.log(`${status} ${label}${detail ? ' — ' + detail : ''}`);
  return cond;
}

let passed = 0;
let failed = 0;
function assert(label, cond, detail) {
  if (ok(label, cond, detail)) passed++;
  else failed++;
}

// ========== Setup: 登录 + 创建 iOS / Android App ==========
async function setup() {
  // 注册 + 登录
  const email = `per_sys_${Date.now()}@test.com`;
  const reg = await http('/api/v1/auth/register', {
    method: 'POST',
    body: {
      email, password: 'Test1234!',
      company: 'PS Co', companyShortName: 'PS',
      contactName: 'PS Tester', phone: '13800138000',
    },
  });
  if (reg.code !== 0) throw new Error('注册失败：' + JSON.stringify(reg));
  token = reg.data.token;

  // 创建 iOS app
  const iosApp = await http('/api/v1/console/app/create', {
    method: 'POST',
    body: { appName: 'PS iOS App', platform: 2, packageName: `com.ps.ios.${Date.now()}` },
  });
  if (iosApp.code !== 0) throw new Error('iOS app create failed');
  appKey = iosApp.data.app_key;

  // 创建 Android app
  const andApp = await http('/api/v1/console/app/create', {
    method: 'POST',
    body: { appName: 'PS Android App', platform: 1, packageName: `com.ps.and.${Date.now()}` },
  });
  if (andApp.code !== 0) throw new Error('Android app create failed');
  appKeyAndroid = andApp.data.app_key;
}

// ========== 主测试 ==========
async function run() {
  await setup();

  // ---- Test 1: 仅 Android init → system_type=1 ----
  const code1 = genCode('AND');
  const t1 = await http('/api/v1/console/network/custom/create', {
    method: 'POST',
    body: {
      network_name: 'PS Android Only',
      network_code: code1,
      adapter_class_init_android: 'com.test.AndInit',
      adapter_class_banner_android: 'com.test.AndBanner',
    },
  });
  assert('T1 仅 Android init → 创建成功', t1.code === 0, `code=${t1.code} msg=${t1.message}`);
  assert('T1 派生 system_type=1', t1.data?.system_type === 1, `got=${t1.data?.system_type}`);
  assert('T1 android init 字段入库', t1.data?.adapter_class_init_android === 'com.test.AndInit');
  assert('T1 ios init 字段为 null', t1.data?.adapter_class_init_ios === null);

  // ---- Test 2: 仅 iOS init → system_type=2 ----
  const code2 = genCode('IOS');
  const t2 = await http('/api/v1/console/network/custom/create', {
    method: 'POST',
    body: {
      network_name: 'PS iOS Only',
      network_code: code2,
      adapter_class_init_ios: 'com.test.IosInit',
      adapter_class_banner_ios: 'com.test.IosBanner',
    },
  });
  assert('T2 仅 iOS init → 创建成功', t2.code === 0, `code=${t2.code} msg=${t2.message}`);
  assert('T2 派生 system_type=2', t2.data?.system_type === 2, `got=${t2.data?.system_type}`);
  assert('T2 ios init 字段入库', t2.data?.adapter_class_init_ios === 'com.test.IosInit');
  assert('T2 android init 字段为 null', t2.data?.adapter_class_init_android === null);

  // ---- Test 3: Android+iOS init → system_type=3 ----
  const code3 = genCode('BOTH');
  const t3 = await http('/api/v1/console/network/custom/create', {
    method: 'POST',
    body: {
      network_name: 'PS Both',
      network_code: code3,
      adapter_class_init_android: 'com.test.BothInitA',
      adapter_class_init_ios: 'com.test.BothInitI',
      adapter_class_banner_android: 'com.test.BothBannerA',
    },
  });
  assert('T3 双系统 init → 创建成功', t3.code === 0, `code=${t3.code} msg=${t3.message}`);
  assert('T3 派生 system_type=3', t3.data?.system_type === 3, `got=${t3.data?.system_type}`);
  assert('T3 android init 入库', t3.data?.adapter_class_init_android === 'com.test.BothInitA');
  assert('T3 ios init 入库', t3.data?.adapter_class_init_ios === 'com.test.BothInitI');

  // ---- Test 4: 都不填 → 拒绝 ----
  const code4 = genCode('NONE');
  const t4 = await http('/api/v1/console/network/custom/create', {
    method: 'POST',
    body: {
      network_name: 'PS None',
      network_code: code4,
      // 故意不传任何 init 字段
      adapter_class_banner_android: 'com.test.BannerA',
    },
  });
  assert('T4 init 都不填 → 拒绝', t4.code === 400 && /初始化 Adapter/.test(t4.message || ''), `code=${t4.code} msg=${t4.message}`);

  // ---- Test 5a: Android 字段格式错误 ----
  const code5a = genCode('BAD_AND');
  const t5a = await http('/api/v1/console/network/custom/create', {
    method: 'POST',
    body: {
      network_name: 'PS Bad Android',
      network_code: code5a,
      adapter_class_init_android: 'BadFormat-NoClass',
    },
  });
  assert('T5a Android 格式错误 → 拒绝', t5a.code === 400 && /Android/.test(t5a.message || ''), `code=${t5a.code} msg=${t5a.message}`);

  // ---- Test 5b: iOS 字段格式错误 ----
  const code5b = genCode('BAD_IOS');
  const t5b = await http('/api/v1/console/network/custom/create', {
    method: 'POST',
    body: {
      network_name: 'PS Bad iOS',
      network_code: code5b,
      adapter_class_init_ios: '123bad-starting-with-digit',
    },
  });
  assert('T5b iOS 格式错误 → 拒绝', t5b.code === 400 && /iOS/.test(t5b.message || ''), `code=${t5b.code} msg=${t5b.message}`);

  // ---- Test 6: SDK config 端点 iOS App 不应收到 Android-only 网络 ----
  //   但要先在 bindings 里把 Android-only 网络绑到 iOS app 上（业务上会绑，所以会下发，
  //   但 SDK config 端点的 system_type 过滤会让 iOS app 跳过 Android-only 网络）
  await http('/api/v1/console/network/app/bind', {
    method: 'POST',
    body: { appKey, networkDefId: t1.data.id },
  });
  // iOS app 拉 SDK config
  const iosSdk = await http(`/api/v1/sdk/config?app_key=${appKey}`);
  const iosHasAndroidOnly = (iosSdk.data?.customAdapters || []).some(a => a.networkCode === code1);
  assert('T6 iOS App 拉 SDK config 不含 Android-only 网络', !iosHasAndroidOnly,
    `codes=${(iosSdk.data?.customAdapters || []).map(a => a.networkCode).join(',')}`);

  // ---- Test 7a: iOS app 拉 SDK config（含 Both 网络）→ 应收到 iOS 字段 ----
  const bindT3Ios = await http('/api/v1/console/network/app/bind', {
    method: 'POST',
    body: { appKey, networkDefId: t3.data.id },
  });
  if (bindT3Ios.code !== 0) console.log('  [debug] bind T3→iOS failed:', JSON.stringify(bindT3Ios));
  const iosSdkBoth = await http(`/api/v1/sdk/config?app_key=${appKey}`);
  if (!iosSdkBoth.data?.customAdapters || iosSdkBoth.data.customAdapters.length === 0) {
    console.log('  [debug] iosSdkBoth empty/full:', JSON.stringify(iosSdkBoth));
  } else {
    const codes = iosSdkBoth.data.customAdapters.map(a => a.networkCode);
    console.log(`  [debug] iosSdkBoth codes=[${codes.join(',')}] expected=${code3}`);
  }
  const bothForIos = (iosSdkBoth.data?.customAdapters || []).find(a => a.networkCode === code3);
  assert('T7a iOS app 收到 Both 网络的 iOS init', bothForIos?.adapterClasses?.init === 'com.test.BothInitI',
    `got=${bothForIos?.adapterClasses?.init}`);
  assert('T7a iOS app 收到的网络标记 currentSystem=ios', bothForIos?.currentSystem === 'ios');

  // ---- Test 7b: Android app 拉 SDK config（含 Both 网络）→ 应收到 Android 字段 ----
  const bindT3And = await http('/api/v1/console/network/app/bind', {
    method: 'POST',
    body: { appKey: appKeyAndroid, networkDefId: t3.data.id },
  });
  if (bindT3And.code !== 0) console.log('  [debug] bind T3→Android failed:', JSON.stringify(bindT3And));
  const andSdkBoth = await http(`/api/v1/sdk/config?app_key=${appKeyAndroid}`);
  const bothForAnd = (andSdkBoth.data?.customAdapters || []).find(a => a.networkCode === code3);
  assert('T7b Android app 收到 Both 网络的 android init', bothForAnd?.adapterClasses?.init === 'com.test.BothInitA',
    `got=${bothForAnd?.adapterClasses?.init}`);
  assert('T7b Android app 收到的网络标记 currentSystem=android', bothForAnd?.currentSystem === 'android');

  // ---- Test 8: 编辑：从仅 Android 改为 iOS+Android ----
  const code8 = genCode('EDIT');
  const t8create = await http('/api/v1/console/network/custom/create', {
    method: 'POST',
    body: {
      network_name: 'PS Edit Test',
      network_code: code8,
      adapter_class_init_android: 'com.test.EditInitA',
    },
  });
  assert('T8 setup → 创建仅 Android 网络', t8create.code === 0);
  // 编辑：添加 iOS init
  const t8update = await http('/api/v1/console/network/custom/update', {
    method: 'POST',
    body: {
      id: t8create.data.id,
      adapter_class_init_ios: 'com.test.EditInitI',
    },
  });
  assert('T8 update → 成功', t8update.code === 0, `code=${t8update.code} msg=${t8update.message}`);
  // 读取列表确认 system_type 变 3
  await sleep(100);
  const listRes = await http('/api/v1/console/network/list?page=1&pageSize=100');
  const updatedRow = (listRes.data?.list || []).find(r => r.id === t8create.data.id);
  assert('T8 重新读取 system_type=3', updatedRow?.system_type === 3, `got=${updatedRow?.system_type}`);
  assert('T8 ios init 已写入', updatedRow?.adapter_class_init_ios === 'com.test.EditInitI');
  assert('T8 android init 保留', updatedRow?.adapter_class_init_android === 'com.test.EditInitA');

  // ---- 清理：删除测试网络 ----
  for (const id of [t1.data.id, t2.data.id, t3.data.id, t8create.data.id]) {
    await http(`/api/v1/console/network/custom/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  console.log(`\n========== per-system 适配器测试结果 ==========`);
  console.log(`通过: ${passed} / 失败: ${failed} / 总数: ${passed + failed}`);
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
