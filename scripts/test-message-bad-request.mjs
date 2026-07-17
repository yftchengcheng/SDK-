import puppeteer from 'puppeteer';
import jwt from 'jsonwebtoken';
const TOKEN = jwt.sign(
  { developerId: 'dev_6NkEhLUUWZpHkmH8', email: 'admin@prd.com', role: 'admin' },
  'ad-sdk-aggregation-secret-key-2024',
  { expiresIn: '7d' }
);
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
const allResponses = [];
page.on('response', r => {
  if (r.url().includes('/api/v1/console/message')) {
    allResponses.push({
      url: r.url().replace('http://localhost:5000', ''),
      status: r.status(),
    });
  }
});
const errors = [];
page.on('pageerror', e => errors.push('PAGE_ERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE_ERROR: ' + m.text()); });

await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);

// 测各种 page 越界
for (const p of [1, 100, 999, 9999]) {
  await page.goto('http://localhost:5000/message', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  // 改分页
  await page.evaluate((p) => {
    // 直接调 API
    const token = localStorage.getItem('token');
    return fetch(`/api/v1/console/message/list?page=${p}&pageSize=20`, {
      headers: { Authorization: 'Bearer ' + token }
    }).then(r => r.json()).then(j => ({ page: p, code: j.code, message: j.message, total: j.data?.total }));
  }, p).then(r => console.log('page=' + p, JSON.stringify(r)));
  allResponses.length = 0;
}

// 测 cookie 模式
console.log('=== Test cookie auth ===');
await page.goto('http://localhost:5000/message', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 3000));
// 移除 token from localStorage
await page.evaluate(() => {
  localStorage.removeItem('token');
  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
});
await page.reload({ waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 3000));
const r1 = await page.evaluate(() => ({
  url: location.href,
  h1: document.querySelector('.page-header-titles-title')?.innerText,
  h2: document.querySelector('h1, h2, .auth-title')?.innerText,
}));
console.log('After clear token & reload:', JSON.stringify(r1));
console.log('API calls after clear:');
allResponses.forEach(c => console.log(`  ${c.status} ${c.url}`));
console.log('Errors:', errors.slice(0, 10));
await browser.close();
