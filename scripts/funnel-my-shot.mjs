import puppeteer from 'puppeteer';
(async () => {
  const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shot-' + Date.now() + '@e2e.com', password: 'Test123456', company: 'e2e', companyShortName: 'e2e', contactName: 'e2e', phone: '13800000000', accessType: 1 }),
  });
  const tk = (await reg.json()).data.token;
  const browser = await puppeteer.launch({ headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 595, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
  await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: '/tmp/funnel-my.png', fullPage: false });
  console.log('shot saved /tmp/funnel-my.png');
  // 再截一张带标注的 (在每行 step / metric 旁边画 y 坐标)
  await page.evaluate(() => {
    document.querySelectorAll('.funnel-block').forEach((b, i) => {
      const r = b.getBoundingClientRect();
      const tag = document.createElement('div');
      tag.textContent = `s${i}@${Math.round(r.top)}`;
      tag.style.cssText = `position:fixed;left:${r.left - 40}px;top:${r.top + 8}px;font-size:10px;color:#ef4444;font-weight:bold;background:#fff;padding:0 2px;border-radius:2px;z-index:9999;`;
      document.body.appendChild(tag);
    });
    document.querySelectorAll('.funnel-metric').forEach((b, i) => {
      const r = b.getBoundingClientRect();
      const tag = document.createElement('div');
      const side = b.classList.contains('funnel-metric-left') ? 'L' : 'R';
      tag.textContent = `m${side}${i}@${Math.round(r.top)}`;
      tag.style.cssText = `position:fixed;left:${r.right + 4}px;top:${r.top + 8}px;font-size:10px;color:#16a34a;font-weight:bold;background:#fff;padding:0 2px;border-radius:2px;z-index:9999;`;
      document.body.appendChild(tag);
    });
  });
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: '/tmp/funnel-my-tagged.png', fullPage: false });
  console.log('tagged shot saved /tmp/funnel-my-tagged.png');
  await browser.close();
})();
