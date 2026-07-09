import puppeteer from 'puppeteer';
import fs from 'fs';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify({ developerId: 'dev_W7dOvj90HaEGi3Ez', email: 'testuser@example.com', role: 'developer' }));
    localStorage.setItem('userRole', 'developer');
  }, VERIFY_TOKEN);
  await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  const fab = await page.$('.hal-fab');
  if (fab) await fab.click();
  await new Promise(r => setTimeout(r, 1200));
  const handle = await page.$('.hal-welcome');
  if (handle) {
    await handle.screenshot({ path: '/tmp/hal-welcome.png' });
    console.log('saved /tmp/hal-welcome.png');
  }
} finally { await browser.close(); }
