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

const data = await page.evaluate(() => {
  const cats = document.querySelector('.mp-cats');
  const cat = document.querySelector('.mp-cat');
  const title = document.querySelector('.mp-cat-title');
  const itemLabel = document.querySelector('.mp-cat-item .el-checkbox__label');
  return {
    catsColumns: cats ? getComputedStyle(cats).gridTemplateColumns : 'no cats',
    catsCount: document.querySelectorAll('.mp-cat').length,
    catWidth: cat ? Math.round(cat.getBoundingClientRect().width) : 0,
    titleFontSize: title ? getComputedStyle(title).fontSize : 'no title',
    itemLabelFontSize: itemLabel ? getComputedStyle(itemLabel).fontSize : 'no item label',
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
