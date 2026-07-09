import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const OUT_DIR = process.env.OUT_DIR || '/tmp/verify-screenshots';
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify({ developerId: 'dev_W7dOvj90HaEGi3Ez', email: 'testuser@example.com', role: 'developer', company: '验证公司' }));
    localStorage.setItem('userRole', 'developer');
  }, VERIFY_TOKEN);

  // 1. 侧边栏
  await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  const sidebar = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.el-menu-item, .el-sub-menu__title'));
    return items.map(e => e.textContent.trim().replace(/\s+/g, ' ')).filter(t => t);
  });
  console.log('SIDEBAR:', JSON.stringify(sidebar, null, 2));

  // 2. network 页
  await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  const network = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.el-tabs__item')).map(t => t.textContent.trim());
    const h1 = document.querySelector('.page-header h1, h1')?.textContent?.trim();
    const buttons = Array.from(document.querySelectorAll('.el-button')).map(b => b.textContent.trim()).filter(Boolean);
    return { tabs, h1, buttons: buttons.slice(0, 10) };
  });
  console.log('NETWORK:', JSON.stringify(network, null, 2));

  // 3. ad-source 页
  await page.goto('http://localhost:5000/ad-source', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  const adsource = await page.evaluate(() => {
    const h1 = document.querySelector('.page-header h1, h1')?.textContent?.trim();
    const text = document.body.textContent.replace(/\s+/g, ' ');
    return {
      h1,
      hasAdPlatform: text.includes('广告平台'),
      hasCustomAdPlatform: text.includes('自定义广告平台'),
      hasOldAdNetwork: text.includes('广告网络'),
      hasOldCustomNetwork: text.includes('自定义网络') && !text.includes('自定义广告平台'),
    };
  });
  console.log('AD-SOURCE:', JSON.stringify(adsource, null, 2));

  // 4. reconciliation 页
  await page.goto('http://localhost:5000/reconciliation', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  const recon = await page.evaluate(() => {
    const text = document.body.textContent.replace(/\s+/g, ' ');
    return {
      hasAdPlatform: text.includes('广告平台'),
      hasOldAdNetwork: text.includes('广告网络'),
    };
  });
  console.log('RECONCILIATION:', JSON.stringify(recon, null, 2));

  // 5. waterfall 页 - 选 placement 后看 tip
  await page.goto('http://localhost:5000/waterfall', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  await page.click('.wf-select');
  await new Promise(r => setTimeout(r, 800));
  const firstOpt = await page.$('.el-select-dropdown__item');
  if (firstOpt) { await firstOpt.click(); await new Promise(r => setTimeout(r, 1000)); }
  const wf = await page.evaluate(() => {
    const text = document.body.textContent.replace(/\s+/g, ' ');
    return { hasAdPlatform: text.includes('广告平台'), hasOldAdNetwork: text.includes('广告网络') };
  });
  console.log('WATERFALL:', JSON.stringify(wf, null, 2));
} finally { await browser.close(); }
