const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', err => console.log('[err]', err.message));

  await page.goto('http://localhost:5000/login', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));
  const loginRes = await page.evaluate(async () => {
    const r = await fetch('/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'logintest2@example.com', password: 'Test1234!' })
    });
    return await r.json();
  });
  await page.evaluate((t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('userInfo', JSON.stringify(u));
    localStorage.setItem('userRole', 'developer');
  }, loginRes.data.token, loginRes.data);

  // Test 1: Metric picker dialog
  console.log('=== Metric Picker ===');
  await page.goto('http://localhost:5000/report/overview', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 3000));
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('设置指标'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  const m = await page.evaluate(() => ({
    title: document.querySelector('.el-dialog__title')?.innerText,
    cats: Array.from(document.querySelectorAll('.mp-cat-title')).map(e => e.innerText),
    itemsCount: document.querySelectorAll('.mp-cat-item').length
  }));
  console.log(JSON.stringify(m, null, 2));
  await page.screenshot({ path: '/tmp/metric-picker-final.png', fullPage: true });

  // Close dialog
  await page.evaluate(() => {
    const close = document.querySelector('.el-dialog__close');
    if (close) close.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Test 2: Funnel
  console.log('\n=== Funnel ===');
  await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 3000));
  const f = await page.evaluate(() => ({
    url: location.href,
    masterItems: document.querySelectorAll('.funnel-master-item').length,
    firstItems: Array.from(document.querySelectorAll('.funnel-master-item-name')).slice(0, 5).map(e => e.innerText),
    rateItems: document.querySelectorAll('.funnel-rate-item').length,
    rateNames: Array.from(document.querySelectorAll('.funnel-rate-item-name')).map(e => e.innerText),
    stepBars: document.querySelectorAll('.funnel-step').length
  }));
  console.log(JSON.stringify(f, null, 2));
  await page.screenshot({ path: '/tmp/funnel-final.png', fullPage: true });

  await browser.close();
})();
