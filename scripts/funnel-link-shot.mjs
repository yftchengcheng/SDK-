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
await page.setViewport({ width: 1440, height: 900 });
page.on('pageerror', (e) => console.log('[shot] PAGEERROR:', e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[shot] ${m.type()}:`, m.text().slice(0, 300)); });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));
const info = await page.evaluate(() => {
  const blocks = Array.from(document.querySelectorAll('.funnel-block'));
  const widths = blocks.map(b => Math.round(b.getBoundingClientRect().width));
  const colW = document.querySelector('.funnel-chart')?.getBoundingClientRect().width;
  const pathCount = document.querySelectorAll('.funnel-link-svg path').length;
  const dotCount = document.querySelectorAll('.funnel-link-svg circle').length;
  return {
    blockWidths: widths,
    blockMinW: Math.min(...widths),
    blockMaxW: Math.max(...widths),
    colW: Math.round(colW || 0),
    ratio: Math.min(...widths) / (colW || 1),
    pathCount,
    dotCount,
  };
});
console.log('[shot] info:', JSON.stringify(info, null, 2));
const splitEl = await page.$('.funnel-split');
if (splitEl) await splitEl.screenshot({ path: 'public/funnel-link.png' });
await browser.close();
