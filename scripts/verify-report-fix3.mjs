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
const el = target.asElement();
if (el) await el.click();
await wait(2500);

const data = await page.evaluate(() => {
  // 用 Range 测文字节点位置
  const ths = Array.from(document.querySelectorAll('.el-table__header-wrapper thead th .cell'));
  const tds = Array.from(document.querySelectorAll('.el-table__body-wrapper tbody tr:first-child td .cell'));
  const measure = (cell) => {
    const r = cell.getBoundingClientRect();
    const range = document.createRange();
    // 找 cell 内第一个 text node
    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, null);
    const tn = walker.nextNode();
    let textRect = null;
    if (tn) {
      range.selectNodeContents(tn);
      textRect = range.getBoundingClientRect();
    }
    return { cellX: r.x, cellW: r.width, textX: textRect?.x, textW: textRect?.width, align: getComputedStyle(cell).textAlign };
  };
  return { ths: ths.map(measure), tds: tds.map(measure) };
});
console.log(JSON.stringify(data, null, 2));
await page.screenshot({ path: '/workspace/projects/public/sdk-screenshots/report-fix-v3.png', fullPage: false });
await browser.close();
