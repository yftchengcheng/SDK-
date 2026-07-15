const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:5000/login', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));
  const loginRes = await page.evaluate(async () => {
    const r = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'logintest2@example.com', password: 'Test1234!' })
    });
    return await r.json();
  });
  await page.evaluate((t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('userInfo', JSON.stringify(u));
    localStorage.setItem('userRole', 'developer');
  }, loginRes.data.token, loginRes.data);

  await page.goto('http://localhost:5000/report/overview', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 5000));
  const data = await page.evaluate(() => ({
    url: location.href,
    bodyLen: document.body.innerText.length,
    filter: !!document.querySelector('.report-filter'),
    selects: document.querySelectorAll('.report-filter .el-select').length,
    masterItems: document.querySelectorAll('.master-detail-item, .report-master-item').length,
    boardItems: document.querySelectorAll('.report-master-detail .master-item, [class*="master"]').length,
    allClasses: Array.from(new Set(Array.from(document.querySelectorAll('[class*="master"]')).map(e => e.className).filter(c => c).slice(0, 5)))
  }));
  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: '/tmp/report-overview-deep.png', fullPage: true });
  await browser.close();
})();
