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
  page.on('console', msg => { if (msg.type() === 'error') console.log('[c.err]', msg.text()); });

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

  await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 4000));
  const data = await page.evaluate(() => {
    return {
      masterItems: document.querySelectorAll('.funnel-master-item').length,
      selectedMaster: document.querySelectorAll('.funnel-master-item.active').length,
      stepBars: document.querySelectorAll('.funnel-step').length,
      rateItems: document.querySelectorAll('.funnel-rate-item').length,
      firstStepText: document.querySelector('.funnel-step-name')?.innerText,
      lastStepText: Array.from(document.querySelectorAll('.funnel-step-name')).slice(-1)[0]?.innerText,
      stepNames: Array.from(document.querySelectorAll('.funnel-step-name')).map(e => e.innerText),
      rateNames: Array.from(document.querySelectorAll('.funnel-rate-item-name')).map(e => e.innerText)
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: '/tmp/funnel-detail.png', fullPage: true });
  await browser.close();
})();
