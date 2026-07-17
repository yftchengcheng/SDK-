import puppeteer from 'puppeteer';
const TOKEN = process.env.VERIFY_TOKEN;
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await page.goto('http://localhost:5000/', { waitUntil: 'networkidle2' });
await page.evaluate((t) => { localStorage.setItem('token', t); }, TOKEN);
await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle0' });
await sleep(2000);
const apps = await page.$$('.app-master-item');
if (apps.length > 0) { await apps[0].click(); await sleep(1500); }
const bindBtnEl = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('关联广告平台')));
if (bindBtnEl.asElement()) { await bindBtnEl.asElement().click(); await sleep(2000); }
const sel = await page.$('.bnd-select');
if (sel) { await sel.click(); await sleep(800); }
// 选第一个选项
const optEl = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.el-select-dropdown__item')).find(o => true));
if (optEl.asElement()) { await optEl.asElement().click(); await sleep(1500); }

const html = await page.evaluate(() => {
  const drawer = document.querySelector('.el-drawer');
  if (!drawer) return 'no drawer';
  return drawer.outerHTML.slice(0, 4000);
});
console.log(html);
await browser.close();
