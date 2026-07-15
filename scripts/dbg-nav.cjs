const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('console', msg => { if (msg.type() === 'error') console.log('[error]', msg.text().slice(0, 200)); });
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
  try {
    await page.goto('http://localhost:5000/report/overview', { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log('overview dom loaded');
    await new Promise(r => setTimeout(r, 2000));
    // Check for create dialog by looking for the button
    const newBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.el-button'));
      return btns.find(b => b.textContent.trim().includes('新建看版'))?.textContent?.trim();
    });
    console.log('new button:', newBtn);
  } catch (e) {
    console.log('error:', e.message);
  }
  await browser.close();
})();
