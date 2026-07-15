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

  await page.goto('http://localhost:5000/report/overview', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 4000));
  const data = await page.evaluate(() => {
    // Get visible text in detail panel
    const detail = document.querySelector('.report-detail-panel');
    return {
      url: location.href,
      detailText: detail?.innerText?.substring(0, 1000).replace(/\n/g, ' | '),
      hasFilter: !!document.querySelector('.report-filter'),
      hasDateRange: !!document.querySelector('.report-date-range, .date-range-picker'),
      filterSelects: document.querySelectorAll('.report-filter .el-select').length,
      hasViewSwitcher: !!document.querySelector('.report-view-switcher, .view-mode-switch'),
      hasExportBtn: !!document.querySelector('.report-export-btn, [class*="export"]'),
      hasDimensionPicker: !!document.querySelector('.report-dimension, [class*="dimension"]'),
      hasMetricBtn: Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('设置指标')),
      allBtns: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim().substring(0, 20)).slice(0, 20)
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: '/tmp/overview-actual.png', fullPage: true });
  await browser.close();
})();
