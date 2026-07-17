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
page.on('requestfailed', r => errors.push('REQ_FAILED: ' + r.url() + ' ' + r.failure().errorText));
// 1. 访问 /message 刷新
await page.goto('http://localhost:5000/message', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2000));
const r1 = await page.evaluate(() => ({ url: location.href, title: document.title, h1: document.querySelector('h1, h2, .page-header-titles-title')?.innerText }));
// 2. 注入 token 后刷新
await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);
await page.reload({ waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 5000));
const r2 = await page.evaluate(() => ({
  url: location.href,
  h1: document.querySelector('h1, h2, .page-header-titles-title')?.innerText,
  tableExists: !!document.querySelector('.page-table-wrap .el-table'),
  rowCount: document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row').length,
}));
console.log('1. First visit:', JSON.stringify(r1));
console.log('2. After token + reload:', JSON.stringify(r2));
console.log('Errors:', errors.slice(0, 5));
await browser.close();
