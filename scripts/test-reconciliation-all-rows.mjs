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
    return { left: Math.round(b.left), w: Math.round(b.width), right: Math.round(b.right), text: (el.innerText||'').trim().slice(0, 30) };
  }
  const head = Array.from(document.querySelectorAll('.page-table-wrap .el-table__header-wrapper .el-table__cell')).map(r);
  const allRows = Array.from(document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row'));
  const rows = allRows.slice(0, 5).map((tr, rowIdx) => ({
    rowIdx,
    cells: Array.from(tr.querySelectorAll('td.el-table__cell')).map(r)
  }));
  // 检查每行每列与 header 的 left 偏差
  const diffs = [];
  rows.forEach(row => {
    row.cells.forEach((cell, i) => {
      if (i < head.length) {
        const d = Math.abs(head[i].left - cell.left);
        if (d > 0) diffs.push({ row: row.rowIdx, col: i, head: head[i], cell, d });
      }
    });
  });
  return { headerCount: head.length, headers: head, bodyRowCount: allRows.length, firstRows: rows, diffs };
});
console.log(JSON.stringify(result, null, 2));
await page.screenshot({ path: '/workspace/projects/scripts/recon-after.png' });
await browser.close();
