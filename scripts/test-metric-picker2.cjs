const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('console', msg => { if (msg.type() === 'error') console.log('[c.err]', msg.text()); });

  await page.goto('http://localhost:5000/login', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));
  const loginRes = await page.evaluate(async () => {
    const r = await fetch('/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'logintest2@example.com', password: 'Test1234!' })
    });
    return await r.json();
  });
  await page.evaluate((t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('userInfo', JSON.stringify(u));
    localStorage.setItem('userRole', 'developer');
  }, loginRes.data.token, loginRes.data);

  await page.goto('http://localhost:5000/report/overview', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 3000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.innerText.includes('设置指标'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Print all category names
  const cats = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.mp-cat-title')).map(e => e.innerText);
  });
  console.log('Categories:', JSON.stringify(cats));

  // Get first metric from each category
  const firstItems = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.mp-cat-item')).slice(0, 10).map(e => ({
      code: e.querySelector('input')?.value,
      label: e.innerText.trim()
    }));
  });
  console.log('First 10 items:', JSON.stringify(firstItems, null, 2));

  // Click the first item
  const clickRes = await page.evaluate(() => {
    const item = document.querySelector('.mp-cat-item');
    if (!item) return null;
    const input = item.querySelector('input');
    const before = input?.checked;
    input?.click();
    const after = input?.checked;
    return { before, after, sideRows: document.querySelectorAll('.mp-side-row').length };
  });
  console.log('Click first item:', JSON.stringify(clickRes));
  await new Promise(r => setTimeout(r, 500));
  const afterWait = await page.evaluate(() => ({
    sideRows: document.querySelectorAll('.mp-side-row').length,
    sideTitle: document.querySelector('.mp-side-title')?.innerText
  }));
  console.log('After 500ms:', JSON.stringify(afterWait));

  await page.screenshot({ path: '/tmp/metric-picker-2.png', fullPage: true });
  await browser.close();
})();
