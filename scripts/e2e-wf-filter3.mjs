// scripts/e2e-wf-filter3.mjs - 简化 e2e，键盘选择 + 检查 dialog options
import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';
mkdirSync('/tmp/wf-filter3', { recursive: true });

const BASE = 'http://localhost:5000';
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const json = (r) => r.json();

(async () => {
  const stamp = Date.now();
  const reg = await fetch(`${BASE}/api/v1/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `wf3${stamp}@e2e.com`, password: 'Test123456', company: 'W', companyShortName: 'w', contactName: 'w', phone: '13800000000', accessType: 1 }),
  }).then(json);
  const token = reg.data.token;
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const app = await fetch(`${BASE}/api/v1/console/app/create`, { method: 'POST', headers: H, body: JSON.stringify({ appName: 'App', packageName: `com.w3.${stamp}`, platform: 1 }) }).then(json);
  const appKey = app.data.app_key;
  const appId = app.data.id;
  const p1 = await fetch(`${BASE}/api/v1/console/placement/create`, { method: 'POST', headers: H, body: JSON.stringify({ appKey, name: 'Banner-A', format: 1 }) }).then(json);
  const p2 = await fetch(`${BASE}/api/v1/console/placement/create`, { method: 'POST', headers: H, body: JSON.stringify({ appKey, name: 'Splash-B', format: 4 }) }).then(json);
  const pid1 = p1.data.id, pid2 = p2.data.id;
  await fetch(`${BASE}/api/v1/console/ad-source/create`, { method: 'POST', headers: H, body: JSON.stringify({ networkCode: 'CSJ', sourceName: 'srcA', thirdAppId: 'a', thirdPlacementId: 'pa', appId, placementId: pid1 }) }).then(json);
  await fetch(`${BASE}/api/v1/console/ad-source/create`, { method: 'POST', headers: H, body: JSON.stringify({ networkCode: 'CSJ', sourceName: 'srcB', thirdAppId: 'b', thirdPlacementId: 'pb', appId, placementId: pid2 }) }).then(json);
  console.log('seeded pid1=', pid1, 'pid2=', pid2);

  // login
  const lr = await fetch(`${BASE}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `wf3${stamp}@e2e.com`, password: 'Test123456' }) });
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
  await page.waitForSelector('.wf-select .el-select__wrapper', { timeout: 8000 });
  await sleep(800);

  // 用 Vue 内部实例设 selectedPlacement（最稳）
  // 先找 vue 暴露的 app
  // 简化：通过 input 事件 input + change
  // 找到 wf-select 的 input
  await page.focus('.wf-select .el-select__input');
  await sleep(200);
  // 输入 "Banner-A" 触发 filter
  await page.keyboard.type('Banner-A', { delay: 30 });
  await sleep(500);
  // 下箭头 + Enter
  await page.keyboard.press('ArrowDown');
  await sleep(200);
  await page.keyboard.press('Enter');
  await sleep(1500);
  await page.screenshot({ path: '/tmp/wf-filter3/01-banner-selected.png', fullPage: true });
  // 验证：看 wf-current-title 下面有 "Banner-A"
  const banner = await page.evaluate(() => {
    const t = document.querySelector('.wf-current-val--lg');
    return t ? t.textContent.trim() : null;
  });
  console.log('selected placement name:', banner);

  // 点添加代码位
  const addBtns = await page.$$('button.el-button--primary.el-button--small');
  if (addBtns[0]) {
    await addBtns[0].click();
    await sleep(800);
    await page.screenshot({ path: '/tmp/wf-filter3/02-add-dialog.png', fullPage: true });
    // 取 dialog 内的 select 全部 options（无视可见性）
    const dialogBox = await page.evaluate(() => {
      const w = document.querySelector('.el-dialog .el-select__wrapper');
      if (!w) return null;
      const r = w.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (dialogBox) {
      await page.mouse.click(dialogBox.x, dialogBox.y);
      await sleep(800);
      const dialogOpts = await page.$$eval('.el-select-dropdown__item', (els) =>
        els
          .filter((e) => e.offsetParent !== null) // visible only
          .map((e) => e.textContent.trim())
          .filter((t) => t && t.length > 0)
      );
      console.log('Banner selected → dialog ad-source options (visible only):', dialogOpts);
      await page.screenshot({ path: '/tmp/wf-filter3/03-banner-options.png', fullPage: true });
    }
    // 关闭 dialog
    const cancel = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.el-dialog__footer button'));
      return btns.findIndex((b) => b.textContent.trim() === '取消');
    });
    const cancelBtns = await page.$$('.el-dialog__footer button');
    if (cancelBtns[cancel]) await cancelBtns[cancel].click();
    await sleep(500);
  }

  // 切到 Splash-B
  await page.focus('.wf-select .el-select__input');
  // 清空输入
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await sleep(300);
  await page.keyboard.type('Splash-B', { delay: 30 });
  await sleep(500);
  await page.keyboard.press('ArrowDown');
  await sleep(200);
  await page.keyboard.press('Enter');
  await sleep(1500);
  await page.screenshot({ path: '/tmp/wf-filter3/04-splash-selected.png', fullPage: true });
  const splash = await page.evaluate(() => {
    const t = document.querySelector('.wf-current-val--lg');
    return t ? t.textContent.trim() : null;
  });
  console.log('selected placement name:', splash);

  const addBtns2 = await page.$$('button.el-button--primary.el-button--small');
  if (addBtns2[0]) {
    await addBtns2[0].click();
    await sleep(800);
    const dbox = await page.evaluate(() => {
      const w = document.querySelector('.el-dialog .el-select__wrapper');
      if (!w) return null;
      const r = w.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (dbox) {
      await page.mouse.click(dbox.x, dbox.y);
      await sleep(800);
      const dOpts2 = await page.$$eval('.el-select-dropdown__item', (els) =>
        els
          .filter((e) => e.offsetParent !== null)
          .map((e) => e.textContent.trim())
          .filter((t) => t && t.length > 0)
      );
      console.log('Splash selected → dialog ad-source options (visible only):', dOpts2);
      await page.screenshot({ path: '/tmp/wf-filter3/05-splash-options.png', fullPage: true });
    }
  }

  await browser.close();
  console.log('done');
})().catch((e) => { console.error('e2e err:', e); process.exit(1); });
