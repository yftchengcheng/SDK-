import puppeteer from 'puppeteer';
(async () => {
  const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'al-' + Date.now() + '@e2e.com', password: 'Test123456', company: 'e2e', companyShortName: 'e2e', contactName: 'e2e', phone: '13800000000', accessType: 1 }),
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
      out.push({ i, name: b.querySelector('.funnel-block-text')?.textContent, top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) });
    });
    return out;
  });
  console.log('11 步色块 y 位置:');
  data.forEach((r) => console.log(`  ${r.i} ${r.name} top=${r.top} bottom=${r.bottom} h=${r.h}`));
  // 计算 step 间距
  for (let i = 1; i < data.length; i++) {
    console.log(`  step ${i-1}→${i} 间距=${data[i].top - data[i-1].top}`);
  }
  // grid
  const grid = await page.evaluate(() => {
    const el = document.querySelector('.funnel-grid');
    const s = getComputedStyle(el);
    return { rows: s.gridTemplateRows, padding: s.padding, alignItems: s.alignItems };
  });
  console.log('grid:', grid);
  await browser.close();
})();
