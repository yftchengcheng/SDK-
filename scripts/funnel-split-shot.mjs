import puppeteer from 'puppeteer';
const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'e2e' + Date.now() + '@e2e.com', password: 'Test123456', company: 'e2e', companyShortName: 'e2e', contactName: 'e2e', phone: '13800000000', accessType: 1 }),
});
const tk = (await reg.json()).data.token;
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2000));
const info = await page.evaluate(() => {
  const split = document.querySelector('.funnel-split');
  const left = document.querySelector('.funnel-split-left');
  const right = document.querySelector('.funnel-split-right');
  const tableRows = document.querySelectorAll('.funnel-table-wrap .el-table__row');
  const headers = Array.from(document.querySelectorAll('.funnel-table-wrap .el-table__header-wrapper th .cell')).map(c => c.textContent.trim());
  const firstRow = document.querySelector('.funnel-table-wrap .el-table__row td');
  const r0Cells = Array.from(document.querySelectorAll('.funnel-table-wrap .el-table__row')[0]?.querySelectorAll('td .cell') || []).map(c => c.textContent.trim());
  return {
    splitW: split?.offsetWidth, splitH: split?.offsetHeight,
    leftW: left?.offsetWidth, leftH: left?.offsetHeight,
    rightW: right?.offsetWidth, rightH: right?.offsetHeight,
    blockCount: document.querySelectorAll('.funnel-block').length,
    leftMetrics: document.querySelectorAll('.funnel-metric-left').length,
    rightMetrics: document.querySelectorAll('.funnel-metric-right').length,
    tableRows: tableRows.length,
    headers,
    r0Cells,
  };
});
console.log('[shot] device:', JSON.stringify(info, null, 2));
// 拍 split
const splitEl = await page.$('.funnel-split');
if (splitEl) await splitEl.screenshot({ path: 'public/funnel-split-device.png' });
// 切到 DAU
await page.evaluate(() => {
  const labels = document.querySelectorAll('.funnel-split-right label.el-radio-button');
  if (labels[1]) labels[1].click();
});
await new Promise(r => setTimeout(r, 700));
const info2 = await page.evaluate(() => {
  const headers = Array.from(document.querySelectorAll('.funnel-table-wrap .el-table__header-wrapper th .cell')).map(c => c.textContent.trim());
  const r0 = Array.from(document.querySelectorAll('.funnel-table-wrap .el-table__row')[0]?.querySelectorAll('td .cell') || []).map(c => c.textContent.trim());
  return { headers, r0 };
});
console.log('[shot] dau:', JSON.stringify(info2));
const splitEl2 = await page.$('.funnel-split');
if (splitEl2) await splitEl2.screenshot({ path: 'public/funnel-split-dau.png' });
await page.screenshot({ path: 'public/funnel-split-page.png', fullPage: true });
await browser.close();
console.log('[shot] done');
