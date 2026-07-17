import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox'],
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
});
const page = await browser.newPage();
// 用户截图估算视口 ~1280
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

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

const target = await page.evaluateHandle(() => {
  const items = document.querySelectorAll('[class*="report-master-item"]');
  for (const it of items) {
    if (it.textContent?.includes('3列无维度测试')) return it;
  }
  return null;
});
if (target) {
  await target.click();
  await wait(2000);
}

await page.screenshot({ path: '/workspace/projects/public/sdk-screenshots/report-3col-1280.png', fullPage: false });

const tableInfo = await page.evaluate(() => {
  const ths = Array.from(document.querySelectorAll('.el-table__header-wrapper table th'));
  const tds = Array.from(document.querySelectorAll('.el-table__body-wrapper table tbody tr:first-child td'));
  return {
    thPos: ths.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
    tdPos: tds.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
    tableScrollWidth: document.querySelector('.el-table')?.scrollWidth,
    bodyWrapperScrollWidth: document.querySelector('.el-table__body-wrapper')?.scrollWidth,
    bodyWrapperClientWidth: document.querySelector('.el-table__body-wrapper')?.clientWidth,
  };
});
console.log('table info:', JSON.stringify(tableInfo, null, 2));

// 详细看 cell 内部
const cellInfo = await page.evaluate(() => {
  const ths = Array.from(document.querySelectorAll('.el-table__header-wrapper table th .cell'));
  const tds = Array.from(document.querySelectorAll('.el-table__body-wrapper table tbody tr:first-child td .cell'));
  return {
    thCellPos: ths.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
    tdCellPos: tds.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
  };
});
console.log('cell info:', JSON.stringify(cellInfo, null, 2));

await browser.close();
