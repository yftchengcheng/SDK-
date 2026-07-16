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
await page.setViewport({ width: 1600, height: 1200 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

// 打开指标弹窗
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('.behavior-card-actions button')).find(b => b.textContent.trim() === '指标');
  btn?.click();
});
await new Promise(r => setTimeout(r, 600));
const pickerInfo = await page.evaluate(() => {
  const dlg = document.querySelector('.el-dialog');
  const chips = document.querySelectorAll('.freq-trend-picker-chip');
  return {
    dlgVisible: !!dlg,
    dlgTitle: dlg?.querySelector('.el-dialog__title')?.textContent,
    chipCount: chips.length,
    chips: Array.from(chips).map(c => c.textContent.trim()),
  };
});
console.log('=== 指标弹窗 ===');
console.log(JSON.stringify(pickerInfo, null, 2));
await page.screenshot({ path: 'public/behavior-picker.png', fullPage: false });

// 勾选所有 7 个
await page.evaluate(() => {
  const labels = document.querySelectorAll('.freq-trend-picker .el-checkbox');
  for (const l of labels) l.click();
});
await new Promise(r => setTimeout(r, 500));
// 点确定
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('.el-dialog__footer button'));
  btns.find(b => b.textContent.trim() === '确定')?.click();
});
await new Promise(r => setTimeout(r, 800));

const afterInfo = await page.evaluate(() => {
  const kpi = document.querySelectorAll('.freq-trend-kpi-item');
  return {
    kpiCount: kpi.length,
    kpi: Array.from(kpi).map(k => k.querySelector('.freq-trend-kpi-name')?.textContent),
  };
});
console.log('=== 全选 7 个后 ===');
console.log(JSON.stringify(afterInfo, null, 2));
await page.screenshot({ path: 'public/behavior-all7.png', fullPage: true });
await browser.close();
