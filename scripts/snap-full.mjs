import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZlbG9wZXJJZCI6ImRldl9ySUZBY0lkaGdJbmhxdyIsImVtYWlsIjoiZGFzaF90ZXN0MkBjb3plLmNvbSIsInJvbGUiOiJkZXZlbG9wZXIiLCJpYXQiOjE3ODM1NzAxOTUsImV4cCI6MTc4NDE3NDk5NX0.YahcCHF5p5V-Y7iKp8ZeZtU6ff22zp_4MDGhHv57vyg';
await page.evaluateOnNewDocument((tk) => {
  localStorage.setItem('token', tk);
  localStorage.setItem('userInfo', JSON.stringify({developerId:'dev_rIFAIdIdgJInhqw',email:'dash_test2@coze.com',company:'测试公司',companyShortName:'dash_test2',contactName:'Dash Test',phone:'13800000000',accessType:1,apiAccessToken:'x',status:1,role:'developer'}));
  localStorage.setItem('userRole', 'developer');
}, token);
await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 3000));
// 完整页面
await page.screenshot({ path: '/tmp/full.png', fullPage: true });
// 视口大小
await page.screenshot({ path: '/tmp/vp.png', fullPage: false });
// 截 master 区域
const mp = await page.$('.app-master-panel');
if (mp) await mp.screenshot({ path: '/tmp/master.png' });
const dp = await page.$('.app-detail-panel');
if (dp) await dp.screenshot({ path: '/tmp/detail.png' });
await browser.close();
console.log('done');
