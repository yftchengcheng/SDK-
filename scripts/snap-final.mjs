import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
// 先去 /login 拿 captcha
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1000));
// 取验证码图（读 svg 文字）
const captchaSvg = await page.$eval('svg', el => el.textContent).catch(() => null);
console.log('captcha:', captchaSvg);
// 填登录
await page.type('input[type="text"]', 'snap_test@coze.com');
await page.type('input[type="password"]', 'Snap123456');
await page.type('input[placeholder*="验证码"]', captchaSvg || 'ABCD');
// 勾选隐私政策
const checkbox = await page.$('.el-checkbox');
if (checkbox) await checkbox.click();
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: '/tmp/login.png' });
// 提交
await page.click('button.el-button--primary');
await new Promise(r => setTimeout(r, 3000));
console.log('after login url:', page.url());
await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 4000));
const info = await page.evaluate(() => {
  const m = document.querySelector('.app-master-panel');
  const d = document.querySelector('.app-detail-panel');
  return {
    url: location.href,
    items: document.querySelectorAll('.app-master-item').length,
    master: m ? m.getBoundingClientRect().toJSON() : null,
    detail: d ? d.getBoundingClientRect().toJSON() : null,
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: '/tmp/vp_final.png', fullPage: false });
await page.screenshot({ path: '/tmp/full_final.png', fullPage: true });
const master = await page.$('.app-master-panel');
if (master) {
  const box = await master.boundingBox();
  await page.screenshot({ path: '/tmp/master_final.png', clip: box });
}
await browser.close();
