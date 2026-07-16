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

// 拿所有 path 和 polygon 的具体属性
const v = await page.evaluate(() => {
  const paths = Array.from(document.querySelectorAll('.funnel-link-svg path'));
  const polys = Array.from(document.querySelectorAll('.funnel-link-svg polygon'));
  // 拿 SVG 完整 outerHTML
  const svgHTML = document.querySelector('.funnel-link-svg')?.outerHTML;
  return {
    pathCount: paths.length,
    polyCount: polys.length,
    firstPath: paths[0] ? {
      d: paths[0].getAttribute('d'),
      stroke: paths[0].getAttribute('stroke'),
      sw: paths[0].getAttribute('stroke-width'),
      dash: paths[0].getAttribute('stroke-dasharray'),
      opacity: paths[0].getAttribute('opacity'),
    } : null,
    firstArrow: polys[0] ? {
      points: polys[0].getAttribute('points'),
      fill: polys[0].getAttribute('fill'),
    } : null,
    svgHTMLLen: svgHTML?.length,
    svgViewBox: document.querySelector('.funnel-link-svg')?.getAttribute('viewBox'),
  };
});
console.log(JSON.stringify(v, null, 2));
await browser.close();
