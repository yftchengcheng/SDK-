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
  const all = [];
  function visit(el, depth) {
    if (el.nodeType !== 1) return;
    const cls = typeof el.className === 'string' ? el.className : '';
    if (cls.includes('el-table__cell') || cls.includes('el-table-fixed-column--right') || cls.includes('el-table__fixed')) {
      const r = el.getBoundingClientRect();
      all.push({
        tag: el.tagName,
        cls: cls.slice(0, 60),
        depth,
        left: Math.round(r.left),
        right: Math.round(r.right),
        w: Math.round(r.width),
        text: (el.innerText||'').trim().slice(0, 15)
      });
    }
    if (depth < 6) Array.from(el.children).forEach(c => visit(c, depth + 1));
  }
  const table = document.querySelector('.page-table-wrap .el-table');
  if (table) visit(table, 0);
  return all;
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
