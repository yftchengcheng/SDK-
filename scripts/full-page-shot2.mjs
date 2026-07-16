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

// 用 evaluate 找 tab 并点击
const clickTab = async (label) => {
  await page.evaluate((label) => {
    const tabs = Array.from(document.querySelectorAll('.behavior-tab, [class*="tab"]'));
    const t = tabs.find(t => t.textContent && t.textContent.trim().includes(label));
    if (t) t.click();
  }, label);
  await new Promise(r => setTimeout(r, 2000));
};

await clickTab('用户价值');
const valueExists = await page.evaluate(() => !!document.querySelector('.value-table'));
console.log('value tab shown:', valueExists);
if (valueExists) {
  const handle = await page.$('.page-table-wrap');
  if (handle) await handle.screenshot({ path: 'public/value-table-only.png' });
  await page.screenshot({ path: 'public/behavior-value-tab.png', fullPage: true });
}

await clickTab('使用时长');
const durExists = await page.evaluate(() => !!document.querySelector('.duration-table'));
console.log('duration tab shown:', durExists);
if (durExists) {
  const handle = await page.$('.page-table-wrap');
  if (handle) await handle.screenshot({ path: 'public/duration-table-only.png' });
}

await browser.close();
