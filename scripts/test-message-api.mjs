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
const apiCalls = [];
page.on('response', r => {
  const url = r.url();
  if (url.includes('/api/')) {
    apiCalls.push({ url, status: r.status(), method: r.request().method() });
  }
});
await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);
await page.goto('http://localhost:5000/message', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
console.log('API calls (direct visit):');
apiCalls.forEach(c => console.log(`  ${c.method} ${c.status} ${c.url}`));
apiCalls.length = 0;
// 刷新
await page.reload({ waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
console.log('API calls (after F5):');
apiCalls.forEach(c => console.log(`  ${c.method} ${c.status} ${c.url}`));
const r1 = await page.evaluate(() => ({
  url: location.href,
  tableExists: !!document.querySelector('.page-table-wrap .el-table'),
  rowCount: document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row').length,
}));
console.log('After F5:', JSON.stringify(r1));
await browser.close();
