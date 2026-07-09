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

  const patchCalls = [];
  page.on('response', async (res) => {
    if (res.url().includes('/api-token/expire') && res.request().method() === 'PATCH') {
      try {
        const body = await res.text();
        patchCalls.push({ status: res.status(), body: body.substring(0, 300) });
      } catch {}
    }
  });

  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify({ developerId: 'dev_4SYXG6wRXqNSmbuG', email: 'verify-api-1783560900@example.com', role: 'developer', company: '测试公司' }));
    localStorage.setItem('userRole', 'developer');
  }, VERIFY_TOKEN);
  await page.goto('http://localhost:5000/profile', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  const before = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll('.table-card')).find(c => c.querySelector('.card-title')?.textContent?.includes('Report API 密钥'));
    const labels = Array.from(card.querySelectorAll('.el-radio-button')).map(b => b.textContent.trim());
    const active = card.querySelector('.el-radio-button.is-active')?.textContent?.trim() || null;
    return { labels, active };
  });
  console.log('BEFORE:', JSON.stringify(before, null, 2));

  // 点击 "3 个月" 按钮
  await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll('.table-card')).find(c => c.querySelector('.card-title')?.textContent?.includes('Report API 密钥'));
    const btn = Array.from(card.querySelectorAll('.el-radio-button')).find(b => b.textContent.trim() === '3 个月');
    if (btn) btn.querySelector('.el-radio-button__inner').click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const after = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll('.table-card')).find(c => c.querySelector('.card-title')?.textContent?.includes('Report API 密钥'));
    const active = card.querySelector('.el-radio-button.is-active')?.textContent?.trim() || null;
    const fields = Array.from(card.querySelectorAll('.api-label')).map(l => l.textContent.trim());
    return { active, fields };
  });
  console.log('AFTER click 3 个月:', JSON.stringify(after, null, 2));
  console.log('PATCH calls:', JSON.stringify(patchCalls, null, 2));

  await page.screenshot({ path: path.join(OUT_DIR, 'profile-presets.png'), fullPage: true });
  console.log('saved');
} finally {
  await browser.close();
}
