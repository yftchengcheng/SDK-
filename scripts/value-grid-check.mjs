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
await page.evaluate(() => {
  Array.from(document.querySelectorAll('.behavior-master-item'))
    .find(i => i.textContent.includes('用户价值'))?.click();
});
await new Promise(r => setTimeout(r, 1500));
const info = await page.evaluate(() => {
  const headers = Array.from(document.querySelectorAll('.value-row--header .value-col')).map(c => ({
    text: c.textContent.trim(),
    width: Math.round(c.getBoundingClientRect().width),
    x: Math.round(c.getBoundingClientRect().left),
  }));
  const firstRow = document.querySelector('.value-row:not(.value-row--header)');
  const cells = firstRow ? Array.from(firstRow.querySelectorAll('.value-col')).map(c => ({
    text: c.textContent.trim(),
    width: Math.round(c.getBoundingClientRect().width),
    x: Math.round(c.getBoundingClientRect().left),
  })) : null;
  return { headerCount: headers.length, headers, firstRow: cells };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
