// 端到端：创建 custom ad-source → 点击编辑 → 验证广告平台字段被回填
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5000';
const CHROME = process.env.PUPPETEER_CHROME || '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const log = (...a) => console.log('[chk-adsrc]', ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const register = async (prefix) => {
  const email = `${prefix}${Date.now()}@e2e.com`;
  const r = await fetch(BASE + '/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email, password: 'Test123456', company: 'e2e', companyShortName: 'e2e',
      contactName: 'e2e', phone: '13800000000', accessType: 1,
    }),
  });
  const j = await r.json();
  if (!j.data || !j.data.token) throw new Error('register failed: ' + JSON.stringify(j));
  return { token: j.data.token, developerId: j.data.developer?.id, email };
};

async function api(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t }; }
  return { status: r.status, body: j };
}

const main = async () => {
  const { token, developerId } = await register('chk-adsrc-edit-');

  // 1. 创建一个 custom 网络
  const customNet = await api('POST', '/api/v1/console/network/custom/create', {
    token, body: {
      networkCode: `E2E_EDIT_${Date.now()}`,
      networkName: 'E2E Edit Test Net',
      androidInit: 'com.test.adapter.EditInit',
      iosInit: 'EditInit',
      adapterClassInitAndroid: 'com.test.adapter.EditInit',
      adapterClassInitIos: 'com.test.adapter.EditInit',
    },
  });
  if (customNet.status !== 200 || customNet.body.code !== 0) {
    throw new Error('custom network create failed: ' + JSON.stringify(customNet));
  }
  const networkDefId = customNet.body.data.id;
  log('custom network created id=' + networkDefId);

  // 2. 创建一个 app
  const appRes = await api('POST', '/api/v1/console/app/create', {
    token, body: { appName: 'E2E App', packageName: `com.e2e.edit.${Date.now()}`, platform: 1 },
  });
  if (appRes.status !== 200 || appRes.body.code !== 0) {
    throw new Error('app create failed: ' + JSON.stringify(appRes));
  }
  const appId = appRes.body.data.id;
  log('app created id=' + appId);

  // 3. 创建一个 placement（需要先拿 app_key）
  const appListRes = await api('GET', `/api/v1/console/app/list?page=1&pageSize=10`, { token });
  const appRow = appListRes.body.data.list.find((it) => it.id === appId);
  if (!appRow) throw new Error('app not in list');
  const plRes = await api('POST', '/api/v1/console/placement/create', {
    token, body: { appKey: appRow.app_key, name: 'E2E Pl', format: 1 },
  });
  if (plRes.status !== 200 || plRes.body.code !== 0) {
    throw new Error('placement create failed: ' + JSON.stringify(plRes));
  }
  const placementId = plRes.body.data.id;
  log('placement created id=' + placementId);

  // 4. 创建一个 ad-source (custom)
  const srcRes = await api('POST', '/api/v1/console/ad-source/create-custom', {
    token, body: {
      networkDefId, appId, placementId,
      sourceName: 'E2E Source',
      thirdAppId: 'app_001', thirdPlacementId: 'pl_001',
    },
  });
  if (srcRes.status !== 200 || srcRes.body.code !== 0) {
    throw new Error('ad-source create failed: ' + JSON.stringify(srcRes));
  }
  const adSourceId = srcRes.body.data.id;
  log('ad-source created id=' + adSourceId + ', network_def_id=' + srcRes.body.data.network_def_id);

  // 5. list 接口拿回这条记录，看 network_def_id 是否被存
  const listRes = await api('GET', `/api/v1/console/ad-source/list?appId=${appId}`, { token });
  if (listRes.status !== 200) throw new Error('list failed: ' + listRes.status);
  const row = listRes.body.data.list.find((it) => it.id === adSourceId);
  if (!row) throw new Error('ad-source not in list');
  log('list returned network_def_id=' + row.network_def_id + ' (expected: ' + networkDefId + ')');
  if (row.network_def_id !== networkDefId) {
    throw new Error(`BUG: network_def_id not stored! got ${row.network_def_id} expected ${networkDefId}`);
  }
  log('✅ backend stored network_def_id correctly');

  // 6. 启 puppeteer 验证编辑 drawer 字段回填
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setCookie({ name: 'auth_token', value: token, domain: 'localhost', path: '/', httpOnly: true });
    page.on('pageerror', (e) => console.error('[page error]', e.message));
    page.on('console', (m) => { console.log('[browser]', m.type(), m.text()); });
    page.on('response', (r) => {
      if (r.url().includes('/api/v1/console/app/list')) console.log('[res]', r.status(), r.url());
    });

    // 跳广告源主页
    await page.goto(BASE + '/ad-source', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);

    const url = page.url();
    log('current url: ' + url);
    const html = await page.content();
    log('body len: ' + html.length + ', has "adsource-side-app": ' + html.includes('adsource-side-app'));

    // 点侧边应用
    const appClick = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('.adsource-side-app-name, [class*="side-app-name"]'));
      for (const el of els) {
        if ((el.textContent || '').trim() === 'E2E App') { el.click(); return 'clicked'; }
      }
      return 'not_found_' + els.length;
    });
    log('app click: ' + appClick);
    await sleep(800);

    // 找所有「编辑」按钮（行内操作）
    const editInfo = await page.evaluate(() => {
      // 表格内的「编辑」按钮（带 primary 类的 link 按钮）
      const btns = Array.from(document.querySelectorAll('.el-table .el-button, .el-table button'));
      const editBtns = btns.filter((b) => (b.textContent || '').trim() === '编辑');
      if (editBtns.length === 0) {
        return { count: 0, sample: null };
      }
      return { count: editBtns.length, sample: editBtns[0].outerHTML.slice(0, 200) };
    });
    log('edit buttons found: ' + JSON.stringify(editInfo));

    // 直接点第一个「编辑」按钮
    const editClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.el-table button'));
      const editBtns = btns.filter((b) => (b.textContent || '').trim() === '编辑');
      if (editBtns.length > 0) { editBtns[0].click(); return editBtns.length; }
      return 0;
    });
    log('edit button count clicked: ' + editClicked);
    await sleep(800);

    // 检查 drawer
    const formInfo = await page.evaluate(() => {
      const drawer = document.querySelector('.el-drawer, [class*="drawer"]');
      if (!drawer) return { found: false };

      // 找所有表单项 label=广告平台 + 找它下面紧跟的 input/select
      const labels = Array.from(drawer.querySelectorAll('.el-form-item__label, label, .form-label'));
      const platformLabel = labels.find((l) => (l.textContent || '').trim().includes('广告平台'));
      if (!platformLabel) return { found: true, hasPlatformLabel: false };

      // 找同 form-item 内的 input / select
      const item = platformLabel.closest('.el-form-item, .form-item') || platformLabel.parentElement;
      const input = item.querySelector('input');
      const selectWrapper = item.querySelector('.el-select, [class*="el-select"]');
      return {
        found: true,
        hasPlatformLabel: true,
        platformInputValue: input ? input.value : null,
        platformInputDisabled: input ? input.disabled : null,
        platformSelectVisible: !!selectWrapper,
        platformSelectText: selectWrapper ? selectWrapper.textContent.trim() : null,
        platformItemType: selectWrapper ? 'select' : (input ? 'input' : null),
      };
    });

    log('edit form info: ' + JSON.stringify(formInfo, null, 2));

    // 期望：disabled input + value="E2E Edit Test Net"（因为是 custom ad-source）
    const pass = formInfo.hasPlatformLabel
      && formInfo.platformItemType === 'input'
      && formInfo.platformInputDisabled === true
      && formInfo.platformInputValue === 'E2E Edit Test Net';

    log('--- 汇总 ---');
    log('PASS: ' + pass);
    if (!pass) {
      process.exitCode = 1;
      log('❌ FAIL');
    } else {
      log('✅ PASS');
    }
  } finally {
    await browser.close();
  }
};

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
