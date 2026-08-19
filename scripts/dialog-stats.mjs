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
await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 2000));
await page.evaluate(async () => {
  const r = await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'dashboard-test@demo.com', password: 'Test123456' }) });
  const j = await r.json();
  if (j.data && j.data.token) { localStorage.setItem('token', j.data.token); if (j.data.userInfo) localStorage.setItem('userInfo', JSON.stringify(j.data.userInfo)); }
});
await page.goto('http://localhost:5000/app', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));  // 加长等待
const btn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'SDK预置策略'));
await btn.click();
await new Promise(r => setTimeout(r, 3000));  // 等 placement-candidates 加载
// 看 dialog 里有什么
const dump = await page.evaluate(() => {
  const body = document.querySelector('.el-dialog__body');
  return {
    bodyHTML: body ? body.innerHTML.slice(0, 800) : 'N/A',
    checkboxCount: document.querySelectorAll('.el-dialog .el-checkbox').length,
    placementItemCount: document.querySelectorAll('.placement-item, [class*="placement-row"]').length,
    allClasses: Array.from(document.querySelectorAll('.el-dialog__body *')).slice(0, 10).map(e => e.className).filter(c => c).join(' | '),
  };
});
console.log('dialog dump:', JSON.stringify(dump, null, 2));
// 找复选框
const clicked = await page.evaluate(() => {
  const cbs = document.querySelectorAll('.el-dialog__body .el-checkbox');
  if (cbs.length > 0) { cbs[0].click(); return cbs.length; }
  return 0;
});
console.log('复选框总数:', clicked);
await new Promise(r => setTimeout(r, 800));
const status = await page.evaluate(() => {
  const stats = document.querySelector('.policy-footer__stats');
  const count = document.querySelector('.policy-footer__count');
  const exportBtn = document.querySelector('.policy-footer__btn-export');
  return {
    statsFound: !!stats,
    statsText: stats ? stats.textContent.trim().replace(/\s+/g, ' ') : '',
    countText: count ? count.textContent.trim() : '',
    countColor: count ? getComputedStyle(count).color : 'N/A',
    countFontSize: count ? getComputedStyle(count).fontSize : 'N/A',
    statsBg: stats ? getComputedStyle(stats).backgroundColor : 'N/A',
    exportBtnFound: !!exportBtn,
    exportBtnText: exportBtn ? exportBtn.textContent.trim() : '',
  };
});
console.log(JSON.stringify(status, null, 2));
await page.screenshot({ path: '/tmp/dialog-stats.png' });
const errs = logs.filter(l => !l.includes('ERR_NAME_NOT_RESOLVED') && !l.includes('favicon'));
console.log('业务错误:', errs.length);
errs.forEach(e => console.log(e));
await browser.close();
