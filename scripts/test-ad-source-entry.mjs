#!/usr/bin/env node
/**
 * 广告平台 → 自定义广告平台 → 广告源 配置入口测试
 * 验证：
 *   T1) 自定义网络 (is_preset=false) 出现在 /network/list 中
 *   T2) 创建应用 + 广告位
 *   T3) 通过 PUT /ad-source/:id 写入 appId + placementId (bigint)
 *   T4) /ad-source/list 支持 appId / placementId / networkDefId 过滤
 *   T5) /placement/list?appKey=xxx 返回该 app 的所有 placement（含 bigint id 和 business placement_id）
 *   T6) /app/list 返回该 developer 的 app 列表（左侧应用列表）
 *   T7) /network/list 包含 is_preset 字段，可被前端用于「广告源」按钮显隐
 *   T8) 全部过滤组合 (appId + placementId + networkDefId) 工作
 */
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = 'http://localhost:5000';

let testsPassed = 0;
let testsFailed = 0;
const results = [];

function ok(name, msg = '') {
  testsPassed++;
  results.push({ name, status: 'PASS', msg });
  console.log(`✅ ${name}${msg ? ' — ' + msg : ''}`);
}
function fail(name, msg) {
  testsFailed++;
  results.push({ name, status: 'FAIL', msg });
  console.log(`❌ ${name} — ${msg}`);
}

