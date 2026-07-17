import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome' });
const page = await browser.newPage();
await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 1 });
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
const t = target.asElement();
if (t) await t.click();
await wait(3000);

const data = await page.evaluate(() => {
  const ths = document.querySelectorAll('.el-table__header-wrapper thead th .cell');
  const tds = document.querySelectorAll('.el-table__body-wrapper tbody tr:first-child td .cell');
  const measure = (cell) => {
    const r = cell.getBoundingClientRect();
    const range = document.createRange();
    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, null);
    const tn = walker.nextNode();
    let textRect = null;
    if (tn) { range.selectNodeContents(tn); textRect = range.getBoundingClientRect(); }
    return {
      cellX: Math.round(r.x), cellEnd: Math.round(r.x + r.width), cellMid: Math.round(r.x + r.width/2),
      textX: Math.round(textRect?.x||0), textW: Math.round(textRect?.width||0), textEnd: Math.round((textRect?.x||0)+(textRect?.width||0)),
      textMid: Math.round((textRect?.x||0)+(textRect?.width||0)/2),
    };
  };
  return { ths: Array.from(ths).map(measure), tds: Array.from(tds).map(measure) };
});
console.log(JSON.stringify(data, null, 2));
const table = await page.$('.el-table');
if (table) await table.screenshot({ path: '/workspace/projects/public/sdk-screenshots/report-center-final.png' });
await browser.close();
