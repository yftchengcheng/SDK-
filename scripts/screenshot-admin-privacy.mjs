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
await page.goto('http://localhost:5000/admin/sdk-privacy', { waitUntil: 'domcontentloaded' });
await wait(2000);
await page.screenshot({ path: '/workspace/projects/public/sdk-screenshots/admin-privacy-list.png' });
const editBtn = await page.evaluateHandle(() => {
  const all = document.querySelectorAll('.el-button');
  for (const b of all) { if (b.textContent?.trim() === '编辑') return b; }
  return null;
});
if (editBtn.asElement()) await editBtn.asElement().click();
await wait(1500);
await page.screenshot({ path: '/workspace/projects/public/sdk-screenshots/admin-privacy-edit-external.png' });
await browser.close();
