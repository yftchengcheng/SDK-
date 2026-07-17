import puppeteer from 'puppeteer';
import fs from 'fs';
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
const bind = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '关联广告平台'));
const bEl = bind.asElement();
if (bEl) { await bEl.click(); await sleep(2000); }

// 查看当前 drawer 状态
const allDrawers = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.el-drawer')).map(d => ({
    header: d.querySelector('.el-drawer__title')?.textContent,
    visible: getComputedStyle(d.querySelector('.el-drawer__body') || d).display !== 'none',
    size: d.getBoundingClientRect().height,
  }));
});
console.log('drawers after click:', allDrawers);

// 如果有"关联"字样的 drawer，找到对应的选择
const allTitles = await page.evaluate(() => Array.from(document.querySelectorAll('.el-drawer__title')).map(t => t.textContent));
console.log('drawer titles:', allTitles);

const selectAndMeasure = async (code) => {
  const sel = await page.$('.bnd-select');
  if (sel) { await sel.click(); await sleep(800); }
  const optEl = await page.evaluateHandle((kw) => Array.from(document.querySelectorAll('.el-select-dropdown__item')).find(o => o.textContent.includes(kw)), code);
  if (optEl.asElement()) { await optEl.asElement().click(); await sleep(1500); }
  return await page.evaluate(() => {
    const drawers = Array.from(document.querySelectorAll('.el-drawer'));
    const bndDrawer = drawers.find(d => d.querySelector('.el-drawer__title')?.textContent?.includes('关联广告平台'));
    if (!bndDrawer) return { err: 'no bind drawer' };
    const body = bndDrawer.querySelector('.el-drawer__body');
    const items = document.querySelectorAll('.bnd-section-card .el-form-item, .bnd-form .el-form-item, .el-drawer .el-form-item');
    const last = items[items.length - 1];
    const lastRect = last?.getBoundingClientRect();
    const bodyRect = body?.getBoundingClientRect();
    return {
      drawerH: bndDrawer.getBoundingClientRect().height,
      viewportH: window.innerHeight,
      bodyScrollH: body?.scrollHeight,
      bodyClientH: body?.clientHeight,
      bodyRect: bodyRect ? { top: bodyRect.top, bottom: bodyRect.bottom } : null,
      lastItemBottom: lastRect?.bottom,
      lastItemText: last?.querySelector('.el-form-item__label')?.textContent?.trim(),
      itemCount: items.length,
      hasScroll: (body?.scrollHeight || 0) > (body?.clientHeight || 0) + 1,
    };
  });
};

for (const code of ['穿山甲', '优量汇', '快手', '百度']) {
  const info = await selectAndMeasure(code);
  console.log(code, JSON.stringify(info));
  fs.writeFileSync(`/tmp/bnd-${code}.png`, await page.screenshot({ fullPage: true }));
}
await browser.close();
