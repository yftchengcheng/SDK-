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
await page.goto('http://localhost:5000/message', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 8000));
const result = await page.evaluate(() => {
  function r(el) {
    const b = el.getBoundingClientRect();
    return { left: Math.round(b.left), w: Math.round(b.width), right: Math.round(b.right), text: (el.innerText||'').trim().slice(0,20) };
  }
  const head = Array.from(document.querySelectorAll('.page-table-wrap .el-table__header-wrapper .el-table__cell')).map(r);
  const rows = Array.from(document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row'));
  const body = rows.slice(0, 3).map(tr => Array.from(tr.querySelectorAll('td.el-table__cell')).map(r));
  const diffs = [];
  if (body[0]) {
    for (let i = 0; i < Math.min(head.length, body[0].length); i++) {
      const d = Math.abs(head[i].left - body[0][i].left);
      if (d > 0) diffs.push({ i, headerLeft: head[i].left, bodyLeft: body[0][i].left, d, headerW: head[i].w, bodyW: body[0][i].w });
    }
  }
  const wrap = document.querySelector('.page-table-wrap');
  const wrapR = wrap ? wrap.getBoundingClientRect() : null;
  return {
    headerCount: head.length,
    headers: head,
    bodyRowCount: rows.length,
    bodyFirstRow: body[0],
    diffs,
    wrap: wrapR ? { left: Math.round(wrapR.left), w: Math.round(wrapR.width), scrollW: wrap.scrollWidth, clientW: wrap.clientWidth } : null
  };
});
console.log(JSON.stringify(result, null, 2));
await page.screenshot({ path: '/workspace/projects/scripts/message-current.png' });
await browser.close();
