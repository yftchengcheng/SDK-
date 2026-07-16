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
  const blocks = Array.from(document.querySelectorAll('.funnel-block'));
  const polys = Array.from(document.querySelectorAll('.funnel-link-svg polygon'));
  // 1. SVG 实际位置（相对 grid）
  const svgOffset = { x: svgRect.left - gridRect.left, y: svgRect.top - gridRect.top };
  // 2. SVG viewBox
  const viewBox = svg.getAttribute('viewBox').split(' ').map(Number);
  // 3. SVG 内 (0,0) 对应 实际 DOM 位置
  const svgZeroInGrid = { x: svgOffset.x, y: svgOffset.y };
  // 4. SVG viewBox y=20 实际对应 DOM y
  const scaleY = svgRect.height / viewBox[3];
  const scaleX = svgRect.width / viewBox[2];
  const v20DomY = svgOffset.y + 20 * scaleY;
  // 5. 找 step 0 (应用启动) 实际 y
  const step0 = blocks[0].getBoundingClientRect();
  return {
    svg: { left: svgOffset.x, top: svgOffset.y, width: svgRect.width, height: svgRect.height, viewBox, scale: { x: scaleX, y: scaleY } },
    step0: { top: step0.top - gridRect.top, bottom: step0.bottom - gridRect.top, centerY: (step0.top + step0.bottom) / 2 - gridRect.top, text: blocks[0].textContent.trim() },
    step4: (() => { const r = blocks[4].getBoundingClientRect(); return { top: r.top - gridRect.top, bottom: r.bottom - gridRect.top, centerY: (r.top + r.bottom) / 2 - gridRect.top, text: blocks[4].textContent.trim() }; })(),
    v20DomY,
    arrowTipY0: 20, // SVG 坐标
    arrowTipY0Dom: v20DomY,
  };
});
console.log(JSON.stringify(v, null, 2));
await browser.close();
