#!/usr/bin/env node
/**
 * verify-app-icon-layout.mjs
 * 验证创建应用弹窗 - App Icon 区域布局：
 *  - 上下两排（uploader + hint）独立分组
 *  - hint 行有「要求」label + 3 个 chip
 *  - 上传按钮和 hint 行不在同一水平线
 */
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5000';
const tokRes = await fetch(`${BASE}/api/v1/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: `icon-layout-${Date.now()}@demo.com`,
    password: 'Test123456',
    company: 'c',
    companyShortName: 'c',
    contactName: 'c',
    phone: '13800000000',
    accessType: 1,
  }),
});
const reg = await tokRes.json();
const tok = reg.data.token;
const dev = reg.data.developerId;
const auth = `Bearer ${tok}`;

// 写一个轻量 HTML 截图对比
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });

// 先注入 token
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(t => {
  localStorage.setItem('token', t);
  localStorage.setItem('auth_token', t);
  const devInfo = {
    developerId: 'dev_xxx',
    email: 'test@x.com',
    role: 'developer',
    displayName: 'tester',
    company: 'c',
  };
  localStorage.setItem('developerInfo', JSON.stringify(devInfo));
}, tok);

// 打开应用管理 → 点击「创建应用」
await page.goto(`${BASE}/app`, { waitUntil: 'networkidle0' });
await page.waitForSelector('.app-master-card, [class*="master"]', { timeout: 5000 });
console.log('[icon-layout] page loaded');

// 找「创建应用」按钮
const createBtns = await page.$$eval('button', els =>
  els.filter(b => /创建应用|新建应用|添加应用/.test(b.textContent || '')).map(b => b.textContent.trim()),
);
console.log('[icon-layout] create btns found:', createBtns);
if (createBtns.length === 0) {
  console.log('[icon-layout] FAIL: no create button');
  await browser.close();
  process.exit(1);
}
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => /创建应用|新建应用|添加应用/.test(b.textContent || ''));
  btn && btn.click();
});
await new Promise(r => setTimeout(r, 1500));

// 找 App Icon 区域
const layout = await page.evaluate(() => {
  const item = [...document.querySelectorAll('.el-form-item')].find(i => /App Icon/i.test(i.textContent || ''));
  if (!item) return { found: false };
  const uploader = item.querySelector('.ad-icon-uploader');
  const hint = item.querySelector('.ad-icon-hint');
  const box = item.querySelector('.ad-icon-box');
  const uploadBtn = item.querySelector('.ad-icon-actions .el-button');
  const label = item.querySelector('.ad-icon-hint-label');
  const chips = [...item.querySelectorAll('.ad-icon-chip')].map(c => c.textContent.trim());

  if (!uploader || !hint) return { found: false, html: item.outerHTML.slice(0, 500) };

  const uRect = uploader.getBoundingClientRect();
  const hRect = hint.getBoundingClientRect();
  const bRect = box.getBoundingClientRect();
  const btnRect = uploadBtn ? uploadBtn.getBoundingClientRect() : null;

  return {
    found: true,
    uploaderY: uRect.top,
    uploaderH: uRect.height,
    hintY: hRect.top,
    hintH: hRect.height,
    boxCx: bRect.left + bRect.width / 2,
    btnCx: btnRect ? btnRect.left + btnRect.width / 2 : null,
    hintCx: hRect.left + hRect.width / 2,
    labelText: label ? label.textContent.trim() : null,
    chips,
    vSpaceBetweenRows: hRect.top - (uRect.top + uRect.height), // 应该是 > 0（hint 在 uploader 下方）
    sameLine: Math.abs(hRect.top - uRect.top) < 5, // 应该 false
  };
});
console.log('[icon-layout] layout:', JSON.stringify(layout, null, 2));

// 截图
await page.screenshot({ path: '/tmp/app-icon-layout.png', fullPage: false });
console.log('[icon-layout] screenshot saved: /tmp/app-icon-layout.png');

const passed = layout.found
  && layout.sameLine === false
  && layout.vSpaceBetweenRows > 5
  && layout.labelText === '要求'
  && layout.chips.length === 3
  && layout.chips.some(c => /PNG/.test(c))
  && layout.chips.some(c => /512/.test(c))
  && layout.chips.some(c => /MB/.test(c));

await browser.close();
console.log('[icon-layout] === result:', passed ? 'PASS' : 'FAIL', '===');
process.exit(passed ? 0 : 1);
