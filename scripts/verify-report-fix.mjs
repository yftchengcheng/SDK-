// 验证综合报表表头与数据对齐
import puppeteer from 'puppeteer';
import fs from 'fs';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox'],
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// 登录拿 token
const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'yufutang@adtalos.com', password: 'Test123456' }),
});
const realToken = (await loginRes.json()).data?.token;

// 注入 token + 跳页面
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' });
await wait(800);
await page.evaluate((tk) => {
  localStorage.setItem('token', tk);
  document.cookie = `auth_token=${tk}; path=/`;
}, realToken);
await page.goto('http://localhost:5000/report/overview', { waitUntil: 'domcontentloaded' });
await wait(3000);

// 全屏截图
await page.screenshot({
  path: '/workspace/projects/public/sdk-screenshots/report-overview-fixed.png',
  fullPage: false,
});
console.log('saved: /workspace/projects/public/sdk-screenshots/report-overview-fixed.png');

// 再次确认 cell 对齐
const check = await page.evaluate(() => {
  const ths = document.querySelectorAll('.el-table__header-wrapper th .cell');
  const tds = document.querySelectorAll('.el-table__body-wrapper tr:first-child td .cell');
  const thPos = Array.from(ths).map(c => ({ x: Math.round(c.getBoundingClientRect().x), w: Math.round(c.getBoundingClientRect().width) }));
  const tdPos = Array.from(tds).map(c => ({ x: Math.round(c.getBoundingClientRect().x), w: Math.round(c.getBoundingClientRect().width) }));
  return { thPos, tdPos, aligned: JSON.stringify(thPos) === JSON.stringify(tdPos) };
});
console.log(JSON.stringify(check, null, 2));
await browser.close();
