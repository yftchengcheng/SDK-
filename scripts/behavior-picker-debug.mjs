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

// 打开弹窗
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('.behavior-card-actions button')).find(b => b.textContent.trim() === '指标');
  btn?.click();
});
await new Promise(r => setTimeout(r, 600));

// 用更稳健的点击方式 - 直接点 checkbox 的 input
const debug = await page.evaluate(() => {
  const checks = document.querySelectorAll('.freq-trend-picker .el-checkbox__input');
  return Array.from(checks).map(c => ({
    checked: c.classList.contains('is-checked'),
    visible: c.offsetWidth > 0,
    label: c.closest('.el-checkbox')?.textContent?.trim().slice(0, 30),
  }));
});
console.log('before clicks:', JSON.stringify(debug, null, 2));

// 逐个点击
for (let i = 0; i < 7; i++) {
  await page.evaluate((idx) => {
    const inputs = document.querySelectorAll('.freq-trend-picker .el-checkbox__input');
    if (inputs[idx]) {
      inputs[idx].click();
    }
  }, i);
  await new Promise(r => setTimeout(r, 100));
}
await new Promise(r => setTimeout(r, 500));

const after = await page.evaluate(() => {
  const checks = document.querySelectorAll('.freq-trend-picker .el-checkbox__input');
  return Array.from(checks).map(c => ({
    checked: c.classList.contains('is-checked'),
    label: c.closest('.el-checkbox')?.textContent?.trim().slice(0, 30),
  }));
});
console.log('after clicks:', JSON.stringify(after, null, 2));

// 点击确定
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('.el-dialog__footer button'));
  btns.find(b => b.textContent.trim() === '确定')?.click();
});
await new Promise(r => setTimeout(r, 800));

const kpi = await page.evaluate(() => {
  const items = document.querySelectorAll('.freq-trend-kpi-item');
  return Array.from(items).map(k => k.querySelector('.freq-trend-kpi-name')?.textContent);
});
console.log('kpi:', JSON.stringify(kpi));
await browser.close();
