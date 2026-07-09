import puppeteer from 'puppeteer';
import fs from 'fs';

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
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
    const cards = Array.from(document.querySelectorAll('.table-card'));
    return cards.map((c, i) => {
      const title = c.querySelector('.card-title')?.textContent?.trim();
      const text = c.textContent?.replace(/\s+/g, ' ').trim().substring(0, 300);
      return { index: i, title, text };
    });
  });
  console.log(JSON.stringify(m, null, 2));
} finally {
  await browser.close();
}
