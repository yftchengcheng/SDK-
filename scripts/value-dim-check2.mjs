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
await page.setViewport({ width: 1600, height: 1800 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

// 切到用户价值
await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('.behavior-master-item'));
  items.find(i => i.textContent.includes('用户价值'))?.click();
});
await new Promise(r => setTimeout(r, 1500));

// 打开维度弹窗
await page.evaluate(() => {
  Array.from(document.querySelectorAll('.behavior-value-table-pane .behavior-card-actions .el-button'))
    .find(b => b.textContent.trim() === '维度')?.click();
});
await new Promise(r => setTimeout(r, 600));

// 取消 3 个 (eCPM 设备占比 + 展示占比 + 设备数)
for (let i = 0; i < 3; i++) {
  await page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('.value-dim-picker-chip.is-checked'));
    if (chips.length > 0) chips[0].click();  // 取消第一个勾选的
  });
  await new Promise(r => setTimeout(r, 200));
}
await new Promise(r => setTimeout(r, 300));
// 点确定
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('.el-dialog__footer button'));
  btns.find(b => b.textContent.trim() === '确定')?.click();
});
await new Promise(r => setTimeout(r, 800));

const after = await page.evaluate(() => {
  const headers = Array.from(document.querySelectorAll('.behavior-value-table-pane .value-row--header .value-col')).map(c => c.textContent.trim());
  // 数据行单元格数 (除第一列)
  const firstRow = document.querySelector('.behavior-value-table-pane .value-row:not(.value-row--header)');
  const cells = firstRow ? Array.from(firstRow.querySelectorAll('.value-col')).map(c => c.textContent.trim()) : null;
  return { headers, firstRow: cells };
});
console.log('=== 取消 3 列后 ===');
console.log(JSON.stringify(after, null, 2));
await page.screenshot({ path: 'public/value-after.png', fullPage: true });
await browser.close();
