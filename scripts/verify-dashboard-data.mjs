import puppeteer from 'puppeteer';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZlbG9wZXJJZCI6ImRldl8yTEdiZEdWRk5jbDRIUG5vIiwiZW1haWwiOiJkYXNoX3Rlc3QyQGNvemUuY29tIiwicm9sZSI6ImRldmVsb3BlciIsImlhdCI6MTc4MzU3MDE5NSwiZXhwIjoxNzg0MTc0OTk1fQ.YahcCHF5p5V-Y7iKp8ZeZtU6ff22zp_4MDGhHv57vyg';
const browser = await puppeteer.launch({ headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1400, deviceScaleFactor: 1 });
await page.evaluateOnNewDocument((tk) => {
  localStorage.setItem('token', tk);
  localStorage.setItem('userInfo', JSON.stringify({
    developerId: 'dev_2LGbdGVFNcl4HPno', email: 'dash_test2@coze.com', company: '测试公司',
    companyShortName: 'dash_test2', contactName: 'Dash Test', phone: '13800000000',
    accessType: 1, apiAccessToken: 'x', status: 1, role: 'developer',
  }));
  localStorage.setItem('userRole', 'developer');
}, token);

// 拦截 API 请求看返回
const apiResponses = [];
page.on('response', async (res) => {
  const url = res.url();
  if (url.includes('/api/v1/console/dashboard/')) {
    try {
      const body = await res.text();
      apiResponses.push({ url: url.split('?')[0].split('/api/v1/console/dashboard/')[1], status: res.status(), body: body.slice(0, 200) });
    } catch {}
  }
});

await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 5000));

// 抓取真实渲染数据
const data = await page.evaluate(() => {
  const incomeCards = Array.from(document.querySelectorAll('.stat-card--income')).map(card => {
    const label = card.querySelector('.stat-card__label')?.textContent?.trim();
    const period = card.querySelector('.stat-card__period')?.textContent?.trim();
    const value = card.querySelector('.stat-card__value')?.textContent?.trim();
    return { label, period, value };
  });
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
console.log('=== API RESPONSES ===');
apiResponses.forEach(r => console.log(`[${r.status}] ${r.url}: ${r.body}`));

await page.screenshot({ path: 'scripts/dashboard-v3-data.png', fullPage: true });
await browser.close();
