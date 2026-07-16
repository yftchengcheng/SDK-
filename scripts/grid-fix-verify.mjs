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
await page.setViewport({ width: 1600, height: 2000 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

// 测展示频次
const freq = await page.evaluate(() => {
  const cells = Array.from(document.querySelectorAll('.frequency-table .frequency-row:not(.frequency-row--header) .frequency-col')).slice(0, 8);
  return cells.map(c => ({ text: c.textContent.trim().slice(0, 15), x: Math.round(c.getBoundingClientRect().left) }));
});
console.log('=== 展示频次 (前 8 单元) ===');
console.log(JSON.stringify(freq, null, 2));

// 测用户价值
await page.evaluate(() => {
  Array.from(document.querySelectorAll('.behavior-master-item')).find(i => i.textContent.includes('用户价值'))?.click();
});
await new Promise(r => setTimeout(r, 1500));
const value = await page.evaluate(() => {
  const cells = Array.from(document.querySelectorAll('.value-table .value-row:not(.value-row--header) .value-col')).slice(0, 8);
  return cells.map(c => ({ text: c.textContent.trim().slice(0, 15), x: Math.round(c.getBoundingClientRect().left) }));
});
console.log('=== 用户价值 (前 8 单元) ===');
console.log(JSON.stringify(value, null, 2));

await page.screenshot({ path: 'public/freq-fixed.png', fullPage: true });
await page.evaluate(() => {
  Array.from(document.querySelectorAll('.behavior-master-item')).find(i => i.textContent.includes('展示频次'))?.click();
});
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: 'public/value-fixed.png', fullPage: true });
await browser.close();
