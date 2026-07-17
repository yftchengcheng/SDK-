import puppeteer from 'puppeteer';
import jwt from 'jsonwebtoken';
// 用真实的 dev 登录 - 真实 token 从服务端取
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
const allResponses = [];
page.on('response', r => {
  if (r.url().includes('/api/')) {
    r.text().then(t => {
      allResponses.push({ url: r.url().replace('http://localhost:5000', ''), status: r.status(), body: t.slice(0, 200) });
    }).catch(() => {});
  }
});
const errors = [];
page.on('pageerror', e => errors.push('PAGE_ERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE_ERROR: ' + m.text()); });

// 1. 完全真实：去 login 页
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 2000));
// 2. 填表单登录
await page.type('input[type="email"], input[placeholder*="邮"], input[placeholder*="邮箱"]', 'admin@prd.com');
await page.type('input[type="password"]', 'admin123');
// 找登录按钮
const loginBtn = await page.$('button[type="submit"], button.login-btn, .auth-btn, .el-button--primary');
if (loginBtn) await loginBtn.click();
await new Promise(r => setTimeout(r, 5000));
const r1 = await page.evaluate(() => location.href);
console.log('1. After login:', r1);
// 3. 跳 /message
await page.goto('http://localhost:5000/message', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
const r2 = await page.evaluate(() => ({
  url: location.href,
  h1: document.querySelector('.page-header-titles-title')?.innerText,
  tableExists: !!document.querySelector('.page-table-wrap .el-table'),
  rowCount: document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row').length,
}));
console.log('2. Visit /message:', JSON.stringify(r2));
allResponses.length = 0;
// 4. F5
await page.reload({ waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
const r3 = await page.evaluate(() => ({
  url: location.href,
  h1: document.querySelector('.page-header-titles-title')?.innerText,
  tableExists: !!document.querySelector('.page-table-wrap .el-table'),
  rowCount: document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row').length,
}));
console.log('3. After F5:', JSON.stringify(r3));
console.log('=== API calls after F5 ===');
allResponses.forEach(c => console.log(`  ${c.status} ${c.url} -> ${c.body}`));
console.log('=== Errors ===');
errors.forEach(e => console.log('  ' + e));
await browser.close();
