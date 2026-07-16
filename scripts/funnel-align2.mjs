import puppeteer from 'puppeteer';
(async () => {
  const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'al2-' + Date.now() + '@e2e.com', password: 'Test123456', company: 'e2e', companyShortName: 'e2e', contactName: 'e2e', phone: '13800000000', accessType: 1 }),
  });
  const tk = (await reg.json()).data.token;
  const browser = await puppeteer.launch({ headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1702, height: 1034 });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
  await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 3000));
  const data = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.funnel-block').forEach((b, i) => {
      const r = b.getBoundingClientRect();
      out.push({ i, top: Math.round(r.top), h: Math.round(r.height), gridArea: getComputedStyle(b).gridArea });
    });
    return out;
  });
  console.log('11 步色块 y 位置 + gridArea:');
  data.forEach((r) => console.log(`  ${r.i} top=${r.top} h=${r.h} gridArea=${r.gridArea}`));
  // metric 位置
  const m = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.funnel-metric').forEach((b, i) => {
      const r = b.getBoundingClientRect();
      out.push({ i, side: b.classList.contains('funnel-metric-left') ? 'L' : 'R', name: b.querySelector('.funnel-metric-name')?.textContent, top: Math.round(r.top), h: Math.round(r.height), gridArea: getComputedStyle(b).gridArea });
    });
    return out;
  });
  console.log('10 个指标 y 位置 + gridArea:');
  m.forEach((r) => console.log(`  ${r.i} [${r.side}] ${r.name} top=${r.top} h=${r.h} gridArea=${r.gridArea}`));
  await browser.close();
})();
