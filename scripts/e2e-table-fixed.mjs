// E2E: 验证表格列布局 - 维度列固定，指标列滑动
import { writeFileSync, mkdirSync } from 'fs';
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5000';
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const SHOTS = '/tmp/report-table-fixed-shots';
mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[table-fixed-e2e]', ...a);

const main = async () => {
  // 注册新用户
  const reg = await fetch(BASE + '/api/v1/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `e2e${Date.now()}@e2e.com`, password: 'Test123456', company: 'e2e', companyShortName: 'e2e',
      contactName: 'e2e', phone: '13800000000', accessType: 1,
    }),
  });
  const tk = (await reg.json()).data.token;
  log('token=' + tk.slice(0, 20));

  const browser = await puppeteer.launch({
    headless: 'new', executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  page.on('console', (msg) => { if (msg.type() === 'error') log('PAGE_ERR>', msg.text().slice(0, 200)); });
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tk) => { localStorage.setItem('token', tk); }, tk);
  await page.goto(BASE + '/report/overview', { waitUntil: 'networkidle2' });
  await sleep(2500);
  await page.screenshot({ path: SHOTS + '/01-loaded.png' });

  // 1. 抓所有表头列 + 是否 fixed
  const headers = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.el-table__header-wrapper thead th')).map((th) => {
      const label = th.querySelector('.cell')?.textContent?.trim() || '?';
      // Element Plus 2.x: el-table-fixed-column--left / --right
      const isFixed = th.classList.contains('el-table-fixed-column--left') || th.classList.contains('el-table-fixed-column--right');
      return { label, isFixed };
    });
  });
  log('--- table headers ---');
  headers.forEach((h) => log(`  ${h.isFixed ? '🔒' : '  '} ${h.label}`));

  const dims = headers.filter((h) => h.isFixed);
  const metrics = headers.filter((h) => !h.isFixed);

  log(`维度列 (fixed): ${dims.length}`);
  log(`指标列 (滑动): ${metrics.length}`);

  // 2. 横向滚动 - 模拟 600px 滚动
  await page.evaluate(() => {
    const wrap = document.querySelector('.el-table__body-wrapper');
    if (wrap) wrap.scrollLeft = 600;
  });
  await sleep(500);
  await page.screenshot({ path: SHOTS + '/02-scrolled.png' });

  // 3. 滚动后再看 fixed 列是否还可见
  const visibility = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.el-table__header-wrapper thead th').forEach((th) => {
      const rect = th.getBoundingClientRect();
      const label = th.querySelector('.cell')?.textContent?.trim() || '?';
      out.push({ label, left: Math.round(rect.left), width: Math.round(rect.width), visible: rect.left >= 0 && rect.left < 1280 });
    });
    return out;
  });
  log('--- header positions after scrollLeft=600 ---');
  visibility.forEach((v) => log(`  ${v.label}: left=${v.left} width=${v.width} visible=${v.visible}`));

  await browser.close();

  if (dims.length > 0 && metrics.length > 0) {
    log('🎉 ALL OK (维度 fixed=' + dims.length + ', 指标 滑动=' + metrics.length + ')');
    process.exit(0);
  } else {
    log('❌ FAILED');
    process.exit(1);
  }
};

main().catch((e) => { console.error(e); process.exit(2); });
