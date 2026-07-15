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
    localStorage.setItem('userRole', data.data.userInfo?.role || 'admin');
  }, loginRes);

  const routes = [
    { path: '/report/overview', name: 'overview' },
    { path: '/report/funnel', name: 'funnel' },
    { path: '/report/behavior', name: 'behavior' },
    { path: '/admin/report-metric', name: 'metric' },
  ];

  for (const r of routes) {
    await page.goto('http://localhost:5000' + r.path, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    const info = await page.evaluate(() => ({
      masterPanel: !!document.querySelector('.report-master-panel'),
      detailPanel: !!document.querySelector('.report-detail-panel'),
      masterItems: document.querySelectorAll('.report-master-item').length,
      title: document.querySelector('.page-header-title, .report-detail-title')?.textContent?.trim(),
    }));
    console.log(`${r.name}: ${JSON.stringify(info)}`);
    await page.screenshot({ path: `/tmp/screenshot-report-${r.name}.png`, fullPage: true });
  }

  if (errors.length > 0) {
    console.error('\n=== Console errors ===');
    errors.forEach((e) => console.log(' -', e));
    process.exit(1);
  }
  console.log('\n✓ all pages rendered successfully');
  await browser.close();
})().catch((err) => {
  console.error('✗ failed:', err.message);
  process.exit(1);
});
