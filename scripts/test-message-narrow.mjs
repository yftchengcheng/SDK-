import puppeteer from 'puppeteer';
import jwt from 'jsonwebtoken';
const TOKEN = jwt.sign(
  { developerId: 'dev_6NkEhLUUWZpHkmH8', email: 'admin@prd.com', role: 'admin' },
  'ad-sdk-aggregation-secret-key-2024',
  { expiresIn: '7d' }
);
// 测试窄屏：1440x900, 1280x800
for (const [w, h] of [[1440, 900], [1280, 800], [1920, 1080]]) {
  const browser = await puppeteer.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: w, height: h },
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5000/', { waitUntil: 'networkidle0' });
  await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);
  await page.goto('http://localhost:5000/message', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 6000));
  const result = await page.evaluate(() => {
    function r(el) {
      const b = el.getBoundingClientRect();
      return { left: Math.round(b.left), w: Math.round(b.width) };
    }
    const head = Array.from(document.querySelectorAll('.page-table-wrap .el-table__header-wrapper .el-table__cell')).map(r);
    const rows = Array.from(document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row'));
    const body = rows[0] ? Array.from(rows[0].querySelectorAll('td.el-table__cell')).map(r) : [];
    const diffs = [];
    for (let i = 0; i < Math.min(head.length, body.length); i++) {
      const d = Math.abs(head[i].left - body[i].left);
      if (d > 0) diffs.push({ i, headerLeft: head[i].left, bodyLeft: body[i].left, d });
    }
    const wrap = document.querySelector('.page-table-wrap');
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      headerCount: head.length, bodyRowCount: rows.length, diffs,
      wrap: wrap ? { w: wrap.getBoundingClientRect().width, scrollW: wrap.scrollWidth, clientW: wrap.clientWidth } : null
    };
  });
  console.log('===', w, 'x', h, '===');
  console.log(JSON.stringify(result));
  await browser.close();
}
