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
const info = await page.evaluate(() => {
  const paths = Array.from(document.querySelectorAll('.funnel-link-svg path'));
  const colors = paths.map(p => p.getAttribute('stroke'));
  const d_first3 = paths.slice(0, 3).map(p => p.getAttribute('d'));
  // 算 .funnel-split 实际尺寸
  const split = document.querySelector('.funnel-split');
  const left = document.querySelector('.funnel-split-left');
  const right = document.querySelector('.funnel-split-right');
  const r = el => { const x = el.getBoundingClientRect(); return { x: Math.round(x.x), y: Math.round(x.y), w: Math.round(x.width), h: Math.round(x.height) }; };
  return {
    split: r(split),
    left: r(left),
    right: r(right),
    colorCount: colors.reduce((a, c) => { a[c] = (a[c] || 0) + 1; return a; }, {}),
    d_first3,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
