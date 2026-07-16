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

// 直接截表格 element
const freq = await page.$('.frequency-table');
if (freq) {
  const box = await freq.boundingBox();
  console.log('freq table box:', box);
  if (box) await page.screenshot({ path: 'public/freq-table-shot.png', clip: { x: 0, y: box.y, width: 1920, height: box.height + 80 } });
}

const clickMaster = async (label) => {
  await page.evaluate((label) => {
    const items = Array.from(document.querySelectorAll('.behavior-master-item'));
    const it = items.find(el => el.textContent && el.textContent.trim().includes(label));
    if (it) it.click();
  }, label);
  await new Promise(r => setTimeout(r, 2500));
};

await clickMaster('用户价值');
await new Promise(r => setTimeout(r, 1500));
// 滚到底部让表格显示
await page.evaluate(() => {
  const v = document.querySelector('.value-table');
  if (v) v.scrollIntoView({ block: 'center' });
});
await new Promise(r => setTimeout(r, 1000));
const v = await page.$('.value-table');
if (v) {
  const box = await v.boundingBox();
  console.log('value table box:', box);
  if (box) await page.screenshot({ path: 'public/value-table-shot.png', clip: { x: 0, y: Math.max(0, box.y - 50), width: 1920, height: box.height + 80 } });
}

await clickMaster('使用时长');
await new Promise(r => setTimeout(r, 1500));
await page.evaluate(() => {
  const d = document.querySelector('.duration-table');
  if (d) d.scrollIntoView({ block: 'center' });
});
await new Promise(r => setTimeout(r, 1000));
const d = await page.$('.duration-table');
if (d) {
  const box = await d.boundingBox();
  console.log('duration table box:', box);
  if (box) await page.screenshot({ path: 'public/duration-table-shot.png', clip: { x: 0, y: Math.max(0, box.y - 50), width: 1920, height: box.height + 80 } });
}
await browser.close();
