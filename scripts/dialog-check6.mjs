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

// 找所有 modal overlay (modal=true)
const modalOverlays = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.el-overlay')).map((o, i) => ({
    i, 
    display: getComputedStyle(o).display,
    modal: o.classList.contains('is-modal') || o.querySelector('.el-overlay-dialog') !== null,
    zIndex: getComputedStyle(o).zIndex,
    hasDialog: o.querySelector('.el-dialog') !== null,
    dialogInOverlay: o.querySelector('.el-dialog')?.outerHTML?.slice(0, 200),
    customClass: o.querySelector('.el-dialog')?.className,
  })).filter(o => o.modal || o.hasDialog);
});
console.log('modal/有 dialog 的 overlay:', JSON.stringify(modalOverlays, null, 2));

// 看 ExportSdkPolicyDialog 的 custom-class policy-dialog
const policyDialog = await page.evaluate(() => {
  const p = document.querySelector('.policy-dialog');
  return p ? { found: true, zIndex: getComputedStyle(p).zIndex, display: getComputedStyle(p).display, html: p.outerHTML.slice(0, 200) } : { found: false };
});
console.log('policy-dialog 元素:', JSON.stringify(policyDialog, null, 2));

// 所有 dialog 元素
const allDialogs = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('[class*="dialog"], [class*="Dialog"]')).map(d => ({
    cls: d.className.slice(0, 100),
    tag: d.tagName,
    display: getComputedStyle(d).display,
    zIndex: getComputedStyle(d).zIndex,
  }));
});
console.log('所有 dialog/Dialog 元素:', JSON.stringify(allDialogs, null, 2));

// check ExportSdkPolicyDialog 在 DOM 里
const dlgCheck = await page.evaluate(() => {
  const html = document.body.innerHTML;
  return {
    hasPolicyDialogClass: html.includes('policy-dialog'),
    hasExportSdkTitle: html.includes('导出 SDK 预置策略'),
    has6_4_58: html.includes('6.4.58'),
    hasEffectVersionLabel: html.includes('效果版本'),
  };
});
console.log('dlgCheck:', JSON.stringify(dlgCheck, null, 2));

await page.screenshot({ path: '/tmp/dialog-test6.png', fullPage: false });
console.log('截图: /tmp/dialog-test6.png');

const errs = logs.filter(l => l.includes('[error]') || l.includes('TypeError') || l.includes('avatar'));
console.log('--- 关键错误 ---');
errs.forEach(e => console.log(e));
await browser.close();
