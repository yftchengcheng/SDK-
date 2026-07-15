const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('console', msg => console.log('[console]', msg.type(), msg.text().slice(0, 200)));
  page.on('pageerror', err => console.log('[pageerror]', err.message));
  page.on('requestfailed', req => console.log('[reqfailed]', req.url().slice(0, 200)));
  page.on('response', res => {
    if (res.status() >= 400) console.log('[resp]', res.status(), res.url().slice(0, 200));
  });
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
  await page.goto('http://localhost:5000/report/overview', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
