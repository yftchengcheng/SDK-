import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1400, deviceScaleFactor: 2 });
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZlbG9wZXJJZCI6ImRldl8yTEdiZEdWRk5jbDRIUG5vIiwiZW1haWwiOiJkYXNoX3Rlc3QyQGNvemUuY29tIiwicm9sZSI6ImRldmVsb3BlciIsImlhdCI6MTc4MzU3MDE5NSwiZXhwIjoxNzg0MTc0OTk1fQ.YahcCHF5p5V-Y7iKp8ZeZtU6ff22zp_4MDGhHv57vyg';
await page.evaluateOnNewDocument((tk) => {
  localStorage.setItem('token', tk);
  localStorage.setItem('userInfo', JSON.stringify({developerId:'dev_2LGbdGVFNcl4HPno',email:'dash_test2@coze.com',company:'测试公司',companyShortName:'dash_test2',contactName:'Dash Test',phone:'13800000000',accessType:1,apiAccessToken:'x',status:1,role:'developer'}));
  localStorage.setItem('userRole', 'developer');
}, token);
const errors = [];
page.on('response', resp => {
  if (resp.status() >= 400) errors.push(`${resp.status()} ${resp.url()}`);
});
await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 4000));
await page.screenshot({ path: '/tmp/now.png' });
console.log('errors:', JSON.stringify(errors, null, 2));
await browser.close();
