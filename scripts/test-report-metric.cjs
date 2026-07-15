/**
 * 指标字典管理 UI 自动化测试 (puppeteer)
 */
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

  // 1. 通过 API 登录（绕过验证码）
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle0' });
  const loginRes = await page.evaluate(async () => {
    const r = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: 'dashboard-test@demo.com', password: 'Test123456' }),
    });
    return { status: r.status, body: await r.json() };
  });
  if (!loginRes.body?.data?.token) {
    throw new Error('login API failed: ' + JSON.stringify(loginRes));
  }
  // Set token + userRole in localStorage so the app picks it up
  await page.evaluate((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userInfo', JSON.stringify(data.userInfo || {}));
    localStorage.setItem('userRole', data.userInfo?.role || 'admin');
  }, loginRes.body.data);
  console.log('1. ✓ login OK, role=' + loginRes.body.data.userInfo?.role);

  // 2. 跳转到指标字典
  await page.goto('http://localhost:5000/admin/report-metric', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.page-header-title', { timeout: 10000 });
  const title = await page.$eval('.page-header-title', (el) => el.textContent.trim());
  console.log(`2. ✓ page title: ${title}`);

  // 3. 表格加载
  await page.waitForSelector('.el-table__row', { timeout: 8000 });
  const rowCount = await page.$$eval('.el-table__body-wrapper .el-table__row', (rows) => rows.length);
  console.log(`3. ✓ table rows: ${rowCount}`);
  if (rowCount < 30) throw new Error(`expected ~34 rows, got ${rowCount}`);

  // 4. 关键词搜索 (前端过滤)
  const searchInput = await page.$('.page-filter input[placeholder*="指标名称"]');
  if (searchInput) {
    await searchInput.type('revenue');
    await new Promise((r) => setTimeout(r, 500));
    const filteredCount = await page.$$eval('.el-table__body-wrapper .el-table__row', (rows) => rows.length);
    console.log(`4. ✓ filtered by 'revenue': ${filteredCount} rows`);
    // clear
    await page.click('.page-filter .el-input__clear');
    await new Promise((r) => setTimeout(r, 300));
  }

  // 5. 验证新建弹窗
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find((b) => b.textContent.trim().includes('新建指标'));
    if (target) target.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  const dialogInfo = await page.evaluate(() => {
    const d = document.querySelector('.el-dialog');
    if (!d) return null;
    return {
      display: getComputedStyle(d).display,
      visible: getComputedStyle(d).visibility,
      opacity: getComputedStyle(d).opacity,
      title: d.querySelector('.el-dialog__title')?.textContent?.trim(),
    };
  });
  console.log(`5. ✓ dialog: ${JSON.stringify(dialogInfo)}`);
  if (!dialogInfo || dialogInfo.title !== '新建指标') {
    throw new Error('dialog did not open');
  }

  // 6. 关闭弹窗
  await page.evaluate(() => {
    const dialog = document.querySelector('.el-dialog');
    if (!dialog) return;
    const cancelBtn = Array.from(dialog.querySelectorAll('button'))
      .find((b) => b.textContent.trim() === '取消');
    if (cancelBtn) cancelBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  console.log('6. ✓ dialog closed');

  // 7. 端到端 CRUD 测试
  // 7a. 新建
  const testCode = `test_metric_${Date.now()}`;
  const testName = 'E2E测试指标';
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find((b) => b.textContent.trim().includes('新建指标'));
    if (target) target.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  // Fill the form
  const inputs = await page.$$('.el-dialog .el-input__inner');
  // [0] code, [1] name, [2] sub_category, [3] unit, [4] formula, [5] required_fields, [6] description
  await inputs[0].type(testCode);
  await inputs[1].type(testName);
  // Save
  await page.evaluate(() => {
    const dialog = document.querySelector('.el-dialog');
    const saveBtn = Array.from(dialog.querySelectorAll('button'))
      .find((b) => b.textContent.trim() === '保存');
    if (saveBtn) saveBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  // 7b. 验证创建后存在
  const createdExists = await page.evaluate((code) => {
    return Array.from(document.querySelectorAll('.el-table__row'))
      .some((row) => row.textContent.includes(code));
  }, testCode);
  console.log(`7a. ✓ create '${testCode}': ${createdExists ? 'OK' : 'NOT FOUND'}`);
  if (!createdExists) throw new Error('create failed');

  // 7c. 删除
  await page.evaluate((code) => {
    const rows = Array.from(document.querySelectorAll('.el-table__row'));
    const target = rows.find((r) => r.textContent.includes(code));
    if (target) {
      const delBtn = Array.from(target.querySelectorAll('button'))
        .find((b) => b.textContent.trim() === '删除' && !b.disabled);
      if (delBtn) delBtn.click();
    }
  }, testCode);
  await new Promise((r) => setTimeout(r, 800));
  // Confirm dialog
  await page.evaluate(() => {
    const confirmBtns = Array.from(document.querySelectorAll('.el-message-box .el-button--primary'));
    if (confirmBtns.length > 0) confirmBtns[0].click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  const deletedGone = await page.evaluate((code) => {
    return !Array.from(document.querySelectorAll('.el-table__row'))
      .some((row) => row.textContent.includes(code));
  }, testCode);
  console.log(`7b. ✓ delete '${testCode}': ${deletedGone ? 'OK' : 'STILL THERE'}`);
  if (!deletedGone) throw new Error('delete failed');

  // 8. 截图
  await page.screenshot({ path: '/tmp/screenshot-report-metric.png', fullPage: true });
  console.log('8. ✓ screenshot saved');

  if (errors.length > 0) {
    console.error('\n=== Console errors ===');
    errors.forEach((e) => console.log(' -', e));
    throw new Error(`${errors.length} console errors`);
  }

  console.log('\n✓ all checks passed');
  await browser.close();
})().catch(async (err) => {
  console.error('✗ failed:', err.message);
  process.exit(1);
});
