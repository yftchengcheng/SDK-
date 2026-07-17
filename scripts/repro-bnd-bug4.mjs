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

const selectAndInspect = async (code) => {
  const sel = await page.$('.bnd-select');
  if (sel) { await sel.click(); await sleep(800); }
  const optEl = await page.evaluateHandle((kw) => Array.from(document.querySelectorAll('.el-select-dropdown__item')).find(o => o.textContent.includes(kw)), code);
  if (optEl.asElement()) { await optEl.asElement().click(); await sleep(1500); }
  return await page.evaluate(() => {
    const drawer = document.querySelector('.el-drawer');
    const body = drawer?.querySelector('.el-drawer__body');
    if (!drawer || !body) return { err: 'no drawer' };
    const items = document.querySelectorAll('.el-form-item');
    const last = items[items.length - 1];
    const lastRect = last?.getBoundingClientRect();
    return {
      drawerTop: drawer.getBoundingClientRect().top,
      drawerBottom: drawer.getBoundingClientRect().bottom,
      drawerH: drawer.getBoundingClientRect().height,
      viewportH: window.innerHeight,
      bodyScrollH: body.scrollHeight,
      bodyClientH: body.clientHeight,
      lastItemBottom: lastRect?.bottom,
      lastItemText: last?.querySelector('.el-form-item__label')?.textContent?.trim(),
      hasScroll: body.scrollHeight > body.clientHeight + 1,
    };
  });
};

for (const code of ['穿山甲', '优量汇', '快手', '百度']) {
  console.log(code, JSON.stringify(await selectAndInspect(code)));
  fs_write: await page.screenshot({ fullPage: true });
}
import fs from 'fs';
for (const code of ['穿山甲', '优量汇', '快手', '百度']) {
  const info = await selectAndInspect(code);
  console.log(code, JSON.stringify(info));
  fs.writeFileSync(`/tmp/bnd-${code}.png`, await page.screenshot({ fullPage: true }));
}

await browser.close();
