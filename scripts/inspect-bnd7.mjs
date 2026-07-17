import puppeteer from 'puppeteer';
const TOKEN = process.env.VERIFY_TOKEN;
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setCacheEnabled(false);
await page.setViewport({ width: 1440, height: 900 });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await page.goto('http://localhost:5000/?_t=' + Date.now(), { waitUntil: 'networkidle2' });
await page.evaluate((t) => { localStorage.setItem('token', t); }, TOKEN);
await page.goto('http://localhost:5000/app?_t=' + Date.now(), { waitUntil: 'networkidle0' });
await sleep(2000);
const apps = await page.$$('.app-master-item');
if (apps.length > 0) { await apps[0].click(); await sleep(1500); }
const bind = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '关联广告平台'));
if (bind.asElement()) { await bind.asElement().click(); await sleep(2000); }
const sel = await page.$('.bnd-select');
if (sel) { await sel.click(); await sleep(800); }
const optEl = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.el-select-dropdown__item')).find(o => o.textContent.includes('百度')));
if (optEl.asElement()) { await optEl.asElement().click(); await sleep(1500); }

const trace = await page.evaluate(() => {
  const out = [];
  const bndBody = document.querySelector('.bnd-body');
  if (!bndBody) return [];
  // walk all children
  for (const el of bndBody.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.height > 50 && r.height < 1000) {
      out.push({
        tag: el.tagName,
        cls: el.className?.toString().slice(0, 50),
        h: Math.round(r.height),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
      });
    }
  }
  return out.slice(0, 25);
});
console.log(JSON.stringify(trace, null, 2));
await browser.close();
