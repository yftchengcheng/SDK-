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
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));
const info = await page.evaluate(() => {
  const grid = document.querySelector('.funnel-grid');
  const svg = document.querySelector('.funnel-link-svg');
  const paths = document.querySelectorAll('.funnel-link-svg path');
  const circles = document.querySelectorAll('.funnel-link-svg circle');
  const gridRect = grid?.getBoundingClientRect();
  const svgRect = svg?.getBoundingClientRect();
  const pathInfo = Array.from(paths).slice(0, 3).map(p => ({
    d: p.getAttribute('d'),
    stroke: p.getAttribute('stroke'),
    bbox: p.getBBox(),
    computed: {
      stroke: getComputedStyle(p).stroke,
      strokeWidth: getComputedStyle(p).strokeWidth,
      opacity: getComputedStyle(p).opacity,
      fill: getComputedStyle(p).fill,
    },
  }));
  return {
    gridRect: gridRect ? { x: gridRect.x, y: gridRect.y, w: gridRect.width, h: gridRect.height } : null,
    svgRect: svgRect ? { x: svgRect.x, y: svgRect.y, w: svgRect.width, h: svgRect.height } : null,
    svgViewBox: svg?.getAttribute('viewBox'),
    svgComputedW: svg ? getComputedStyle(svg).width : null,
    svgComputedH: svg ? getComputedStyle(svg).height : null,
    pathCount: paths.length,
    circleCount: circles.length,
    pathInfo,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
