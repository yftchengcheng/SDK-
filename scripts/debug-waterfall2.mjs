// 调试：登录后跳到 waterfall 测「已加载」按钮
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve('public/sdk-screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const BASE = 'http://localhost:5000';
const EMAIL = 'yufutang@adtalos.com';
const PASSWORD = 'Test123456';

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // 1. 登录
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  const apiRes = await page.evaluate(async ({ email, password }) => {
    const r = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  }, { email: EMAIL, password: PASSWORD });
  const token = apiRes.data.token;
  const userInfo = apiRes.data;
  console.log('[1] token len:', token?.length);

  await page.evaluate(({ token, userInfo }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    localStorage.setItem('userRole', userInfo.role || 'admin');
    document.cookie = `auth_token=${token}; path=/`;
  }, { token, userInfo });

  // 2. 跳到 waterfall
  await page.goto(`${BASE}/waterfall`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  console.log('[2] url:', page.url());

  // 3. 等左侧广告位列表渲染
  await page.waitForSelector('.app-master-item', { timeout: 10000 });
  const placements = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.app-master-item')).map((el, i) => ({
      idx: i,
      name: el.querySelector('.app-master-item-name-text')?.textContent?.trim(),
      token: el.querySelector('.app-master-item-token-text')?.textContent?.trim(),
    }));
  });
  console.log('[3] placements:', placements.slice(0, 5));

  // 4. 选第一个广告位
  await page.evaluate(() => {
    const items = document.querySelectorAll('.app-master-item');
    if (items[0]) items[0].click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 5. 检查状态
  const beforeLoad = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.el-table__row'));
    return {
      tgSelector: document.querySelector('.wf-tg-selector input')?.value || null,
      rowCount: rows.length,
      rows: rows.map((r) => {
        const btns = Array.from(r.querySelectorAll('button')).map(b => ({
          text: b.textContent?.trim(),
          disabled: b.disabled,
        }));
        return {
          name: r.querySelector('.wf-config-name')?.textContent?.trim(),
          group: r.querySelector('.wf-config-group-name')?.textContent?.trim(),
          btns,
        };
      }),
    };
  });
  console.log('[4] before:', JSON.stringify(beforeLoad, null, 2));

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'wf-before-load.png'), fullPage: true });

  // 6. 找「加载」按钮（非已加载），点击
  const clickInfo = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.el-table__row'));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const btn = Array.from(r.querySelectorAll('button')).find(b => b.textContent?.trim() === '加载');
      if (btn && !btn.disabled) {
        const tg = r.querySelector('.wf-config-group-name')?.textContent?.trim();
        const name = r.querySelector('.wf-config-name')?.textContent?.trim();
        const tgId = r.querySelector('td')?.textContent?.trim() || '';
        btn.click();
        return { clicked: true, group: tg, name, rowIdx: i };
      }
    }
    return { clicked: false };
  });
  console.log('[5] click:', JSON.stringify(clickInfo));
  await new Promise(r => setTimeout(r, 1500));

  const afterLoad = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.el-table__row'));
    const counts = Array.from(document.querySelectorAll('.wf-layer-count')).map(c => c.textContent?.trim());
    return {
      tgSelector: document.querySelector('.wf-tg-selector input')?.value || null,
      layerCounts: counts,
      rows: rows.map((r) => {
        const btns = Array.from(r.querySelectorAll('button')).map(b => ({
          text: b.textContent?.trim(),
          disabled: b.disabled,
        }));
        return {
          name: r.querySelector('.wf-config-name')?.textContent?.trim(),
          group: r.querySelector('.wf-config-group-name')?.textContent?.trim(),
          btns,
        };
      }),
    };
  });
  console.log('[6] after:', JSON.stringify(afterLoad, null, 2));

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'wf-after-load.png'), fullPage: true });

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
