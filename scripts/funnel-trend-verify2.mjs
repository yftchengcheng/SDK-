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
await page.setViewport({ width: 1440, height: 1600 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

// 切到趋势
await page.evaluate(() => {
  const r = Array.from(document.querySelectorAll('.funnel-bottom-toolbar .el-radio-button__inner'));
  r.find(x => x.textContent.trim() === '趋势')?.click();
});
await new Promise(r => setTimeout(r, 1500));

// 检查 canvas 实际像素 (按颜色)
const canvasInfo = await page.evaluate(() => {
  const canvases = document.querySelectorAll('.funnel-bottom-trend canvas');
  return Array.from(canvases).map(c => ({
    w: c.width, h: c.height,
    cw: c.clientWidth, ch: c.clientHeight,
    visible: c.offsetWidth > 0 && c.offsetHeight > 0,
  }));
});
console.log('=== Canvas ===');
console.log(JSON.stringify(canvasInfo, null, 2));

await page.screenshot({ path: 'public/funnel-trend-final.png', fullPage: true });

// 切到分天
await page.evaluate(() => {
  const r = Array.from(document.querySelectorAll('.funnel-bottom-toolbar .el-radio-button__inner'));
  r.find(x => x.textContent.trim() === '分天')?.click();
});
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: 'public/funnel-daily-final.png', fullPage: true });
console.log('done');

await browser.close();
