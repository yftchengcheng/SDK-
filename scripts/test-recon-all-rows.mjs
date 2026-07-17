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
  function r(el) {
    const b = el.getBoundingClientRect();
    return { left: Math.round(b.left), w: Math.round(b.width) };
  }
  const head = Array.from(document.querySelectorAll('.page-table-wrap .el-table__header-wrapper .el-table__cell')).map(r);
  const allRows = Array.from(document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row'));
  // 检查所有行所有列与 header 的 left 偏差
  const diffs = [];
  allRows.forEach((tr, rowIdx) => {
    const cells = Array.from(tr.querySelectorAll('td.el-table__cell')).map(r);
    cells.forEach((cell, i) => {
      if (i < head.length) {
        const d = Math.abs(head[i].left - cell.left);
        const wd = Math.abs(head[i].w - cell.w);
        if (d > 0 || wd > 0) diffs.push({ row: rowIdx, col: i, headLeft: head[i].left, cellLeft: cell.left, headW: head[i].w, cellW: cell.w, d, wd });
      }
    });
  });
  return { headerCount: head.length, bodyRowCount: allRows.length, diffs: diffs.slice(0, 30), diffCount: diffs.length };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
