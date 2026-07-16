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

// 详细测展示频次表
const freq = await page.evaluate(() => {
  const tbl = document.querySelector('.frequency-table');
  const headers = Array.from(tbl.querySelectorAll('.frequency-row--header .frequency-col')).map(c => ({
    text: c.textContent.trim(),
    width: Math.round(c.getBoundingClientRect().width),
  }));
  const dataRows = Array.from(tbl.querySelectorAll('.frequency-row:not(.frequency-row--header)'));
  const firstDataRow = dataRows[0];
  const cells = Array.from(firstDataRow.querySelectorAll('.frequency-col')).map(c => ({
    text: c.textContent.trim(),
    width: Math.round(c.getBoundingClientRect().width),
    html: c.innerHTML.length > 60 ? c.innerHTML.slice(0, 60) : c.innerHTML,
  }));
  return { headerCount: headers.length, headers, firstRowCells: cells };
});
console.log('=== 展示频次表 ===');
console.log(JSON.stringify(freq, null, 2));
await browser.close();
