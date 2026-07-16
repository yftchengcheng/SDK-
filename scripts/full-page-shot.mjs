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
await page.setViewport({ width: 1920, height: 1500 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

// 截全页（frequency tab）
await page.screenshot({ path: 'public/behavior-freq-full.png', fullPage: true });
console.log('freq full screenshot saved');

// 切到 value tab
const valueTab = await page.$('text/用户价值');
if (valueTab) {
  await valueTab.click();
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'public/behavior-value-full.png', fullPage: true });
  console.log('value full screenshot saved');
}

// 切到 duration tab
const durTab = await page.$('text/使用时长');
if (durTab) {
  await durTab.click();
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'public/behavior-duration-full.png', fullPage: true });
  console.log('duration full screenshot saved');
}
await browser.close();
