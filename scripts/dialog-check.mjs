import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  const consoleLogs = [];
  page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => consoleLogs.push(`[pageerror] ${err.message}`));

  console.log('--- 1. goto / ---');
  await page.goto('http://localhost:5000/', { waitUntil: 'networkidle0', timeout: 30000 });

  console.log('--- 2. login as dashboard-test@demo.com ---');
  const loginResp = await page.evaluate(async () => {
    const r = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: 'dashboard-test@demo.com', password: 'Test123456' }),
    });
    return { status: r.status, body: (await r.json()).code };
  });
  console.log('  login result:', JSON.stringify(loginResp));

  console.log('--- 3. 跳到 /#/app + 等待 App 渲染 ---');
  await page.goto('http://localhost:5000/#/app', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2500));

  console.log('--- 4. 找 SDK 预置策略 按钮 ---');
  const btnInfo = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, .el-button, [class*="button"], [class*="btn"]'));
    const candidates = btns
      .map((b) => ({ text: (b.textContent || '').trim().slice(0, 50), classes: b.className.slice(0, 80) }))
      .filter((b) => b.text.includes('SDK') || b.text.includes('预置') || b.text.includes('导出'));
    return candidates.slice(0, 10);
  });
  console.log('  候选按钮:', JSON.stringify(btnInfo, null, 2));

  console.log('--- 5. 直接点所有包含"SDK"或"预置"的按钮 ---');
  const clickedTexts = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, .el-button'));
    const out = [];
    for (const b of btns) {
      const t = (b.textContent || '').trim();
      if ((t.includes('SDK') || t.includes('预置') || t.includes('导出')) && !b.disabled) {
        b.click();
        out.push(t);
      }
    }
    return out;
  });
  console.log('  已点击:', JSON.stringify(clickedTexts));
  await new Promise((r) => setTimeout(r, 2500));

  console.log('--- 6. 检查 el-dialog DOM 状态 ---');
  const dialogInfo = await page.evaluate(() => {
    const overlays = Array.from(document.querySelectorAll('.el-overlay, .el-overlay-dialog'));
    const dialogs = Array.from(document.querySelectorAll('.el-dialog, [class*="policy-dialog"]'));
    const policyDialogs = dialogs.filter((d) => d.className.includes('policy-dialog'));
    return {
      overlayCount: overlays.length,
      overlayStyles: overlays.map((o) => ({
        zIndex: getComputedStyle(o).zIndex,
        display: getComputedStyle(o).display,
        visibility: getComputedStyle(o).visibility,
        opacity: getComputedStyle(o).opacity,
      })),
      dialogCount: dialogs.length,
      policyDialogCount: policyDialogs.length,
      policyDialogStyles: policyDialogs.map((d) => ({
        zIndex: getComputedStyle(d).zIndex,
        display: getComputedStyle(d).display,
        visibility: getComputedStyle(d).visibility,
        opacity: getComputedStyle(d).opacity,
        position: getComputedStyle(d).position,
        top: getComputedStyle(d).top,
        left: getComputedStyle(d).left,
        width: getComputedStyle(d).width,
        height: getComputedStyle(d).height,
        transform: getComputedStyle(d).transform,
      })),
    };
  });
  console.log('  dialog info:', JSON.stringify(dialogInfo, null, 2));

  console.log('--- 7. 截图 ---');
  await page.screenshot({ path: '/tmp/dialog-test.png', fullPage: false });
  console.log('  截图保存到 /tmp/dialog-test.png');

  console.log('--- 8. console 日志 (最近 20 条) ---');
  for (const l of consoleLogs.slice(-20)) console.log('  ' + l);
} finally {
  await browser.close();
}
