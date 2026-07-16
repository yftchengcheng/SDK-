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
await page.setViewport({ width: 1600, height: 1600 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

const info = await page.evaluate(() => {
  const trend = document.querySelector('.behavior-freq-trend-pane');
  const table = document.querySelector('.behavior-freq-table-pane .frequency-table');
  const trendRect = trend?.getBoundingClientRect();
  const tableRect = table?.getBoundingClientRect();
  return {
    trendW: trendRect ? Math.round(trendRect.width) : 0,
    trendH: trendRect ? Math.round(trendRect.height) : 0,
    trendTop: trendRect ? Math.round(trendRect.top) : 0,
    tableW: tableRect ? Math.round(tableRect.width) : 0,
    tableTop: tableRect ? Math.round(tableRect.top) : 0,
    stacked: trendRect && tableRect ? tableRect.top > trendRect.top : false,
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'public/behavior-vertical.png', fullPage: true });
await browser.close();
