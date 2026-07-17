import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'yufutang@adtalos.com', password: 'Test123456' }) });
const realToken = (await loginRes.json()).data?.token;
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' });
await wait(800);
await page.evaluate((tk) => { localStorage.setItem('token', tk); document.cookie = `auth_token=${tk}; path=/`; }, realToken);
await page.goto('http://localhost:5000/report/overview', { waitUntil: 'domcontentloaded' });
await wait(3000);

// 创建 3 列无维度看版
const createRes = await fetch('http://localhost:5000/api/v1/console/report/board/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${realToken}` },
  body: JSON.stringify({ name: '3列无维度测试', report_type: 'overview', sort_order: 99, is_default: false, is_hidden: false, config: { layout: { view: 'table' }, filters: { dateRange: '7d' }, dimensions: [], metrics: ['requests', 'impressions', 'revenue_actual'] } }),
});
const newBoard = (await createRes.json()).data;
console.log('created board id:', newBoard?.id);

const target = await page.evaluateHandle(() => {
  const items = document.querySelectorAll('[class*="report-master-item"]');
  for (const it of items) { if (it.textContent?.includes('3列无维度测试')) return it; }
  return null;
});
if (target) { const el = target.asElement(); if (el) await el.click(); }
await wait(2500);

const data = await page.evaluate(() => {
  const ths = Array.from(document.querySelectorAll('.el-table__header-wrapper thead th'));
  const tds = Array.from(document.querySelectorAll('.el-table__body-wrapper tbody tr:first-child td'));
  // 提取每个 cell 内文字的实际 rect
  const out = { ths: [], tds: [] };
  for (const th of ths) {
    const cell = th.querySelector('.cell');
    if (!cell) continue;
    const r = cell.getBoundingClientRect();
    const text = cell.textContent?.trim() || '';
    // 找 text 实际渲染区域
    const textR = Array.from(cell.children).map(c => c.getBoundingClientRect());
    out.ths.push({ x: r.x, w: r.width, text, textRect: textR.map(t => ({ x: t.x, w: t.width })) });
  }
  for (const td of tds) {
    const cell = td.querySelector('.cell');
    if (!cell) continue;
    const r = cell.getBoundingClientRect();
    const text = cell.textContent?.trim() || '';
    const textR = cell.firstElementChild?.getBoundingClientRect();
    out.tds.push({ x: r.x, w: r.width, text, textX: textR?.x, textW: textR?.width });
  }
  return out;
});
console.log(JSON.stringify(data, null, 2));

await page.screenshot({ path: '/workspace/projects/public/sdk-screenshots/report-fix-v2.png', fullPage: false });
await browser.close();
