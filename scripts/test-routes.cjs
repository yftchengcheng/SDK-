const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', err => console.log('[pageerror]', err.message));
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

  for (const route of ['/report/overview', '/report/funnel', '/report/behavior']) {
    await page.goto('http://localhost:5000' + route, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    const title = await page.title();
    const h2 = await page.evaluate(() => document.querySelector('h2.page-title')?.textContent?.trim());
    console.log(`${route} → title=${title}, h2=${h2}`);
  }
  await browser.close();
})();
