import puppeteer from 'puppeteer';
const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'e2e' + Date.now() + '@e2e.com', password: 'Test123456', company: 'e2e', companyShortName: 'e2e', contactName: 'e2e', phone: '13800000000', accessType: 1 }),
});
const tk = (await reg.json()).data.token;
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1448 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

const v = await page.evaluate(() => {
  const grid = document.querySelector('.funnel-grid');
  const gridRect = grid.getBoundingClientRect();
  const blocks = Array.from(document.querySelectorAll('.funnel-block'));
  const leftMetrics = Array.from(document.querySelectorAll('.funnel-metric-left'));
  const rightMetrics = Array.from(document.querySelectorAll('.funnel-metric-right'));
  return {
    blocks: blocks.map((b, i) => {
      const r = b.getBoundingClientRect();
      return { idx: i, text: b.textContent.trim(), top: Math.round(r.top - gridRect.top), bottom: Math.round(r.bottom - gridRect.top), centerY: Math.round((r.top + r.bottom) / 2 - gridRect.top) };
    }),
    leftMetrics: leftMetrics.map((m) => {
      const r = m.getBoundingClientRect();
      const name = m.querySelector('.funnel-metric-name')?.textContent.trim();
      return { name, top: Math.round(r.top - gridRect.top), bottom: Math.round(r.bottom - gridRect.top), centerY: Math.round((r.top + r.bottom) / 2 - gridRect.top) };
    }),
    rightMetrics: rightMetrics.map((m) => {
      const r = m.getBoundingClientRect();
      const name = m.querySelector('.funnel-metric-name')?.textContent.trim();
      return { name, top: Math.round(r.top - gridRect.top), bottom: Math.round(r.bottom - gridRect.top), centerY: Math.round((r.top + r.bottom) / 2 - gridRect.top) };
    }),
  };
});
console.log(JSON.stringify(v, null, 2));
await browser.close();
