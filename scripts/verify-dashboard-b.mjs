import puppeteer from 'puppeteer';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZlbG9wZXJJZCI6ImRldl82TmtFaExVVVdacEhrbUg4IiwiZW1haWwiOiJkYXNoYm9hcmQtdGVzdEBkZW1vLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4MzU3NzIxMiwiZXhwIjoxNzg0MTgyMDEyfQ.Ve_m6uO14u8fYMU2IUA43sgWWcfHgioSYLht4pZ2noE';
const browser = await puppeteer.launch({ headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1400, deviceScaleFactor: 1 });
await page.evaluateOnNewDocument((tk) => {
  localStorage.setItem('token', tk);
  localStorage.setItem('userInfo', JSON.stringify({
    developerId: 'dev_6NkEhLUUWZpHkmH8', email: 'dashboard-test@demo.com', company: 'Demo Co',
    companyShortName: 'dashboard-test', contactName: 'Demo', phone: '13800000000',
    accessType: 1, apiAccessToken: 'x', status: 1, role: 'admin',
  }));
  localStorage.setItem('userRole', 'admin');
}, token);

await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 5000));

const data = await page.evaluate(() => {
  const incomeCards = Array.from(document.querySelectorAll('.stat-card--income')).map(card => ({
    label: card.querySelector('.stat-card__label')?.textContent?.trim(),
    period: card.querySelector('.stat-card__period')?.textContent?.trim(),
    value: card.querySelector('.stat-card__value')?.textContent?.trim(),
  }));
  const rankCards = Array.from(document.querySelectorAll('.page-rank-card')).map(card => {
    const title = card.querySelector('.page-rank-card__title')?.textContent?.trim();
    const rows = Array.from(card.querySelectorAll('.rank-row')).map(r => ({
      name: r.querySelector('.rank-row__name')?.textContent?.trim(),
      value: r.querySelector('.rank-row__value')?.textContent?.trim(),
    }));
    return { title, rows: rows.slice(0, 5) };
  });
  return { incomeCards, rankCards };
});

console.log('=== INCOME CARDS ===');
console.log(JSON.stringify(data.incomeCards, null, 2));
console.log('=== RANK CARDS ===');
console.log(JSON.stringify(data.rankCards, null, 2));

await page.screenshot({ path: 'public/dashboard-account-b.png', fullPage: true });
await browser.close();
