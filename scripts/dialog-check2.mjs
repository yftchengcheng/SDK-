import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// 监听所有 console
const logs = [];
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`));

// 1. 登录
console.log('--- 1. goto / ---');
await page.goto('http://localhost:5000/', { waitUntil: 'networkidle0', timeout: 30000 });
console.log('current url:', page.url());

// 2. 登录
console.log('--- 2. login ---');
const loginOk = await page.evaluate(async () => {
  const r = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dashboard-test@demo.com', password: 'Test123456' }),
  });
  const j = await r.json();
  if (j.data && j.data.token) {
    localStorage.setItem('token', j.data.token);
    if (j.data.userInfo) localStorage.setItem('userInfo', JSON.stringify(j.data.userInfo));
    return true;
  }
  return false;
});
console.log('login:', loginOk);

// 3. goto /app
console.log('--- 3. goto /app ---');
await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle0', timeout: 30000 });
console.log('current url:', page.url());
await new Promise(r => setTimeout(r, 3000));

// 4. 找 SDK 预置策略 按钮
const btnInfo = await page.evaluate(() => {
  const allBtns = Array.from(document.querySelectorAll('button'));
  const result = allBtns.map(b => ({
    text: b.textContent.trim().slice(0, 30),
    cls: b.className.slice(0, 60),
    visible: b.offsetParent !== null,
  })).filter(b => b.visible);
  return result;
});
console.log('所有可见按钮:', JSON.stringify(btnInfo, null, 2));

// 5. 找 "SDK预置策略" 按钮并点击
const sdkBtnIdx = btnInfo.findIndex(b => b.text.includes('SDK预置策略'));
if (sdkBtnIdx >= 0) {
  console.log('--- 4. 点击 SDK预置策略 按钮 ---');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.trim().includes('SDK预置策略'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
}

// 6. 检查 el-dialog
const dialogInfo = await page.evaluate(() => {
  const overlays = Array.from(document.querySelectorAll('.el-overlay'));
  const dialogs = Array.from(document.querySelectorAll('.el-dialog'));
  const policyDialogs = Array.from(document.querySelectorAll('.policy-dialog'));
  return {
    overlayCount: overlays.length,
    overlayStyles: overlays.slice(0, 3).map(o => ({
      zIndex: getComputedStyle(o).zIndex,
      display: getComputedStyle(o).display,
      visibility: getComputedStyle(o).visibility,
    })),
    dialogCount: dialogs.length,
    dialogStyles: dialogs.slice(0, 3).map(d => ({
      zIndex: getComputedStyle(d).zIndex,
      display: getComputedStyle(d).display,
      visibility: getComputedStyle(d).visibility,
    })),
    policyDialogCount: policyDialogs.length,
    policyDialogStyles: policyDialogs.slice(0, 3).map(p => ({
      zIndex: getComputedStyle(p).zIndex,
      display: getComputedStyle(p).display,
      visibility: getComputedStyle(p).visibility,
    })),
  };
});
console.log('--- 5. dialog info ---');
console.log(JSON.stringify(dialogInfo, null, 2));

// 7. 截图
await page.screenshot({ path: '/tmp/dialog-test2.png', fullPage: true });
console.log('截图: /tmp/dialog-test2.png');

// 8. console 日志
console.log('--- 6. console logs ---');
logs.slice(-20).forEach(l => console.log(l));

await browser.close();
