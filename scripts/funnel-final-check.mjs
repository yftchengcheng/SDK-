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

const r = await page.evaluate(() => {
  const r = (el) => { const x = el.getBoundingClientRect(); return { x: Math.round(x.x), y: Math.round(x.y), w: Math.round(x.width), h: Math.round(x.height) }; };
  const grid = document.querySelector('.funnel-grid');
  const gr = grid.getBoundingClientRect();
  const blocks = Array.from(document.querySelectorAll('.funnel-block'));
  const lms = Array.from(document.querySelectorAll('.funnel-metric-left'));
  const rms = Array.from(document.querySelectorAll('.funnel-metric-right'));
  const results = [];
  // 测试每个 metric 的右边缘点 vs SVG line 起点
  for (let i = 0; i < lms.length; i++) {
    const m = r(lms[i]);
    const my = m.y + m.h/2 - gr.y;
    const mx = m.x + m.w - gr.x;
    results.push({ side: 'L', name: lms[i].querySelector('.funnel-metric-name')?.textContent, metric: { x: Math.round(mx), y: Math.round(my) } });
  }
  for (let i = 0; i < rms.length; i++) {
    const m = r(rms[i]);
    const my = m.y + m.h/2 - gr.y;
    const mx = m.x - gr.x;
    results.push({ side: 'R', name: rms[i].querySelector('.funnel-metric-name')?.textContent, metric: { x: Math.round(mx), y: Math.round(my) } });
  }
  const blockResults = blocks.map((b, i) => {
    const br = r(b);
    return { i, x: Math.round(br.x + br.w/2 - gr.x), y: Math.round(br.y + br.h/2 - gr.y), name: b.querySelector('.funnel-block-text')?.textContent };
  });
  // 解析 SVG path
  const paths = Array.from(document.querySelectorAll('.funnel-link-svg path')).map(p => p.getAttribute('d'));
  return { results, blockResults, paths, gridRect: { x: Math.round(gr.x), y: Math.round(gr.y) } };
});

const { results, blockResults, paths, gridRect } = r;
console.log('=== 检查 line 起点 vs metric 位置 ===');
let alignOK = 0, alignFail = 0;
for (let i = 0; i < results.length; i++) {
  const m = results[i];
  console.log(`${m.side} ${m.name}: metric 边 (${m.metric.x},${m.metric.y})`);
}
console.log('---');
console.log('=== 检查 line 终点 vs block 位置 ===');
for (let i = 0; i < blockResults.length; i++) {
  console.log(`block[${i}] ${blockResults[i].name} 中心 (${blockResults[i].x},${blockResults[i].y})`);
}

// 拍 split 区域
const splitEl = await page.$('.funnel-split');
if (splitEl) await splitEl.screenshot({ path: 'public/funnel-line-final.png' });

// 拍完整 page
await page.screenshot({ path: 'public/funnel-line-page.png', clip: { x: 200, y: 430, width: 800, height: 600 } });
await browser.close();
