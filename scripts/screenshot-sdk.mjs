/**
 * 截图 SDK 管理页面（登录态：admin）
 * 输出到 public/sdk-screenshots/
 */
import { mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'public', 'sdk-screenshots');
const BASE = process.env.BASE_URL || 'http://localhost:5000';

mkdirSync(OUT_DIR, { recursive: true });

// 启动 puppeteer（用沙箱预装的 chromium）
import('puppeteer').then(async ({ default: puppeteer }) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

    // 1. 注入登录态（直接 localStorage set）
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    // 通过 fetch 登录拿 token
    const loginRes = await page.evaluate(async () => {
      const r = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'yufutang@adtalos.com', password: 'Test123456' }),
      });
      const d = await r.json();
      return d;
    });
    if (!loginRes.data || !loginRes.data.token) {
      throw new Error('login failed: ' + JSON.stringify(loginRes));
    }
    const token = loginRes.data.token;
    const userInfo = loginRes.data;
    await page.evaluate(
      ({ t, u }) => {
        localStorage.setItem('token', t);
        localStorage.setItem('userInfo', JSON.stringify(u));
        localStorage.setItem('userRole', u.role || 'admin');
      },
      { t: token, u: userInfo }
    );
    console.log('logged in as', userInfo.email, 'role=', userInfo.role);

    // 截图列表
    const shots = [
      { url: '/sdk', file: 'sdk-home.png', wait: 1500 },
      { url: '/sdk/docs', file: 'sdk-docs.png', wait: 1500 },
      { url: '/sdk/docs?doc=1', file: 'sdk-doc-detail.png', wait: 1500 },
      { url: '/sdk/privacy', file: 'sdk-privacy.png', wait: 1500 },
      { url: '/sdk/history', file: 'sdk-history.png', wait: 1500 },
      { url: '/admin/sdk/releases', file: 'admin-sdk-releases.png', wait: 1500 },
      { url: '/admin/sdk/docs', file: 'admin-sdk-docs.png', wait: 1500 },
      { url: '/admin/sdk/privacy', file: 'admin-sdk-privacy.png', wait: 1500 },
    ];

    for (const s of shots) {
      console.log('→ capturing', s.url);
      await page.goto(`${BASE}${s.url}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise((r) => setTimeout(r, s.wait));
      const out = join(OUT_DIR, s.file);
      await page.screenshot({ path: out, fullPage: true });
      console.log('  saved', out);
    }

    console.log('all done. out dir =', OUT_DIR);
  } catch (e) {
    console.error('error:', e);
    process.exit(1);
  } finally {
    await browser.close();
  }
}).catch((e) => {
  console.error('import error:', e);
  process.exit(1);
});
