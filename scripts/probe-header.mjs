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
await page.goto('http://localhost:5000/placement', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2500));
const h = await page.$eval('.page-header', el => el.getBoundingClientRect().height);
console.log('placement page-header h:', h);
await page.goto('http://localhost:5000/waterfall', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2500));
const h2 = await page.$eval('.page-header', el => el.getBoundingClientRect().height);
console.log('waterfall page-header h:', h2);
// page-shell padding
const shellPad = await page.$eval('.page-shell', el => getComputedStyle(el).padding);
console.log('waterfall page-shell padding:', shellPad);
const shellGap = await page.$eval('.page-shell', el => getComputedStyle(el).gap);
console.log('waterfall page-shell gap:', shellGap);
await browser.close();
