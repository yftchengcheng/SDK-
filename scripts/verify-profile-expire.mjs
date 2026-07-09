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
    const card = Array.from(document.querySelectorAll('.table-card')).find(c => c.querySelector('.card-title')?.textContent?.includes('Report API 密钥'));
    if (!card) return { error: 'Report API 密钥 card not found' };
    const labelTexts = Array.from(card.querySelectorAll('.api-label')).map(e => e.textContent.trim());
    const pickerVisible = !!card.querySelector('.api-expire-picker input');
    const pickerPlaceholder = card.querySelector('.api-expire-picker input')?.placeholder || '';
    const buttons = Array.from(card.querySelectorAll('.el-button')).map(b => b.textContent.trim());
    const tokenText = card.querySelector('.api-token-code')?.textContent.trim();
    return { labelTexts, pickerVisible, pickerPlaceholder, buttons, tokenText };
  });
  console.log(JSON.stringify(m, null, 2));

  await page.screenshot({ path: path.join(OUT_DIR, 'profile-expire.png'), fullPage: true });
  console.log('saved');
} finally {
  await browser.close();
}
