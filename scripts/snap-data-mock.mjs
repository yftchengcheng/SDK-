import puppeteer from 'puppeteer';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZlbG9wZXJJZCI6ImRldl9SZU9GUTNEck81OVpSd0FLIiwiZW1haWwiOiJzbmFwX3Rlc3RAY296ZS5jb20iLCJyb2xlIjoiZGV2ZWxvcGVyIiwiaWF0IjoxNzgzNTg0Nzk3LCJleHAiOjE3ODQxODk1OTd9.W3_V3uUCUok0RInJL0WJN-OZxq6iYOGA-ozQx39q-CU';
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.setCookie({name:'auth_token',value:token,domain:'localhost',path:'/',httpOnly:true,sameSite:'Strict'});
await page.evaluateOnNewDocument((tk)=>{
  const p=JSON.parse(atob(tk.split('.')[1]));
  localStorage.setItem('token',tk);
  localStorage.setItem('userInfo',JSON.stringify({developerId:p.developerId,email:p.email,role:p.role,company:'X',companyShortName:'X',contactName:'X',phone:'X',accessType:1,apiAccessToken:'x',status:1}));
},token);
// 拦截 dashboard overview 接口，注入 mock 数据
await page.setRequestInterception(true);
page.on('request', req => {
  if (req.url().includes('/dashboard/overview')) {
    req.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: {
          dau: 12345,
          dau_trend: '+12.5%',
          dau_trend_dir: 'up',
          revenue: 2867.50,
          revenue_trend: '+8.3%',
          revenue_trend_dir: 'up',
          arpdau: 0.23,
          arpdau_trend: '-3.2%',
          arpdau_trend_dir: 'down',
          impression_dau: 8.7,
          impression_dau_trend: '+5.1%',
          impression_dend_dir: 'up',
        }
      })
    });
  } else {
    req.continue();
  }
});
await page.goto('http://localhost:5000/app?bust=' + Date.now(), { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 4000));
const items = await page.$$('.app-master-item');
if (items[0]) await items[0].click();
await new Promise(r => setTimeout(r, 3000));
const dataCard = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.detail-card')).find(c => c.querySelector('.metric-grid')));
const el = dataCard.asElement();
const box = await el.boundingBox();
await page.screenshot({ path: '/tmp/datacard_mock.png', clip: { x: box.x-2, y: box.y-2, width: box.width+4, height: box.height+4 } });
await browser.close();
