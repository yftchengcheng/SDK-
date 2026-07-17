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
// 遍历所有分类，把所有文档标题拿出来
const allTitles = await page.evaluate(() => {
  const result = [];
  const cats = document.querySelectorAll('.docs-cat-item');
  for (let i = 0; i < cats.length; i++) {
    const catName = cats[i].textContent?.trim();
    cats[i].click();
  }
  return new Promise(resolve => {
    setTimeout(() => {
      const titles = document.querySelectorAll('.docs-doc-item');
      resolve(Array.from(titles).map(t => t.textContent?.trim()));
    }, 1500);
  });
});
console.log('all visible doc titles:', JSON.stringify(allTitles));
await browser.close();
