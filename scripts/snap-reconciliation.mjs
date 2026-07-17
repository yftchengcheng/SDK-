import puppeteer from 'puppeteer';
import jwt from 'jsonwebtoken';
const TOKEN = jwt.sign(
  { developerId: 'dev_rqoDvlTij9RfZjtT', email: 'admin@prd.com', role: 'admin' },
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
await new Promise(r => setTimeout(r, 5000));
const result = await page.evaluate(() => {
  function rect(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) };
  }
  const shell = document.querySelector('.page-shell');
  const sections = document.querySelectorAll('.page-section-card');
  const allCards = document.querySelectorAll('.page-card');
  return {
    shell: rect(shell),
    shellKids: Array.from(shell?.children || []).map(c => ({ tag: c.tagName, cls: c.className, ...rect(c) })),
    sections: Array.from(sections).map(s => ({ ...rect(s), kids: Array.from(s.children).map(c => ({ cls: c.className, ...rect(c) })) })),
    cards: Array.from(allCards).map(c => ({ cls: c.className, hasFilter: !!c.querySelector('.page-filter'), hasTable: !!c.querySelector('.el-table'), parentCls: c.parentElement?.className, ...rect(c) })),
    table: rect(document.querySelector('.el-table')),
  };
});
console.log(JSON.stringify(result, null, 2));
await page.screenshot({ path: '/tmp/reconciliation-final.png', fullPage: true });
await browser.close();
