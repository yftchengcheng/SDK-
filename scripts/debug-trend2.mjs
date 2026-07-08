// /workspace/projects/scripts/debug-trend2.mjs
// 验证 dashboard 7天 tab 的 X 轴显示 7+ 个日期标签
import puppeteer from '/workspace/projects/node_modules/.pnpm/puppeteer-core@25.3.0/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const PORT = '5000';
const BASE = `http://localhost:${PORT}`;

const lr = await fetch(`${BASE}/api/v1/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'dashboard-test@demo.com', password: 'Test1234abcd' }),
});
const lj = await lr.json();
const token = lj?.data?.token;
if (!token) { console.log('login failed:', JSON.stringify(lj)); process.exit(1); }

const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// 把 token 写到 localStorage
await page.evaluateOnNewDocument((t) => {
  localStorage.setItem('token', t);
}, token);

await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.body.innerText.includes('数据看板'), { timeout: 10000 });
await new Promise(r => setTimeout(r, 3000));

// 1) 直接看 ECharts canvas X 轴标签（从 DOM 截取 svg 文本）
const xLabels = await page.evaluate(() => {
  // 找所有 svg text 包含 - 或 / 月份的
  const texts = Array.from(document.querySelectorAll('svg text'));
  return texts.map(t => t.textContent).filter(s => /\d/.test(s));
});
console.log('SVG date labels:', JSON.stringify(xLabels));

// 2) 抓主 trend chart 的 x 轴 text
const mainChartLabels = await page.evaluate(() => {
  const svg = document.querySelector('svg[xmlns="http://www.w3.org/2000/svg"]');
  if (!svg) return null;
  return Array.from(svg.querySelectorAll('text')).map(t => t.textContent);
});
console.log('Main SVG labels:', JSON.stringify(mainChartLabels));

await page.screenshot({ path: '/tmp/dashboard2.png' });
console.log('screenshot -> /tmp/dashboard2.png');

await browser.close();
