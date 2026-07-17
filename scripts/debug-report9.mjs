import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox'],
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
});
const page = await browser.newPage();
await page.setViewport({ width: 600, height: 800, deviceScaleFactor: 1 });

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

// 点击「3列无维度」看版
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

const initial = await page.evaluate(() => {
  const ths = Array.from(document.querySelectorAll('.el-table__header-wrapper table th'));
  const tds = Array.from(document.querySelectorAll('.el-table__body-wrapper table tbody tr:first-child td'));
  return {
    thPos: ths.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
    tdPos: tds.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
    bodyWrapperScrollWidth: document.querySelector('.el-table__body-wrapper')?.scrollWidth,
    bodyWrapperClientWidth: document.querySelector('.el-table__body-wrapper')?.clientWidth,
    bodyWrapperScrollLeft: document.querySelector('.el-table__body-wrapper')?.scrollLeft,
    headerWrapperScrollLeft: document.querySelector('.el-table__header-wrapper')?.scrollLeft,
  };
});
console.log('INITIAL:', JSON.stringify(initial, null, 2));

// 触发横向滚动
await page.evaluate(() => {
  const wrap = document.querySelector('.el-table__body-wrapper');
  if (wrap) {
    wrap.scrollLeft = 50;
    wrap.dispatchEvent(new Event('scroll', { bubbles: true }));
  }
});
await wait(500);

const afterScroll = await page.evaluate(() => {
  const ths = Array.from(document.querySelectorAll('.el-table__header-wrapper table th'));
  const tds = Array.from(document.querySelectorAll('.el-table__body-wrapper table tbody tr:first-child td'));
  return {
    thPos: ths.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
    tdPos: tds.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
    bodyWrapperScrollLeft: document.querySelector('.el-table__body-wrapper')?.scrollLeft,
    headerWrapperScrollLeft: document.querySelector('.el-table__header-wrapper')?.scrollLeft,
  };
});
console.log('AFTER SCROLL:', JSON.stringify(afterScroll, null, 2));

await page.screenshot({ path: '/workspace/projects/public/sdk-screenshots/report-after-scroll.png' });
await browser.close();
