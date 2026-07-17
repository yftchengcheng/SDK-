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
// 滚动到 table 区域
await page.evaluate(() => window.scrollTo(0, 200));
await new Promise(r => setTimeout(r, 1000));
// 截 page-card
const card = await page.$('.page-card');
if (card) await card.screenshot({ path: '/workspace/projects/scripts/message-table-card.png' });
// 截 page-filter
const filter = await page.$('.page-filter');
if (filter) await filter.screenshot({ path: '/workspace/projects/scripts/message-filter.png' });
await browser.close();
