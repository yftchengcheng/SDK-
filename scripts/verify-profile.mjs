import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const OUT_DIR = process.env.OUT_DIR || '/tmp/verify-screenshots';
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify({ developerId: 'dev_4SYXG6wRXqNSmbuG', email: 'verify-api-1783560900@example.com', role: 'developer', company: '测试公司' }));
    localStorage.setItem('userRole', 'developer');
  }, VERIFY_TOKEN);
  await page.goto('http://localhost:5000/profile', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  const m = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.el-descriptions__label, .el-descriptions__content'));
    const grouped = [];
    for (let i = 0; i < items.length; i += 2) {
      grouped.push({
        label: items[i]?.textContent?.trim(),
        value: items[i+1]?.textContent?.trim(),
      });
    }
    return {
      descriptions: grouped,
      hasReportApiSection: !!Array.from(document.querySelectorAll('.card-title')).find(e => e.textContent?.includes('Report API 密钥')),
      apiTokenButtonText: document.querySelector('.table-card:nth-child(3) .el-button')?.textContent?.trim(),
    };
  });
  console.log(JSON.stringify(m, null, 2));

  await page.screenshot({ path: path.join(OUT_DIR, 'profile-after.png'), fullPage: true });
  console.log('saved');
} finally {
  await browser.close();
}
