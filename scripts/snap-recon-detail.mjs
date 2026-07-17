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
// 截 table 区域
const card = await page.$('.page-card:nth-of-type(2)');
if (card) await card.screenshot({ path: '/workspace/projects/scripts/recon-table-card.png' });
const header = await page.$('.page-table-wrap .el-table__header-wrapper');
if (header) await header.screenshot({ path: '/workspace/projects/scripts/recon-header.png' });
const firstBodyRow = await page.$('.page-table-wrap .el-table__body-wrapper tr.el-table__row');
if (firstBodyRow) await firstBodyRow.screenshot({ path: '/workspace/projects/scripts/recon-row0.png' });
await browser.close();
