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

// 验证 1: 元素存在
const v1 = await page.evaluate(() => ({
  svg: !!document.querySelector('.funnel-link-svg'),
  paths: document.querySelectorAll('.funnel-link-svg path').length,
  polygons: document.querySelectorAll('.funnel-link-svg polygon').length,
  circles: document.querySelectorAll('.funnel-link-svg circle').length,
  blocks: document.querySelectorAll('.funnel-block').length,
}));

// 验证 2: path d 数据 (随机抽 3 个)
const v2 = await page.evaluate(() => ({
  paths: Array.from(document.querySelectorAll('.funnel-link-svg path')).slice(0, 5).map(p => p.getAttribute('d')),
  arrows: Array.from(document.querySelectorAll('.funnel-link-svg polygon')).slice(0, 5).map(p => ({
    points: p.getAttribute('points'),
    fill: p.getAttribute('fill'),
  })),
  cssStroke: getComputedStyle(document.querySelector('.funnel-link-svg path')).strokeWidth,
  cssDash: getComputedStyle(document.querySelector('.funnel-link-svg path')).strokeDasharray,
}));

console.log('=== V1 元素存在 ===');
console.log(JSON.stringify(v1, null, 2));
console.log('=== V2 数据 ===');
console.log(JSON.stringify(v2, null, 2));

// 验证 3: 视觉 - 截大图
await page.screenshot({ path: 'public/funnel-verify-1.png', clip: { x: 200, y: 420, width: 1000, height: 650 } });
await page.screenshot({ path: 'public/funnel-verify-2.png', fullPage: true });

// 验证 4: 检查 arrow 是否真的渲染了 (找三角形的 3 个顶点像素)
const arrCheck = await page.evaluate(() => {
  const arrows = document.querySelectorAll('.funnel-link-svg polygon');
  const arr = arrows[0];
  const rect = arr.getBoundingClientRect();
  return {
    arr0_rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
    arr0_visible: rect.width > 0 && rect.height > 0,
  };
});
console.log('=== V4 第一个箭头 rect ===');
console.log(JSON.stringify(arrCheck, null, 2));

await browser.close();
