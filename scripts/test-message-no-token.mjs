import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
const errors = [];
const apiCalls = [];
page.on('pageerror', e => errors.push('PAGE_ERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE_ERROR: ' + m.text()); });
page.on('response', r => {
  if (r.url().includes('/api/v1/console/message')) {
    r.json().then(j => {
      apiCalls.push({ url: r.url().replace('http://localhost:5000', ''), status: r.status(), body: j });
    }).catch(() => apiCalls.push({ url: r.url().replace('http://localhost:5000', ''), status: r.status(), body: 'NOT_JSON' }));
  }
});
// 1. 直接访问 /message（无 token）
await page.goto('http://localhost:5000/message', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
const r1 = await page.evaluate(() => ({
  url: location.href,
  h1: document.querySelector('.page-header-titles-title')?.innerText,
  h2: document.querySelector('h1, h2, .auth-title')?.innerText,
}));
console.log('1. Direct /message no token:', JSON.stringify(r1));
console.log('  API calls:');
apiCalls.forEach(c => console.log(`    ${c.status} ${c.url} -> ${JSON.stringify(c.body).slice(0, 200)}`));
apiCalls.length = 0;

// 2. 登录后访问 dashboard
await page.evaluate(() => localStorage.clear());
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 3000));
console.log('2. After clear cache at /login:');
console.log('  API calls:');
apiCalls.forEach(c => console.log(`    ${c.status} ${c.url} -> ${JSON.stringify(c.body).slice(0, 200)}`));
apiCalls.length = 0;

console.log('Errors:', errors.slice(0, 10));
await browser.close();
