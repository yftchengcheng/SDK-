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
  // 看 row 0-4 的所有 cell
  const rows = Array.from(document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row')).slice(0, 5);
  return rows.map((tr, i) => {
    const cells = Array.from(tr.querySelectorAll('td.el-table__cell'));
    return {
      row: i,
      cells: cells.map((td, j) => ({ col: j, text: (td.innerText || '').trim().slice(0, 30) }))
    };
  });
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
