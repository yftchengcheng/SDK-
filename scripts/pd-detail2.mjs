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
// 找所有 button 看有什么按钮
const btns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim().slice(0, 30)).filter(t => t));
console.log('所有按钮:', JSON.stringify(btns));
// 点第一个"新增"
const newBtn = await page.evaluateHandle(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  return btns.find(b => b.textContent.includes('创建广告位'));
});
if (newBtn) {
  await page.evaluate(el => el.click(), newBtn);
}
await new Promise(r => setTimeout(r, 3000));
const status = await page.evaluate(() => {
  return {
    drawerVisible: !!document.querySelector('.el-drawer__open'),
    drawerForm: document.querySelector('.el-drawer__open form') ? 'form-found' : 'no-form',
    detailFound: !!document.querySelector('.pd-field-details'),
    rowCount: document.querySelectorAll('.pd-field-details__table .el-table__row').length,
    title: document.querySelector('.pd-field-details__title')?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100),
  };
});
console.log(JSON.stringify(status, null, 2));
const errs = logs.filter(l => l.includes('[error]') || l.includes('TypeError') || l.includes('CircleCheckFilled') || l.includes('InfoFilled') || l.includes('formatFieldDetails'));
console.log('errors:', errs.length);
errs.forEach(e => console.log(e));
await browser.close();
