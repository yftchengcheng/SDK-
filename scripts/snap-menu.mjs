import puppeteer from 'puppeteer';
import jwt from 'jsonwebtoken';
const TOKEN = jwt.sign(
  { developerId: 'dev_6NkEhLUUWZpHkmH8', email: 'admin@prd.com', role: 'admin' },
  'ad-sdk-aggregation-secret-key-2024',
  { expiresIn: '7d' }
);
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);
await page.goto('http://localhost:5000/message', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
// 截侧边栏
const sidebar = await page.$('.sidebar, .el-aside, [class*="sidebar"]');
if (sidebar) await sidebar.screenshot({ path: '/workspace/projects/scripts/sidebar.png' });
// 列所有 nav-item 文本
const navItems = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('.nav-item'));
  return items.map(el => ({
    text: el.innerText.trim().slice(0, 30),
    visible: el.offsetParent !== null,
    class: el.className,
  }));
});
console.log('nav items:', JSON.stringify(navItems, null, 2));
await page.screenshot({ path: '/workspace/projects/scripts/message-page.png' });
await browser.close();
