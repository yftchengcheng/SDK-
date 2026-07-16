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
const info = await page.evaluate(() => {
  const tbl = document.querySelector('.frequency-table');
  const rows = Array.from(tbl.querySelectorAll('.frequency-row')).slice(0, 3);
  const card = document.querySelector('.page-card');
  return {
    viewport: window.innerWidth,
    cardW: card ? Math.round(card.getBoundingClientRect().width) : 0,
    cardOverflowX: card ? getComputedStyle(card).overflowX : '',
    tblW: Math.round(tbl.getBoundingClientRect().width),
    tblRect: { x: Math.round(tbl.getBoundingClientRect().left), right: Math.round(tbl.getBoundingClientRect().right) },
    rowH: rows.map(r => Math.round(r.getBoundingClientRect().height)),
    pagination: {
      exists: !!document.querySelector('.frequency-table ~ .behavior-table-pagination'),
      text: document.querySelector('.behavior-table-pagination')?.textContent?.trim().slice(0, 60) || '',
    },
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
