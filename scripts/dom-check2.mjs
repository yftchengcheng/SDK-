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
await page.goto('http://localhost:5000/report/overview', { waitUntil: 'domcontentloaded' });
await wait(3000);
const target = await page.evaluateHandle(() => {
  const items = document.querySelectorAll('[class*="report-master-item"]');
  for (const it of items) { if (it.textContent?.includes('3列无维度测试')) return it; }
  return null;
});
if (target) await target.click();
await wait(2000);

const style = await page.evaluate(() => {
  const thCell = document.querySelector('.el-table__header-wrapper th .cell');
  const tdCell = document.querySelector('.el-table__body-wrapper td .cell');
  const thCS = getComputedStyle(thCell);
  const tdCS = getComputedStyle(tdCell);
  return {
    thCellStyle: { width: thCS.width, display: thCS.display, padding: thCS.padding, boxSizing: thCS.boxSizing },
    tdCellStyle: { width: tdCS.width, display: tdCS.display, padding: tdCS.padding, boxSizing: tdCS.boxSizing },
    thCellRect: thCell?.getBoundingClientRect(),
    tdCellRect: tdCell?.getBoundingClientRect(),
  };
});
console.log(JSON.stringify(style, null, 2));
await browser.close();
