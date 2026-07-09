import puppeteer from 'puppeteer';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const browser = await puppeteer.launch({ headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
  await new Promise(r => setTimeout(r, 3000));
  const result = await page.evaluate(() => {
    const navLabels = Array.from(document.querySelectorAll('.nav-item .nav-label')).map(n => n.textContent.trim()).filter(Boolean);
    return { url: location.href, navLabels };
  });
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); }
