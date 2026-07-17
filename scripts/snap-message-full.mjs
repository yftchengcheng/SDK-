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
  const sectionCards = Array.from(document.querySelectorAll('.page-section-card')).map(r);
  const cards = Array.from(document.querySelectorAll('.page-card')).map(r);
  const wrap = document.querySelector('.page-table-wrap');
  return { sectionCards, cards, wrap: r(wrap), viewportH: window.innerHeight };
});
console.log(JSON.stringify(result, null, 2));
await page.screenshot({ path: '/workspace/projects/scripts/message-sectioned.png' });
await browser.close();
