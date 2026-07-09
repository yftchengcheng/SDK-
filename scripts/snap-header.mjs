import puppeteer from 'puppeteer';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZlbG9wZXJJZCI6ImRldl9SZU9GUTNEck81OVpSd0FLIiwiZW1haWwiOiJzbmFwX3Rlc3RAY296ZS5jb20iLCJyb2xlIjoiZGV2ZWxvcGVyIiwiaWF0IjoxNzgzNTg0Nzk3LCJleHAiOjE3ODQxODk1OTd9.W3_V3uUCUok0RInJL0WJN-OZxq6iYOGA-ozQx39q-CU';
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.setCookie({name:'auth_token',value:token,domain:'localhost',path:'/',httpOnly:true,sameSite:'Strict'});
await page.evaluateOnNewDocument((tk)=>{
  const p=JSON.parse(atob(tk.split('.')[1]));
  localStorage.setItem('token',tk);
  localStorage.setItem('userInfo',JSON.stringify({developerId:p.developerId,email:p.email,role:p.role,company:'X',companyShortName:'X',contactName:'X',phone:'X',accessType:1,apiAccessToken:'x',status:1}));
},token);
await page.goto('http://localhost:5000/app?bust=' + Date.now(), { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 4000));
const info = await page.evaluate(() => {
  const header = document.querySelector('.page-header');
  const shell = document.querySelector('.page-shell');
  const md = document.querySelector('.app-master-detail');
  const master = document.querySelector('.app-master-panel');
  const detail = document.querySelector('.app-detail-panel');
  return {
    pageHeader: header ? header.getBoundingClientRect().toJSON() : null,
    pageShell: shell ? { ...shell.getBoundingClientRect().toJSON(), gap: getComputedStyle(shell).gap, padding: getComputedStyle(shell).padding } : null,
    masterDetail: md ? md.getBoundingClientRect().toJSON() : null,
    master: master ? master.getBoundingClientRect().toJSON() : null,
    detail: detail ? detail.getBoundingClientRect().toJSON() : null,
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: '/tmp/page.png', fullPage: false });
// 截 page-header
const h = await page.$eval('.page-header', el => el.getBoundingClientRect().toJSON());
await page.screenshot({ path: '/tmp/header.png', clip: { ...h, x: h.x-2, y: h.y-2, width: h.width+4, height: h.height+4 } });
await browser.close();
