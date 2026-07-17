import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox'],
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });

const wait = (ms) => new Promise(r => setTimeout(r, ms));

const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'yufutang@adtalos.com', password: 'Test123456' }),
});
const realToken = (await loginRes.json()).data?.token;

await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' });
await wait(800);
await page.evaluate((tk) => {
  localStorage.setItem('token', tk);
  document.cookie = `auth_token=${tk}; path=/`;
}, realToken);

await page.goto('http://localhost:5000/report/overview', { waitUntil: 'domcontentloaded' });
await wait(3000);

// 直接用 puppeteer 创建新的看版（placement 维度，3 个指标）
const updateRes = await page.evaluate(async (tk) => {
  const list = await fetch('/api/v1/console/report/board/list?report_type=overview', {
    headers: { Authorization: 'Bearer ' + tk }
  }).then(r => r.json());
  const board = list.data[0];

  // 更新为 placement 维度
  const r = await fetch(`/api/v1/console/report/board/update/${board.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk },
    body: JSON.stringify({
      name: board.name,
      description: '测试看版',
      report_type: 'overview',
      sort_order: board.sort_order,
      is_default: board.is_default,
      is_hidden: board.is_hidden,
      config: {
        ...board.config,
        dimensions: ['placement'],
        metrics: ['requests', 'impressions', 'revenue_actual'],
      },
    }),
  });
  return { status: r.status, data: await r.json() };
}, realToken);
console.log('update:', JSON.stringify(updateRes, null, 2));

await page.reload({ waitUntil: 'domcontentloaded' });
await wait(3000);

await page.screenshot({ path: '/workspace/projects/public/sdk-screenshots/report-placement-3col.png', fullPage: false });

const tableInfo = await page.evaluate(() => {
  const ths = Array.from(document.querySelectorAll('.el-table__header-wrapper table th'));
  const tds = Array.from(document.querySelectorAll('.el-table__body-wrapper table tbody tr:first-child td'));
  return {
    thTexts: ths.map(t => (t.textContent || '').trim()),
    tdTexts: tds.map(t => (t.textContent || '').trim()),
    thPos: ths.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
    tdPos: tds.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; }),
  };
});
console.log('table info:', JSON.stringify(tableInfo, null, 2));

await browser.close();
