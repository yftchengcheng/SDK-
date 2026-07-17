import puppeteer from 'puppeteer';
const TOKEN = process.env.VERIFY_TOKEN;
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await page.goto('http://localhost:5000/', { waitUntil: 'networkidle2' });
await page.evaluate((t) => { localStorage.setItem('token', t); }, TOKEN);
await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle0' });
await sleep(2000);
const apps = await page.$$('.app-master-item');
console.log('app count:', apps.length);
if (apps.length > 0) { await apps[0].click(); await sleep(1500); }
// 找所有按钮
const btns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t));
console.log('all buttons:', btns);
fs.writeFileSync; 
import fs from 'fs';
fs.writeFileSync('/tmp/bnd-step1.png', await page.screenshot({ fullPage: true }));

// 找含「关联」的按钮
const bind = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('关联')));
if (bind.asElement()) { await bind.asElement().click(); await sleep(2000); }
fs.writeFileSync('/tmp/bnd-step2.png', await page.screenshot({ fullPage: true }));
const drawerInfo = await page.evaluate(() => {
  const d = document.querySelector('.el-drawer');
  if (!d) return 'no drawer';
  return { present: true, classes: d.className, header: d.querySelector('.el-drawer__title')?.textContent };
});
console.log('drawerInfo:', drawerInfo);

await browser.close();
