const puppeteer = require('puppeteer');

(async () => {
  console.log('=== E2E Test: Data Report Module ===');
  const browser = await puppeteer.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', err => console.log('[pageerror]', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[console.error]', msg.text());
  });

  // Login
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
  const token = loginRes.data.token;
  await page.evaluate((t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('userInfo', JSON.stringify(u));
    localStorage.setItem('userRole', 'developer');
  }, token, loginRes.data);

  // === Test 1: Overview with board (filter should show) ===
  console.log('\n[1] Overview with board');
  await page.goto('http://localhost:5000/report/overview', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 3000));
  const overviewData = await page.evaluate(() => ({
    url: location.href,
    filterExists: !!document.querySelector('.report-filter'),
    selects: document.querySelectorAll('.report-filter .el-select').length,
    boardItems: document.querySelectorAll('.report-master-detail .master-item, [class*="board-item"]').length,
    allElems: document.querySelectorAll('*').length
  }));
  console.log('   ', JSON.stringify(overviewData));
  await page.screenshot({ path: '/tmp/01-overview.png', fullPage: true });

  // === Test 2: Click first board to load detail ===
  console.log('\n[2] Click board to load detail');
  const boardItem = await page.$('.report-master-detail .master-item, .report-master-panel [class*="item"]');
  if (boardItem) {
    await boardItem.click();
    await new Promise(r => setTimeout(r, 2000));
    const detailData = await page.evaluate(() => ({
      filterExists: !!document.querySelector('.report-filter'),
      selects: document.querySelectorAll('.report-filter .el-select').length,
      tableRows: document.querySelectorAll('.el-table__row').length,
      headerSelects: document.querySelectorAll('.report-detail-header .el-select').length
    }));
    console.log('   after click:', JSON.stringify(detailData));
    await page.screenshot({ path: '/tmp/02-overview-board.png', fullPage: true });
  }

  // === Test 3: Funnel ===
  console.log('\n[3] Funnel');
  await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2500));
  const funnelData = await page.evaluate(() => ({
    masterItems: document.querySelectorAll('.funnel-master-item').length,
    steps: document.querySelectorAll('.funnel-step').length,
    rates: document.querySelectorAll('.funnel-rate-item').length,
    formula: !!document.querySelector('.funnel-formula-body')
  }));
  console.log('   ', JSON.stringify(funnelData));
  await page.screenshot({ path: '/tmp/03-funnel.png', fullPage: true });

  // === Test 4: Funnel - select 11 steps ===
  console.log('\n[4] Funnel - click all 11 steps');
  const masterItems = await page.$$('.funnel-master-item');
  for (let i = 0; i < masterItems.length; i++) {
    await masterItems[i].click();
    await new Promise(r => setTimeout(r, 200));
  }
  const stepsAfter = await page.evaluate(() => document.querySelectorAll('.funnel-step').length);
  console.log('   steps after selecting 11:', stepsAfter);
  await page.screenshot({ path: '/tmp/04-funnel-11steps.png', fullPage: true });

  // === Test 5: Funnel - formula validation ===
  console.log('\n[5] Funnel - formula validation');
  const formulaInput = await page.$('.funnel-formula-body .el-input__inner');
  if (formulaInput) {
    await formulaInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await formulaInput.type('step_4_click / step_1_impression');
    await new Promise(r => setTimeout(r, 500));
    const msg = await page.evaluate(() => {
      const m = document.querySelector('.funnel-formula-msg');
      return m ? { text: m.innerText, error: m.classList.contains('error'), success: m.classList.contains('success') } : null;
    });
    console.log('   formula 1/1:', JSON.stringify(msg));
    await page.screenshot({ path: '/tmp/05-funnel-formula-ok.png', fullPage: true });
  }

  // === Test 6: Behavior - 3 sub-tabs ===
  console.log('\n[6] Behavior - 3 sub-tabs');
  await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2500));
  const behMaster = await page.evaluate(() => document.querySelectorAll('.behavior-master-item').length);
  console.log('   master items:', behMaster);
  for (let i = 0; i < behMaster; i++) {
    const items = await page.$$('.behavior-master-item');
    await items[i].click();
    await new Promise(r => setTimeout(r, 1000));
    const data = await page.evaluate((idx) => ({
      active: document.querySelectorAll('.behavior-master-item')[idx].classList.contains('active'),
      frequencyRows: document.querySelectorAll('.frequency-row').length,
      valueSummaries: document.querySelectorAll('.value-summary-item').length,
      durationChart: !!document.querySelector('.duration-chart-canvas')
    }), i);
    console.log(`   tab ${i}:`, JSON.stringify(data));
  }
  await page.screenshot({ path: '/tmp/06-behavior-duration.png', fullPage: true });

  // === Test 7: Export endpoint (try multiple paths) ===
  console.log('\n[7] Export endpoint');
  for (const url of ['/api/v1/console/report/export/pdf', '/api/v1/console/report/aggregate/export/pdf']) {
    const r = await page.evaluate(async (u, t) => {
      const res = await fetch(u, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t },
        body: JSON.stringify({ report_type: 'overview', dimensions: ['date'], metrics: ['impressions','clicks','revenue_actual'], filters: { dateRange: '7d' } })
      });
      return { url: u, status: res.status, ct: res.headers.get('content-type'), len: (await res.text()).length };
    }, url, token);
    console.log('  ', JSON.stringify(r));
  }

  console.log('\n=== Done ===');
  await browser.close();
})();
