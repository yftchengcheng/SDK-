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
  const r = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dashboard-test@demo.com', password: 'Test123456' }),
  });
  const j = await r.json();
  if (j.data && j.data.token) {
    localStorage.setItem('token', j.data.token);
    if (j.data.userInfo) localStorage.setItem('userInfo', JSON.stringify(j.data.userInfo));
  }
});
await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 3000));

const btn = await page.evaluateHandle(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  return btns.find(b => b.textContent.trim() === 'SDK预置策略');
});
await btn.click();
await new Promise(r => setTimeout(r, 1500));

const dom = await page.evaluate(() => {
  const overlay = document.querySelector('.el-overlay');
  const dialog = document.querySelector('.el-dialog');
  return {
    overlayCount: document.querySelectorAll('.el-overlay').length,
    elDialogCount: document.querySelectorAll('.el-dialog').length,
    policyDialogCount: document.querySelectorAll('.policy-dialog').length,
    overlayDisplay: overlay ? getComputedStyle(overlay).display : 'N/A',
    overlayZIndex: overlay ? getComputedStyle(overlay).zIndex : 'N/A',
    dialogDisplay: dialog ? getComputedStyle(dialog).display : 'N/A',
    dialogZIndex: dialog ? getComputedStyle(dialog).zIndex : 'N/A',
    dialogVisible: dialog ? dialog.offsetParent !== null : false,
    dialogWidth: dialog ? getComputedStyle(dialog).width : 'N/A',
    dialogHeight: dialog ? getComputedStyle(dialog).height : 'N/A',
    hasExportTitle: !!Array.from(document.querySelectorAll('*')).find(e => e.textContent.trim() === '导出 SDK 预置策略' && e.children.length === 0),
  };
});
console.log('--- DOM 状态 ---');
console.log(JSON.stringify(dom, null, 2));

// 检查 console 错误
const errors = logs.filter(l => l.includes('[error]') || l.includes('TypeError') || l.includes('avatarBg'));
console.log('--- Errors ---');
errors.forEach(e => console.log(e));

await page.screenshot({ path: '/tmp/dialog-test4.png', fullPage: false });
console.log('截图: /tmp/dialog-test4.png');

await browser.close();
