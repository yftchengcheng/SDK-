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
  const container = document.querySelector('.chart-panel-container');
  const body = document.querySelector('.chart-panel-container .body');
  const left = document.querySelector('.chart-panel-container .left-box');
  const main = document.querySelector('.chart-panel-container .main');
  const right = document.querySelector('.chart-panel-container .right-box');
  const firstStep = document.querySelector('.chart-panel-container .main .main-item');
  const firstL = document.querySelector('.chart-panel-container .left-box .process-box');
  const firstR = document.querySelector('.chart-panel-container .right-box .process-box');
  // 计算第一个 process-box 内的 arrow 位置
  const firstLArrow = document.querySelector('.chart-panel-container .left-box .process-box--arrow');
  const firstRArrow = document.querySelector('.chart-panel-container .right-box .process-box--arrow');
  const r = (el) => el ? el.getBoundingClientRect() : null;
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    container: r(container),
    body: r(body),
    left: r(left),
    main: r(main),
    right: r(right),
    firstStep: r(firstStep),
    firstL: r(firstL),
    firstR: r(firstR),
    firstLArrow: r(firstLArrow),
    firstRArrow: r(firstRArrow),
    // CSS computed
    bodyDisplay: body ? getComputedStyle(body).display : null,
    bodyFlexDir: body ? getComputedStyle(body).flexDirection : null,
    mainFlex: main ? getComputedStyle(main).flex : null,
    containerW: container ? getComputedStyle(container).width : null,
  };
});
console.log(JSON.stringify(v, null, 2));
await browser.close();
