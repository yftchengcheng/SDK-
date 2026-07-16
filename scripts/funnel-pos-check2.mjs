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
await page.setViewport({ width: 1440, height: 1200 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

const v = await page.evaluate(() => {
  const arr = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom };
  };
  return {
    container: arr(document.querySelector('.chart-panel-container')),
    body: arr(document.querySelector('.chart-panel-container .body')),
    left: arr(document.querySelector('.chart-panel-container .left-box')),
    main: arr(document.querySelector('.chart-panel-container .main')),
    right: arr(document.querySelector('.chart-panel-container .right-box')),
    step0: arr(document.querySelector('.chart-panel-container .main .main-item')),
    step10: arr(document.querySelector('.chart-panel-container .main .main-item:last-child')),
    firstL: arr(document.querySelector('.chart-panel-container .left-box .process-box')),
    firstLArrow: arr(document.querySelector('.chart-panel-container .left-box .process-box--arrow')),
    firstR: arr(document.querySelector('.chart-panel-container .right-box .process-box')),
    firstRArrow: arr(document.querySelector('.chart-panel-container .right-box .process-box--arrow')),
  };
});
console.log(JSON.stringify(v, null, 2));
await browser.close();
