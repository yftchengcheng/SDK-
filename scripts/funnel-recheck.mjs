import puppeteer from 'puppeteer';
const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'e2e' + Date.now() + '@e2e.com', password: 'Test123456', company: 'e2e', companyShortName: 'e2e', contactName: 'e2e', phone: '13800000000', accessType: 1 }),
});
const tk = (await reg.json()).data.token;
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-cache'],
});
const page = await browser.newPage();
await page.setCacheEnabled(false);
await page.setViewport({ width: 1440, height: 1448, deviceScaleFactor: 2 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 3000));

const wrap = await page.$('.funnel-split-left');
if (wrap) await wrap.screenshot({ path: 'public/funnel-recheck.png' });

const v = await page.evaluate(() => {
  const polys = Array.from(document.querySelectorAll('.funnel-link-svg polygon'));
  return polys.map((p, i) => {
    const pts = p.getAttribute('points').split(' ').map(s => s.split(',').map(Number));
    return { idx: i, tipX: pts[1][0], tipY: pts[1][1], color: p.getAttribute('fill') };
  });
});
console.log(JSON.stringify(v, null, 2));
await browser.close();
