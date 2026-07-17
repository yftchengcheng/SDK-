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
// 1. 登录（注入 token 到 localStorage）
await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);
await page.goto('http://localhost:5000/dashboard', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 3000));
// 2. 点击侧边栏"消息中心"
await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('.nav-item'));
  const messageItem = items.find(el => el.innerText.trim() === '消息中心');
  if (messageItem) messageItem.click();
});
await new Promise(r => setTimeout(r, 3000));
const r1 = await page.evaluate(() => ({
  url: location.href,
  title: document.title,
  h1: document.querySelector('.page-header-titles-title')?.innerText,
  tableExists: !!document.querySelector('.page-table-wrap .el-table'),
  rowCount: document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row').length,
}));
console.log('1. After click sidebar 消息中心:', JSON.stringify(r1));
// 3. F5 刷新
await page.reload({ waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
const r2 = await page.evaluate(() => ({
  url: location.href,
  h1: document.querySelector('.page-header-titles-title')?.innerText,
  tableExists: !!document.querySelector('.page-table-wrap .el-table'),
  rowCount: document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row').length,
}));
console.log('2. After F5 reload:', JSON.stringify(r2));
// 4. 再刷新一次
await page.reload({ waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
const r3 = await page.evaluate(() => ({
  url: location.href,
  h1: document.querySelector('.page-header-titles-title')?.innerText,
  tableExists: !!document.querySelector('.page-table-wrap .el-table'),
  rowCount: document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row').length,
}));
console.log('3. After 2nd F5:', JSON.stringify(r3));
console.log('Errors:', errors.slice(0, 10));
await browser.close();
