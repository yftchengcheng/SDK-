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
const apiCalls = [];
page.on('pageerror', e => errors.push('PAGE_ERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE_ERROR: ' + m.text()); });
page.on('response', r => {
  if (r.url().includes('/api/')) {
    r.json().then(j => {
      apiCalls.push({ url: r.url().replace('http://localhost:5000', ''), status: r.status(), body: j });
    }).catch(() => apiCalls.push({ url: r.url().replace('http://localhost:5000', ''), status: r.status(), body: 'NOT_JSON' }));
  }
});
await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);
await page.goto('http://localhost:5000/message', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
console.log('=== After visit /message ===');
apiCalls.forEach(c => console.log(`  ${c.status} ${c.url} -> ${JSON.stringify(c.body).slice(0, 200)}`));
apiCalls.length = 0;
console.log('--- F5 reload ---');
await page.reload({ waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
const r1 = await page.evaluate(() => ({
  url: location.href,
  h1: document.querySelector('.page-header-titles-title')?.innerText,
  tableExists: !!document.querySelector('.page-table-wrap .el-table'),
  rowCount: document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row').length,
}));
console.log('After F5:', JSON.stringify(r1));
console.log('=== After F5 API calls ===');
apiCalls.forEach(c => console.log(`  ${c.status} ${c.url} -> ${JSON.stringify(c.body).slice(0, 200)}`));
console.log('=== Errors ===');
errors.forEach(e => console.log('  ' + e));
await browser.close();