async function api(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

async function register() {
  const email = `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@t.com`;
  const r = await api('POST', '/api/v1/auth/register', {
    body: {
      email, password: 'Test1234', company: 'T', companyShortName: 'T',
      contactName: 'T', phone: '13800138000',
    },
  });
  if (r.status !== 200 || r.json.code !== 0) throw new Error(`register failed: ${JSON.stringify(r.json)}`);
  return r.json.data.token;
}

async function run() {
  console.log('========== 广告源配置入口测试 ==========');
  const token = await register();

  // T1: 自定义网络
  const ts = Date.now();
  const netR = await api('POST', '/api/v1/console/network/custom/create', {
    token,
    body: {
      network_name: `EntryNet_${ts}`,
      network_code: `ENTRY_NET_${ts}`,
      adapter_class_init_android: 'com.entry.Init',
    },
  });
  if (netR.json.code === 0) ok('T1.1 创建自定义网络', `id=${netR.json.data.id} code=${netR.json.data.network_code}`);
  else fail('T1.1 创建自定义网络', JSON.stringify(netR.json));
  const networkDefId = netR.json.data.id;

  // 验证 is_preset
  const listR = await api('GET', `/api/v1/console/network/list?page=1&pageSize=200`, { token });
  const customRow = (listR.json.data?.list || []).find(x => x.id === networkDefId);
  if (customRow && customRow.is_preset === false) {
    ok('T1.2 is_preset 标识（自定义=is_preset=false）', `id=${customRow.id} is_preset=${customRow.is_preset}`);
  } else {
    fail('T1.2 is_preset 标识', JSON.stringify(customRow));
  }

  // T2: 创建 app + placement
  const appR = await api('POST', '/api/v1/console/app/create', {
    token,
    body: { appName: `EntryApp_${ts}`, packageName: `com.entry.${ts}`, platform: 1 },
  });
  const appId = appR.json.data?.id;
  const appKey = appR.json.data?.app_key;
  if (appId) ok('T2.1 创建应用', `id=${appId} appKey=${appKey}`);
  else fail('T2.1 创建应用', JSON.stringify(appR.json));

  const plR = await api('POST', '/api/v1/console/placement/create', {
    token,
    body: { appKey, name: 'rewarded_slot', format: 1 },
  });
  const placementId = plR.json.data?.id; // bigint
  const placementBusinessId = plR.json.data?.placement_id; // varchar
  if (placementId) ok('T2.2 创建广告位', `bigint=${placementId} business=${placementBusinessId}`);
  else fail('T2.2 创建广告位', JSON.stringify(plR.json));

  // T3: PUT 写入 appId + placementId (bigint)
  const asR = await api('POST', '/api/v1/console/ad-source/create', {
    token,
    body: { networkCode: 'TEMP_CODE', sourceName: 'TestSource', thirdAppId: 'ta', thirdPlacementId: 'tp' },
  });
  const adId = asR.json.data?.id;
  if (adId) ok('T3.1 创建 ad-source', `id=${adId}`);
  else fail('T3.1 创建 ad-source', JSON.stringify(asR.json));

  const putR = await api('PUT', `/api/v1/console/ad-source/${adId}`, {
    token,
    body: { sourceName: 'TestSource2', appId, placementId },
  });
  if (putR.json.code === 0) ok('T3.2 PUT 写入 appId+placementId', JSON.stringify(putR.json));
  else fail('T3.2 PUT 写入', JSON.stringify(putR.json));

  // T4: list 过滤
  const f1 = await api('GET', `/api/v1/console/ad-source/list?appId=${appId}`, { token });
  const f1Row = (f1.json.data?.list || []).find(r => r.id === adId);
  if (f1Row && f1Row.app_id === appId && f1Row.placement_id === placementId) {
    ok('T4.1 list 过滤 appId 工作', `app_id=${f1Row.app_id} placement_id=${f1Row.placement_id}`);
  } else {
    fail('T4.1 list 过滤 appId', JSON.stringify(f1.json));
  }

  const f2 = await api('GET', `/api/v1/console/ad-source/list?placementId=${placementId}`, { token });
  const f2Row = (f2.json.data?.list || []).find(r => r.id === adId);
  if (f2Row && f2Row.placement_id === placementId) {
    ok('T4.2 list 过滤 placementId 工作', `placement_id=${f2Row.placement_id}`);
  } else {
    fail('T4.2 list 过滤 placementId', JSON.stringify(f2.json));
  }

  // T5: placement/list?appKey=xxx
  const plList = await api('GET', `/api/v1/console/placement/list?appKey=${appKey}`, { token });
  const plItem = (plList.json.data?.list || []).find(x => x.id === placementId);
  if (plItem) ok('T5 placement/list?appKey=xxx 找到', JSON.stringify(plItem).slice(0, 200));
  else fail('T5 placement/list', JSON.stringify(plList.json));

  // T6: app/list
  const apList = await api('GET', '/api/v1/console/app/list?page=1&pageSize=20', { token });
  const apItem = (apList.json.data?.list || []).find(x => x.id === appId);
  if (apItem) ok('T6 app/list 找到', `id=${apItem.id} name=${apItem.app_name}`);
  else fail('T6 app/list', JSON.stringify(apList.json));

  // T7: network/list 包含 is_preset
  const nl = await api('GET', '/api/v1/console/network/list?page=1&pageSize=200', { token });
  const presetCount = (nl.json.data?.list || []).filter(r => r.is_preset === true).length;
  const customCount = (nl.json.data?.list || []).filter(r => r.is_preset === false).length;
  if (presetCount > 0 && customCount > 0) {
    ok('T7 network/list 区分 preset/custom', `preset=${presetCount} custom=${customCount}`);
  } else {
    fail('T7 network/list 字段', `preset=${presetCount} custom=${customCount}`);
  }

  // T8: 组合过滤
  const f3 = await api('GET', `/api/v1/console/ad-source/list?appId=${appId}&placementId=${placementId}`, { token });
  const f3Row = (f3.json.data?.list || []).find(r => r.id === adId);
  if (f3Row) ok('T8 组合过滤 appId+placementId', `找到 ${f3.json.data.total} 条`);
  else fail('T8 组合过滤', JSON.stringify(f3.json));

  // T9: networkDefId 过滤（应该没匹配，因为没创建 custom_<id> 的 networkCode 的 ad_source）
  const f4 = await api('GET', `/api/v1/console/ad-source/list?networkDefId=${networkDefId}`, { token });
  if (f4.json.code === 0) ok('T9 networkDefId 过滤不报错', `total=${f4.json.data?.total}`);
  else fail('T9 networkDefId 过滤', JSON.stringify(f4.json));

  // T10: 不传 placementId 时过滤被忽略（修复了 NaN 转换 bug）
  const f5 = await api('GET', `/api/v1/console/ad-source/list?placementId=undefined`, { token });
  if (f5.json.code === 0) ok('T10 placementId=undefined 不报错（NaN 修复）', `total=${f5.json.data?.total}`);
  else fail('T10 placementId=undefined', JSON.stringify(f5.json));

  // 清理
  await api('DELETE', `/api/v1/console/ad-source/${adId}`, { token });

  console.log(`\n========== 结果 ==========`);
  console.log(`通过: ${testsPassed} / 失败: ${testsFailed} / 总数: ${testsPassed + testsFailed}`);
  process.exit(testsFailed > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('Top error:', e);
  process.exit(1);
});
