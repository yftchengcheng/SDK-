import puppeteer from 'puppeteer';
import fs from 'fs';

const TOKEN = process.env.VERIFY_TOKEN;
if (!TOKEN) { console.error('VERIFY_TOKEN env required'); process.exit(1); }

const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

await page.goto('http://localhost:5000/', { waitUntil: 'networkidle2' });
await page.evaluate((t) => {
  localStorage.setItem('token', t);
}, TOKEN);

console.log('[1] navigate /app');
await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle0' });
await sleep(2000);

const apps = await page.$$('.app-master-item');
console.log('  app items:', apps.length);
if (apps.length > 0) {
  await apps[0].click();
  await sleep(1500);
}

console.log('[2] click 关联广告平台');
const bindBtnEl = await page.evaluateHandle(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  return btns.find(b => b.textContent.includes('关联广告平台'));
});
const el = bindBtnEl.asElement();
if (el) {
  await el.click();
  await sleep(2000);
}

console.log('[3] select 穿山甲');
const sel = await page.$('.bnd-select');
if (sel) {
  await sel.click();
  await sleep(800);
  const optEl = await page.evaluateHandle(() => {
    const opts = Array.from(document.querySelectorAll('.el-select-dropdown__item'));
    return opts.find(o => o.textContent.includes('穿山甲') || o.textContent.includes('CSJ'));
  });
  const oe = optEl.asElement();
  if (oe) {
    await oe.click();
    await sleep(1500);
  }
}

await sleep(1500);
fs.writeFileSync('/tmp/bnd-csj-full.png', await page.screenshot({ fullPage: true }));

const labels = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.bnd-field-label-text')).map(e => e.textContent.trim());
});
console.log('  visible field labels (CSJ):', labels);

const drawerInfo = await page.evaluate(() => {
  const drawer = document.querySelector('.el-drawer');
  if (!drawer) return null;
  return {
    bodyHeight: drawer.querySelector('.el-drawer__body')?.scrollHeight,
    bodyClientHeight: drawer.querySelector('.el-drawer__body')?.clientHeight,
    bodyScrollTop: drawer.querySelector('.el-drawer__body')?.scrollTop,
    drawerHeight: drawer.getBoundingClientRect().height,
    innerHTML: drawer.querySelector('.el-drawer__body')?.innerHTML.slice(0, 3000),
  };
});
console.log('  drawer info:', JSON.stringify(drawerInfo, null, 2));

await browser.close();
