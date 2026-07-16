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
  const svg = document.querySelector('.funnel-link-svg');
  const svgRect = svg.getBoundingClientRect();
  const polys = Array.from(document.querySelectorAll('.funnel-link-svg polygon'));
  // 0 号箭头的实际 DOM 位置
  const p0 = polys[0];
  const p0Rect = p0.getBoundingClientRect();
  return {
    grid: { w: gridRect.width, h: gridRect.height },
    svg: { w: svgRect.width, h: svgRect.height, viewBox: svg.getAttribute('viewBox'), preserveAspectRatio: svg.getAttribute('preserveAspectRatio') || 'default(xMidYMid meet)' },
    gridTop: gridRect.top,
    svgTop: svgRect.top,
    arrow0Dom: { left: p0Rect.left, top: p0Rect.top, w: p0Rect.width, h: p0Rect.height },
  };
});
console.log(JSON.stringify(v, null, 2));
await browser.close();
