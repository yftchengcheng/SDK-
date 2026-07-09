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
// 找 data preview 卡片
const card = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('.detail-card'));
  return cards.map(c => {
    const t = c.querySelector('.detail-card-title')?.textContent?.trim();
    const r = c.getBoundingClientRect();
    return { title: t, x: r.x, y: r.y, w: r.width, h: r.height };
  });
});
console.log('cards:', JSON.stringify(card, null, 2));
// 找数据预览 card
const dataCard = await page.evaluateHandle(() => {
  return Array.from(document.querySelectorAll('.detail-card')).find(c => c.querySelector('.metric-grid'));
});
if (dataCard) {
  const el = dataCard.asElement();
  if (el) {
    const box = await el.boundingBox();
    console.log('data card box:', box);
    await page.screenshot({ path: '/tmp/datacard.png', clip: { x: box.x-2, y: box.y-2, width: box.width+4, height: box.height+4 } });
  }
}
// 看 metric item 详细
const details = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.metric-item')).map(el => {
    const label = el.querySelector('.metric-label')?.textContent;
    const value = el.querySelector('.metric-value')?.textContent;
    const tip = el.querySelector('.metric-trend')?.textContent?.trim().replace(/\s+/g, ' ');
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    // 检查子元素是否溢出
    const childs = Array.from(el.children).map(c => {
      const cr = c.getBoundingClientRect();
      const overflowH = cr.right > r.right + 1;
      const overflowV = cr.bottom > r.bottom + 1;
      return { tag: c.tagName + (c.className ? '.' + c.className.split(' ')[0] : ''), text: c.textContent.trim().replace(/\s+/g, ' ').slice(0, 30), overflowH, overflowV, w: cr.width, h: cr.height };
    });
    return { label, value, tip, w: r.width, h: r.height, childs, padding: cs.padding };
  });
});
console.log('details:', JSON.stringify(details, null, 2));
await browser.close();
