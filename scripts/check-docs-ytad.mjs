import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'yufutang@adtalos.com', password: 'Test123456' }) });
const realToken = (await loginRes.json()).data?.token;
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' });
await wait(800);
await page.evaluate((tk) => { localStorage.setItem('token', tk); document.cookie = `auth_token=${tk}; path=/`; }, realToken);
await page.goto('http://localhost:5000/sdk/docs', { waitUntil: 'domcontentloaded' });
await wait(3000);
const cats = await page.evaluate(() => {
  const items = document.querySelectorAll('.docs-cat-item');
  return Array.from(items).map(i => i.textContent?.trim()).slice(0, 12);
});
console.log('categories:', JSON.stringify(cats));
await page.screenshot({ path: '/workspace/projects/public/sdk-screenshots/docs-list.png' });
await browser.close();
