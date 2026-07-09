import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const OUT_DIR = process.env.OUT_DIR || '/tmp/verify-screenshots';
fs.mkdirSync(OUT_DIR, { recursive: true });
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify({ developerId: 'dev_W7dOvj90HaEGi3Ez', email: 'testuser@example.com', role: 'developer' }));
    localStorage.setItem('userRole', 'developer');
  }, VERIFY_TOKEN);
  await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // 1. 默认 Tab "广告平台管理"
  const tab1 = await page.evaluate(() => {
    return {
      tabs: Array.from(document.querySelectorAll('.el-tabs__item')).map(t => t.textContent.trim()),
      tableHeaders: Array.from(document.querySelectorAll('.el-table__header-wrapper th .cell')).map(t => t.textContent.trim()),
      bodyHasPlatform: document.body.textContent.includes('平台'),
      bodyHasNetwork: document.body.textContent.includes('网络'),
    };
  });
  console.log('TAB 1 (广告平台管理):', JSON.stringify(tab1, null, 2));

  // 2. 切到第二个 Tab "自定义广告平台"
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('.el-tabs__item')).find(t => t.textContent.trim() === '自定义广告平台');
    tab?.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  const tab2 = await page.evaluate(() => {
    return {
      headers: Array.from(document.querySelectorAll('.el-table__header-wrapper th .cell')).map(t => t.textContent.trim()),
    };
  });
  console.log('TAB 2 (自定义广告平台):', JSON.stringify(tab2, null, 2));

  // 3. 切到第三个 Tab "广告平台账号"
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('.el-tabs__item')).find(t => t.textContent.trim() === '广告平台账号');
    tab?.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  const tab3 = await page.evaluate(() => {
    return {
      headers: Array.from(document.querySelectorAll('.el-table__header-wrapper th .cell')).map(t => t.textContent.trim()),
    };
  });
  console.log('TAB 3 (广告平台账号):', JSON.stringify(tab3, null, 2));

  await page.screenshot({ path: path.join(OUT_DIR, 'network-platform.png'), fullPage: true });
  console.log('saved');
} finally { await browser.close(); }
