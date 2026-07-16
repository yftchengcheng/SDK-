import puppeteer from 'puppeteer';
(async () => {
  const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'chain-' + Date.now() + '@e2e.com', password: 'Test123456', company: 'e2e', companyShortName: 'e2e', contactName: 'e2e', phone: '13800000000', accessType: 1 }),
  });
  const tk = (await reg.json()).data.token;
  const browser = await puppeteer.launch({ headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1702, height: 1034 });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
  await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 3000));
  const rects = await page.evaluate(() => {
    const get = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { sel, w: Math.round(r.width), h: Math.round(r.height) };
    };
    return [
      get('.funnel-layout'),
      get('.funnel-grid'),
      get('.funnel-col'),
      get('.funnel-chart'),
      get('.funnel-block-0'),
      get('.funnel-page'),
      get('.funnel-chart-card'),
    ];
  });
  console.log(rects);
  await browser.close();
})();
