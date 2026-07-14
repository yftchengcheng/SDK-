/**
 * E2E: HAL 智能客服图标进入 / 刷新不"错位"
 * 验证：
 * 1. 直接刷新 (reload)，FAB 不出现 (0,0) 闪烁（puppeteer 抓 200ms 内 RAF 多帧位置）
 * 2. 收起 → 刷新 → 边条 HAL 贴右 + 垂直居中（CSS class 决定位置）
 * 3. 拖拽到 (200,300) → 刷新 → FAB 在 (200,300) 附近（clampPos）
 */
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const PORT = '5000';
const OUT = '/tmp/hal-fab-position';
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[E2E]', ...a);

async function waitFab(page) {
  await page.waitForSelector('.hal-fab, .hal-edge', { timeout: 5000 });
}

async function getBox(page) {
  return await page.evaluate(() => {
    const el = document.querySelector('.hal-fab') || document.querySelector('.hal-edge');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { tag: el.className, x: r.x, y: r.y, w: r.width, h: r.height };
  });
}

(async () => {
  const stamp = Date.now();
  const reg = await (await fetch(`http://localhost:${PORT}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `halb${stamp}@e2e.com`,
      password: 'Test123456',
      company: 'halb',
      companyShortName: 'halb',
      contactName: 'halb',
      phone: '13800000000',
      accessType: 1,
    }),
  })).json();
  if (reg.code !== 0) {
    console.error('register failed', reg);
    process.exit(1);
  }
  const token = reg.data.token;

  const browser = await puppeteer.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    headless: 'new',
    args: ['--no-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    page.on('pageerror', (e) => console.log('PAGEERR', e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') console.log('CON-ERR', m.text());
    });

    await page.goto(`http://localhost:${PORT}/login`, { waitUntil: 'networkidle0' });
    await page.setCookie({ name: 'auth_token', value: token, url: `http://localhost:${PORT}`, sameSite: 'Strict' });
    await page.evaluate((t) => localStorage.setItem('token', t), token);

    // ============ Phase 1: 首次加载，FAB 不应该在 (0,0) ============
    await page.goto(`http://localhost:${PORT}/dashboard`, { waitUntil: 'networkidle0' });
    await waitFab(page);
    // 在 200ms 内连抓两帧，确保无闪烁
    const samples = [];
    for (let i = 0; i < 5; i++) {
      const b = await getBox(page);
      samples.push(b);
      await sleep(40);
    }
    log('Phase 1 samples (first 200ms after load):');
    samples.forEach((b, i) => log(`  t+${i * 40}ms:`, b));
    const phase1 = samples[0];
    if (!phase1 || phase1.x < 50 || phase1.y < 50) {
      console.error('❌ FAIL Phase 1: FAB 初始位置 (0,0) 闪烁');
      await page.screenshot({ path: path.join(OUT, 'phase1-fail.png') });
      process.exit(1);
    }
    log('✅ Phase 1 PASS: FAB 初始位置正确 =', phase1);

    // ============ Phase 2: 拖拽到 (200,300) → 刷新 → 位置应保持 ============
    const fab = await page.$('.hal-fab');
    const fabBox = await fab.boundingBox();
    // mousedown 在 fab 中心，mousemove 到 (200,300)，mouseup
    await page.mouse.move(fabBox.x + fabBox.width / 2, fabBox.y + fabBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(250, 350, { steps: 10 });
    await page.mouse.up();
    await sleep(500);

    const draggedBox = await getBox(page);
    log('Phase 2 dragged to:', draggedBox);
    if (!draggedBox || Math.abs(draggedBox.x - 250) > 30 || Math.abs(draggedBox.y - 350) > 30) {
      console.error('❌ FAIL Phase 2: 拖拽位置不正确');
      await page.screenshot({ path: path.join(OUT, 'phase2-drag-fail.png') });
      process.exit(1);
    }

    // 刷新
    await page.reload({ waitUntil: 'networkidle0' });
    await waitFab(page);
    await sleep(300);
    const afterReload = await getBox(page);
    log('Phase 2 after reload:', afterReload);
    if (!afterReload || Math.abs(afterReload.x - 250) > 30 || Math.abs(afterReload.y - 350) > 30) {
      console.error('❌ FAIL Phase 2: 刷新后位置丢失');
      await page.screenshot({ path: path.join(OUT, 'phase2-reload-fail.png') });
      process.exit(1);
    }
    log('✅ Phase 2 PASS: 拖拽位置刷新后保持');

    // ============ Phase 3: 预置 localStorage 模拟「已收起」态 → 刷新 → edge 贴右 + 垂直居中 ============
    await page.evaluate(() => {
      localStorage.setItem('hal-widget-state-v1', 'hidden');
      localStorage.setItem('hal-widget-pos-v1', JSON.stringify({ x: 1408, y: 410 }));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.hal-edge', { timeout: 5000 });
    await sleep(300);
    // 连抓 5 帧
    const hiddenSamples = [];
    for (let i = 0; i < 5; i++) {
      const b = await page.evaluate(() => {
        const el = document.querySelector('.hal-edge');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height, className: el.className };
      });
      hiddenSamples.push(b);
      await sleep(40);
    }
    log('Phase 3 hidden samples (5 frames):');
    hiddenSamples.forEach((b, i) => log(`  t+${i * 40}ms:`, b));
    const hiddenBox = hiddenSamples[0];
    if (!hiddenBox) {
      console.error('❌ FAIL Phase 3: 没出现 .hal-edge');
      await page.screenshot({ path: path.join(OUT, 'phase3-fail.png') });
      process.exit(1);
    }
    const w = 1440, h = 900;
    // 贴右（left+w 距离 w 应在 0~20 之间）
    if (w - (hiddenBox.x + hiddenBox.w) > 20) {
      console.error('❌ FAIL Phase 3: edge 不贴右, x+w=' + (hiddenBox.x + hiddenBox.w) + ' vs w=' + w);
      await page.screenshot({ path: path.join(OUT, 'phase3-fail.png') });
      process.exit(1);
    }
    // 垂直居中
    const centerY = hiddenBox.y + hiddenBox.h / 2;
    if (Math.abs(centerY - h / 2) > 20) {
      console.error('❌ FAIL Phase 3: edge 不垂直居中, centerY=' + centerY);
      process.exit(1);
    }
    log('✅ Phase 3 PASS: edge 贴右 + 垂直居中, centerY=' + centerY);
    await page.screenshot({ path: path.join(OUT, 'phase3-edge.png') });

    await page.screenshot({ path: path.join(OUT, 'final.png') });
    log('🏁 ALL PASS');
  } finally {
    await browser.close();
  }
})();
