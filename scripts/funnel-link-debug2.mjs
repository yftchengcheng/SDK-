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
  const layout = document.querySelector('.funnel-layout');
  const lms = Array.from(document.querySelectorAll('.funnel-metric-left'));
  const blocks = Array.from(document.querySelectorAll('.funnel-block'));
  const lr = layout.getBoundingClientRect();
  // 计算每个 metric 和对应 step 的 SVG 内坐标
  const l0 = lms[0].getBoundingClientRect();
  const b4 = blocks[4].getBoundingClientRect();
  const b0 = blocks[0].getBoundingClientRect();
  return {
    layout: r(layout),
    lm0_in_svg: { x: Math.round(l0.x + l0.width/2 - lr.x), y: Math.round(l0.y + l0.height/2 - lr.y) },
    block0_in_svg: { x: Math.round(b0.x + b0.width/2 - lr.x), y: Math.round(b0.y + b0.height/2 - lr.y) },
    block4_in_svg: { x: Math.round(b4.x + b4.width/2 - lr.x), y: Math.round(b4.y + b4.height/2 - lr.y) },
    path0: document.querySelectorAll('.funnel-link-svg path')[0]?.getAttribute('d'),
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'public/funnel-link3.png', clip: { x: 200, y: 430, width: 800, height: 600 } });
await browser.close();
