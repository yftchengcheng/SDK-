import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const OUT_DIR = process.env.OUT_DIR || '/tmp/verify-screenshots';
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const putCalls = [];
  const warnMsgs = [];
  page.on('response', async (res) => {
    if (res.url().includes('/profile/password') && res.request().method() === 'PUT') {
      try {
        const body = await res.text();
        putCalls.push({ status: res.status(), body: body.substring(0, 300) });
      } catch {}
    }
  });
  page.on('console', (msg) => {
    const t = msg.text();
    if (t.includes('ElMessage') || t.includes('Warning') || t.includes('Error')) {
      warnMsgs.push(t);
    }
  });

  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify({ developerId: 'dev_4SYXG6wRXqNSmbuG', email: 'verify-api-1783560900@example.com', role: 'developer', company: '测试公司' }));
    localStorage.setItem('userRole', 'developer');
  }, VERIFY_TOKEN);
  await page.goto('http://localhost:5000/profile', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  // 点修改密码按钮
  await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll('.table-card')).find(c => c.querySelector('.card-title')?.textContent?.includes('安全设置'));
    if (card) {
      const btn = Array.from(card.querySelectorAll('.el-button')).find(b => b.textContent.trim() === '修改密码');
      btn?.click();
    }
  });
  await new Promise((r) => setTimeout(r, 800));

  // 测抽屉存在
  const drawerCheck = await page.evaluate(() => {
    const drawer = document.querySelector('.el-drawer');
    if (!drawer) return { exists: false };
    const r = drawer.getBoundingClientRect();
    return {
      exists: true,
      visible: r.width > 0 && r.x >= 0 && r.x < window.innerWidth,
      width: Math.round(r.width),
      x: Math.round(r.x),
    };
  });
  console.log('DRAWER:', JSON.stringify(drawerCheck, null, 2));

  // 拿所有 label
  const labels = await page.evaluate(() => {
    const form = document.querySelector('.el-drawer .password-drawer-body');
    if (!form) return [];
    return Array.from(form.querySelectorAll('.el-form-item__label')).map(l => l.textContent.trim());
  });
  console.log('LABELS:', JSON.stringify(labels, null, 2));

  await page.screenshot({ path: path.join(OUT_DIR, 'password-drawer.png'), fullPage: false });
  console.log('saved password-drawer.png');
} finally {
  await browser.close();
}
