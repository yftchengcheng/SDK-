// 完整截图：瀑布流配置页面（修复后）
import puppeteer from 'puppeteer';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve('public/sdk-screenshots');
const BASE = 'http://localhost:5000';

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  const apiRes = await page.evaluate(async () => {
    const r = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'yufutang@adtalos.com', password: 'Test123456' }),
    });
    return r.json();
  });
  const token = apiRes.data.token;
  const userInfo = apiRes.data;
  await page.evaluate(({ token, userInfo }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    localStorage.setItem('userRole', userInfo.role || 'admin');
    document.cookie = `auth_token=${token}; path=/`;
  }, { token, userInfo });

  await page.goto(`${BASE}/waterfall`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // 选第一个有 config 的广告位（启动开屏）
  await page.evaluate(() => {
    const items = document.querySelectorAll('.app-master-item');
    if (items[0]) items[0].click();
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'waterfall-fixed.png'), fullPage: true });

  await browser.close();
  console.log('done');
}

main().catch(e => { console.error(e); process.exit(1); });
