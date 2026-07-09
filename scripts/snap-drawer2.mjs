import puppeteer from 'puppeteer';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZlbG9wZXJJZCI6ImRldl9SZU9GUTNEck81OVpSd0FLIiwiZW1haWwiOiJzbmFwX3Rlc3RAY296ZS5jb20iLCJyb2xlIjoiZGV2ZWxvcGVyIiwiaWF0IjoxNzgzNTg0Nzk3LCJleHAiOjE3ODQxODk1OTd9.W3_V3uUCUok0RInJL0WJN-OZxq6iYOGA-ozQx39q-CU';
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1100, deviceScaleFactor: 1 });
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
await new Promise(r => setTimeout(r, 1500));
const btnText = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const createBtn = btns.find(b => b.textContent.includes('创建广告位'));
  if (createBtn) { createBtn.click(); return 'clicked'; }
  return null;
});
await new Promise(r => setTimeout(r, 2000));
// 截 .el-drawer 整个 body
const drawerBody = await page.$('.el-drawer__body');
if (drawerBody) {
  const box = await drawerBody.boundingBox();
  console.log('drawer body:', box);
  if (box) await page.screenshot({ path: '/tmp/drawer_body.png', clip: { ...box, x: box.x - 2, y: box.y - 2, width: box.width + 4, height: box.height + 4 } });
}
// 截 .pd-section
const section = await page.$('.pd-section');
if (section) {
  const box = await section.boundingBox();
  console.log('section:', box);
  if (box) await page.screenshot({ path: '/tmp/section.png', clip: { ...box, x: box.x - 2, y: box.y - 2, width: box.width + 4, height: box.height + 4 } });
}
await browser.close();
