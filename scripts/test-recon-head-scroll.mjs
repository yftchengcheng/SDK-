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
// 看 head scroll 位置
const before = await page.evaluate(() => {
  const head = document.querySelector('.page-table-wrap .el-table__header-wrapper');
  return { headScrollLeft: head.scrollLeft, headScrollW: head.scrollWidth, headClientW: head.clientWidth };
});
// 滚 head
await page.evaluate(() => {
  const head = document.querySelector('.page-table-wrap .el-table__header-wrapper');
  head.scrollLeft = 16;
});
await new Promise(r => setTimeout(r, 500));
const after = await page.evaluate(() => {
  const head = document.querySelector('.page-table-wrap .el-table__header-wrapper');
  const body = document.querySelector('.page-table-wrap .el-table__body-wrapper');
  // 找 header 和 body 第 0 列 left
  const headCell = document.querySelector('.page-table-wrap .el-table__header-wrapper .el-table__cell:first-child');
  const bodyCell = document.querySelector('.page-table-wrap .el-table__body-wrapper tr.el-table__row:first-child td.el-table__cell:first-child');
  return {
    headScrollLeft: head.scrollLeft,
    bodyScrollLeft: body.scrollLeft,
    headFirstCellLeft: Math.round(headCell.getBoundingClientRect().left),
    bodyFirstCellLeft: Math.round(bodyCell.getBoundingClientRect().left),
  };
});
console.log('BEFORE:', JSON.stringify(before));
console.log('AFTER :', JSON.stringify(after));
await page.screenshot({ path: '/workspace/projects/scripts/recon-head-scrolled.png' });
await browser.close();
