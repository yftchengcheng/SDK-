import puppeteer from 'puppeteer';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const browser = await puppeteer.launch({
  headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
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
  await new Promise(r => setTimeout(r, 1000));
  const m = await page.evaluate(() => {
    const icon = document.querySelector('.hal-welcome-icon');
    if (!icon) return { error: 'no icon' };
    const r = icon.getBoundingClientRect();
    const s = getComputedStyle(icon);
    const svg = icon.querySelector('svg, .el-icon');
    const sr = svg?.getBoundingClientRect();
    const ss = svg ? getComputedStyle(svg) : null;
    return {
      icon: { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) },
      svg: sr ? { w: Math.round(sr.width), h: Math.round(sr.height), x: Math.round(sr.x), y: Math.round(sr.y) } : null,
      iconStyles: { borderRadius: s.borderRadius, padding: s.padding, overflow: s.overflow },
      svgStyles: ss ? { color: ss.color, fontSize: ss.fontSize } : null,
    };
  });
  console.log(JSON.stringify(m, null, 2));
} finally { await browser.close(); }
