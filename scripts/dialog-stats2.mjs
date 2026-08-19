import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const apiLogs = [];
page.on('response', res => {
  const u = res.url();
  if (u.includes('placement-candidates') || u.includes('sdk-versions') || u.includes('effect-versions')) {
    apiLogs.push(`[${res.status()}] ${u.replace('http://localhost:5000', '')}`);
  }
});
page.on('requestfailed', req => {
  if (req.url().includes('placement-candidates') || req.url().includes('sdk-versions') || req.url().includes('effect-versions')) {
    apiLogs.push(`[FAIL] ${req.url().replace('http://localhost:5000', '')}`);
  }
});
await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 2000));
await page.evaluate(async () => {
  const r = await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'dashboard-test@demo.com', password: 'Test123456' }) });
  const j = await r.json();
  if (j.data && j.data.token) { localStorage.setItem('token', j.data.token); if (j.data.userInfo) localStorage.setItem('userInfo', JSON.stringify(j.data.userInfo)); }
});
await page.goto('http://localhost:5000/app', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
apiLogs.length = 0;  // 清空 - 只统计按钮 click 后的
const btn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'SDK预置策略'));
await btn.click();
await new Promise(r => setTimeout(r, 3000));
console.log('按钮 click 后 API 调用:');
apiLogs.forEach(l => console.log(' ', l));
const dom = await page.evaluate(() => ({
  rightListHTML: document.querySelector('.policy-section')?.outerHTML?.length || 0,
  // 找 candidates 渲染区
  placementIds: Array.from(document.querySelectorAll('.el-dialog__body [class*="placement"]')).map(e => e.className).slice(0, 5),
  // 找 footer chip
  stats: document.querySelector('.policy-footer__stats')?.textContent?.trim().replace(/\s+/g, ' '),
  count: document.querySelector('.policy-footer__count')?.textContent?.trim(),
  exportBtn: document.querySelector('.policy-footer__btn-export')?.textContent?.trim(),
  cancelBtn: Array.from(document.querySelectorAll('.el-dialog__footer button')).map(b => b.textContent.trim()),
}));
console.log('DOM:', JSON.stringify(dom, null, 2));
await page.screenshot({ path: '/tmp/dialog-stats.png' });
await browser.close();
