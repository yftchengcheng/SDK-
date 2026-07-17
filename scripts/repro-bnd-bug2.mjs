import puppeteer from 'puppeteer';
import fs from 'fs';

const TOKEN = process.env.VERIFY_TOKEN;
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
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
const bindBtnEl = await page.evaluateHandle(() => {
  return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('关联广告平台'));
});
if (bindBtnEl.asElement()) {
  await bindBtnEl.asElement().click();
  await sleep(2000);
}

for (const code of ['穿山甲', '优量汇', '快手', '百度']) {
  console.log(`\n=== ${code} ===`);
  await page.evaluate(() => {
    const close = document.querySelector('.el-drawer__close-btn');
    if (close) close.click();
  });
  await sleep(500);
  const bindBtnEl2 = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('关联广告平台'));
  });
  if (bindBtnEl2.asElement()) {
    await bindBtnEl2.asElement().click();
    await sleep(2000);
  }
  const sel = await page.$('.bnd-select');
  if (sel) {
    await sel.click();
    await sleep(800);
    const optEl = await page.evaluateHandle((kw) => {
      return Array.from(document.querySelectorAll('.el-select-dropdown__item')).find(o => o.textContent.includes(kw));
    }, code);
    if (optEl.asElement()) {
      await optEl.asElement().click();
      await sleep(1500);
    }
  }
  const labels = await page.evaluate(() => Array.from(document.querySelectorAll('.bnd-field-label-text')).map(e => e.textContent.trim()));
  console.log('  field labels:', labels);

  const drawerInfo = await page.evaluate(() => {
    const drawer = document.querySelector('.el-drawer');
    const body = drawer?.querySelector('.el-drawer__body');
    if (!drawer || !body) return null;
    return {
      drawerH: drawer.getBoundingClientRect().height,
      bodyScrollH: body.scrollHeight,
      bodyClientH: body.clientHeight,
      hasScroll: body.scrollHeight > body.clientHeight,
      drawerBottomY: drawer.getBoundingClientRect().bottom,
      viewportH: window.innerHeight,
    };
  });
  console.log('  drawer:', drawerInfo);

  fs.writeFileSync(`/tmp/bnd-${code}.png`, await page.screenshot({ fullPage: true }));
  console.log(`  saved /tmp/bnd-${code}.png`);
}

await browser.close();
