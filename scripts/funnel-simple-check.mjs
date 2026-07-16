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
const info = await page.evaluate(() => {
  return {
    pathCount: document.querySelectorAll('.funnel-link-svg path').length,
    dotCount: document.querySelectorAll('.funnel-link-svg circle').length,
    paths: Array.from(document.querySelectorAll('.funnel-link-svg path')).map(p => p.getAttribute('d')),
  };
});
console.log('总 path:', info.pathCount, '总 dot:', info.dotCount);
console.log('左 5 linkIndices 长度: 2+2+2+2+2 = 10, 右 5: 1+2+1+1+2 = 7, 总 17');
console.log('前 3 path d:');
info.paths.slice(0, 3).forEach(d => console.log('  ' + d));
await page.screenshot({ path: 'public/funnel-simple.png', clip: { x: 200, y: 420, width: 1000, height: 650 } });
await browser.close();
