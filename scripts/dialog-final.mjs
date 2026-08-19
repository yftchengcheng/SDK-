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

const status = await page.evaluate(() => {
  const dialog = document.querySelector('.el-dialog');
  const overlay = document.querySelector('.el-overlay.policy-dialog__mask');
  return {
    dialogFound: !!dialog,
    dialogVisible: dialog ? getComputedStyle(dialog).display !== 'none' : false,
    dialogRect: dialog ? dialog.getBoundingClientRect() : null,
    overlayFound: !!overlay,
    overlayZ: overlay ? getComputedStyle(overlay).zIndex : 'N/A',
    policyHeader: !!document.querySelector('.policy-header'),
    policyBadge: !!document.querySelector('.policy-badge'),
    policySectionCount: document.querySelectorAll('.policy-section').length,
    hasTitle: !!Array.from(document.querySelectorAll('*')).find(e => e.textContent.trim() === '导出 SDK 预置策略' && e.children.length === 0),
  };
});
console.log('状态:', JSON.stringify(status, null, 2));

await page.screenshot({ path: '/tmp/dialog-final.png' });
console.log('截图: /tmp/dialog-final.png');

const errs = logs.filter(l => l.includes('[error]') || l.includes('TypeError') || l.includes('avatar'));
console.log('错误数:', errs.length);
errs.forEach(e => console.log(e));
await browser.close();
