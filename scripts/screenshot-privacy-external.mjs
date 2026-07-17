import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'yufutang@adtalos.com', password: 'Test123456' }) });
const realToken = (await loginRes.json()).data?.token;
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' });
await wait(800);
await page.evaluate((tk) => { localStorage.setItem('token', tk); document.cookie = `auth_token=${tk}; path=/`; }, realToken);

await page.goto('http://localhost:5000/sdk/privacy', { waitUntil: 'domcontentloaded' });
await wait(3500);
const data = await page.evaluate(() => {
  const policy = document.querySelector('.privacy-title');
  const iframe = document.querySelector('.privacy-iframe');
  const actions = document.querySelector('.privacy-actions');
  return {
    title: policy?.textContent?.trim(),
    iframeSrc: iframe?.getAttribute('src') || null,
    iframeW: iframe ? Math.round(iframe.getBoundingClientRect().width) : 0,
    iframeH: iframe ? Math.round(iframe.getBoundingClientRect().height) : 0,
    actionsText: actions?.textContent?.trim().replace(/\s+/g, ' '),
  };
});
console.log(JSON.stringify(data, null, 2));
await page.screenshot({ path: '/workspace/projects/public/sdk-screenshots/sdk-privacy-external.png', fullPage: false });
await browser.close();
