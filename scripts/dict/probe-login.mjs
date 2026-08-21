import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5000';
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  // 截一张登录页，看清实际结构
  await page.screenshot({ path: '/tmp/login-page.png' });
  const inputTypes = await page.$$eval('input', (els) =>
    els.map((e) => ({ type: e.type, placeholder: e.placeholder, name: e.name })),
  );
  console.log('login inputs:', JSON.stringify(inputTypes, null, 2));
  const buttons = await page.$$eval('button', (els) => els.map((e) => e.textContent?.trim() || ''));
  console.log('login buttons:', buttons);
} finally {
  await browser.close();
}
