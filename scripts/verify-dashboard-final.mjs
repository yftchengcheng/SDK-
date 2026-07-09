import puppeteer from 'puppeteer';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZlbG9wZXJJZCI6ImRldl8yTEdiZEdWRk5jbDRIUG5vIiwiZW1haWwiOiJkYXNoX3Rlc3QyQGNvemUuY29tIiwicm9sZSI6ImRldmVsb3BlciIsImlhdCI6MTc4MzU3MDE5NSwiZXhwIjoxNzg0MTc0OTk1fQ.YahcCHF5p5V-Y7iKp8ZeZtU6ff22zp_4MDGhHv57vyg';
const browser = await puppeteer.launch({ headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
await page.evaluateOnNewDocument((tk) => {
  localStorage.setItem('token', tk);
  localStorage.setItem('userInfo', JSON.stringify({
    developerId: 'dev_2LGbdGVFNcl4HPno', email: 'dash_test2@coze.com', company: '测试公司',
    companyShortName: 'dash_test2', contactName: 'Dash Test', phone: '13800000000',
    accessType: 1, apiAccessToken: 'x', status: 1, role: 'developer',
  }));
  localStorage.setItem('userRole', 'developer');
}, token);
await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 6000));
const data = await page.evaluate(() => ({
  title: document.querySelector('.page-header-title')?.textContent?.trim(),
  incomeCards: document.querySelectorAll('.stat-card--income').length,
  incomeLabels: Array.from(document.querySelectorAll('.stat-card__label')).map(e => e.textContent.trim()).slice(0, 4),
  filterSelects: document.querySelectorAll('.el-select').length,
  datePicker: document.querySelectorAll('.el-date-editor').length,
  chartRendered: !!document.querySelector('.chart-canvas svg'),
  rankCards: document.querySelectorAll('.page-rank-card').length,
  rankTitles: Array.from(document.querySelectorAll('.page-rank-card__title')).map(e => e.textContent.trim()),
  rankMetricSelects: document.querySelectorAll('.rank-card__metric').length,
  period: document.querySelector('.page-section__period')?.textContent?.trim().slice(0, 60),
}));
console.log('STRUCTURE:', JSON.stringify(data, null, 2));
await page.screenshot({ path: 'scripts/dashboard-v2-final.png', fullPage: true });
await browser.close();
