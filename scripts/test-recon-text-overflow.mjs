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
  // 找所有 body 行的 .cell 内部内容
  const rows = Array.from(document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row')).slice(0, 3);
  const data = rows.map((tr, rowIdx) => {
    const cells = Array.from(tr.querySelectorAll('td.el-table__cell'));
    return {
      rowIdx,
      cells: cells.map((td, i) => {
        const cellInner = td.querySelector('.cell');
        const r = td.getBoundingClientRect();
        const innerR = cellInner ? cellInner.getBoundingClientRect() : null;
        return {
          col: i,
          text: (td.innerText || '').trim().slice(0, 30),
          tdW: Math.round(r.width),
          tdLeft: Math.round(r.left),
          innerW: innerR ? Math.round(innerR.width) : null,
          tdScrollW: td.scrollWidth,
          tdClientW: td.clientWidth,
          overflow: td.scrollWidth > td.clientWidth + 1
        };
      })
    };
  });
  return data;
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
