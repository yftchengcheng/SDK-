// E2E: 验证添加广告源 drawer 多了「广告平台」字段
// 1) 从「广告源主页（standard）」进入 -> el-select 选 custom 网络
// 2) 从「广告平台 -> 广告源（custom）」进入 -> disabled input 锁定 platform

import puppeteer from 'puppeteer';
import { setTimeout as wait } from 'node:timers/promises';

const PORT = process.env.DEPLOY_RUN_PORT || 5000;
const BASE = `http://localhost:${PORT}`;
const DOMAIN = process.env.COZE_PROJECT_DOMAIN_DEFAULT || '';

const stamp = Date.now();
const email = `chk-adsrc-${stamp}@x.com`;
const password = 'Test123456';

async function http(path, init = {}) {
  const res = await fetch(BASE + path, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text), raw: text }; } catch { return { status: res.status, body: null, raw: text }; }
}

const log = (...a) => console.log('[chk-adsrc]', ...a);

(async () => {
  // 1. 注册 + 拿 token
  const reg = await http('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1 }),
  });
  if (reg.status !== 200 && reg.status !== 201) { log('register failed', reg); process.exit(1); }
  const token = reg.body.data?.token;
  if (!token) { log('no token', reg); process.exit(1); }
  log('register ok, token len=', token.length);

  // 2. 拉 custom networks
  const net = await http('/api/v1/console/network/custom/list?page=1&pageSize=10', { headers: { Authorization: `Bearer ${token}` } });
  if (net.status !== 200) { log('networks list failed', net); process.exit(1); }
  let networks = net.body.data?.list || [];
  log('custom networks (initial):', networks.length);

  if (networks.length === 0) {
    // 新用户没 custom 网络，先创建一个
    log('creating a custom network for testing...');
    const code = `CUSTOM_TEST_${Date.now().toString(36).toUpperCase()}`;
    const cr = await http('/api/v1/console/network/custom/create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        networkName: 'E2E Test Net',
        networkCode: code,
        iconUrl: '',
        systemType: 1,
        adapterClassInitAndroid: 'com.test.adapter.E2EInit',
        adapterClassInitIos: '',
      }),
    });
    log('create custom network:', cr.status, cr.body?.message);
    if (cr.status !== 200) { log('create failed, abort'); process.exit(1); }
    const newId = cr.body.data?.id || cr.body.data?.network_def_id;
    if (!newId) { log('no id in create response', cr.body); process.exit(1); }
    // 重新拉列表
    const net2 = await http('/api/v1/console/network/custom/list?page=1&pageSize=10', { headers: { Authorization: `Bearer ${token}` } });
    networks = net2.body.data?.list || [];
    log('custom networks (after create):', networks.length);
  }
  const firstNet = networks[0];
  log('first custom network:', firstNet.id, firstNet.network_name);

  // 创建测试 app（没 app 就没有左侧应用可点）
  const appCode = `APP_TEST_${Date.now().toString(36).toUpperCase()}`;
  const ar = await http('/api/v1/console/app/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ appName: 'E2E Test App', packageName: appCode, platform: 1 }),
  });
  log('create app:', ar.status, ar.body?.message);
  if (ar.status !== 200) { log('app create failed, abort'); process.exit(1); }

  // 3. puppeteer
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setCookie({ name: 'auth_token', value: token, domain: 'localhost', path: '/' });
    await page.setViewport({ width: 1440, height: 900 });

    // 先访问 /login 然后在 localStorage 写 token + userInfo（前端从 localStorage 读）
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate((t) => {
      localStorage.setItem('token', t);
      localStorage.setItem('userInfo', JSON.stringify({
        developerId: '', email: '', company: null, companyShortName: null, contactName: null, phone: null, accessType: 1, apiAccessToken: null, status: 1, role: 'developer',
      }));
    }, token);
    await wait(800);

    // --- 场景 A：从广告源主页（standard）进入，添加广告源
    log('=== 场景 A：standard 入口 ===');
    await page.goto(`${BASE}/ad-source`, { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(2500);
    log('A: current url after goto /ad-source:', page.url());
    const pageDumpA = await page.evaluate(() => {
      const main = document.querySelector('.adsource-main');
      return {
        hasMain: !!main,
        mainText: main ? (main.innerText || '').slice(0, 400) : null,
        sideApps: document.querySelectorAll('.adsource-side-app').length,
        sideAppsTitle: (document.querySelector('.adsource-side-apps-title') || {}).textContent,
        bodyTitle: document.title,
      };
    });
    log('A: page dump:', pageDumpA);
    // 选第一个应用（左侧）
    const appClickA = await page.evaluate(async () => {
      const list = document.querySelectorAll('.adsource-side-app');
      return { count: list.length, html0: list[0] ? list[0].outerHTML.slice(0, 200) : null };
    });
    log('A: side app list:', appClickA);
    await page.evaluate(() => {
      const list = document.querySelectorAll('.adsource-side-app');
      if (list[0]) list[0].click();
    });
    await wait(2000);
    // 检查应用是否真选上了
    const appCheckA = await page.evaluate(() => {
      const active = document.querySelector('.adsource-side-app--active');
      return { hasActive: !!active, activeText: active ? active.textContent : null };
    });
    log('A: app selection check:', appCheckA);
    // 点 + 添加广告源
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.textContent && x.textContent.includes('添加广告源'));
      if (b) b.click();
    });
    await wait(800);

    // 检查 drawer 里是否有「广告平台」label
    const stdFormInfo = await page.evaluate(() => {
      // el-drawer append-to-body, drawer 实际在 body 末尾
      const drawer = document.querySelector('.el-drawer') || document.querySelector('.el-overlay');
      const allDrawers = document.querySelectorAll('.el-drawer');
      // 看 body 末尾（drawer 内容会被 append 过来）
      const bodyForms = document.body.querySelectorAll('.el-form-item');
      const bodyLabels = document.body.querySelectorAll('.el-form-item__label');
      let drawerBody = null;
      // 在所有 .el-drawer 里找含 .el-form 的那个
      for (const d of allDrawers) {
        if (d.querySelector('.el-form')) { drawerBody = d; break; }
      }
      if (!drawerBody) drawerBody = drawer;
      const labels1 = drawerBody ? Array.from(drawerBody.querySelectorAll('.el-form-item__label')) : [];
      const platformItem = labels1.find(l => (l.textContent || '').includes('广告平台'));
      let selectEl = null, inputEl = null;
      if (platformItem) {
        const formItem = platformItem.closest('.el-form-item');
        if (formItem) {
          selectEl = formItem.querySelector('.el-select');
          inputEl = formItem.querySelector('input');
        }
      }
      let selectPlaceholder = null, selectSelectedLabel = null;
      if (selectEl) {
        const placeholderEl = selectEl.querySelector('.el-select__placeholder');
        const selectedEl = selectEl.querySelector('.el-select__selected-item, .el-input__inner');
        selectPlaceholder = placeholderEl ? placeholderEl.textContent : null;
        selectSelectedLabel = selectedEl ? selectedEl.textContent : null;
      }
      return {
        drawerOpen: !!drawer,
        bodyForms: bodyForms.length,
        bodyLabels: bodyLabels.length,
        drawerCount: allDrawers.length,
        labelCount1: labels1.length,
        drawerTextPreview: drawerBody ? (drawerBody.innerText || '').slice(0, 500) : '',
        hasPlatformLabel: !!platformItem,
        platformItemType: selectEl ? 'select' : (inputEl ? 'input' : 'none'),
        platformInputDisabled: inputEl ? inputEl.disabled : null,
        platformInputValue: inputEl ? inputEl.value : null,
        selectPlaceholder,
        selectSelectedLabel,
      };
    });
    log('A: standard form info', stdFormInfo);

    await page.screenshot({ path: '/tmp/chk-adsrc-std.png' });
    await page.evaluate(() => {
      const close = document.querySelector('.page-form-drawer-shell .el-button.is-circle');
      if (close) close.click();
    });
    await wait(500);

    // --- 场景 B：从广告平台 -> 广告源（custom）进入
    log('=== 场景 B：custom 入口（从「广告平台-操作项-广告源」）===');
    await page.goto(`${BASE}/ad-source?networkId=${firstNet.id}&networkName=${encodeURIComponent(firstNet.network_name)}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(1200);
    log('B: current url after goto:', page.url());
    await page.evaluate(async () => {
      const el = document.querySelector('.adsource-side-app');
      if (el) (el).click();
    });
    await wait(1500);
    const appCheckB = await page.evaluate(() => {
      const active = document.querySelector('.adsource-side-app--active');
      return { hasActive: !!active, activeText: active ? active.textContent : null };
    });
    log('B: app selection check:', appCheckB);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.textContent && x.textContent.includes('添加广告源'));
      if (b) b.click();
    });
    await wait(800);

    const customFormInfo = await page.evaluate(() => {
      const drawer = document.querySelector('.el-drawer, .page-form-drawer, [class*="drawer"]');
      if (!drawer) return { drawerOpen: false, bodyText: (document.body.innerText || '').slice(0, 300) };
      const labels = Array.from(drawer.querySelectorAll('.el-form-item__label'));
      const platformItem = labels.find(l => (l.textContent || '').includes('广告平台'));
      let selectEl = null, inputEl = null;
      if (platformItem) {
        const formItem = platformItem.closest('.el-form-item');
        if (formItem) {
          selectEl = formItem.querySelector('.el-select');
          inputEl = formItem.querySelector('input');
        }
      }
      return {
        drawerOpen: true,
        hasPlatformLabel: !!platformItem,
        platformItemType: selectEl ? 'select' : (inputEl ? 'input' : 'none'),
        platformInputDisabled: inputEl ? inputEl.disabled : null,
        platformInputValue: inputEl ? inputEl.value : null,
        expectedPlatformName: new URLSearchParams(location.search).get('networkName'),
      };
    });
    log('B: custom form info', customFormInfo);

    await page.screenshot({ path: '/tmp/chk-adsrc-cust.png' });

    // 汇总
    log('--- 汇总 ---');
    const A_pass = stdFormInfo.drawerOpen && stdFormInfo.hasPlatformLabel && stdFormInfo.platformItemType === 'select'
      && stdFormInfo.selectPlaceholder === '请选择广告平台' && stdFormInfo.selectSelectedLabel !== '0';
    const B_pass = customFormInfo.drawerOpen
      && customFormInfo.hasPlatformLabel
      && customFormInfo.platformItemType === 'input'
      && customFormInfo.platformInputDisabled === true
      && (customFormInfo.platformInputValue || '').includes(decodeURIComponent(customFormInfo.expectedPlatformName || ''));
    log('A (standard select 渲染) pass:', A_pass);
    log('B (custom locked input) pass:', B_pass);
    if (!A_pass || !B_pass) { log('❌ FAIL'); process.exit(1); }
    log('✅ PASS');
  } catch (e) {
    log('error:', e.message); process.exit(1);
  } finally {
    await browser.close();
  }
})();
