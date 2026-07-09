import puppeteer from 'puppeteer';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZlbG9wZXJJZCI6ImRldl9SZU9GUTNEck81OVpSd0FLIiwiZW1haWwiOiJzbmFwX3Rlc3RAY296ZS5jb20iLCJyb2xlIjoiZGV2ZWxvcGVyIiwiaWF0IjoxNzgzNTg0ODc4LCJleHAiOjE3ODQxODk2Nzh9._pevwF2qd5OYd7RkT-PZjVkKmsFEfynAbgda0yrNsr8';
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
// 注入 cookie
await page.setCookie({
  name: 'auth_token',
  value: token,
  domain: 'localhost',
  path: '/',
  httpOnly: true,
  sameSite: 'Strict',
});
// 同时把 userInfo 写到 localStorage
await page.evaluateOnNewDocument((tk) => {
  // 解码 JWT payload
  const payload = JSON.parse(atob(tk.split('.')[1]));
  const userInfo = {
    developerId: payload.developerId,
    email: payload.email,
    role: payload.role,
    company: '截图测试',
    companyShortName: 'snap',
    contactName: 'Snap',
    phone: '13800000001',
    accessType: 1,
    apiAccessToken: 'x',
    status: 1,
  };
  localStorage.setItem('token', tk);
  localStorage.setItem('userInfo', JSON.stringify(userInfo));
}, token);
await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 4000));
const info = await page.evaluate(() => {
  const m = document.querySelector('.app-master-panel');
  const d = document.querySelector('.app-detail-panel');
  return {
    url: location.href,
    items: document.querySelectorAll('.app-master-item').length,
    master: m ? m.getBoundingClientRect().toJSON() : null,
    detail: d ? d.getBoundingClientRect().toJSON() : null,
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: '/tmp/vp_final.png', fullPage: false });
await page.screenshot({ path: '/tmp/full_final.png', fullPage: true });
const master = await page.$('.app-master-panel');
if (master) {
  const box = await master.boundingBox();
  if (box) {
    await page.screenshot({ path: '/tmp/master_final.png', clip: box });
  }
}
const detail = await page.$('.app-detail-panel');
if (detail) {
  const box = await detail.boundingBox();
  if (box) {
    await page.screenshot({ path: '/tmp/detail_final.png', clip: box });
  }
}
await browser.close();
console.log('done');
