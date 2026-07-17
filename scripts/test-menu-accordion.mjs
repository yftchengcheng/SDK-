import puppeteer from 'puppeteer';
import jwt from 'jsonwebtoken';
const TOKEN = jwt.sign(
  { developerId: 'dev_rqoDvlTij9RfZjtT', email: 'admin@prd.com', role: 'admin' },
  'ad-sdk-aggregation-secret-key-2024',
  { expiresIn: '7d' }
);
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
await page.goto('http://localhost:5000/', { waitUntil: 'networkidle0' });
await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);
await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2000));

async function snap() {
  return await page.evaluate(() => {
    const groups = document.querySelectorAll('.nav-group');
    return Array.from(groups).map(g => {
      const labelEl = g.querySelector('.nav-label');
      const sublist = g.querySelector('.nav-sublist');
      return {
        label: labelEl?.textContent?.trim() || '',
        hasSublist: !!sublist,
        sublistH: sublist?.getBoundingClientRect().height || 0,
      };
    });
  });
}
console.log('=== dashboard initial ===');
console.log(JSON.stringify(await snap(), null, 2));

// 点击 "聚合管理"
const clicked1 = await page.evaluate(() => {
  const groups = document.querySelectorAll('.nav-group');
  for (const g of groups) {
    const label = g.querySelector('.nav-item--group .nav-label');
    if (label?.textContent?.trim() === '聚合管理') {
      g.querySelector('.nav-item--group').click();
      return true;
    }
  }
  return false;
});
await new Promise(r => setTimeout(r, 500));
console.log('=== after click 聚合管理 ===');
console.log(JSON.stringify(await snap(), null, 2));

// 点击 "数据报表"
const clicked2 = await page.evaluate(() => {
  const groups = document.querySelectorAll('.nav-group');
  for (const g of groups) {
    const label = g.querySelector('.nav-item--group .nav-label');
    if (label?.textContent?.trim() === '数据报表') {
      g.querySelector('.nav-item--group').click();
      return true;
    }
  }
  return false;
});
await new Promise(r => setTimeout(r, 500));
console.log('=== after click 数据报表 ===');
console.log(JSON.stringify(await snap(), null, 2));

await browser.close();
