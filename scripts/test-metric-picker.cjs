const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', err => console.log('[err]', err.message));
  page.on('console', msg => { if (msg.type() === 'error') console.log('[console.error]', msg.text()); });

  await page.goto('http://localhost:5000/login', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));
  const loginRes = await page.evaluate(async () => {
    const r = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  console.log('1) url:', page.url());

  // Click 设置指标 button
  // Use page.evaluate to click
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.innerText.includes('设置指标'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('2) 设置指标 button clicked:', clicked);
  await new Promise(r => setTimeout(r, 1500));

  const dialogData = await page.evaluate(() => {
    const dialog = document.querySelector('.el-dialog');
    const title = document.querySelector('.el-dialog__title')?.innerText;
    const cats = document.querySelectorAll('.mp-cat-col').length;
    const items = document.querySelectorAll('.mp-cat-item').length;
    const sideRows = document.querySelectorAll('.mp-side-row').length;
    const sideTitle = document.querySelector('.mp-side-title')?.innerText;
    return { dialog: !!dialog, title, cats, items, sideRows, sideTitle };
  });
  console.log('3) Dialog:', JSON.stringify(dialogData));
  await page.screenshot({ path: '/tmp/metric-picker.png', fullPage: true });

  // Click an unchecked metric
  const checkRes = await page.evaluate(() => {
    const checks = Array.from(document.querySelectorAll('.mp-cat-item .el-checkbox__input'));
    if (!checks.length) return null;
    checks[0].click();
    return { checked: checks.length, sideRows: document.querySelectorAll('.mp-side-row').length };
  });
  console.log('4) After click first item:', JSON.stringify(checkRes));
  await new Promise(r => setTimeout(r, 500));

  await browser.close();
})();
