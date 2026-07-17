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
  const dialog = document.querySelector('.el-dialog');
  const main = document.querySelector('.mp-main');
  const side = document.querySelector('.mp-side');
  const cats = document.querySelector('.mp-cats');
  const catCol = document.querySelector('.mp-cat-col');
  return {
    dialogW: dialog ? Math.round(dialog.getBoundingClientRect().width) : 0,
    dialogH: dialog ? Math.round(dialog.getBoundingClientRect().height) : 0,
    mainH: main ? Math.round(main.getBoundingClientRect().height) : 0,
    mainW: main ? Math.round(main.getBoundingClientRect().width) : 0,
    catsW: cats ? Math.round(cats.getBoundingClientRect().width) : 0,
    catsH: cats ? Math.round(cats.getBoundingClientRect().height) : 0,
    sideW: side ? Math.round(side.getBoundingClientRect().width) : 0,
    sideH: side ? Math.round(side.getBoundingClientRect().height) : 0,
    catColW: catCol ? Math.round(catCol.getBoundingClientRect().width) : 0,
  };
});
console.log(JSON.stringify(data, null, 2));
const dialog = await page.$('.el-dialog');
if (dialog) await dialog.screenshot({ path: '/workspace/projects/public/sdk-screenshots/metric-picker-v3.png' });
await browser.close();
