// E2E: 验证综合报表"指标设置"弹窗的回显
import { writeFileSync, mkdirSync } from 'fs';
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5000';
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const SHOTS = '/tmp/report-metric-shots';
mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[metric-picker-e2e]', ...a);

const api = async (token, method, path, body) => {
  const r = await fetch(BASE + path, {
    method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
};

const register = async () => {
  const r = await fetch(BASE + '/api/v1/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `e2e${Date.now()}@e2e.com`, password: 'Test123456', company: 'e2e', companyShortName: 'e2e',
      contactName: 'e2e', phone: '13800000000', accessType: 1,
    }),
  });
  return (await r.json()).data.token;
};

const main = async () => {
  const tk = await register();
  log('token=' + tk.slice(0, 20));

  // 1. 直接看 DB 现有看版
  const boards = await api(tk, 'GET', '/api/v1/console/report/board/list?report_type=overview');
  log('boards count:', boards.data?.length);
  if (!boards.data?.length) {
    log('NO BOARD, abort');
    process.exit(1);
  }
  const board = boards.data[0];
  log('board config metrics:', JSON.stringify(board.config?.metrics));

  // 2. 启动浏览器
  const browser = await puppeteer.launch({
    headless: 'new', executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  page.on('console', (msg) => log('PAGE>', msg.text().slice(0, 200)));
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tk) => { localStorage.setItem('token', tk); }, tk);
  await page.goto(BASE + '/report/overview', { waitUntil: 'networkidle2' });
  await sleep(2500);
  await page.screenshot({ path: SHOTS + '/01-loaded.png' });

  // 3. 点击"指标设置"按钮
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.textContent && b.textContent.trim() === '设置');
    if (btn) { btn.click(); return true; }
    return false;
  });
  log('clicked settings btn:', clicked);
  await sleep(1500);
  await page.screenshot({ path: SHOTS + '/02-picker-open.png' });

  // 4. 抓取弹窗 DOM：所有 metric 行的勾选状态
  const result = await page.evaluate(() => {
    const out = { items: [], sideSelected: [] };
    // 弹窗里所有 .mp-cat-item
    document.querySelectorAll('.mp-cat-item').forEach((row) => {
      const name = row.querySelector('.mp-cat-item-name')?.textContent?.trim() || '?';
      const cb = row.querySelector('input[type="checkbox"]');
      const isChecked = cb ? cb.checked : false;
      out.items.push({ name, isChecked });
    });
    // 右侧已选列
    document.querySelectorAll('.mp-side-row').forEach((row) => {
      const name = row.querySelector('.mp-side-name')?.textContent?.trim() || '?';
      out.sideSelected.push(name);
    });
    return out;
  });

  log('--- metric picker state ---');
  log('items:');
  result.items.forEach((it) => log(`  ${it.isChecked ? '✓' : '✗'} ${it.name}`));
  log('side selected:');
  result.sideSelected.forEach((s) => log(`  • ${s}`));

  // 5. 关键指标回显
  const expect = ['展示数', '点击数', '实际收益'];
  const expectImpressions = result.items.find((i) => i.name === '展示数');
  const expectClicks = result.items.find((i) => i.name === '点击数');
  const expectRevenue = result.items.find((i) => i.name === '实际收益');

  log('--- key check ---');
  log('展示数 checked:', expectImpressions?.isChecked);
  log('点击数 checked:', expectClicks?.isChecked);
  log('实际收益 checked:', expectRevenue?.isChecked);

  // 写一个结果文件
  writeFileSync('/tmp/metric-picker-result.json', JSON.stringify(result, null, 2));
  log('result written to /tmp/metric-picker-result.json');

  await browser.close();

  if (expectImpressions?.isChecked && expectClicks?.isChecked && expectRevenue?.isChecked) {
    log('🎉 ALL 3 CHECKED');
    process.exit(0);
  } else {
    log('❌ FAILED');
    process.exit(1);
  }
};

main().catch((e) => { console.error(e); process.exit(2); });
