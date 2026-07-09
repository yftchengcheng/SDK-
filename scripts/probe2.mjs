import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZlbG9wZXJJZCI6ImRldl9ySUZBY0lkaGdJbmhxdyIsImVtYWlsIjoiZGFzaF90ZXN0MkBjb3plLmNvbSIsInJvbGUiOiJkZXZlbG9wZXIiLCJpYXQiOjE3ODM1NzAxOTUsImV4cCI6MTc4NDE3NDk5NX0.YahcCHF5p5V-Y7iKp8ZeZtU6ff22zp_4MDGhHv57vyg';
await page.setCookie({
  name: 'auth_token', value: token, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Strict',
});
await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 3000));
const info = await page.evaluate(() => {
  return {
    url: location.href,
    title: document.title,
    bodyText: document.body.innerText.slice(0, 200),
    masterPanel: !!document.querySelector('.app-master-panel'),
    items: document.querySelectorAll('.app-master-item').length,
    allClasses: Array.from(new Set(Array.from(document.querySelectorAll('*')).map(e => e.className).filter(c => typeof c === 'string' && c.includes('app-')))).slice(0, 20),
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: '/tmp/vp2.png', fullPage: false });
await browser.close();
