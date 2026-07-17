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
  defaultViewport: { width: 1280, height: 800 },
});
const page = await browser.newPage();
await page.goto('http://localhost:5000/', { waitUntil: 'networkidle0' });
await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);
await page.goto('http://localhost:5000/reconciliation', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 6000));
const result = await page.evaluate(() => {
  function r(el) {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), w: Math.round(b.width), right: Math.round(b.right) };
  }
  const shell = document.querySelector('.page-shell');
  const wrap = document.querySelector('.page-table-wrap');
  const content = document.querySelector('.content-area');
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight, scrollX: window.scrollX, scrollY: window.scrollY },
    shell: r(shell),
    wrap: r(wrap),
    content: r(content),
    body: r(document.body),
    html: r(document.documentElement)
  };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
