import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const logs = [];
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`));
await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 2000));
await page.evaluate(async () => {
  const r = await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'dashboard-test@demo.com', password: 'Test123456' }) });
  const j = await r.json();
  if (j.data && j.data.token) { localStorage.setItem('token', j.data.token); if (j.data.userInfo) localStorage.setItem('userInfo', JSON.stringify(j.data.userInfo)); }
});
await page.goto('http://localhost:5000/placement', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
// 点新增广告位
const newBtn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('新增') || b.textContent.includes('创建')));
if (newBtn) await newBtn.click();
await new Promise(r => setTimeout(r, 2000));
const status = await page.evaluate(() => {
  const detail = document.querySelector('.pd-field-details');
  const title = document.querySelector('.pd-field-details__title');
  const rows = document.querySelectorAll('.pd-field-details__table .el-table__row');
  const headers = Array.from(document.querySelectorAll('.pd-field-details__table th')).map(t => t.textContent.trim());
  const firstRowData = rows[0] ? Array.from(rows[0].querySelectorAll('td')).map(c => c.textContent.trim()) : [];
  return {
    detailFound: !!detail,
    title: title ? title.textContent.trim().replace(/\s+/g, ' ').slice(0, 100) : '',
    rowCount: rows.length,
    headers: headers,
    firstRow: firstRowData,
  };
});
console.log(JSON.stringify(status, null, 2));
await page.screenshot({ path: '/tmp/pd-detail.png' });
const errs = logs.filter(l => l.includes('[error]') || l.includes('TypeError') || l.includes('CircleCheckFilled') || l.includes('InfoFilled'));
console.log('errors:', errs.length);
errs.forEach(e => console.log(e));
await browser.close();
