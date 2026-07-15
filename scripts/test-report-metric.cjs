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
    localStorage.setItem('userRole', data.data.userInfo?.role || 'admin');
  }, loginRes);
  console.log('1. ✓ login OK');

  await page.goto('http://localhost:5000/admin/report-metric', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const title = await page.title();
  console.log(`2. ✓ page title: ${title}`);

  // Verify master panel + detail panel
  const hasMaster = !!(await page.$('.report-master-panel'));
  const hasDetail = !!(await page.$('.report-detail-panel'));
  console.log(`3. ✓ master-detail layout: master=${hasMaster}, detail=${hasDetail}`);
  if (!hasMaster || !hasDetail) throw new Error('master-detail layout missing');

  // Master items should be 3 categories
  const masterItems = await page.$$('.report-master-item');
  console.log(`4. ✓ master items (categories): ${masterItems.length}`);
  if (masterItems.length < 3) throw new Error(`expected at least 3 categories, got ${masterItems.length}`);

  // Click "其他" category
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.report-master-item-name-text'));
    const other = items.find(i => i.textContent.trim() === '其他');
    if (other) other.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Table rows
  const rowCount = await page.$$eval('.el-table__body-wrapper .el-table__row', els => els.length);
  console.log(`5. ✓ table rows (其他): ${rowCount}`);

  // Search filter
  await page.type('.el-input__inner[placeholder*="搜索"]', 'revenue');
  await new Promise(r => setTimeout(r, 800));
  const filteredCount = await page.$$eval('.el-table__body-wrapper .el-table__row', els => els.length);
  console.log(`6. ✓ search filtered rows: ${filteredCount}`);

  // Clear search
  await page.evaluate(() => {
    const input = document.querySelector('.el-input__inner[placeholder*="搜索"]');
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 500));

  // Open new metric dialog
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.report-detail-toolbar .el-button, .report-master-panel .el-button'));
    const newBtn = btns.find(b => b.textContent.trim().includes('新建指标'));
    if (newBtn) newBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  const dialogVisible = !!(await page.$('.el-overlay-dialog'));
  console.log(`7. ✓ create dialog: ${dialogVisible}`);

  if (dialogVisible) {
    // Close
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.el-dialog button'));
      const cancel = btns.find(b => b.textContent.trim().includes('取消'));
      if (cancel) cancel.click();
    });
    await new Promise(r => setTimeout(r, 500));
  }

  await page.screenshot({ path: '/tmp/screenshot-report-metric.png', fullPage: true });
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
