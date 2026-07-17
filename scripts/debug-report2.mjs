import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox'],
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// 拿 token
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

// 找看版
const boards = await page.$$eval('[class*="report-master-item"]', els => els.map(e => ({
  name: e.querySelector('.report-master-item-name-text')?.textContent?.trim() || '',
  desc: e.querySelector('.report-master-item-desc')?.textContent?.trim() || '',
})));
console.log('boards:', JSON.stringify(boards, null, 2));

// 找按广告位的看版
const placementBoard = await page.evaluateHandle(() => {
  const items = document.querySelectorAll('[class*="report-master-item"]');
  for (const it of items) {
    const name = it.querySelector('.report-master-item-name-text')?.textContent?.trim() || '';
    const desc = it.querySelector('.report-master-item-desc')?.textContent?.trim() || '';
    if (name.includes('广告位') || desc.includes('广告位')) return it;
  }
  return items[0];
});

if (placementBoard) {
  await placementBoard.click();
  await wait(2000);
  console.log('clicked placement board');
}

await page.screenshot({ path: '/workspace/projects/public/sdk-screenshots/report-placement.png', fullPage: true });

// 分析表格
const tableInfo = await page.evaluate(() => {
  const ths = Array.from(document.querySelectorAll('.el-table__header-wrapper table th .cell'));
  const tds = Array.from(document.querySelectorAll('.el-table__body-wrapper table tbody tr:first-child td .cell'));
  return {
    thTexts: ths.map(t => (t.textContent || '').trim()),
    tdTexts: tds.map(t => (t.textContent || '').trim()),
    thPos: ths.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
    tdPos: tds.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
    tableScrollWidth: document.querySelector('.el-table')?.scrollWidth,
    tableClientWidth: document.querySelector('.el-table')?.clientWidth,
    bodyWrapperScrollWidth: document.querySelector('.el-table__body-wrapper')?.scrollWidth,
    bodyWrapperClientWidth: document.querySelector('.el-table__body-wrapper')?.clientWidth,
    wrapWidth: document.querySelector('.page-table-wrap')?.offsetWidth,
  };
});
console.log('table info:', JSON.stringify(tableInfo, null, 2));

await browser.close();
