// scripts/inspect-wf.mjs - 真正登录后看 wf 内部 state
import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:5000';
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const json = (r) => r.json();

(async () => {
  const stamp = Date.now();
  const reg = await fetch(`${BASE}/api/v1/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `wf${stamp}@e2e.com`, password: 'Test123456', company: 'W', companyShortName: 'w', contactName: 'w', phone: '13800000000', accessType: 1 }),
  }).then(json);
  const token = reg.data.token;
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const app = await fetch(`${BASE}/api/v1/console/app/create`, { method: 'POST', headers: H, body: JSON.stringify({ appName: 'App', packageName: `com.w.${stamp}`, platform: 1 }) }).then(json);
  const appKey = app.data.app_key;
  const appId = app.data.id;
  const p1 = await fetch(`${BASE}/api/v1/console/placement/create`, { method: 'POST', headers: H, body: JSON.stringify({ appKey, name: 'Banner-A', format: 1 }) }).then(json);
  const p2 = await fetch(`${BASE}/api/v1/console/placement/create`, { method: 'POST', headers: H, body: JSON.stringify({ appKey, name: 'Splash-B', format: 4 }) }).then(json);
  const pid1 = p1.data.id, pid2 = p2.data.id;
  await fetch(`${BASE}/api/v1/console/ad-source/create`, { method: 'POST', headers: H, body: JSON.stringify({ networkCode: 'CSJ', sourceName: 'srcA', thirdAppId: 'a', thirdPlacementId: 'pa', appId, placementId: pid1 }) }).then(json);
  await fetch(`${BASE}/api/v1/console/ad-source/create`, { method: 'POST', headers: H, body: JSON.stringify({ networkCode: 'CSJ', sourceName: 'srcB', thirdAppId: 'b', thirdPlacementId: 'pb', appId, placementId: pid2 }) }).then(json);
  console.log('seeded pid1=', pid1, 'pid2=', pid2);

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', (m) => { if (!m.text().includes('Failed to load resource')) console.log('[browser]', m.text()); });
  page.on('request', (r) => { if (r.url().includes('/ad-source/list')) console.log('>> AD-SOURCE:', r.url()); });
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  // 真正登录
  await page.evaluate((tok) => localStorage.setItem('token', tok), token);
  await page.goto(`${BASE}/waterfall`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('.wf-select .el-select__wrapper', { timeout: 10000 });
  await sleep(1200);

  // 1) 触发 Banner-A 选择
  await page.focus('.wf-select .el-select__input');
  await sleep(300);
  await page.keyboard.type('Banner-A', { delay: 50 });
  await sleep(500);
  await page.keyboard.press('ArrowDown');
  await sleep(200);
  await page.keyboard.press('Enter');
  await sleep(2000);
  // 检查内部 state
  const state1 = await page.evaluate(() => {
    const root = document.querySelector('#app')?.__vue_app__;
    let result = null;
    const walk = (n, depth = 0) => {
      if (!n || depth > 12 || result) return;
      if (n.setupState && ('adSourceList' in n.setupState || 'selectedPlacement' in n.setupState)) {
        const s = n.setupState;
        result = {
          selectedPlacement: s.selectedPlacement,
          currentPlacement: s.currentPlacement?.name,
          adSourceList: (s.adSourceList || []).map((x) => ({ name: x.source_name, pid: x.placement_id, network: x.network_code })),
          adSourceListLength: s.adSourceList?.length,
        };
        return;
      }
      if (n.subTree) walk(n.subTree, depth + 1);
      if (n.component) walk(n.component, depth + 1);
      if (Array.isArray(n.children)) n.children.forEach((c) => walk(c, depth + 1));
    };
    if (root) walk(root._instance);
    return result;
  });
  console.log('after Banner-A:', JSON.stringify(state1, null, 2));

  // 2) 打开 add dialog
  const addBtns = await page.$$('button.el-button--primary.el-button--small');
  if (addBtns[0]) {
    await addBtns[0].click();
    await sleep(800);
    const dbox = await page.evaluate(() => {
      const w = document.querySelector('.el-dialog .el-select__wrapper');
      if (!w) return null;
      const r = w.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (dbox) {
      await page.mouse.click(dbox.x, dbox.y);
      await sleep(1000);
      const visOpts = await page.$$eval('.el-select-dropdown__item', (els) =>
        els
          .filter((e) => e.offsetParent !== null)
          .map((e) => e.textContent.trim())
      );
      console.log('Banner-A dialog visible options:', visOpts);
    }
  }

  await browser.close();
})().catch((e) => { console.error('err:', e); process.exit(1); });
