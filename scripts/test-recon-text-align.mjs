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
// 测试：先看列宽，再看 cell 内文本对齐（看 cell text 是否居中/居左/居右）
const result = await page.evaluate(() => {
  function r(el) {
    const b = el.getBoundingClientRect();
    return { left: Math.round(b.left), w: Math.round(b.width), text: (el.innerText||'').trim().slice(0, 30), align: getComputedStyle(el).textAlign };
  }
  // 1. 看 header 内部是否有 inner content
  const heads = Array.from(document.querySelectorAll('.page-table-wrap .el-table__header-wrapper .el-table__cell .cell')).map(r);
  // 2. 看 body 内部 cell 实际内容
  const row0Cells = Array.from(document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row:first-child td.el-table__cell .cell')).map(r);
  // 3. 看 reconciliation template 中的 prop label
  const columns = Array.from(document.querySelectorAll('.page-table-wrap colgroup col')).map(c => ({ w: c.width }));
  return { heads, row0Cells, columns };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
