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
await page.setViewport({ width: 1600, height: 2000 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));
// 切到「使用时长」tab
await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('.behavior-master-item'));
  const t = items.find(i => i.textContent.includes('使用时长'));
  if (t) t.click();
  else console.log('not found, items:', items.map(i => i.textContent.trim()));
});
await new Promise(r => setTimeout(r, 1500));
const all = await page.evaluate(() => {
  const tables = document.querySelectorAll('[class*="table"]');
  return Array.from(tables).map(t => t.className);
});
console.log('tables:', all);
// 查 duration 元素
const dur = await page.evaluate(() => {
  return {
    hasChart: !!document.querySelector('.duration-chart'),
    hasSummary: !!document.querySelector('.duration-summary'),
    durationTable: !!document.querySelector('.duration-table'),
    durationRowCount: document.querySelectorAll('.duration-row').length,
  };
});
console.log('duration:', dur);
await browser.close();
