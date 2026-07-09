import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1500));
// 把验证码 token 接口 + 后端 captcha 文本读出来 - 但这是 canvas 画的, 读不到字符
// 改方案: 直接发 send-captcha + 用 /api 的 verify 跳过
// 最简单: 用 axios 在 node 中先发登录拿 cookie, 然后 puppeteer 用 cookie
const resp = await fetch('http://localhost:5000/api/v1/auth/send-captcha');
const { data: cd } = await resp.json();
const captchaToken = cd.captchaToken;
console.log('captchaToken:', captchaToken?.slice(0, 30));
// 假设验证码是后端 dev mode 默认值
// 但前端 captcha 校验是前端的 captchaText, 不依赖后端 captchaToken
// 所以必须从前端读出来, 让我重写
await page.evaluate((tk) => {
  // 注入设置：覆盖前端验证码文本
  window.__captchaToken = tk;
}, captchaToken);
// 通过监听 canvas 重绘不太可行
// 改用 OCR 思路: 截 canvas 然后用极简模板匹配 - 太复杂
// 干脆: 用 setCookie 直接注入 auth_token
await browser.close();
