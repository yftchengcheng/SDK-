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
const errors = [];
page.on('pageerror', e => errors.push('PAGE_ERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE_ERROR: ' + m.text()); });
await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);
const flow = [
  { name: '1. login → /dashboard', url: 'http://localhost:5000/dashboard' },
  { name: '2. click 消息中心', click: '消息中心' },
  { name: '3. F5', reload: true },
  { name: '4. navigate /reconciliation', url: 'http://localhost:5000/reconciliation' },
  { name: '5. click 消息中心 again', click: '消息中心' },
  { name: '6. F5', reload: true },
  { name: '7. type /message in URL bar', url: 'http://localhost:5000/message' },
];
for (const step of flow) {
  if (step.url) await page.goto(step.url, { waitUntil: 'domcontentloaded' });
  if (step.click) {
    await page.evaluate((label) => {
      const items = Array.from(document.querySelectorAll('.nav-item'));
      const m = items.find(el => el.innerText.trim() === label);
      if (m) m.click();
    }, step.click);
  }
  if (step.reload) await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  const r = await page.evaluate(() => ({
    url: location.href,
    h1: document.querySelector('.page-header-titles-title')?.innerText,
    tableExists: !!document.querySelector('.page-table-wrap .el-table'),
    rowCount: document.querySelectorAll('.page-table-wrap .el-table__body-wrapper tr.el-table__row').length,
  }));
  console.log(step.name, ':', JSON.stringify(r));
}
console.log('Errors:', errors.slice(0, 10));
await browser.close();
