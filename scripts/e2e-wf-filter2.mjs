// scripts/e2e-wf-filter2.mjs
import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';
mkdirSync('/tmp/wf-filter2', { recursive: true });

const BASE = 'http://localhost:5000';
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const json = (r) => r.json();

(async () => {
  const stamp = Date.now();
  const reg = await fetch(`${BASE}/api/v1/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `wf2${stamp}@e2e.com`, password: 'Test123456', company: 'W', companyShortName: 'w', contactName: 'w', phone: '13800000000', accessType: 1 }),
  }).then(json);
  const token = reg.data.token;
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const app = await fetch(`${BASE}/api/v1/console/app/create`, { method: 'POST', headers: H, body: JSON.stringify({ appName: 'App', packageName: `com.w2.${stamp}`, platform: 1 }) }).then(json);
  const appKey = app.data.app_key;
  const appId = app.data.id;
  const p1 = await fetch(`${BASE}/api/v1/console/placement/create`, { method: 'POST', headers: H, body: JSON.stringify({ appKey, name: 'Banner-A', format: 1 }) }).then(json);
  const p2 = await fetch(`${BASE}/api/v1/console/placement/create`, { method: 'POST', headers: H, body: JSON.stringify({ appKey, name: 'Splash-B', format: 4 }) }).then(json);
  const pid1 = p1.data.id, pid2 = p2.data.id;
  await fetch(`${BASE}/api/v1/console/ad-source/create`, { method: 'POST', headers: H, body: JSON.stringify({ networkCode: 'CSJ', sourceName: 'srcA', thirdAppId: 'a', thirdPlacementId: 'pa', appId, placementId: pid1 }) }).then(json);
  await fetch(`${BASE}/api/v1/console/ad-source/create`, { method: 'POST', headers: H, body: JSON.stringify({ networkCode: 'CSJ', sourceName: 'srcB', thirdAppId: 'b', thirdPlacementId: 'pb', appId, placementId: pid2 }) }).then(json);
  console.log('seeded pid1=', pid1, 'pid2=', pid2);

  // login to get cookie
  const lr = await fetch(`${BASE}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `wf2${stamp}@e2e.com`, password: 'Test123456' }) });
  const setCookie = lr.headers.get('set-cookie') || '';
  const m = setCookie.match(/auth_token=([^;]+)/);
  const cookieValue = m ? m[1] : token;

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate((tok) => { localStorage.setItem('token', tok); }, cookieValue);
  await page.goto(`${BASE}/waterfall`, { waitUntil: 'networkidle0' });
  // 等 vue mount + placement fetch 完成
  await page.waitForSelector('.wf-select .el-select__wrapper', { timeout: 8000 });
  await sleep(800);
  console.log('url:', page.url());
  // 看 select 内部结构
  const innerHtml = await page.evaluate(() => {
    const el = document.querySelector('.wf-select');
    return el ? el.outerHTML.slice(0, 1200) : 'NO_WF_SELECT';
  });
  console.log('wf-select inner:', innerHtml.slice(0, 600));
  // 也数 wrapper 数量
  const wraps = await page.$$('.el-select__wrapper');
  console.log('total .el-select__wrapper count:', wraps.length);
  const wfWraps = await page.$$('.wf-select .el-select__wrapper');
  console.log('wf-select wrapper count:', wfWraps.length);
  await page.screenshot({ path: '/tmp/wf-filter2/01-load.png', fullPage: true });

  // 关闭所有 dropdown（点击 body 空白区域）
  await page.mouse.click(20, 200);
  await sleep(300);

  // EP 2 wrapper: .wf-select 内部 .el-select__wrapper 才是点击目标
  // EP 监听 mousedown。直接用 page.mouse 在 wrapper 中心点击
  const wfBox = await page.evaluate(() => {
    const w = document.querySelector('.wf-select .el-select__wrapper');
    if (!w) return null;
    const r = w.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (wfBox) {
    await page.mouse.click(wfBox.x, wfBox.y);
  }
  await sleep(700);
  // 取所有 visible options 的 label
  const opts1 = await page.$$eval('.el-select-dropdown__item', (els) => els.map((e) => ({ text: e.textContent.trim(), visible: e.offsetParent !== null })));
  console.log('after open dropdown:', JSON.stringify(opts1));
  // 点 Banner-A
  const bannerOpt = await page.$x ? null : null;
  await page.evaluate((label) => {
    const items = Array.from(document.querySelectorAll('.el-select-dropdown__item'));
    const t = items.find((e) => e.textContent.trim().includes(label));
    if (t) t.click();
  }, 'Banner-A');
  await sleep(1500);
  // 确保 dropdown 完全关闭
  await page.mouse.click(20, 200);
  await sleep(500);
  await page.screenshot({ path: '/tmp/wf-filter2/02-banner-selected.png', fullPage: true });

  // 点第一个「添加代码位」
  const addBtns = await page.$$('button.el-button--primary.el-button--small');
  if (addBtns[0]) {
    await addBtns[0].click();
    await sleep(800);
    await page.screenshot({ path: '/tmp/wf-filter2/03-add-dialog-banner.png', fullPage: true });
    // dialog 里 select（只有一个 el-select）
    // 找 dialog 内的 select wrapper
    const dialogBox = await page.evaluate(() => {
      const w = document.querySelector('.el-dialog .el-select__wrapper');
      if (!w) return null;
      const r = w.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (dialogBox) {
      await page.mouse.click(dialogBox.x, dialogBox.y);
      await sleep(700);
      const dialogOpts = await page.$$eval('.el-select-dropdown__item', (els) =>
        els.filter((e) => e.offsetParent !== null).map((e) => e.textContent.trim())
      );
      console.log('Banner selected → dialog ad-source options (visible only):', dialogOpts);
      await page.screenshot({ path: '/tmp/wf-filter2/04-banner-dropdown.png', fullPage: true });
    }
    // 关闭 dialog
    const cancelBtn = await page.$('.el-dialog__footer .el-button:not(.el-button--primary)');
    if (cancelBtn) await cancelBtn.click();
    await sleep(500);
  }

  // 切到 Splash-B
  await page.mouse.click(20, 200);
  await sleep(300);
  const wfBox2 = await page.evaluate(() => {
    const w = document.querySelector('.wf-select .el-select__wrapper');
    if (!w) return null;
    const r = w.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (wfBox2) await page.mouse.click(wfBox2.x, wfBox2.y);
  await sleep(700);
  await page.evaluate((label) => {
    const items = Array.from(document.querySelectorAll('.el-select-dropdown__item'));
    const t = items.find((e) => e.textContent.trim().includes(label));
    if (t) t.click();
  }, 'Splash-B');
  await sleep(1500);
  await page.mouse.click(20, 200);
  await sleep(500);
  await page.screenshot({ path: '/tmp/wf-filter2/05-splash-selected.png', fullPage: true });

  const addBtns2 = await page.$$('button.el-button--primary.el-button--small');
  if (addBtns2[0]) {
    await addBtns2[0].click();
    await sleep(800);
    const ds2 = await page.evaluate(() => {
      const w = document.querySelector('.el-dialog .el-select__wrapper');
      if (!w) return null;
      const r = w.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (ds2) {
      await page.mouse.click(ds2.x, ds2.y);
      await sleep(700);
      const dialogOpts2 = await page.$$eval('.el-select-dropdown__item', (els) =>
        els.filter((e) => e.offsetParent !== null).map((e) => e.textContent.trim())
      );
      console.log('Splash selected → dialog ad-source options (visible only):', dialogOpts2);
      await page.screenshot({ path: '/tmp/wf-filter2/06-splash-dropdown.png', fullPage: true });
    }
  }

  await browser.close();
  console.log('done');
})().catch((e) => { console.error('e2e err:', e); process.exit(1); });
