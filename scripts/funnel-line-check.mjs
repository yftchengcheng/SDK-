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

const metrics = await page.evaluate(() => {
  const r = (el) => { const x = el.getBoundingClientRect(); return { x: Math.round(x.x), y: Math.round(x.y), w: Math.round(x.width), h: Math.round(x.height), cx: Math.round(x.x + x.width/2), cy: Math.round(x.y + x.height/2), right: Math.round(x.right), left: Math.round(x.left) }; };
  const grid = document.querySelector('.funnel-grid');
  const gr = grid.getBoundingClientRect();
  const blocks = Array.from(document.querySelectorAll('.funnel-block')).map((b, i) => ({ i, ...r(b) }));
  const lms = Array.from(document.querySelectorAll('.funnel-metric-left')).map((m, i) => ({ i, ...r(m), name: m.querySelector('.funnel-metric-name')?.textContent }));
  const rms = Array.from(document.querySelectorAll('.funnel-metric-right')).map((m, i) => ({ i, ...r(m), name: m.querySelector('.funnel-metric-name')?.textContent }));
  const paths = Array.from(document.querySelectorAll('.funnel-link-svg path')).map((p) => ({ d: p.getAttribute('d'), color: p.getAttribute('stroke') }));
  return { blocks, lms, rms, paths, gridRect: { x: gr.x, y: gr.y, w: gr.width, h: gr.height } };
});
const { blocks, lms, rms, paths, gridRect } = metrics;

const LEFT = [
  { name: '广告场景到达率', alignIdx: 4, links: [0, 4] },
  { name: '广告触发率', alignIdx: 6, links: [4, 6] },
  { name: '触发展示成功率', alignIdx: 7, links: [6, 7] },
  { name: '展示成功率', alignIdx: 8, links: [7, 8] },
  { name: '点击率', alignIdx: 10, links: [8, 10] },
];
const RIGHT = [
  { name: '人均启动', alignIdx: 0, links: [0] },
  { name: '流量填充率', alignIdx: 3, links: [2, 3] },
  { name: '广告Ready率', alignIdx: 4, links: [4] },
  { name: 'isReady成功率', alignIdx: 5, links: [5] },
  { name: '展示Gap', alignIdx: 9, links: [8, 9] },
];
const blockCenterSvg = (i) => ({ x: Math.round(blocks[i].cx - gridRect.x), y: Math.round(blocks[i].cy - gridRect.y) });
const lmCenterSvg = (i) => ({ x: Math.round(lms[i].right - gridRect.x), y: Math.round(lms[i].cy - gridRect.y) });
const rmCenterSvg = (i) => ({ x: Math.round(rms[i].left - gridRect.x), y: Math.round(rms[i].cy - gridRect.y) });

console.log('=== 左指标 ===');
for (let i = 0; i < LEFT.length; i++) {
  const m = lmCenterSvg(i);
  const main = blockCenterSvg(LEFT[i].links[0]);
  console.log(`${LEFT[i].name} 主线终点应为 (${main.x},${main.y}) 实际 line 起点(${m.x},${m.y})`);
}
console.log('---');
console.log('总 paths:', paths.length);
await page.screenshot({ path: 'public/funnel-line-check.png', clip: { x: 200, y: 430, width: 800, height: 600 } });
await browser.close();
