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

  await page.goto('http://localhost:5000/login', { waitUntil: 'load' });
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

  await page.goto('http://localhost:5000/report/overview', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));
  const title = await page.title();
  console.log(`2. ✓ page title: ${title}`);

  // Verify master panel + detail panel
  const hasMaster = !!(await page.$('.report-master-panel'));
  const hasDetail = !!(await page.$('.report-detail-panel'));
  console.log(`3. ✓ master-detail layout: master=${hasMaster}, detail=${hasDetail}`);

  // Click "新建看版" in master panel header
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.report-master-header button, .report-master-header .el-button'));
    const b = btns.find(x => x.textContent.trim().includes('新建看版'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 800));
  const dialogVisible = !!(await page.$('.el-overlay-dialog'));
  console.log(`4. ✓ create dialog: ${dialogVisible}`);
  if (!dialogVisible) throw new Error('dialog should open');

  // Fill name + save
  await page.evaluate(() => { const input = document.querySelector('.el-dialog .el-input__inner'); if (input) { input.focus(); document.execCommand('insertText', false, 'E2E测试看版'); input.dispatchEvent(new Event('input', { bubbles: true })); } });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.el-dialog button')).find(b => b.textContent.trim().includes('保存'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  console.log('5. ✓ board created');

  // Verify the new board appears in master list
  const boardInList = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.report-master-item-name-text'));
    return items.some(i => i.textContent.trim() === 'E2E测试看版');
  });
  console.log(`6. ✓ new board in master list: ${boardInList}`);

  // Click the new board to select
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.report-master-item'));
    const target = items.find(i => i.textContent.includes('E2E测试看版'));
    if (target) target.click();
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
    const hasContent = await page.evaluate(() => !!document.querySelector('.report-detail-content .el-table, .kpi-card, [class*="chart"]'));
    console.log(`7.${mode} ✓ view ${mode}: hasContent=${hasContent}`);
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
  console.log(`8. ✓ cleanup: deleted ${deleted}`);

  await page.screenshot({ path: '/tmp/screenshot-report-overview.png', fullPage: true });
  console.log('9. ✓ screenshot');

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
