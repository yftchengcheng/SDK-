// 验证：广告平台 - 应用关联列表 - 应用列显示「应用名 + APP token」上下结构
import puppeteer from 'puppeteer';
import fs from 'fs';

const PORT = process.env.DEPLOY_RUN_PORT || '5000';
const SHOTS = '/tmp/binding-app-cell';
fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, url, token, body) {
  const r = await fetch(`http://localhost:${PORT}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

(async () => {
  // 1) 注册新用户
  const stamp = Date.now();
  const reg = await api('POST', '/api/v1/auth/register', null, {
    email: `bn${stamp}@e2e.com`, password: 'Test123456', company: 'bn', companyShortName: 'bn',
    contactName: 'bn', phone: '13800000000', accessType: 1,
  });
  if (!reg?.data?.token) { console.error('REG FAILED', reg); process.exit(1); }
  const token = reg.data.token;

  // 2) 创建自定义广告平台 + 2 个 app + 2 条 binding
  const nw = await api('POST', '/api/v1/console/network/custom/create', token, {
    networkCode: `E2E${stamp}`,
    networkName: 'E2E-Network',
    description: 'e2e binding test',
    adapter_class_init_android: 'com.e2e.network.E2EInit',
  });
  if (nw?.code !== 0) { console.error('NW CREATE FAILED', nw); process.exit(1); }
  const networkId = nw.data.id;

  const app1 = await api('POST', '/api/v1/console/app/create', token, { appName: '我的游戏-A', packageName: `com.bn.${stamp}.a`, platform: 1 });
  const app2 = await api('POST', '/api/v1/console/app/create', token, { appName: '我的电商-B', packageName: `com.bn.${stamp}.b`, platform: 1 });

  // 上传一个 adapter 以便 binding 流程跑通（adapterVersionId = 0 也允许）
  const a1 = await api('POST', '/api/v1/console/network/app/bind', token, {
    appKey: app1.data.app_key,
    networkDefId: networkId,
    networkAppId: 'tpa_001',
    adapterVersionId: 0,
    extraParams: null,
  });
  const a2 = await api('POST', '/api/v1/console/network/app/bind', token, {
    appKey: app2.data.app_key,
    networkDefId: networkId,
    networkAppId: 'tpa_002',
    adapterVersionId: 0,
    extraParams: null,
  });
  console.log('a1 =', a1?.code, 'a2 =', a2?.code);

  // 3) 接口冒烟：app/list 应包含 app_name
  const list = await api('GET', `/api/v1/console/network/app/list?networkDefId=${networkId}`, token);
  console.log('list RAW =', JSON.stringify(list, null, 2).slice(0, 800));

  // 4) 浏览器走完：登录 → /network → 点「应用」
  const browser = await puppeteer.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`PAGEERR: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`CONSOLE.ERR: ${m.text()}`); });
  await page.goto(`http://localhost:${PORT}/login`, { waitUntil: 'networkidle0' });
  await page.setCookie({ name: 'auth_token', value: token, url: `http://localhost:${PORT}`, sameSite: 'Strict' });
  await page.evaluate((t) => localStorage.setItem('token', t), token);
  await page.goto(`http://localhost:${PORT}/network`, { waitUntil: 'networkidle0' });
  await sleep(2000);

  // 切到「自定义广告平台」Tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.el-tabs__item'));
    const t = tabs.find((el) => el.textContent && el.textContent.includes('自定义'));
    if (t) t.click();
  });
  await sleep(1500);
  await page.screenshot({ path: `${SHOTS}/01-list.png` });

  // 找到 E2E-Network 那行的「应用」按钮
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.el-table__row'));
    const row = rows.find((r) => r.textContent && r.textContent.includes('E2E-Network'));
    if (!row) throw new Error('row not found');
    const buttons = Array.from(row.querySelectorAll('button'));
    const appBtn = buttons.find((b) => b.textContent && b.textContent.trim() === '应用');
    if (!appBtn) throw new Error('app btn not found');
    appBtn.click();
  });
  await sleep(2000);
  await page.screenshot({ path: `${SHOTS}/02-binding-drawer.png` });

  // 抓取第一个 binding-app-cell 节点的 DOM + 文字
  const cellInfo = await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('.binding-app-cell'));
    if (cells.length === 0) return { found: false };
    return {
      found: true,
      count: cells.length,
      first: {
        name: cells[0].querySelector('.binding-app-name')?.innerText,
        token: cells[0].querySelector('.binding-app-token')?.innerText,
        html: cells[0].outerHTML,
      },
    };
  });
  console.log('cellInfo =', JSON.stringify(cellInfo, null, 2));

  if (errors.length) {
    console.log('[errors]');
    errors.slice(0, 10).forEach((e) => console.log(' -', e));
  } else {
    console.log('[errors] none');
  }

  await browser.close();
  process.exit(cellInfo.found && cellInfo.first.name && cellInfo.first.token ? 0 : 1);
})();
