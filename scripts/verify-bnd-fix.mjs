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
const sel = await page.$('.bnd-select');
if (sel) { await sel.click(); await sleep(800); }
const optEl = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.el-select-dropdown__item')).find(o => o.textContent.includes('百度')));
if (optEl.asElement()) { await optEl.asElement().click(); await sleep(1500); }

// 滚动到 bndBody 底部
await page.evaluate(() => {
  const b = document.querySelector('.bnd-body');
  if (b) b.scrollTop = b.scrollHeight;
});
await sleep(800);

// 检查 footer 和 last item 的真实可视位置
const finalInfo = await page.evaluate(() => {
  const bnd = document.querySelector('.bnd-body');
  const items = document.querySelectorAll('.bnd-body .el-form-item');
  const last = items[items.length - 1];
  const footer = document.querySelector('.bnd-drawer .el-drawer__footer');
  const lastRect = last?.getBoundingClientRect();
  const footerRect = footer?.getBoundingClientRect();
  return {
    scrollTop: bnd?.scrollTop,
    maxScroll: bnd?.scrollHeight - bnd?.clientHeight,
    lastItemText: last?.textContent?.trim().slice(0, 30),
    lastItemBottom: lastRect?.bottom,
    lastItemVisible: lastRect && lastRect.top < window.innerHeight && lastRect.bottom > 0,
    footerBottom: footerRect?.bottom,
    footerVisible: footerRect && footerRect.top < window.innerHeight && footerRect.bottom > 0,
  };
});
console.log('after scroll to bottom:', JSON.stringify(finalInfo, null, 2));

fs.writeFileSync('/tmp/bnd-baidu-after-scroll.png', await page.screenshot({ fullPage: true }));
await browser.close();
