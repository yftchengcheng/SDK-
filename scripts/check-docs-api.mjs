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
// 点 API 参考
await page.evaluate(() => {
  const items = document.querySelectorAll('.docs-cat-item');
  for (const i of items) { if (i.textContent?.trim() === 'API 参考') { i.click(); return; } }
});
await wait(2000);
const docList = await page.evaluate(() => {
  const items = document.querySelectorAll('.docs-doc-item');
  return Array.from(items).map(i => i.textContent?.trim());
});
console.log('API 参考 docs:', JSON.stringify(docList));
// 找含 YTAd 的
const targetIdx = await page.evaluate(() => {
  const items = document.querySelectorAll('.docs-doc-item');
  for (let idx = 0; idx < items.length; idx++) {
    if (items[idx].textContent?.includes('YTAd')) return idx;
  }
  return -1;
});
console.log('YTAd target idx:', targetIdx);
if (targetIdx >= 0) {
  await page.evaluate((idx) => {
    const items = document.querySelectorAll('.docs-doc-item');
    if (items[idx]) items[idx].click();
  }, targetIdx);
  await wait(1500);
  await page.screenshot({ path: '/workspace/projects/public/sdk-screenshots/docs-ytad-detail.png' });
  const title = await page.evaluate(() => document.querySelector('.docs-detail-title')?.textContent?.trim());
  console.log('detail title:', JSON.stringify(title));
}
await browser.close();
