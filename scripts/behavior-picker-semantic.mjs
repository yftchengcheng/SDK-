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

// 先记录当前 KPI
const before = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.freq-trend-kpi-item')).map(k => k.querySelector('.freq-trend-kpi-name')?.textContent);
});
console.log('初始 KPI:', before);

// 打开弹窗
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('.behavior-card-actions button')).find(b => b.textContent.trim() === '指标');
  btn?.click();
});
await new Promise(r => setTimeout(r, 600));

// 取消所有 + 勾选 1 个 (eCPM)
const checkBefore = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.freq-trend-picker .el-checkbox__input')).map(c => c.classList.contains('is-checked'));
});
console.log('弹窗勾选状态:', checkBefore);

// 先取消所有 4 个已勾选
for (let i = 0; i < 4; i++) {
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('.freq-trend-picker .el-checkbox__input');
    const firstChecked = Array.from(inputs).findIndex(c => c.classList.contains('is-checked'));
    if (firstChecked >= 0) inputs[firstChecked].click();
  });
  await new Promise(r => setTimeout(r, 100));
}
// 再勾选 eCPM (第 7 个)
await page.evaluate(() => {
  const inputs = document.querySelectorAll('.freq-trend-picker .el-checkbox__input');
  inputs[6]?.click();
});
await new Promise(r => setTimeout(r, 300));

const checkAfter = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.freq-trend-picker .el-checkbox__input')).map(c => c.classList.contains('is-checked'));
});
console.log('操作后勾选状态:', checkAfter);

// 点确定
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('.el-dialog__footer button'));
  btns.find(b => b.textContent.trim() === '确定')?.click();
});
await new Promise(r => setTimeout(r, 800));

const kpi = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.freq-trend-kpi-item')).map(k => k.querySelector('.freq-trend-kpi-name')?.textContent);
});
console.log('只勾 eCPM 后 KPI:', kpi);

await page.screenshot({ path: 'public/behavior-only-ecpm.png', fullPage: true });
await browser.close();
