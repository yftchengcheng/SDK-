// 抓 drawer 完整内容
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5000';
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const register = async () => {
  const r = await fetch(BASE + '/api/v1/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `dbg${Date.now()}@e2e.com`, password: 'Test123456', company: 'e2e', companyShortName: 'e2e',
      contactName: 'e2e', phone: '13800000000', accessType: 1,
    }),
  });
  const j = await r.json();
  return j.data.token;
};

const api = async (token, method, path, body) => {
  const r = await fetch(BASE + path, {
    method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
};

const main = async () => {
  const tk = await register();
  const a = await api(tk, 'POST', '/api/v1/console/app/create', { appName: 'Dbg', packageName: `com.dbg.${Date.now()}`, platform: 1 });
  const appKey = a.data.app_key;
  await api(tk, 'POST', '/api/v1/console/placement/create', { appKey, name: 'Ban', format: 1 });

  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tk) => { localStorage.setItem('token', tk); }, tk);
  await page.goto(BASE + '/ad-source', { waitUntil: 'networkidle2' });
  await sleep(1500);

  // 选 app + placement
  await page.evaluate(() => {
    const sels = document.querySelectorAll('.el-select');
    sels[0]?.click();
  });
  await sleep(400);
  await page.evaluate(() => {
    const items = document.querySelectorAll('.el-select-dropdown__item');
    items[0]?.click();
  });
  await sleep(700);
  await page.evaluate(() => {
    const sels = document.querySelectorAll('.el-select');
    sels[1]?.click();
  });
  await sleep(400);
  await page.evaluate(() => {
    const items = document.querySelectorAll('.el-select-dropdown__item');
    items[0]?.click();
  });
  await sleep(700);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => /添加广告源/.test(x.textContent || ''));
    b?.click();
  });
  await sleep(1200);

  // 抓 drawer body 完整 html
  const html = await page.evaluate(() => {
    const drawer = document.querySelector('.el-drawer__body');
    if (!drawer) return { error: 'no drawer' };
    return {
      drawerText: (drawer.textContent || '').slice(0, 1500),
      // 找所有 .page-form-section-title
      titles: Array.from(drawer.querySelectorAll('.page-form-section-title')).map((t) => t.textContent.trim()),
      // 找所有 section 的 child 数
      sections: Array.from(drawer.querySelectorAll('.page-form-section')).map((s, i) => ({
        idx: i,
        title: (s.querySelector('.page-form-section-title')?.textContent || '').trim(),
        formItemCount: s.querySelectorAll('.el-form-item').length,
        bodyChildren: s.querySelector('.page-form-section-body')?.children.length || 0,
        bodyHtml: (s.querySelector('.page-form-section-body')?.innerHTML || '').slice(0, 400),
      })),
    };
  });
  console.log(JSON.stringify(html, null, 2));

  await page.screenshot({ path: '/tmp/dbg-drawer.png', fullPage: true });
  await browser.close();
};

main().catch(console.error);
