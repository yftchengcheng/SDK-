import puppeteer from 'puppeteer';
import jwt from 'jsonwebtoken';
const TOKEN = jwt.sign(
  { developerId: 'dev_6NkEhLUUWZpHkmH8', email: 'dev@prd.com', role: 'admin' },
  'ad-sdk-aggregation-secret-key-2024',
  { expiresIn: '7d' }
);
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
const allResponses = [];
page.on('response', r => {
  if (r.url().includes('/api/v1/console/message')) {
    r.text().then(t => allResponses.push({ url: r.url().replace('http://localhost:5000', ''), status: r.status(), body: t.slice(0, 300) })).catch(() => {});
  }
});
const errors = [];
page.on('pageerror', e => errors.push('PAGE_ERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE_ERROR: ' + m.text()); });

await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);
await page.goto('http://localhost:5000/message', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
const r1 = await page.evaluate(() => ({
  url: location.href,
  h1: document.querySelector('.page-header-titles-title')?.innerText,
  tableExists: !!document.querySelector('.page-table-wrap .el-table'),
  rowCount: document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row').length,
}));
console.log('1. Visit /message:', JSON.stringify(r1));
allResponses.length = 0;
await page.reload({ waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
const r2 = await page.evaluate(() => ({
  url: location.href,
  h1: document.querySelector('.page-header-titles-title')?.innerText,
  tableExists: !!document.querySelector('.page-table-wrap .el-table'),
  rowCount: document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row').length,
}));
console.log('2. After F5:', JSON.stringify(r2));
console.log('=== API calls after F5 ===');
allResponses.forEach(c => console.log(`  ${c.status} ${c.url} -> ${c.body}`));
console.log('=== Errors ===');
errors.forEach(e => console.log('  ' + e));
await browser.close();
