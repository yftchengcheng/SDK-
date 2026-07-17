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
  const tds = document.querySelectorAll('.el-table__body-wrapper tbody tr:first-child td .cell');
  return Array.from(tds).map(cell => {
    const cellR = cell.getBoundingClientRect();
    const span = cell.firstElementChild;
    if (!span) return { cellMid: Math.round(cellR.x + cellR.width/2), noSpan: true };
    const spanR = span.getBoundingClientRect ? span.getBoundingClientRect() : { x: 0, width: 0 };
    const spanText = span.getBoundingClientRect ? { x: spanR.x, width: spanR.width } : { x: 0, width: 0 };
    return {
      cellX: Math.round(cellR.x), cellEnd: Math.round(cellR.x + cellR.width), cellMid: Math.round(cellR.x + cellR.width/2),
      spanX: Math.round(spanR.x), spanW: Math.round(spanR.width), spanEnd: Math.round(spanR.x + spanR.width), spanMid: Math.round(spanR.x + spanR.width/2),
      textX: Math.round(spanText.x), textW: Math.round(spanText.width), textMid: Math.round(spanText.x + spanText.width/2),
      spanClass: span.className, spanDisplay: getComputedStyle(span).display, spanTextAlign: getComputedStyle(span).textAlign,
    };
  });
});
console.log(JSON.stringify(data, null, 2));
const table = await page.$('.el-table');
if (table) await table.screenshot({ path: '/workspace/projects/public/sdk-screenshots/report-center-final.png' });
await browser.close();
