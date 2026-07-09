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
// 找 metric-grid
const grid = await page.$('.metric-grid');
if (grid) {
  const box = await grid.boundingBox();
  console.log('metric-grid box:', box);
  const card = await page.$eval('.metric-grid', el => {
    const r = el.parentElement.parentElement;
    const rr = r.getBoundingClientRect();
    return { x: rr.x, y: rr.y, width: rr.width, height: rr.height };
  });
  console.log('card box:', card);
  await page.screenshot({ path: '/tmp/data_card.png', clip: { x: card.x-2, y: card.y-2, width: card.width+4, height: card.height+4 } });
}
// 看 metric items
const items2 = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.metric-item')).map(el => {
    const r = el.getBoundingClientRect();
    return {
      label: el.querySelector('.metric-label')?.textContent,
      value: el.querySelector('.metric-value')?.textContent,
      trend: el.querySelector('.metric-trend')?.textContent?.trim().replace(/\s+/g,' '),
      width: r.width,
      height: r.height,
    };
  });
});
console.log('items:', JSON.stringify(items2, null, 2));
await browser.close();
