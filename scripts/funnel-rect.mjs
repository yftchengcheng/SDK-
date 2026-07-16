import puppeteer from 'puppeteer';

(async () => {
  const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'funnel-rect-' + Date.now() + '@e2e.com', password: 'Test123456', company: 'e2e', companyShortName: 'e2e', contactName: 'e2e', phone: '13800000000', accessType: 1 }),
  });
  const tk = (await reg.json()).data.token;
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1702, height: 1034 });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
  await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 3000));
  const rects = await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll('.funnel-block'));
    return blocks.map((b, i) => {
      const r = b.getBoundingClientRect();
      return { i, name: b.querySelector('.funnel-block-text')?.textContent, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    });
  });
  console.log('11 步色块位置:');
  rects.forEach((r) => console.log(`  ${r.i} ${r.name} x=${r.x} y=${r.y} w=${r.w} h=${r.h}`));
  const leftRects = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.funnel-metric-left'));
    return items.map((m, i) => {
      const r = m.getBoundingClientRect();
      return { i, name: m.querySelector('.funnel-metric-name')?.textContent, y: Math.round(r.y), x: Math.round(r.x), w: Math.round(r.width), gridRow: m.style.gridRow };
    });
  });
  console.log('左侧 5 个指标位置:');
  leftRects.forEach((r) => console.log(`  ${r.i} ${r.name} y=${r.y} x=${r.x} w=${r.w} gridRow=${r.gridRow}`));
  const rightRects = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.funnel-metric-right'));
    return items.map((m, i) => {
      const r = m.getBoundingClientRect();
      return { i, name: m.querySelector('.funnel-metric-name')?.textContent, y: Math.round(r.y), x: Math.round(r.x), w: Math.round(r.width), gridRow: m.style.gridRow };
    });
  });
  console.log('右侧 5 个指标位置:');
  rightRects.forEach((r) => console.log(`  ${r.i} ${r.name} y=${r.y} x=${r.x} w=${r.w} gridRow=${r.gridRow}`));
  await browser.close();
})();
