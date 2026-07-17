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
const editBtn = await page.evaluateHandle(() => {
  const all = document.querySelectorAll('.el-button');
  for (const b of all) { if (b.textContent?.trim() === '设置') return b; }
  return null;
});
const t = editBtn.asElement();
if (t) await t.click();
await wait(2000);

// 通过页面暴露的 setSelected（如有）或直接点所有 checkbox 模拟选超级多
const before = await page.evaluate(() => {
  const dialog = document.querySelector('.el-dialog');
  const main = document.querySelector('.mp-main');
  const side = document.querySelector('.mp-side');
  const sideList = document.querySelector('.mp-side-list');
  return {
    dialogH: Math.round(dialog.getBoundingClientRect().height),
    mainH: Math.round(main.getBoundingClientRect().height),
    sideH: Math.round(side.getBoundingClientRect().height),
    sideListH: Math.round(sideList.getBoundingClientRect().height),
    sideListScrollH: sideList.scrollHeight,
    sideListClientH: sideList.clientHeight,
    sideListOverflow: getComputedStyle(sideList).overflowY,
  };
});
console.log('BEFORE:', JSON.stringify(before, null, 2));

// 点击所有可点 checkbox
await page.evaluate(() => {
  const items = document.querySelectorAll('.mp-cat-item .el-checkbox__input');
  items.forEach(c => c.click());
});
await wait(800);

const after = await page.evaluate(() => {
  const dialog = document.querySelector('.el-dialog');
  const main = document.querySelector('.mp-main');
  const side = document.querySelector('.mp-side');
  const sideList = document.querySelector('.mp-side-list');
  return {
    dialogH: Math.round(dialog.getBoundingClientRect().height),
    mainH: Math.round(main.getBoundingClientRect().height),
    sideH: Math.round(side.getBoundingClientRect().height),
    sideListH: Math.round(sideList.getBoundingClientRect().height),
    sideListScrollH: sideList.scrollHeight,
    sideListClientH: sideList.clientHeight,
    sideListOverflow: getComputedStyle(sideList).overflowY,
    sideListRows: document.querySelectorAll('.mp-side-row').length,
  };
});
console.log('AFTER:', JSON.stringify(after, null, 2));

await browser.close();
