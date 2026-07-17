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
await page.goto('http://localhost:5000/', { waitUntil: 'networkidle0' });
await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);
await page.goto('http://localhost:5000/reconciliation', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 8000));
const result = await page.evaluate(() => {
  const table = document.querySelector('.page-table-wrap .el-table');
  // 找所有 el-table__ 开头 class
  const all = {};
  table.querySelectorAll('*').forEach(el => {
    if (el.className && typeof el.className === 'string') {
      el.className.split(' ').forEach(c => {
        if (c.startsWith('el-table__') && c.includes('fixed')) {
          all[c] = (all[c] || 0) + 1;
        }
      });
    }
  });
  // 看 table 内布局
  const children = Array.from(table.children).map(c => ({ tag: c.tagName, cls: c.className }));
  return { fixedRelated: all, tableChildren: children };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
