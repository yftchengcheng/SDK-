// scripts/e2e-waterfall-filter.mjs
import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:5000';
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const SHOTS = '/tmp/wf-filter-shots';
import { mkdirSync } from 'fs';
mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const json = (r) => r.json();

(async () => {
  // 1. 注册/登录
  const stamp = Date.now();
  const reg = await fetch(`${BASE}/api/v1/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `wf${stamp}@e2e.com`, password: 'Test123456', company: 'WFCo', companyShortName: 'wf', contactName: 'wf', phone: '13800000000', accessType: 1 }),
  }).then(json);
  const token = reg.data.token;
  const me = reg.data.user;
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // 2. 建 app
  const appRes = await fetch(`${BASE}/api/v1/console/app/create`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ appName: 'WFApp', packageName: `com.wf.${stamp}`, platform: 1 }),
  }).then(json);
  const appId = appRes.data.appId || appRes.data.id;
  const appKey = appRes.data.app_key;
  console.log('appId:', appId, 'appKey:', appKey);

  // 3. 建 2 个 placement（后端参数：appKey/name/format）
  const p1 = await fetch(`${BASE}/api/v1/console/placement/create`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ appKey, name: 'Banner-1', format: 1 }),
  }).then(json);
  console.log('p1 raw:', JSON.stringify(p1).slice(0, 300));
  // ad_source.placement_id 是 bigint，对应 placement.id（DB 主键）
  const pid1 = p1.data.id;
  const p2 = await fetch(`${BASE}/api/v1/console/placement/create`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ appKey, name: 'Splash-1', format: 4 }),
  }).then(json);
  const pid2 = p2.data.id;
  console.log('placement dbId:', pid1, pid2, 'bizId:', p1.data.placement_id, p2.data.placement_id);

  // 4. 各放 1 个 ad-source（自定义网络，关联 ad_network_def）
  // 先查一个 ad_network_def
  // 4. 各放 1 个 ad-source（preset 平台 CSJ，无需 networkDefId）
  console.log('adSrc1:', JSON.stringify({ networkCode: 'CSJ', appId, placementId: pid1 }));
  const adSrc1 = await fetch(`${BASE}/api/v1/console/ad-source/create`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      networkCode: 'CSJ', sourceName: 'SourceA-on-Banner', sourceCode: 'src_a_banner',
      thirdAppId: 'app_a', thirdPlacementId: 'pid_a',
      appId, placementId: pid1, sortPrice: 1.0,
    }),
  }).then(json);
  console.log('adSrc1:', adSrc1.code, adSrc1.message);

  const adSrc2 = await fetch(`${BASE}/api/v1/console/ad-source/create`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      networkCode: 'CSJ', sourceName: 'SourceB-on-Splash', sourceCode: 'src_b_splash',
      thirdAppId: 'app_b', thirdPlacementId: 'pid_b',
      appId, placementId: pid2, sortPrice: 1.0,
    }),
  }).then(json);
  console.log('adSrc2:', adSrc2.code, adSrc2.message);

  // 5. 浏览器登录 + 选 placement + 看 ad-source 列表
  // login 拿 cookie 字符串
  const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `wf${stamp}@e2e.com`, password: 'Test123456' }),
  });
  const setCookie = loginRes.headers.get('set-cookie') || '';
  // 解析 auth_token=<jwt>; path=/; HttpOnly; ...
  const m = setCookie.match(/auth_token=([^;]+)/);
  const cookieValue = m ? m[1] : token;
  console.log('set-cookie auth_token len:', cookieValue.length);

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('console', (m) => console.log('[browser]', m.type(), m.text()));
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  // 双保险：cookie + Authorization header
  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  await client.send('Network.setCookie', {
    name: 'auth_token',
    value: cookieValue,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Strict',
  });
  await page.setExtraHTTPHeaders({ Authorization: `Bearer ${cookieValue}` });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.startsWith(BASE) && !req.headers().authorization) {
      req.continue({ headers: { ...req.headers(), authorization: `Bearer ${cookieValue}` } });
    } else {
      req.continue();
    }
  });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate((tok) => {
    localStorage.setItem('token', tok);
  }, cookieValue);
  await page.goto(`${BASE}/waterfall`, { waitUntil: 'networkidle0' });
  await sleep(2000);
  await page.screenshot({ path: `${SHOTS}/01-initial.png`, fullPage: true });
  console.log('current url after nav:', page.url());

  // 选第一个 placement（Banner-1）
  const selectedP1 = pid1;
  // 模拟点击 select：用 evaluate 找 select 内部 input 并 dispatch
  // EP 的 el-select 是 input + dropdown；点击下拉后选项含 label
  // 这里直接走 API 路径：通过 setSelected 然后 trigger vue
  // 简化：直接调用 page select trigger
  await page.click('.wf-select');
  await sleep(500);
  // 选项在 .el-select-dropdown__item
  const optCount = await page.$$eval('.el-select-dropdown__item', (els) => els.map((e) => e.textContent?.trim() || ''));
  console.log('dropdown options (label):', optCount);

  // 选含 Banner-1 的 option
  const bannerIdx = optCount.findIndex((t) => t.includes('Banner-1'));
  if (bannerIdx >= 0) {
    await page.evaluate((idx) => {
      const items = document.querySelectorAll('.el-select-dropdown__item');
      const it = items[idx];
      it.click();
    }, bannerIdx);
    await sleep(1500);
    await page.screenshot({ path: `${SHOTS}/02-banner-selected.png`, fullPage: true });
  } else {
    console.log('Banner option not found, options:', optCount);
  }

  // 点"添加代码位"按钮（在 layer header 内；EP 2 button class 是 el-button--primary + el-button--small）
  const addBtns = await page.$$('button.el-button--primary.el-button--small');
  console.log('add buttons count:', addBtns.length);
  if (addBtns.length > 0) {
    await addBtns[0].click();
    await sleep(500);
    await page.screenshot({ path: `${SHOTS}/03-add-dialog.png`, fullPage: true });

    // 打开 select
    const selectHandle = await page.$('.el-dialog .el-select');
    if (selectHandle) {
      await selectHandle.click();
      await sleep(500);
      const dropOpts = await page.$$eval('.el-select-dropdown__item', (els) => els.map((e) => e.textContent?.trim() || ''));
      console.log('dialog ad-source options (should be Banner only):', dropOpts);
      await page.screenshot({ path: `${SHOTS}/04-banner-ad-source-list.png`, fullPage: true });
    }
    // 关闭 dialog
    const cancelBtn = await page.$('.el-dialog .el-button:not(.el-button--primary)');
    if (cancelBtn) await cancelBtn.click();
    await sleep(300);
  }

  // 切到 Splash-1
  await page.click('.wf-select');
  await sleep(500);
  const opt2 = await page.$$eval('.el-select-dropdown__item', (els) => els.map((e) => e.textContent?.trim() || ''));
  const splashIdx = opt2.findIndex((t) => t.includes('Splash-1'));
  if (splashIdx >= 0) {
    await page.evaluate((idx) => {
      const items = document.querySelectorAll('.el-select-dropdown__item');
      items[idx].click();
    }, splashIdx);
    await sleep(1500);
    await page.screenshot({ path: `${SHOTS}/05-splash-selected.png`, fullPage: true });
    const addBtns2 = await page.$$('button.el-button--primary.el-button--small');
    if (addBtns2.length > 0) {
      await addBtns2[0].click();
      await sleep(500);
      const s2 = await page.$('.el-dialog .el-select');
      if (s2) {
        await s2.click();
        await sleep(500);
        const dropOpts2 = await page.$$eval('.el-select-dropdown__item', (els) => els.map((e) => e.textContent?.trim() || ''));
        console.log('dialog ad-source options (should be Splash only):', dropOpts2);
        await page.screenshot({ path: `${SHOTS}/06-splash-ad-source-list.png`, fullPage: true });
      }
    }
  }

  await browser.close();
  console.log('done');
})().catch((e) => { console.error('e2e err:', e); process.exit(1); });
