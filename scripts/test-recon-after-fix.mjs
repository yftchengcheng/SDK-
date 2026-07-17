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
    return { left: Math.round(b.left), w: Math.round(b.width), right: Math.round(b.right) };
  }
  const head = Array.from(document.querySelectorAll('.page-table-wrap .el-table__header-wrapper .el-table__cell')).map(r);
  const allRows = Array.from(document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row'));
  const diffs = [];
  allRows.forEach((tr, rowIdx) => {
    const cells = Array.from(tr.querySelectorAll('td.el-table__cell')).map(r);
    cells.forEach((cell, i) => {
      if (i < head.length) {
        const d = Math.abs(head[i].left - cell.left);
        if (d > 0) diffs.push({ row: rowIdx, col: i, headLeft: head[i].left, cellLeft: cell.left, d });
      }
    });
  });
  const wrap = document.querySelector('.page-table-wrap');
  const table = document.querySelector('.page-table-wrap .el-table');
  return {
    headerCount: head.length,
    bodyRowCount: allRows.length,
    diffs: diffs.slice(0, 10),
    diffCount: diffs.length,
    headers: head,
    wrap: { w: Math.round(wrap.getBoundingClientRect().width), scrollW: wrap.scrollWidth, clientW: wrap.clientWidth },
    table: { w: Math.round(table.getBoundingClientRect().width) }
  };
});
console.log(JSON.stringify(result, null, 2));
await page.screenshot({ path: '/workspace/projects/scripts/recon-no-fixed.png' });
await browser.close();
