import puppeteer from 'puppeteer';
(async () => {
  const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dbg-' + Date.now() + '@e2e.com', password: 'Test123456', company: 'e2e', companyShortName: 'e2e', contactName: 'e2e', phone: '13800000000', accessType: 1 }),
  });
  const tk = (await reg.json()).data.token;
  const browser = await puppeteer.launch({ headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1702, height: 1034 });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
  await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 3000));
  const info = await page.evaluate(() => {
    const el = document.querySelector('.funnel-grid');
    if (!el) return 'no .funnel-grid';
    const s = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const parent = el.parentElement;
    const ps = parent ? getComputedStyle(parent) : null;
    return {
      gridW: rect.width,
      gridH: rect.height,
      gridDisplay: s.display,
      gridColumns: s.gridTemplateColumns,
      gridParentTag: parent?.tagName,
      gridParentClass: parent?.className,
      gridParentW: parent ? parent.getBoundingClientRect().width : null,
      gridParentDisplay: ps?.display,
      gridParentFlexDirection: ps?.flexDirection,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
