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
// 全屏截图
await page.screenshot({ path: '/workspace/projects/scripts/recon-initial.png' });
// 看 header 第一行
const head = await page.$('.page-table-wrap .el-table__header-wrapper');
if (head) await head.screenshot({ path: '/workspace/projects/scripts/recon-head-initial.png' });
const body = await page.$('.page-table-wrap .el-table__body-wrapper');
if (body) await body.screenshot({ path: '/workspace/projects/scripts/recon-body-initial.png' });
await browser.close();
