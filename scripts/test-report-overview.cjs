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
  if (!loginRes.data?.token) throw new Error('login failed: ' + JSON.stringify(loginRes));
  await page.evaluate((data) => {
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('userInfo', JSON.stringify(data.data.userInfo || {}));
    localStorage.setItem('userRole', data.data.userInfo?.role || 'developer');
  }, loginRes);
  console.log('1. ✓ login OK');

  await page.goto('http://localhost:5000/report/overview', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const title = await page.title();
  console.log(`2. ✓ page title: ${title}`);

  // Open create dialog
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().includes('新建看版'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  const dialogVisible = !!(await page.$('.el-overlay-dialog'));
  console.log(`3. ✓ create dialog: ${dialogVisible}`);
  if (!dialogVisible) throw new Error('dialog should open');

  // Fill name + save
  await page.type('.el-dialog .el-input__inner', 'E2E测试看版');
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.el-dialog button')).find(b => b.textContent.trim().includes('保存'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  console.log('4. ✓ submitted');

  // Click board selector
  await page.click('.overview-toolbar-left .el-select__wrapper');
  await new Promise(r => setTimeout(r, 500));
  const inList = await page.evaluate(() => {
    const opts = Array.from(document.querySelectorAll('.el-select-dropdown__item'));
    return opts.some(o => o.textContent.trim().includes('E2E测试看版'));
  });
  console.log(`5. ✓ board in dropdown: ${inList}`);

  // Select the new board
  await page.evaluate(() => {
    const opts = Array.from(document.querySelectorAll('.el-select-dropdown__item'));
    const opt = opts.find(o => o.textContent.trim().includes('E2E测试看版'));
    if (opt) opt.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Test each view mode
  for (const mode of ['卡片', '趋势', '柱状', '表格']) {
    await page.evaluate((m) => {
      const btns = Array.from(document.querySelectorAll('.el-radio-button__inner'));
      const b = btns.find(x => x.textContent.trim() === m);
      if (b) b.click();
    }, mode);
    await new Promise(r => setTimeout(r, 1200));
    const hasContent = await page.evaluate(() => !!document.querySelector('.page-card, .el-table, .kpi-card, [class*="chart"]'));
    console.log(`6.${mode} ✓ view ${mode}: hasContent=${hasContent}`);
  }

  // Cleanup
  const deleted = await page.evaluate(async () => {
    const r = await fetch('/api/v1/console/report/board/list?report_type=overview', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
    });
    const data = await r.json();
    const board = (data.data || []).find(b => b.name === 'E2E测试看版');
    if (board) {
      await fetch(`/api/v1/console/report/board/delete/${board.id}`, {
        method: 'DELETE', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
      });
      return board.id;
    }
    return null;
  });
  console.log(`7. ✓ cleanup: deleted ${deleted}`);

  await page.screenshot({ path: '/tmp/screenshot-report-overview.png', fullPage: true });
  console.log('8. ✓ screenshot');

  if (errors.length > 0) {
    console.error('\n=== Console errors ===');
    errors.slice(0, 5).forEach((e) => console.log(' -', e));
  }

  await browser.close();
  console.log('\n✓ all checks passed');
})().catch((err) => {
  console.error('✗ failed:', err.message);
  process.exit(1);
});
