import puppeteer from 'puppeteer';
(async () => {
  const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'uc-' + Date.now() + '@e2e.com', password: 'Test123456', company: 'e2e', companyShortName: 'e2e', contactName: 'e2e', phone: '13800000000', accessType: 1 }),
  });
  const tk = (await reg.json()).data.token;
  const browser = await puppeteer.launch({ headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  // 模拟用户截图 viewport (1280 宽)
  await page.setViewport({ width: 1280, height: 595, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
  await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: '/tmp/funnel-1280.png', fullPage: false });
  // 取 y 坐标
  const data = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('.funnel-block').forEach((b, i) => {
      const r = b.getBoundingClientRect();
      out[`step_${i}`] = { top: Math.round(r.top), h: Math.round(r.height), name: b.querySelector('.funnel-block-text')?.textContent };
    });
    document.querySelectorAll('.funnel-metric').forEach((b, i) => {
      const r = b.getBoundingClientRect();
      out[`metric_${i}`] = { top: Math.round(r.top), h: Math.round(r.height), side: b.classList.contains('funnel-metric-left') ? 'L' : 'R', name: b.querySelector('.funnel-metric-name')?.textContent };
    });
    return out;
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
