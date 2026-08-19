import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const logs = [];
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`));
await page.goto('http://localhost:5000/', { waitUntil: 'networkidle0' });
await page.evaluate(async () => {
  const r = await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'dashboard-test@demo.com', password: 'Test123456' }) });
  const j = await r.json();
  if (j.data && j.data.token) { localStorage.setItem('token', j.data.token); if (j.data.userInfo) localStorage.setItem('userInfo', JSON.stringify(j.data.userInfo)); }
});
await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 3000));
const btn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'SDK预置策略'));
await btn.click();
await new Promise(r => setTimeout(r, 1500));

// 看所有 .el-overlay 的 display 状态
const overlays = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.el-overlay')).map((o, i) => ({
    i, 
    display: getComputedStyle(o).display, 
    zIndex: getComputedStyle(o).zIndex,
    visibility: getComputedStyle(o).visibility,
    opacity: getComputedStyle(o).opacity,
    modal: o.classList.contains('is-modal'),
    parent: o.parentElement?.className?.slice(0,40),
  }));
});
console.log('overlays:', JSON.stringify(overlays, null, 2));

// 看所有 .el-dialog 的 z-index 来源
const dlg = await page.evaluate(() => {
  const d = document.querySelector('.el-dialog');
  if (!d) return null;
  return {
    inlineZ: d.style.zIndex,
    compZ: getComputedStyle(d).zIndex,
    parentClass: d.parentElement?.className?.slice(0,60),
    parentParentClass: d.parentElement?.parentElement?.className?.slice(0,60),
    parentZ: d.parentElement ? getComputedStyle(d.parentElement).zIndex : 'N/A',
  };
});
console.log('el-dialog:', JSON.stringify(dlg, null, 2));

// check hal widget z-index
const hal = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.hal-fab, .hal-panel, .hal-edge')).map(e => ({
    cls: e.className,
    zIndex: getComputedStyle(e).zIndex,
    position: getComputedStyle(e).position,
    rect: { x: e.getBoundingClientRect().x, y: e.getBoundingClientRect().y, w: e.getBoundingClientRect().width, h: e.getBoundingClientRect().height },
  }));
});
console.log('HAL widgets:', JSON.stringify(hal, null, 2));

// click backdrop 看是否关了
await page.evaluate(() => {
  const o = document.querySelector('.el-overlay');
  if (o) o.click();
});
await new Promise(r => setTimeout(r, 1000));
const stillOpen = await page.evaluate(() => document.querySelectorAll('.el-dialog').length);
console.log('click overlay 后 dialog count:', stillOpen);

await page.screenshot({ path: '/tmp/dialog-test5.png', fullPage: false });
console.log('截图: /tmp/dialog-test5.png');
const errs = logs.filter(l => l.includes('[error]') || l.includes('TypeError'));
console.log('errors:', errs.length);
errs.forEach(e => console.log(e));
await browser.close();
