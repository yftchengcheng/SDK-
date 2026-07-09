import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2000));

// 从 localStorage 提取 captcha (开发模式 dev 跳过, 但实际是有的)
// 用 dev mode: captcha 输入框是不是 disabled?
const captchaState = await page.evaluate(() => {
  const inputs = Array.from(document.querySelectorAll('input'));
  return inputs.map(i => ({ ph: i.placeholder, val: i.value, disabled: i.disabled, name: i.name }));
});
console.log('inputs:', JSON.stringify(captchaState, null, 2));

// 模拟: 读取 canvas 的 pixel data, 计算 RGB 转灰度后识别 4 字符
const capText = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  if (!c) return null;
  const ctx = c.getContext('2d');
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  // 简单 dump 看
  return { w: c.width, h: c.height, len: data.length };
});
console.log('canvas:', capText);

// 简单办法: 我自己生成 captcha, 然后把后端写一个 /api/v1/auth/login-dev 跳过
// 但这要改后端. 算了, 截屏然后人眼读
// 截一张登录页
await page.screenshot({ path: '/tmp/login_screen.png' });
await browser.close();
