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

  // 1) Open create dialog
  await page.goto('http://localhost:5000/report/overview', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 3000));
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('新建看版'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const dialogFields = await page.evaluate(() => {
    const items = document.querySelectorAll('.el-dialog .el-form-item');
    return Array.from(items).map(i => {
      const label = i.querySelector('.el-form-item__label')?.innerText;
      const input = i.querySelector('input')?.placeholder;
      const hasSelect = !!i.querySelector('select, .el-select');
      const checkCount = i.querySelectorAll('.el-checkbox').length;
      const radioCount = i.querySelectorAll('.el-radio').length;
      return { label, input, hasSelect, checkCount, radioCount };
    });
  });
  console.log('=== 新建看版 弹窗字段 ===');
  console.log(JSON.stringify(dialogFields, null, 2));
  await page.screenshot({ path: '/tmp/new-board-dialog.png', fullPage: true });

  // 2) Close dialog and check report view filter
  await page.evaluate(() => {
    const close = document.querySelector('.el-dialog__close');
    if (close) close.click();
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('\n=== 报表视图 筛选器状态 ===');
  const filterState = await page.evaluate(() => {
    return {
      filterExists: !!document.querySelector('.report-filter'),
      filterSelects: document.querySelectorAll('.report-filter .el-select').length,
      hasDetailPanel: !!document.querySelector('.report-detail-panel'),
      currentBoard: !!document.querySelector('.report-detail-title')
    };
  });
  console.log(JSON.stringify(filterState, null, 2));
  await page.screenshot({ path: '/tmp/overview-no-board.png', fullPage: true });

  await browser.close();
})();
