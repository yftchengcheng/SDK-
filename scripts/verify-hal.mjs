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
    localStorage.setItem('userInfo', JSON.stringify({ developerId: 'dev_W7dOvj90HaEGi3Ez', email: 'testuser@example.com', role: 'developer', company: '验证公司' }));
    localStorage.setItem('userRole', 'developer');
  }, VERIFY_TOKEN);
  await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  // 点开 HAL
  const fab = await page.$('.hal-fab');
  if (fab) await fab.click();
  await new Promise((r) => setTimeout(r, 1000));

  const m = await page.evaluate(() => {
    const desc = document.querySelector('.hal-welcome-desc');
    if (!desc) return { error: 'hal-welcome-desc not found' };
    const r = desc.getBoundingClientRect();
    return {
      text: desc.textContent.replace(/\s+/g, ' ').trim(),
      hasBr: desc.querySelector('br') !== null,
      w: Math.round(r.width), h: Math.round(r.height),
      computed: getComputedStyle(desc).lineHeight,
    };
  });
  console.log(JSON.stringify(m, null, 2));

  await page.screenshot({ path: path.join(OUT_DIR, 'hal-welcome.png'), fullPage: false });
  console.log('saved');
} finally {
  await browser.close();
}
