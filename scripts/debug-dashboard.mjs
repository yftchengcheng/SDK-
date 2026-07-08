/**
 * 调试：直接通过 API 登录拿 token，注入 localStorage，再访问 /dashboard
 * 不走验证码。
 */
import puppeteer from '/workspace/projects/node_modules/.pnpm/puppeteer-core@25.3.0/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const PORT = process.env.DEPLOY_RUN_PORT || '5000';
const HOST = `localhost:${PORT}`;
const BASE = `http://${HOST}`;

const EMAIL = 'dashboard-test@demo.com';
const PASSWORD = 'Test1234abcd';

async function main() {
  console.log('=== step1: register/login via API ===');
  // 先注册（已注册则忽略错误）
  await fetch(`${BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      company: 'Demo Co',
      companyShortName: 'demo',
      contactName: 'Demo',
      phone: '13800000000',
    }),
  }).catch(() => {});

  const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginJson = await loginRes.json();
  const token = loginJson?.data?.token;
  const user = loginJson?.data;
  console.log('login status:', loginRes.status, 'token:', token ? token.slice(0, 30) + '...' : 'NULL');
  if (!token) {
    console.error('login failed:', JSON.stringify(loginJson));
    process.exit(1);
  }

  console.log('\n=== step2: launch puppeteer with token in localStorage ===');
  const browser = await puppeteer.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  const page = await browser.newPage();

  // 在所有页面打开之前注入 init script
  await page.evaluateOnNewDocument((t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('userInfo', JSON.stringify(u));
  }, token, user);

  // 监听 console
  page.on('console', (msg) => {
    if (msg.text().includes('[DevGuard]') || msg.text().includes('[vite]')) {
      console.log(`  [browser] ${msg.text()}`);
    }
  });

  // 监听 API 请求
  const apiTimings = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/v1/console/dashboard') || url.includes('/api/v1/console/report')) {
      const timing = res.timing();
      apiTimings.push({
        url: url.replace(BASE, ''),
        status: res.status(),
        duration: Math.round(timing.responseEnd - timing.requestStart),
        time: Math.round(timing.requestStart),
      });
    }
  });

  const t0 = Date.now();
  console.log('--- page.goto(/dashboard) ---');
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  const tDOM = Date.now();
  console.log(`DOMContentLoaded @${tDOM - t0}ms`);

  // 等关键元素出现
  try {
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.dashboard-page, .page-dashboard, h1, h2, .page-title, [class*="dashboard"]');
        if (el && el.textContent && el.textContent.includes('数据看板')) return true;
        return document.body.innerText.includes('数据看板');
      },
      { timeout: 15000 }
    );
    const tTitle = Date.now();
    console.log(`数据看板 title @${tTitle - t0}ms`);

    // 等图表渲染（找 ECharts canvas）
    await page.waitForFunction(
      () => document.querySelectorAll('canvas').length >= 3,
      { timeout: 15000 }
    );
    const tCharts = Date.now();
    console.log(`charts rendered @${tCharts - t0}ms`);

    // 抓 dashboard 页面的"硬编码值"
    const hardcodedSnapshot = await page.evaluate(() => {
      const text = document.body.innerText;
      const cards = Array.from(document.querySelectorAll('.stat-card, .el-card, [class*="card"]')).slice(0, 4)
        .map((c) => c.innerText.replace(/\s+/g, ' ').trim());
      const hasDateRange = !!document.querySelector('.el-date-editor, input[placeholder*="日期"], input[placeholder*="开始"], input[placeholder*="结束"]');
      return { cards, hasDateRange, sample: text.slice(0, 500) };
    });
    console.log('hardcoded cards:', JSON.stringify(hardcodedSnapshot, null, 2));
  } catch (e) {
    console.log('TIMEOUT (15s):', e.message);
    const url = page.url();
    const text = await page.evaluate(() => document.body.innerText.slice(0, 200));
    console.log('current url:', url);
    console.log('body text:', text);
  }

  // 监听换日期：选择 30 天 tab
  console.log('\n--- step3: click 30d tab and measure refetch ---');
  const before30d = Date.now();
  const click30d = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.el-radio-button__inner, .mode-tab, button'));
    const t = tabs.find((el) => /30|三十/.test(el.innerText));
    if (t) {
      t.click();
      return true;
    }
    return false;
  });
  console.log('click 30d tab:', click30d);
  await new Promise((r) => setTimeout(r, 3000));
  const after30d = Date.now();
  console.log(`30d tab clicked, wait 3s, total ${after30d - before30d}ms`);

  // 用日历 picker 选日期
  console.log('\n--- step4: change date range via picker ---');
  const dateChangeResult = await page.evaluate(() => {
    const input = document.querySelector('.el-date-editor input');
    if (!input) return { ok: false, reason: 'no date picker' };
    input.focus();
    input.click();
    return { ok: true };
  });
  console.log('date picker focus:', dateChangeResult);
  await new Promise((r) => setTimeout(r, 1500));

  console.log('\n=== API 响应时间 ===');
  apiTimings.forEach((a) => {
    console.log(`  [${a.time}ms] ${a.status} ${a.duration}ms ${a.url}`);
  });
  console.log('total API calls:', apiTimings.length);

  await page.screenshot({ path: '/tmp/dashboard.png', fullPage: true });
  console.log('screenshot saved /tmp/dashboard.png');

  await browser.close();
}

main().catch((e) => {
  console.error('ERR:', e);
  process.exit(1);
});
