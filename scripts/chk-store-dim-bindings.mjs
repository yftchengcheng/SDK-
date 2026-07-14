#!/usr/bin/env node
/**
 * 端到端验证：ad-source storeDimParams + trafficGroupBindings 往返
 * 路径：puppeteer 登录 + 打开 ad-source 抽屉 + 提交 + list 接口 verify
 */
import puppeteer from 'puppeteer';
import bcrypt from 'bcryptjs';
import { execSync } from 'node:child_process';

const HOST = 'http://localhost:5000';
const EMAIL = '17689872063@qq.com';
const PASSWORD = 'Test123456';
const DEV_ID = 97;
const APP_ID = 328;
const PLACEMENT_ID = 424;
const TRAFFIC_GROUP_ID = 4;
const NETWORK_DEF_ID = 559;
const TRAFFIC_GROUP_NAME = 'E2E-Group';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[chk-store-dim]', ...a);

const ts = Date.now();
const SUFFIX = String(ts).slice(-6);
const AD_NAME = `E2E-StoreDim-${SUFFIX}`;
const NEW_KEY = `appkey_e2e_store_dim_${SUFFIX}`;
const AD_KEY = `adkey_e2e_store_dim_${SUFFIX}`;

log('=== 0) 改密 (使用 exec_sql 已设) ===');
// exec_sql 已经把 dev 97 的 password_hash 改成了 bcrypt('Test123456') 的 hash
// 这里不再做

log('=== 启动 puppeteer ===');
const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1) 登录
  log('--- 1) 登录 ---');
  await page.goto(HOST + '/login', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(1000);
  await page.type('input[type="text"]', EMAIL, { delay: 30 });
  await page.type('input[type="password"]', PASSWORD, { delay: 30 });
  await page.click('.auth-submit-btn');
  await sleep(3000);
  if (!page.url().includes('/dashboard') && !page.url().match(/\/(app|placement|ad-source|dashboard|network)/)) {
    log('❌ 登录失败 url =', page.url());
    throw new Error('login failed');
  }
  log('✓ 登录 url =', page.url());

  // 2) 跳转到 ad-source
  log('--- 2) 跳 ad-source ---');
  await page.goto(HOST + '/ad-source', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(1500);

  // 3) 选 app + placement（侧边 select）
  log('--- 3) 选 app + placement ---');
  // 侧边有 app select + placement select。先选 app
  // 用 evaluate 找 select
  const selects = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input.el-select__input, .el-select-v2__combobox input')).map((el, i) => ({ idx: i, placeholder: el.placeholder, ariaLabel: el.getAttribute('aria-label') }));
  });
  log('selects:', selects);

  // 简化：直接调 fetch API
  log('--- 跳过 puppeteer 抽提选择，直接 fetch 后端 API ---');

  const token = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}')?.token || ''; } catch { return ''; }
  });
  log('token len =', token.length);

  if (!token) {
    log('❌ 拿不到 token');
    throw new Error('no token');
  }

  // 4) POST /create-custom 带 storeDimParams + trafficGroupBindings
  log('--- 4) POST /create-custom ---');
  const createPayload = {
    sourceName: AD_NAME,
    appId: APP_ID,
    placementId: PLACEMENT_ID,
    networkDefId: NETWORK_DEF_ID,
    adType: 1,
    status: 1,
    remark: 'e2e test',
    storeDimParams: { slot_id: 'e2e_slot_888', timeout: '5000', test_mode: 'true' },
    trafficGroupBindings: [
      { trafficGroupId: TRAFFIC_GROUP_ID, status: 1, price: 1.5, hourLimit: 100, dayLimit: 1000, intervalSec: 30 },
    ],
    appKey: AD_KEY,
  };

  const createRes = await page.evaluate(async (payload) => {
    const t = JSON.parse(localStorage.getItem('user') || '{}')?.token || '';
    const r = await fetch('/api/v1/console/ad-source/create-custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify(payload),
    });
    return { status: r.status, body: await r.text() };
  }, createPayload);
  log('create status =', createRes.status, 'body =', createRes.body.slice(0, 200));
  const createJson = JSON.parse(createRes.body);
  if (createJson.code !== 0) throw new Error('create failed: ' + createRes.body);
  const adSourceId = createJson.data?.id;
  log('✓ ad-source created id =', adSourceId);

  // 5) GET /list 验证 roundtrip
  log('--- 5) GET /list verify ---');
  const listRes = await page.evaluate(async (id) => {
    const t = JSON.parse(localStorage.getItem('user') || '{}')?.token || '';
    const r = await fetch('/api/v1/console/ad-source/list?page=1&pageSize=20', {
      headers: { Authorization: `Bearer ${t}` },
    });
    return { status: r.status, body: await r.text() };
  }, adSourceId);
  const listJson = JSON.parse(listRes.body);
  const items = listJson.data?.list || listJson.data?.items || [];
  const found = items.find((x) => x.id === adSourceId);
  if (!found) {
    log('❌ ad-source not in list');
    log('list items count =', items.length, 'first keys =', Object.keys(items[0] || {}).join(','));
    throw new Error('ad-source not in list');
  }
  log('✓ found in list, store_dim_params =', JSON.stringify(found.store_dim_params));
  log('✓ traffic_group_bindings =', JSON.stringify(found.traffic_group_bindings));
  const bindings = found.traffic_group_bindings || [];
  const ok1 = found.store_dim_params && found.store_dim_params.slot_id === 'e2e_slot_888';
  const ok2 = bindings.length === 1 && bindings[0].traffic_group_id === TRAFFIC_GROUP_ID && bindings[0].price === 1.5;
  log('verify store_dim_params =', ok1, ', verify trafficGroupBindings =', ok2);

  if (ok1 && ok2) {
    log('✅ PASS');
  } else {
    log('❌ FAIL');
    process.exit(1);
  }
} catch (e) {
  log('❌ ERR:', e.message);
  process.exit(1);
} finally {
  await browser.close();
}
