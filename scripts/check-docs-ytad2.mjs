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
// 点 API 参考分类
await page.evaluate(() => {
  const items = document.querySelectorAll('.docs-cat-item');
  for (const i of items) { if (i.textContent?.trim() === 'API 参考') { i.click(); return; } }
});
await wait(2000);
// 找到含 YTAd 的项并点开
const list = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.docs-doc-item')).map(i => i.textContent?.trim());
});
console.log('API 参考 list:', JSON.stringify(list));
const ytadIdx = list.findIndex(t => t?.includes('YTAd'));
console.log('ytadIdx:', ytadIdx);
if (ytadIdx >= 0) {
  await page.evaluate((idx) => {
    const items = document.querySelectorAll('.docs-doc-item');
    items[idx]?.click();
  }, ytadIdx);
  await wait(2000);
  const titleEl = await page.evaluate(() => {
    const t = document.querySelector('.docs-detail-title') || document.querySelector('.docs-doc-title') || document.querySelector('h1,h2,h3');
    return t?.textContent?.trim();
  });
  console.log('detail title:', JSON.stringify(titleEl));
  await page.screenshot({ path: '/workspace/projects/public/sdk-screenshots/api-ytad-before.png' });
}
await browser.close();
