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

// 选百度（8 字段）
const sel = await page.$('.bnd-select');
if (sel) { await sel.click(); await sleep(800); }
const optEl = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.el-select-dropdown__item')).find(o => o.textContent.includes('百度')));
if (optEl.asElement()) { await optEl.asElement().click(); await sleep(1500); }

const info = await page.evaluate(() => {
  const drawer = document.querySelector('.bnd-drawer');
  const drawerBody = drawer?.querySelector('.el-drawer__body');
  const bndBody = drawer?.querySelector('.bnd-body');
  return {
    drawer: { 
      h: drawer?.getBoundingClientRect().height,
      style: drawer?.getAttribute('style')?.slice(0, 200),
    },
    drawerBody: {
      h: drawerBody?.getBoundingClientRect().height,
      clientH: drawerBody?.clientHeight,
      scrollH: drawerBody?.scrollHeight,
      overflow: getComputedStyle(drawerBody).overflow,
      minHeight: getComputedStyle(drawerBody).minHeight,
      flex: getComputedStyle(drawerBody).flex,
      display: getComputedStyle(drawerBody).display,
    },
    bndBody: {
      h: bndBody?.getBoundingClientRect().height,
      clientH: bndBody?.clientHeight,
      scrollH: bndBody?.scrollHeight,
      overflowY: getComputedStyle(bndBody).overflowY,
      minHeight: getComputedStyle(bndBody).minHeight,
      flex: getComputedStyle(bndBody).flex,
    },
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
