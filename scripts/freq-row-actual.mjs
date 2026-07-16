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
await page.setViewport({ width: 1600, height: 1800 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));
// 默认在展示频次 tab
const info = await page.evaluate(() => {
  const headers = Array.from(document.querySelectorAll('.frequency-table .frequency-row--header .frequency-col')).map(c => c.textContent.trim());
  const rows = Array.from(document.querySelectorAll('.frequency-table .frequency-row:not(.frequency-row--header)'));
  return {
    headerCount: headers.length,
    headers,
    rowCount: rows.length,
    firstRow: rows[0] ? Array.from(rows[0].querySelectorAll('.frequency-col')).map(c => c.textContent.trim()) : null,
    lastRow: rows[rows.length-1] ? Array.from(rows[rows.length-1].querySelectorAll('.frequency-col')).map(c => c.textContent.trim()) : null,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
