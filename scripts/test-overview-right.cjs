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
  const data = await page.evaluate(() => {
    const detailPanel = document.querySelector('.report-detail-panel');
    return {
      detailPanelExists: !!detailPanel,
      detailPanelText: detailPanel?.innerText?.substring(0, 300),
      viewModes: document.querySelectorAll('.report-detail-toolbar .el-radio-button').length,
      dataViewer: document.querySelector('.report-detail-data, .el-table, .kpi-grid, [class*="view"]')?.className,
      allViewContainers: Array.from(document.querySelectorAll('.report-detail-panel > div')).map(d => d.className)
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
