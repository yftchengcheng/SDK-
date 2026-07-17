// 截图：瀑布流配置页面 - 验证「已加载」按钮 + 右侧编辑面板回显
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve('public/sdk-screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

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
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  console.log('[1] goto /login');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('input[type="text"]', { timeout: 10000 });
  await page.type('input[type="text"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await page.click('button.el-button--primary');
  await page.waitForSelector('.el-menu', { timeout: 15000 });
  console.log('[2] login ok');

  console.log('[3] goto /waterfall');
  await page.goto(`${BASE}/waterfall`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // 等广告位下拉
  await page.waitForSelector('.wf-placement-selector', { timeout: 10000 });

  // 选择第一个有 config 的广告位
  console.log('[4] select placement');
  const placedClicked = await page.evaluate(() => {
    const sel = document.querySelector('.wf-placement-selector');
    if (!sel) return false;
    const input = sel.querySelector('input');
    if (!input) return false;
    input.focus();
    return true;
  });
  if (!placedClicked) {
    console.log('[!] no placement selector');
  }
  // 用键盘打开
  await page.focus('.wf-placement-selector input');
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 500));
  // 选项列表
  const optLabels = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.el-select-dropdown__item'));
    return items.map(i => i.textContent || '').slice(0, 5);
  });
  console.log('[5] dropdown options:', optLabels);
  // 点第一个非占位的
  for (let i = 0; i < optLabels.length; i++) {
    await page.evaluate((idx) => {
      const items = Array.from(document.querySelectorAll('.el-select-dropdown__item'));
      if (items[idx]) items[idx].click();
    }, i);
    await new Promise(r => setTimeout(r, 800));
    const hasList = await page.evaluate(() => document.querySelectorAll('.el-table__row').length);
    if (hasList > 0) {
      console.log(`[5] selected option ${i}, rows=${hasList}`);
      break;
    }
    // 再次打开
    await page.focus('.wf-placement-selector input');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 500));
  }

  await new Promise(r => setTimeout(r, 1500));

  // 检查行数和按钮状态
  const rowInfo = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.el-table__row'));
    return rows.map((r, i) => {
      const btns = Array.from(r.querySelectorAll('button')).map(b => b.textContent?.trim());
      return { idx: i, btns };
    });
  });
  console.log('[6] row info:', JSON.stringify(rowInfo));

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'waterfall-before-load.png'), fullPage: true });

  // 找「加载」按钮（非已加载），点击
  console.log('[7] click 加载 button');
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.el-table__row button'));
    for (const b of btns) {
      if (b.textContent?.trim() === '加载' && !b.disabled) {
        b.click();
        return true;
      }
    }
    return false;
  });
  console.log('[8] clicked:', clicked);
  await new Promise(r => setTimeout(r, 1500));

  const afterInfo = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.el-table__row'));
    return rows.map((r) => {
      const btns = Array.from(r.querySelectorAll('button')).map(b => b.textContent?.trim());
      const tgSel = document.querySelector('.wf-tg-selector input');
      return { btns, selectedTg: tgSel ? tgSel.value : null };
    });
  });
  console.log('[9] after click:', JSON.stringify(afterInfo));

  // 检查右侧编辑面板的 source 数量
  const layerInfo = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.wf-layer-card, .wf-layer, [class*="layer"]'));
    const countEls = Array.from(document.querySelectorAll('.wf-layer-count'));
    return countEls.map(c => c.textContent?.trim());
  });
  console.log('[10] layer source counts:', layerInfo);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'waterfall-after-load.png'), fullPage: true });

  await browser.close();
  console.log('done');
}

main().catch(e => { console.error(e); process.exit(1); });
