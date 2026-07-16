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
await page.setViewport({ width: 1600, height: 2000 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));
// 默认在展示频次
const info = await page.evaluate(() => {
  const tbl = document.querySelector('.frequency-table');
  if (!tbl) return { error: 'frequency-table not found' };
  const rows = Array.from(tbl.querySelectorAll('.frequency-row'));
  const headers = Array.from(tbl.querySelectorAll('.frequency-row--header .frequency-col')).map(c => c.textContent.trim());
  // 取前 3 行数据
  const data = rows.slice(1, 4).map(r => Array.from(r.querySelectorAll('.frequency-col')).map(c => c.textContent.trim()));
  // 看每列的 grid 位置
  const headerCols = Array.from(tbl.querySelectorAll('.frequency-row--header .frequency-col'));
  const colRects = headerCols.map(c => {
    const r = c.getBoundingClientRect();
    return { label: c.textContent.trim(), x: Math.round(r.left), w: Math.round(r.width) };
  });
  return {
    tableW: Math.round(tbl.getBoundingClientRect().width),
    headers,
    colRects,
    data,
    totalCols: headers.length,
    sameColCount: data.every(r => r.length === headers.length),
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'public/freq-table-actual.png', fullPage: true, clip: { x: 0, y: 0, width: 1200, height: 1500 } });
await browser.close();
