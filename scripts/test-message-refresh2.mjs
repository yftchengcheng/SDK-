import puppeteer from 'puppeteer';
import jwt from 'jsonwebtoken';
const TOKEN = jwt.sign(
  { developerId: 'dev_6NkEhLUUWZpHkmH8', email: 'admin@prd.com', role: 'admin' },
  'ad-sdk-aggregation-secret-key-2024',
  { expiresIn: '7d' }
);
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGE_ERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE_ERROR: ' + m.text()); });
// 1. 注入 token 后访问首页
await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);
await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
await new Promise(r => setTimeout(r, 3000));
// 2. 在应用内 navigate 到 /message
await page.goto('http://localhost:5000/message', { waitUntil: 'domcontentloaded', timeout: 15000 });
await new Promise(r => setTimeout(r, 5000));
const r1 = await page.evaluate(() => ({
  url: location.href,
  h1: document.querySelector('.page-header-titles-title')?.innerText,
  tableExists: !!document.querySelector('.page-table-wrap .el-table'),
  rowCount: document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row').length,
}));
console.log('1. Direct visit /message:', JSON.stringify(r1));
// 3. 刷新
await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
await new Promise(r => setTimeout(r, 5000));
const r2 = await page.evaluate(() => ({
  url: location.href,
  h1: document.querySelector('.page-header-titles-title')?.innerText,
  tableExists: !!document.querySelector('.page-table-wrap .el-table'),
  rowCount: document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row').length,
}));
console.log('2. After F5 reload:', JSON.stringify(r2));
// 4. 用地址栏访问（模拟用户直接键入 URL）
await page.goto('http://localhost:5000/message', { waitUntil: 'domcontentloaded', timeout: 15000 });
await new Promise(r => setTimeout(r, 3000));
const r3 = await page.evaluate(() => location.href);
console.log('3. Direct URL again:', r3);
console.log('Errors:', errors.slice(0, 5));
await browser.close();
