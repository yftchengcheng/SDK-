const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(err.message));

  // Login
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle0' });
  const loginRes = await page.evaluate(async () => {
    const r = await fetch('/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ email: 'aggtest@xinyi.cn', password: 'Test123456' }),
    });
    return await r.json();
  });
  await page.evaluate((data) => {
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('userInfo', JSON.stringify(data.data.userInfo || {}));
    localStorage.setItem('userRole', data.data.userInfo?.role || 'developer');
  }, loginRes);

  // Visit all data report pages
  for (const route of ['/report/overview', '/report/funnel', '/report/behavior', '/admin/report-metric']) {
    await page.goto('http://localhost:5000' + route, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    console.log(`✓ ${route} loaded`);
  }

  if (errors.length > 0) {
    console.error('\n=== Console errors ===');
    errors.forEach((e) => console.log(' -', e));
    process.exit(1);
  }

  console.log('\n✓ all pages loaded with no console errors');
  await browser.close();
})().catch((err) => {
  console.error('✗ failed:', err.message);
  process.exit(1);
});
