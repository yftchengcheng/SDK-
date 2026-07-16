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
await page.setViewport({ width: 1600, height: 1200 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));
const info = await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('.behavior-card-actions .el-button')).find(b => b.textContent.trim() === '指标选择');
  const hasIcon = btn?.querySelector('svg');
  const cls = btn?.className;
  return {
    found: !!btn,
    text: btn?.textContent?.trim(),
    hasIcon: !!hasIcon,
    classes: cls,
    computed: btn ? {
      bg: getComputedStyle(btn).backgroundColor,
      border: getComputedStyle(btn).borderColor,
      color: getComputedStyle(btn).color,
    } : null,
  };
});
console.log(JSON.stringify(info, null, 2));
// 同时截一下 Funnel 的指标选择按钮做对比
await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1500));
const funnel = await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('.el-button')).find(b => b.textContent.trim() === '指标选择');
  return {
    found: !!btn,
    text: btn?.textContent?.trim(),
    hasIcon: !!btn?.querySelector('svg'),
  };
});
console.log('Funnel 对照:', JSON.stringify(funnel));
await page.screenshot({ path: 'public/behavior-btn.png', fullPage: true });
await browser.close();
