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
const result = await page.evaluate(() => {
  // 找 page-card(table) 内部的所有子元素
  const card = document.querySelector('.page-card');
  if (!card) return { error: 'no card' };
  function r(el) {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      cls: el.className,
      top: Math.round(b.top),
      bottom: Math.round(b.bottom),
      left: Math.round(b.left),
      w: Math.round(b.width),
      h: Math.round(b.height),
    };
  }
  const children = Array.from(card.children).map(r);
  return { card: r(card), children };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
