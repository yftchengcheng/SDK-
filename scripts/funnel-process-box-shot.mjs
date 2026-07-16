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

// 全页面截图
await page.screenshot({ path: 'public/funnel-processbox-full.png' });

// 单独截漏斗图表区
const chartWrap = await page.$('.funnel-chart-wrap');
if (chartWrap) {
  await chartWrap.screenshot({ path: 'public/funnel-processbox-chart.png' });
}

// 数据: 检查 process-box 数量
const data = await page.evaluate(() => {
  const steps = document.querySelectorAll('.chart-panel-container .main .main-item');
  const leftBoxes = document.querySelectorAll('.chart-panel-container .left-box .process-box');
  const rightBoxes = document.querySelectorAll('.chart-panel-container .right-box .process-box');
  const arrowsL = document.querySelectorAll('.chart-panel-container .left-box .process-box--arrow');
  const arrowsR = document.querySelectorAll('.chart-panel-container .right-box .process-box--arrow');
  const linesL = document.querySelectorAll('.chart-panel-container .left-box .process-box--line');
  const linesR = document.querySelectorAll('.chart-panel-container .right-box .process-box--line');
  const singles = document.querySelectorAll('.chart-panel-container .right-box .process-box--line__single');
  // 第一个左侧 process-box (广告场景到达率) 的位置
  const first = leftBoxes[0];
  const r = first ? first.getBoundingClientRect() : null;
  return {
    steps: steps.length,
    leftBoxes: leftBoxes.length,
    rightBoxes: rightBoxes.length,
    arrowsL: arrowsL.length,
    arrowsR: arrowsR.length,
    linesL: linesL.length,
    linesR: linesR.length,
    rightSingles: singles.length,
    firstLeftBox: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null,
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
