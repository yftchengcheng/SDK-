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
  const wrap = document.querySelector('.page-table-wrap');
  const table = document.querySelector('.page-table-wrap .el-table');
  const inner = document.querySelector('.page-table-wrap .el-table__inner-wrapper');
  const head = document.querySelector('.page-table-wrap .el-table__header-wrapper');
  const body = document.querySelector('.page-table-wrap .el-table__body-wrapper');
  function r(el) {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { left: Math.round(b.left), w: Math.round(b.width), scrollW: el.scrollWidth, clientW: el.clientWidth };
  }
  return { wrap: r(wrap), table: r(table), inner: r(inner), head: r(head), body: r(body) };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
