import puppeteer from 'puppeteer';

(async () => {
  const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'e2e' + Date.now() + '@e2e.com', password: 'Test123456', company: 'e2e', companyShortName: 'e2e', contactName: 'e2e', phone: '13800000000', accessType: 1 }),
  });
  const tk = (await reg.json()).data.token;
  console.log('[funnel-e2e] token:', tk.slice(0, 20) + '...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', (e) => console.log('[funnel-e2e] PAGEERROR:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('[funnel-e2e] CONSOLE_ERR:', m.text().slice(0, 200)); });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
  await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: '/tmp/funnel-01.png', fullPage: true });
  // 1. 检查标题
  const title = await page.evaluate(() => document.querySelector('.page-header-title')?.textContent?.trim());
  console.log('[funnel-e2e] title:', title);
  // 2. 检查筛选
  const filterCount = await page.evaluate(() => document.querySelectorAll('.funnel-filter .el-form-item').length);
  console.log('[funnel-e2e] filter items:', filterCount);
  // 3. 警告条
  const hasWarning = await page.evaluate(() => !!document.querySelector('.funnel-warning'));
  console.log('[funnel-e2e] has warning:', hasWarning);
  // 4. 漏斗步骤数
  const stepCount = await page.evaluate(() => document.querySelectorAll('.funnel-block').length);
  console.log('[funnel-e2e] funnel steps:', stepCount);
  // 5. 左右侧指标（新结构：.funnel-metric-left / .funnel-metric-right）
  const leftMetric = await page.evaluate(() => document.querySelectorAll('.funnel-metric-left').length);
  const rightMetric = await page.evaluate(() => document.querySelectorAll('.funnel-metric-right').length);
  console.log('[funnel-e2e] left metrics:', leftMetric, 'right metrics:', rightMetric);
  // 5.1 检查 marker 色块
  const markerCount = await page.evaluate(() => document.querySelectorAll('.funnel-metric-mark').length);
  console.log('[funnel-e2e] metric marks:', markerCount);
  // 5.2 验证对齐：取第一个 left-metric 的 gridRow
  const leftAligns = await page.evaluate(() => Array.from(document.querySelectorAll('.funnel-metric-left')).map((el) => el.style.gridRow));
  console.log('[funnel-e2e] left aligns:', leftAligns.join(','));
  const rightAligns = await page.evaluate(() => Array.from(document.querySelectorAll('.funnel-metric-right')).map((el) => el.style.gridRow));
  console.log('[funnel-e2e] right aligns:', rightAligns.join(','));
  // 6. 表格行数
  const tableRows = await page.evaluate(() => document.querySelectorAll('.funnel-table-wrap .el-table__row').length);
  console.log('[funnel-e2e] table rows:', tableRows);
  // 7. 打开指标选择弹窗
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('指标选择'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const dialogCols = await page.evaluate(() => document.querySelectorAll('.metric-picker-col').length);
  const dialogItems = await page.evaluate(() => document.querySelectorAll('.metric-picker-item').length);
  console.log('[funnel-e2e] dialog cols:', dialogCols, 'dialog items:', dialogItems);
  await page.screenshot({ path: '/tmp/funnel-02-dialog.png', fullPage: true });
  // 8. 切设备数/DAU
  await page.evaluate(() => {
    const close = document.querySelector('.metric-picker-dialog .el-dialog__headerbtn');
    if (close) close.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.el-radio-button')).find((b) => b.textContent?.trim() === 'DAU');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  // 9. 展开/收起
  const collapsed = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('展开') || b.textContent?.includes('收起'));
    if (btn) btn.click();
    return !!btn;
  });
  console.log('[funnel-e2e] expand/collapse clickable:', collapsed);
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: '/tmp/funnel-03.png', fullPage: true });
  await browser.close();
  console.log('[funnel-e2e] ALL DONE');
})();
