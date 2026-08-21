import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 2000));
await page.evaluate(async () => {
  const r = await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'dashboard-test@demo.com', password: 'Test123456' }) });
  const j = await r.json();
  if (j.data && j.data.token) { localStorage.setItem('token', j.data.token); if (j.data.userInfo) localStorage.setItem('userInfo', JSON.stringify(j.data.userInfo)); }
});
await page.goto('http://localhost:5000/placement', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
// 直接调用组件方法 - 找 Index.vue 里的 onCreate 触发
const result = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const createBtn = btns.find(b => b.textContent.trim() === '创建广告位');
  if (!createBtn) return 'no-btn';
  createBtn.click();
  return 'clicked';
});
console.log('result:', result);
await new Promise(r => setTimeout(r, 3000));
const status = await page.evaluate(() => {
  const drawers = Array.from(document.querySelectorAll('.el-drawer'));
  return {
    drawerCount: drawers.length,
    drawerOpen: drawers.map(d => d.classList.contains('is-opened') || d.classList.contains('opening') || d.classList.contains('open') || getComputedStyle(d).visibility === 'visible'),
    detailFound: !!document.querySelector('.pd-field-details'),
    rowCount: document.querySelectorAll('.pd-field-details__table .el-table__row').length,
    title: document.querySelector('.pd-field-details__title')?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80),
  };
});
console.log(JSON.stringify(status, null, 2));
await page.screenshot({ path: '/tmp/pd-detail3.png' });
await browser.close();
