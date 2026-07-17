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
page.on('console', msg => console.log('PAGE:', msg.text()));
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
await page.goto('http://localhost:5000/', { waitUntil: 'networkidle0' });
await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);
await page.goto('http://localhost:5000/reconciliation', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 8000));
const result = await page.evaluate(() => {
  // 找操作列的 header cell，看是否在 fixed 容器
  const opHeader = Array.from(document.querySelectorAll('.page-table-wrap .el-table__header-wrapper th.el-table__cell')).find(c => c.innerText.trim() === '操作');
  if (!opHeader) return { error: 'no op header' };
  // 找它的父链
  const parents = [];
  let el = opHeader;
  while (el && el !== document.body) {
    parents.push({ tag: el.tagName, cls: typeof el.className === 'string' ? el.className : '' });
    el = el.parentElement;
  }
  return { opHeader: { tag: opHeader.tagName, cls: opHeader.className, parentTag: opHeader.parentElement?.tagName, parentCls: opHeader.parentElement?.className }, parents };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
