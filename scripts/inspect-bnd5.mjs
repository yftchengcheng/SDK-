import puppeteer from 'puppeteer';
import fs from 'fs';
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

const measure = async (code) => {
  const sel = await page.$('.bnd-select');
  if (sel) { await sel.click(); await sleep(800); }
  const optEl = await page.evaluateHandle((kw) => Array.from(document.querySelectorAll('.el-select-dropdown__item')).find(o => o.textContent.includes(kw)), code);
  if (optEl.asElement()) { await optEl.asElement().click(); await sleep(1500); }
  return await page.evaluate(() => {
    const bndBody = document.querySelector('.bnd-body');
    const items = document.querySelectorAll('.bnd-body .el-form-item');
    const last = items[items.length - 1];
    return {
      bndBodyClientH: bndBody?.clientHeight,
      bndBodyScrollH: bndBody?.scrollHeight,
      bndBodyHasScroll: (bndBody?.scrollHeight || 0) > (bndBody?.clientHeight || 0) + 1,
      lastItemText: last?.textContent?.trim().slice(0, 30),
      lastItemBottom: last?.getBoundingClientRect().bottom,
      formItemCount: items.length,
    };
  });
};

for (const code of ['穿山甲', '优量汇', '快手', '百度']) {
  console.log(code, JSON.stringify(await measure(code)));
  fs.writeFileSync(`/tmp/bnd-fix-${code}.png`, await page.screenshot({ fullPage: true }));
}
await browser.close();
