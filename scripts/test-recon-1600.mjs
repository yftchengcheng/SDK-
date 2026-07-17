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
await new Promise(r => setTimeout(r, 6000));
await page.screenshot({ path: '/workspace/projects/scripts/recon-1600-final.png' });
const card = await page.$('.page-section-card:nth-of-type(2)');
if (card) await card.screenshot({ path: '/workspace/projects/scripts/recon-1600-card.png' });
const result = await page.evaluate(() => {
  function r(el) {
    const b = el.getBoundingClientRect();
    return { left: Math.round(b.left), w: Math.round(b.width), right: Math.round(b.right) };
  }
  const head = Array.from(document.querySelectorAll('.page-table-wrap .el-table__header-wrapper .el-table__cell')).map(r);
  return head;
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
