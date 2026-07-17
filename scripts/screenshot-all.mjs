import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
const TOK = readFileSync('/tmp/prd-token', 'utf-8').trim();
const ADM = readFileSync('/tmp/prd-admin-token', 'utf-8').trim();

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

const shotPage = async (page, url, name, tok) => {
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate(t => localStorage.setItem('token', t), tok);
  await page.goto(`http://localhost:5000${url}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: `public/prd/${name}.png`, fullPage: false });
  console.log('✓', name, url);
};

const page = await browser.newPage();

// 登录页
await page.setViewport({ width: 1920, height: 1080 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: 'public/prd/01-login.png', fullPage: false });
console.log('✓ 01-login');

// 注册页
await page.goto('http://localhost:5000/register', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: 'public/prd/02-register.png', fullPage: false });
console.log('✓ 02-register');

// 业务页面
const pages = [
  ['/dashboard', '03-dashboard'],
  ['/app', '04-app'],
  ['/placement', '05-placement'],
  ['/aggregation/traffic-group', '06-traffic-group'],
  ['/aggregation/ad-source', '07-ad-source'],
  ['/aggregation/waterfall', '08-waterfall'],
  ['/report/overview', '09-report-overview'],
  ['/report/funnel', '10-report-funnel'],
  ['/report/behavior', '11-report-behavior'],
  ['/reconciliation', '12-reconciliation'],
  ['/network', '13-network'],
  ['/message', '14-message'],
  ['/profile', '15-profile'],
];

for (const [url, name] of pages) {
  await shotPage(page, url, name, TOK);
}

// admin 页面
for (const [url, name] of [['/admin/developers', '16-admin-developers'], ['/admin/report-metric', '17-admin-report-metric']]) {
  await shotPage(page, url, name, ADM);
}

await browser.close();
console.log('done');
