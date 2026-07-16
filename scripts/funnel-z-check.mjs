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
const z = await page.evaluate(() => {
  const svg = document.querySelector('.funnel-link-svg');
  const b0 = document.querySelector('.funnel-block-0');
  const lm0 = document.querySelectorAll('.funnel-metric-left')[0];
  return {
    svgZ: getComputedStyle(svg).zIndex,
    blockZ: getComputedStyle(b0).zIndex,
    blockPos: getComputedStyle(b0).position,
    metricZ: getComputedStyle(lm0).zIndex,
    metricPos: getComputedStyle(lm0).position,
  };
});
console.log(JSON.stringify(z, null, 2));
await page.screenshot({ path: 'public/funnel-clip.png', clip: { x: 200, y: 420, width: 1000, height: 650 } });
await browser.close();
