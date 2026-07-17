import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox'],
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
});
const page = await browser.newPage();
// 用户截图应该是 ~1280px 视口 (截图原 408x484 = 612x726 device pixels)
await page.setViewport({ width: 1024, height: 700, deviceScaleFactor: 1.5 });

const wait = (ms) => new Promise(r => setTimeout(r, ms));

const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'yufutang@adtalos.com', password: 'Test123456' }),
});
const realToken = (await loginRes.json()).data?.token;

await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' });
await wait(800);
await page.evaluate((tk) => {
  localStorage.setItem('token', tk);
  document.cookie = `auth_token=${tk}; path=/`;
}, realToken);

await page.goto('http://localhost:5000/report/overview', { waitUntil: 'domcontentloaded' });
await wait(3000);

await page.screenshot({ path: '/workspace/projects/public/sdk-screenshots/report-1024.png', fullPage: false });

// 看下水平滚动情况
const tableInfo = await page.evaluate(() => {
  const ths = Array.from(document.querySelectorAll('.el-table__header-wrapper table th'));
  const tds = Array.from(document.querySelectorAll('.el-table__body-wrapper table tbody tr:first-child td'));
  const fixedLeft = document.querySelectorAll('.el-table__fixed-left-wrapper');
  return {
    thTexts: ths.map(t => (t.textContent || '').trim()),
    tdTexts: tds.map(t => (t.textContent || '').trim()),
    thPos: ths.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
    tdPos: tds.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
    tableScrollWidth: document.querySelector('.el-table')?.scrollWidth,
    bodyWrapperScrollWidth: document.querySelector('.el-table__body-wrapper')?.scrollWidth,
    bodyWrapperClientWidth: document.querySelector('.el-table__body-wrapper')?.clientWidth,
    bodyWrapperScrollLeft: document.querySelector('.el-table__body-wrapper')?.scrollLeft,
    fixedLeftExists: fixedLeft.length,
    fixedLeftWidth: Array.from(fixedLeft).map(f => f.getBoundingClientRect().width),
  };
});
console.log('table info:', JSON.stringify(tableInfo, null, 2));

await browser.close();
