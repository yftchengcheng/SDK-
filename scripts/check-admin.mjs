import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
const ADM = readFileSync('/tmp/prd-admin-token', 'utf-8').trim();
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate(t => localStorage.setItem('token', t), ADM);
await page.goto('http://localhost:5000/admin/developers', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));
const info = await page.evaluate(() => ({
  url: location.href,
  title: document.title,
  bodyText: document.body.textContent.slice(0, 200),
  tableExists: !!document.querySelector('.el-table'),
  cardExists: !!document.querySelector('.page-card'),
  role: localStorage.getItem('userInfo'),
}));
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'public/prd/16-admin-developers-v2.png', fullPage: false });
await page.goto('http://localhost:5000/admin/report-metric', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));
const info2 = await page.evaluate(() => ({
  url: location.href,
  title: document.title,
  bodyText: document.body.textContent.slice(0, 200),
}));
console.log(JSON.stringify(info2, null, 2));
await page.screenshot({ path: 'public/prd/17-admin-report-metric-v2.png', fullPage: false });
await browser.close();
