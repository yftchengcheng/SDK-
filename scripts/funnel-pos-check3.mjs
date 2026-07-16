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
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const boxesL = Array.from(document.querySelectorAll('.chart-panel-container .left-box .process-box'));
  const boxesR = Array.from(document.querySelectorAll('.chart-panel-container .right-box .process-box'));
  const getStyle = (el) => {
    const s = el.getAttribute('style') || '';
    return s;
  };
  const getComputed = (el) => {
    const cs = getComputedStyle(el);
    return { gridRow: cs.gridRow, gridColumn: cs.gridColumn, display: cs.display, position: cs.position };
  };
  return {
    leftBox: arr(document.querySelector('.chart-panel-container .left-box')),
    main: arr(document.querySelector('.chart-panel-container .main')),
    leftBoxes: boxesL.map((b, i) => ({
      i,
      name: b.querySelector('.label')?.textContent?.trim() || '',
      style: getStyle(b),
      computed: getComputed(b),
      rect: arr(b),
    })),
    rightBoxes: boxesR.map((b, i) => ({
      i,
      name: b.querySelector('.label')?.textContent?.trim() || '',
      style: getStyle(b),
      computed: getComputed(b),
      rect: arr(b),
    })),
  };
});
console.log(JSON.stringify(v, null, 2));
await browser.close();
