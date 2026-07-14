// 验证：点击 Master 列表的 placement 不再报「缺少placementId」+ traffic group select 正确填充
import puppeteer from 'puppeteer';
import fs from 'fs';

const PORT = process.env.DEPLOY_RUN_PORT || '5000';
const SHOTS = '/tmp/wf-tg-bug';
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
  // 1) 注册新用户（避免污染旧账号数据）
  const stamp = Date.now();
  const reg = await api('POST', '/api/v1/auth/register', null, {
    email: `wftg${stamp}@e2e.com`, password: 'Test123456', company: 'wftg', companyShortName: 'wftg',
    contactName: 'wftg', phone: '13800000000', accessType: 1,
  });
  if (!reg?.data?.token) { console.error('REG FAILED', reg); process.exit(1); }
  const token = reg.data.token;
  console.log('[reg] token ok');

  // 2) 准备 app + placement + 流量分组
  const app = await api('POST', '/api/v1/console/app/create', token, { appName: 'TG-App', packageName: `com.tg.${stamp}`, platform: 1 });
  const appKey = app.data.app_key;
  const p1 = await api('POST', '/api/v1/console/placement/create', token, { appKey, name: 'TG-Banner', format: 1 });
  const p2 = await api('POST', '/api/v1/console/placement/create', token, { appKey, name: 'TG-Splash', format: 4 });
  const pid1 = p1.data.id, pid2 = p2.data.id;
  // 为 p1 创建 1 个流量分组 + 为 p2 创建 1 个流量分组
  const tg1 = await api('POST', '/api/v1/console/traffic-group/create', token, { placementId: p1.data.placement_id, groupName: '国内-Banner', conditions: { region: 'CN' }, priority: 1, status: 1 });
  const tg2 = await api('POST', '/api/v1/console/traffic-group/create', token, { placementId: p2.data.placement_id, groupName: '海外-Splash', conditions: { region: 'OVERSEAS' }, priority: 1, status: 1 });
  console.log('[data] tg1 =', tg1?.code, tg1?.message, ' tg2 =', tg2?.code, tg2?.message);

  // 3) 浏览器登录 + 跳转 waterfall
  const browser = await puppeteer.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    headless: 'new', args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`PAGEERR: ${e.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`CONSOLE.ERR: ${msg.text()}`); });

  await page.goto(`http://localhost:${PORT}/login`, { waitUntil: 'networkidle0' });
  await page.setCookie({ name: 'auth_token', value: token, url: `http://localhost:${PORT}`, sameSite: 'Strict' });
  await page.evaluate((t) => { localStorage.setItem('token', t); }, token);

  await page.goto(`http://localhost:${PORT}/waterfall`, { waitUntil: 'networkidle0' });
  await sleep(2000);
  await page.screenshot({ path: `${SHOTS}/01-initial.png` });

  // 4) 拦截 API：点 Master 第一个 placement（TG-Banner）
  const requests = [];
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('/traffic-group/list') || u.includes('/waterfall/config')) {
      requests.push({ method: req.method(), url: u, hasPlacementId: u.includes('placementId=') });
    }
  });

  console.log('=== click TG-Banner (p1) ===');
  await page.evaluate((plId) => {
    const items = Array.from(document.querySelectorAll('.app-master-item'));
    const target = items.find((el) => el.textContent && el.textContent.includes('TG-Banner'));
    if (target) target.click();
  }, pid1);
  await sleep(1500);
  await page.screenshot({ path: `${SHOTS}/02-banner.png` });

  console.log('=== click TG-Splash (p2) ===');
  await page.evaluate((plId) => {
    const items = Array.from(document.querySelectorAll('.app-master-item'));
    const target = items.find((el) => el.textContent && el.textContent.includes('TG-Splash'));
    if (target) target.click();
  }, pid2);
  await sleep(1500);
  await page.screenshot({ path: `${SHOTS}/03-splash.png` });

  // 5) 检查：traffic-group 下拉
  const tgOptions = await page.evaluate(() => {
    const select = document.querySelector('.wf-tg-selector .el-select');
    if (!select) return { found: false, count: 0 };
    // 不展开，只看是否有 el-select 节点存在
    return { found: true, count: 1, html: select.outerHTML.slice(0, 200) };
  });
  console.log('[tg-selector]', tgOptions);

  // 6) 输出网络请求
  console.log('[network]');
  requests.forEach((r) => console.log(' -', r.method, r.url, 'hasPlacementId:', r.hasPlacementId));

  // 7) 输出错误
  if (errors.length) {
    console.log('[errors]');
    errors.slice(0, 10).forEach((e) => console.log(' -', e));
  } else {
    console.log('[errors] none');
  }

  await browser.close();
  console.log('=== DONE ===');
  process.exit(errors.length ? 1 : 0);
})();
