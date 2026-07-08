// /workspace/projects/scripts/debug-trend.mjs
// 抓 dashboard trend API 实际返回的 shape
import puppeteer from '/workspace/projects/node_modules/.pnpm/puppeteer-core@25.3.0/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const PORT = process.env.DEPLOY_RUN_PORT || '5000';
const BASE = `http://localhost:${PORT}`;
const EMAIL = 'dashboard-test@demo.com';
const PASSWORD = 'Test1234abcd';

// 1) 登录拿 token
const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const loginJson = await loginRes.json();
const token = loginJson?.data?.token;
const user = loginJson?.data;
console.log('login OK, token:', token?.slice(0, 20) + '...');

// 2) 用 token 调 trend API 看看后端返回啥
const trendRes = await fetch(`${BASE}/api/v1/console/dashboard/trend?startDate=2026-07-01&endDate=2026-07-08`, {
  headers: { 'Authorization': `Bearer ${token}` },
});
const trendJson = await trendRes.json();
console.log('\n=== /dashboard/trend?startDate=2026-07-01&endDate=2026-07-08 ===');
console.log(JSON.stringify(trendJson, null, 2));

const overviewRes = await fetch(`${BASE}/api/v1/console/dashboard/overview?startDate=2026-07-01&endDate=2026-07-08`, {
  headers: { 'Authorization': `Bearer ${token}` },
});
const overviewJson = await overviewRes.json();
console.log('\n=== /dashboard/overview?startDate=2026-07-01&endDate=2026-07-08 ===');
console.log(JSON.stringify(overviewJson, null, 2));

// 3) 启动 puppeteer 抓页面看到的 trend data
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument((t, u) => {
  localStorage.setItem('token', t);
  localStorage.setItem('userInfo', JSON.stringify(u));
}, token, user);

// 拦截 fetch 拿真实响应
await page.evaluateOnNewDocument(() => {
  window.__apiResponses = {};
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    if (url.includes('/api/v1/console/dashboard/')) {
      const res = await origFetch.apply(this, args);
      const cloned = res.clone();
      try {
        const json = await cloned.json();
        window.__apiResponses[url.split('?')[0]] = { params: url, body: json };
      } catch (e) {}
      return res;
    }
    return origFetch.apply(this, args);
  };
});

await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.body.innerText.includes('数据看板'), { timeout: 10000 });
await new Promise(r => setTimeout(r, 2000));

const data = await page.evaluate(() => window.__apiResponses);
console.log('\n=== BROWSER SEES ===');
for (const [k, v] of Object.entries(data)) {
  console.log(`\n>>> ${k}`);
  console.log('   params:', v.params);
  console.log('   body:', JSON.stringify(v.body, null, 2).slice(0, 1500));
}

await browser.close();
