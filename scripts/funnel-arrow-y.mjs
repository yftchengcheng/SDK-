import puppeteer from 'puppeteer';
const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'e2e' + Date.now() + '@e2e.com', password: 'Test123456', company: 'e2e', companyShortName: 'e2e', contactName: 'e2e', phone: '13800000000', accessType: 1 }),
});
const tk = (await reg.json()).data.token;
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1448 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

const v = await page.evaluate(() => {
  const polys = Array.from(document.querySelectorAll('.funnel-link-svg polygon'));
  const blocks = Array.from(document.querySelectorAll('.funnel-block'));
  const blockCenters = blocks.map(b => {
    const r = b.getBoundingClientRect();
    return { y: r.top + r.height / 2, text: b.textContent.trim() };
  });
  return polys.map((p, i) => {
    const tipX = parseFloat(p.getAttribute('points').split(' ')[1].split(',')[0]);
    const tipY = parseFloat(p.getAttribute('points').split(' ')[1].split(',')[1]);
    // 找最近 block
    const nearest = blockCenters.reduce((min, b) => 
      Math.abs(b.y - tipY) < Math.abs(min.y - tipY) ? b : min
    );
    return { idx: i, tipX, tipY, target: nearest.text, color: p.getAttribute('fill') };
  });
});
console.log(JSON.stringify(v, null, 2));
await browser.close();
