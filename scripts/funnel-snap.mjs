import puppeteer from 'puppeteer';

(async () => {
  const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'funnel-snap-' + Date.now() + '@e2e.com', password: 'Test123456', company: 'e2e', companyShortName: 'e2e', contactName: 'e2e', phone: '13800000000', accessType: 1 }),
  });
  const tk = (await reg.json()).data.token;
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1702, height: 1034 });  // 与用户原图同尺寸
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
  await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 3000));
  await page.screenshot({ path: '/tmp/funnel-snap.png', fullPage: true });
  // 局部：漏斗卡片
  const rect = await page.evaluate(() => {
    const el = document.querySelector('.funnel-chart-card') || document.querySelector('.funnel-grid');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (rect) {
    await page.screenshot({
      path: '/tmp/funnel-snap-crop.png',
      clip: { x: rect.x, y: rect.y, width: rect.w, height: rect.h },
    });
  }
  console.log('[snap] saved /tmp/funnel-snap.png and crop');
  await browser.close();
})();
