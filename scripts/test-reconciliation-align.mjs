import puppeteer from 'puppeteer';
import jwt from 'jsonwebtoken';
const TOKEN = jwt.sign(
  { developerId: 'dev_rqoDvlTij9RfZjtT', email: 'admin@prd.com', role: 'admin' },
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
  // 取所有 body row，扁平化 cells
  const rows = Array.from(document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row'));
  const body = rows.slice(0, 3).map(tr => Array.from(tr.querySelectorAll('td.el-table__cell')).map(r));
  // 检查每列 header 与第 0 行对应 cell 的 left 是否对齐
  const diffs = [];
  if (body[0]) {
    for (let i = 0; i < Math.min(head.length, body[0].length); i++) {
      const d = Math.abs(head[i].left - body[0][i].left);
      if (d > 0) diffs.push({ i, headerLeft: head[i].left, bodyLeft: body[0][i].left, d, headerW: head[i].w, bodyW: body[0][i].w });
    }
  }
  return { headerCount: head.length, bodyRowCount: rows.length, bodyFirstRowLength: body[0]?.length || 0, diffs };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
