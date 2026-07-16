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
  const r = (el) => { const x = el.getBoundingClientRect(); return { x: Math.round(x.x), y: Math.round(x.y), w: Math.round(x.width), h: Math.round(x.height) }; };
  return {
    layout: r(document.querySelector('.funnel-layout')),
    svg: r(document.querySelector('.funnel-link-svg')),
    grid: r(document.querySelector('.funnel-grid')),
    chart: r(document.querySelector('.funnel-chart')),
    block0: r(document.querySelector('.funnel-block-0')),
    block5: r(document.querySelector('.funnel-block-5')),
    block10: r(document.querySelector('.funnel-block-10')),
    lm0: r(document.querySelectorAll('.funnel-metric-left')[0]),
    rm0: r(document.querySelectorAll('.funnel-metric-right')[0]),
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'public/funnel-link2.png', clip: { x: 250, y: 450, width: 750, height: 600 } });
await browser.close();
