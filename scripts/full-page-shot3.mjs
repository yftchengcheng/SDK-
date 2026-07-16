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

// 截图 frequency tab
const freqH = await page.$('.page-card:has(.frequency-table)');
if (freqH) await freqH.screenshot({ path: 'public/freq-card.png' });
console.log('freq card captured');

const clickMaster = async (label) => {
  await page.evaluate((label) => {
    const items = Array.from(document.querySelectorAll('.behavior-master-item'));
    const it = items.find(el => el.textContent && el.textContent.trim().includes(label));
    if (it) it.click();
  }, label);
  await new Promise(r => setTimeout(r, 2500));
};

await clickMaster('用户价值');
const vExists = await page.evaluate(() => !!document.querySelector('.value-table'));
console.log('value shown:', vExists);
if (vExists) {
  const vH = await page.$('.page-card:has(.value-table)');
  if (vH) await vH.screenshot({ path: 'public/value-card.png' });
}

await clickMaster('使用时长');
const dExists = await page.evaluate(() => !!document.querySelector('.duration-table'));
console.log('duration shown:', dExists);
if (dExists) {
  const dH = await page.$('.page-card:has(.duration-table)');
  if (dH) await dH.screenshot({ path: 'public/duration-card.png' });
}
await browser.close();
