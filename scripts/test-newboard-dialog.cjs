const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

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
  // Click 新建看版
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('新建看版'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  const data = await page.evaluate(() => {
    const dialog = document.querySelector('.el-dialog');
    const formItems = Array.from(document.querySelectorAll('.el-dialog .el-form-item'));
    return {
      dialogTitle: document.querySelector('.el-dialog__title')?.innerText,
      formFields: formItems.map(f => f.querySelector('.el-form-item__label')?.innerText),
      inputs: Array.from(document.querySelectorAll('.el-dialog input,.el-dialog textarea')).map(i => ({ type: i.type, placeholder: i.placeholder, value: i.value })),
      selects: Array.from(document.querySelectorAll('.el-dialog .el-select')).map(s => s.innerText.substring(0, 20))
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: '/tmp/newboard-dialog.png', fullPage: true });
  await browser.close();
})();
