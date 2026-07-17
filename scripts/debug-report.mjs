import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox'],
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });

page.on('console', (m) => console.log('[browser]', m.type(), m.text().slice(0, 200)));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// 获取真实 token
const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'yufutang@adtalos.com', password: 'Test123456' }),
});
const loginData = await loginRes.json();
const realToken = loginData.data?.token;
console.log('got token:', realToken?.slice(0, 30));

// Login
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' });
await wait(800);

// 注入 token
await page.evaluate((tk) => {
  localStorage.setItem('token', tk);
  document.cookie = `auth_token=${tk}; path=/`;
}, realToken);

await page.goto('http://localhost:5000/report/overview', { waitUntil: 'domcontentloaded' });
await wait(3000);

// 找看版 (左侧列表)
const tabBtns = await page.$$eval('.el-tabs__item', els => els.map(e => e.textContent?.trim()));
console.log('tab btns:', tabBtns);

// 找 el-card 看版
const cards = await page.$$eval('.el-card', els => els.map(e => e.textContent?.trim().slice(0, 60)));
console.log('cards:', cards);

// 找看版卡片
const overviewBoard = await page.$('.overview-board-card');
if (overviewBoard) {
  await overviewBoard.click();
  await wait(2000);
  console.log('clicked overview board');
} else {
  // 试 click 第一个 el-card
  const firstCard = await page.$('.el-card');
  if (firstCard) {
    await firstCard.click();
    await wait(2000);
    console.log('clicked first card');
  }
}

await page.screenshot({ path: '/workspace/projects/public/sdk-screenshots/report-bug-overview.png', fullPage: true });

// 分析表格
const tableInfo = await page.evaluate(() => {
  const ths = Array.from(document.querySelectorAll('.el-table__header-wrapper table th'));
  const firstRowTds = Array.from(document.querySelectorAll('.el-table__body-wrapper table tbody tr:first-child td'));
  return {
    thCount: ths.length,
    tdCount: firstRowTds.length,
    thInfo: ths.map(t => ({ text: (t.textContent || '').trim().slice(0, 12), w: t.offsetWidth, left: Math.round(t.getBoundingClientRect().left) })),
    tdInfo: firstRowTds.map(t => ({ text: (t.textContent || '').trim().slice(0, 12), w: t.offsetWidth, left: Math.round(t.getBoundingClientRect().left) })),
    tableScrollWidth: document.querySelector('.el-table')?.scrollWidth,
    tableClientWidth: document.querySelector('.el-table')?.clientWidth,
    bodyWrapperScrollWidth: document.querySelector('.el-table__body-wrapper')?.scrollWidth,
    bodyWrapperClientWidth: document.querySelector('.el-table__body-wrapper')?.clientWidth,
    wrapWidth: document.querySelector('.page-table-wrap')?.offsetWidth,
    hasGutter: !!document.querySelector('.el-table__body-wrapper .el-table__column--selection, .el-table__fixed-left-patch'),
  };
});
console.log('table info:', JSON.stringify(tableInfo, null, 2));

await browser.close();
