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
// 测滚动：模拟横向滚动
const before = await page.evaluate(() => {
  const wrap = document.querySelector('.page-table-wrap');
  const head = document.querySelector('.page-table-wrap .el-table__header-wrapper');
  const body = document.querySelector('.page-table-wrap .el-table__body-wrapper');
  return {
    wrapScrollLeft: wrap.scrollLeft, headScrollLeft: head.scrollLeft, bodyScrollLeft: body.scrollLeft,
    wrapW: wrap.getBoundingClientRect().width, wrapScrollW: wrap.scrollWidth
  };
});
// 滚到 wrap 中部
await page.evaluate(() => {
  const wrap = document.querySelector('.page-table-wrap');
  wrap.scrollLeft = 200;
});
await new Promise(r => setTimeout(r, 500));
const after = await page.evaluate(() => {
  const wrap = document.querySelector('.page-table-wrap');
  const head = document.querySelector('.page-table-wrap .el-table__header-wrapper');
  const body = document.querySelector('.page-table-wrap .el-table__body-wrapper');
  return {
    wrapScrollLeft: wrap.scrollLeft, headScrollLeft: head.scrollLeft, bodyScrollLeft: body.scrollLeft
  };
});
console.log('BEFORE:', JSON.stringify(before));
console.log('AFTER :', JSON.stringify(after));
await page.screenshot({ path: '/workspace/projects/scripts/recon-scrolled.png' });
await browser.close();
