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
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '创建广告位');
  if (btn) btn.click();
});
await new Promise(r => setTimeout(r, 3000));
const dump = await page.evaluate(() => {
  const drawer = document.querySelector('.el-drawer__open') || document.querySelector('.el-drawer');
  if (!drawer) return 'no drawer';
  // 找所有 section / class
  const sections = Array.from(drawer.querySelectorAll('section')).map(s => s.className);
  const allClasses = Array.from(drawer.querySelectorAll('[class*="pd-"]')).map(e => e.className).slice(0, 10);
  return { sections, allClasses, hasFormatFieldDetails: !!drawer.querySelector('.pd-field-details') };
});
console.log(JSON.stringify(dump, null, 2));
const errs = logs.filter(l => l.includes('[error]') || l.includes('TypeError') || l.includes('formatFieldDetails') || l.includes('Cannot read'));
console.log('errors:', errs.length);
errs.forEach(e => console.log(e));
await page.screenshot({ path: '/tmp/pd-detail4.png' });
await browser.close();
