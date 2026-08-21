import puppeteer from 'puppeteer';
const BASE = 'http://localhost:5000';
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[placeholder="请输入注册邮箱"]');
  await page.type('input[placeholder="请输入注册邮箱"]', 'testuser@example.com');
  await page.type('input[placeholder="请输入密码"]', 'Test123456');
  // captcha canvas 文字从 DOM 拿不到，尝试从 component instance 拿
  // 简化：直接读 __VUE__ 根组件
  await new Promise(r => setTimeout(r, 500));
  const captcha = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    let result = '';
    // 暴力遍历 Vue 组件树
    const root = document.getElementById('app');
    if (!root) return 'no-root';
    // 直接读 canvas 的 data 属性
    const canvas = document.querySelector('canvas');
    if (!canvas) return 'no-canvas';
    // canvas 上有 data-captcha 属性吗？
    return JSON.stringify({
      canvasAttrs: Array.from(canvas.attributes).map((a) => `${a.name}=${a.value}`),
      width: canvas.width,
      height: canvas.height,
    });
  });
  console.log('captcha probe:', captcha);
} finally { await browser.close(); }
