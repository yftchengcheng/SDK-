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
const items = await page.$$('.app-master-item');
if (items[0]) await items[0].click();
await new Promise(r => setTimeout(r, 2000));
// 看 app detail header 高度 + 4 个 card 高度
const layout = await page.evaluate(() => {
  const detail = document.querySelector('.app-detail-panel');
  const header = document.querySelector('.app-detail-header');
  const cards = Array.from(document.querySelectorAll('.detail-card')).map(c => {
    const r = c.getBoundingClientRect();
    const title = c.querySelector('.detail-card-title')?.textContent?.trim();
    return { title, h: r.height };
  });
  const detailR = detail?.getBoundingClientRect();
  return {
    detailHeight: detailR?.height,
    headerHeight: header?.getBoundingClientRect()?.height,
    cards,
  };
});
console.log('layout:', JSON.stringify(layout, null, 2));
await page.screenshot({ path: '/tmp/datacard_full.png', fullPage: false });
await browser.close();
