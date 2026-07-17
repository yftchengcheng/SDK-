// 调试：尝试不同方式登录
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5000';
const EMAIL = 'yufutang@adtalos.com';
const PASSWORD = 'Test123456';

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  page.on('console', msg => console.log('PAGE:', msg.text()));
  page.on('pageerror', e => console.log('PAGEERR:', e.message));

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  const url1 = page.url();
  console.log('[A] after goto:', url1);

  // 列出所有 input
  const inputs = await page.evaluate(() => {
    const arr = Array.from(document.querySelectorAll('input'));
    return arr.map((i, idx) => ({ idx, type: i.type, name: i.name, placeholder: i.placeholder, visible: !!i.offsetParent }));
  });
  console.log('[B] inputs:', JSON.stringify(inputs));

  // 找 login 按钮
  const buttons = await page.evaluate(() => {
    const arr = Array.from(document.querySelectorAll('button'));
    return arr.map((b, idx) => ({ idx, text: (b.textContent || '').trim(), type: b.type, cls: b.className }));
  });
  console.log('[C] buttons:', JSON.stringify(buttons));

  // 直接调登录 API 来获取 token，然后注入 localStorage + cookie
  console.log('[D] call /auth/login API');
  const apiRes = await page.evaluate(async ({ email, password }) => {
    const r = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return { status: r.status, body: await r.text() };
  }, { email: EMAIL, password: PASSWORD });
  console.log('[E] login API:', apiRes.status, apiRes.body.slice(0, 200));

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
