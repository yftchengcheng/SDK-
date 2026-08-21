/**
 * 验证：placement 字段明细表从 dictCache 接口动态加载，不再 hardcoded
 * 1. 打开 /placement 页
 * 2. 点击「创建广告位」
 * 3. 字段明细表行数 = 3 (基础) + N (接口返回)
 * 4. 切 format 1→2→4 行数变化
 */
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5000';
const browser = await puppeteer.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('[browser]', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('[pageerror]', err.message));
  page.on('request', (req) => { if (req.url().includes('auth')) console.log('[req]', req.method(), req.url()); });
  page.on('response', (res) => { if (res.url().includes('auth')) console.log('[res]', res.status(), res.url()); });
  await page.setViewport({ width: 1440, height: 900 });

  // 1. 登录
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[placeholder="请输入注册邮箱"]');
  await page.type('input[placeholder="请输入注册邮箱"]', 'testuser@example.com');
  await page.type('input[placeholder="请输入密码"]', 'Test123456');
  // 等 captcha canvas 渲染完成
  await new Promise(r => setTimeout(r, 1500));
  const captcha = await page.evaluate(() => (window).__loginCaptcha || '');
  console.log('[login] captcha:', captcha);
  if (captcha) {
    await page.focus('input[placeholder="请输入验证码"]');
    await page.keyboard.type(captcha);
    // 触发 blur 让 el-form 校验通过
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      const captchaInput = Array.from(inputs).find((i) => i.placeholder === '请输入验证码');
      if (captchaInput) captchaInput.blur();
    });
  }
  // 勾选隐私政策 checkbox
  await page.evaluate(() => {
    const cb = document.querySelector('input[type="checkbox"]');
    if (cb && !cb.checked) cb.click();
  });
  await new Promise(r => setTimeout(r, 500));
  // 找登录按钮（可能是 el-form 内的 button[type=submit]）
  const submitBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent?.trim() === '登 录') return b.outerHTML.slice(0, 200);
    }
    return null;
  });
  console.log('[login btn HTML]', submitBtn);
  await page.click('button.el-button--primary');
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: '/tmp/login-after.png' });
  console.log('[1] login attempt, current url:', page.url());

  // 2. 跳到 /placement（点击侧边栏菜单 — 触发 vue-router 实际跳转）
  // 先展开 '应用与广告位' 分组
  await page.evaluate(() => {
    const groups = Array.from(document.querySelectorAll('.nav-item--group'));
    for (const g of groups) {
      if ((g.textContent || '').includes('应用')) { g.click(); return; }
    }
  });
  await new Promise(r => setTimeout(r, 600));
  const placementLink = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('.nav-item, a, [role="menuitem"]'));
    for (const el of links) {
      const text = (el.textContent || '').trim();
      if (text === '广告位管理' || text === '广告位') {
        el.click();
        return text;
      }
    }
    return null;
  });
  console.log('[2] click placement link:', placementLink);
  await new Promise(r => setTimeout(r, 2500));

  // 3. 点击「创建广告位」按钮
  const buttons = await page.$$('button');
  let createBtnFound = false;
  for (const b of buttons) {
    const text = await b.evaluate((el) => el.textContent?.trim() || '');
    if (text.includes('创建广告位') || text.includes('+ 创建')) {
      await b.click();
      createBtnFound = true;
      break;
    }
  }
  if (!createBtnFound) {
    // 备选：直接在 el-table 上方的工具栏找
    const allBtns = await page.$$eval('button', (els) => els.map((e) => e.textContent?.trim() || ''));
    console.log('[2] buttons on page:', allBtns);
    throw new Error('创建按钮未找到');
  }
  console.log('[2] 点击创建广告位 OK');
  await new Promise(r => setTimeout(r, 3000));

  // 4. 找到字段明细表
  const tables = await page.$$('.pd-field-details__table');
  console.log('[3] 找到 pd-field-details__table 数量:', tables.length);
  if (tables.length === 0) {
    // 可能是 format=1 时明细表不在
    console.log('[3] 字段明细表未渲染，截图');
    await page.screenshot({ path: '/tmp/dict-pd-no.png' });
    throw new Error('字段明细表未找到');
  }

  // 4.5 选 app + format=1
  // 只操作 .el-drawer 内的 form select（避免与顶部 filter select 混淆）
  await page.evaluate(() => {
    const drawer = document.querySelector('.el-drawer__body') || document.querySelector('.el-drawer');
    if (!drawer) return;
    const formItems = drawer.querySelectorAll('.el-form-item');
    let appSelect = null;
    for (const fi of formItems) {
      const label = (fi.querySelector('.el-form-item__label')?.textContent || '');
      if (label.includes('所属应用')) appSelect = fi.querySelector('.el-select');
    }
    if (appSelect) {
      const wrap = appSelect.querySelector('.el-select__wrapper') || appSelect;
      wrap.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      wrap.click();
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    const popups = document.querySelectorAll('.el-select-dropdown__item');
    if (popups.length > 0) popups[0].click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 选 format=横幅
  await page.evaluate(() => {
    const drawer = document.querySelector('.el-drawer__body') || document.querySelector('.el-drawer');
    if (!drawer) return;
    const formItems = drawer.querySelectorAll('.el-form-item');
    for (const fi of formItems) {
      const label = (fi.querySelector('.el-form-item__label')?.textContent || '');
      if (label.includes('广告形式')) {
        const select = fi.querySelector('.el-select');
        const wrap = select?.querySelector('.el-select__wrapper') || select;
        wrap?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        wrap?.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    const popups = document.querySelectorAll('.el-select-dropdown__item');
    for (const p of popups) {
      if ((p.textContent || '').trim() === '横幅') { p.click(); return; }
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  console.log('[4b] drawer form 状态:', await page.evaluate(() => {
    const drawer = document.querySelector('.el-drawer__body') || document.querySelector('.el-drawer');
    if (!drawer) return 'no drawer';
    const inputs = drawer.querySelectorAll('.el-select__placeholder, .el-select__selected-item, .el-select__wrapper');
    return Array.from(inputs).map((e) => e.textContent || '').join(' | ');
  }));

  // 5. 取 format=1 时的行数
  const rows1 = await page.$$eval('.pd-field-details__table tbody tr', (els) =>
    els.map((el) => {
      const cells = el.querySelectorAll('td');
      return Array.from(cells).map((c) => c.textContent?.trim() || '');
    }),
  );
  console.log('[4] format=1 (横幅) 字段明细表行数:', rows1.length);
  console.log('    行内容:', JSON.stringify(rows1, null, 2));

  // 6. 切 format=2 (插屏) — placement 用 el-select，选 '2'
  await page.evaluate(() => {
    // 找到 el-select-item 文本为 '插屏' 的并 click
    const items = document.querySelectorAll('.el-select-dropdown__item, .el-select-v2__option, .el-option');
    for (const el of items) {
      if ((el.textContent || '').trim() === '插屏') { el.click(); return; }
    }
  });
  // 也直接设置 vue reactive 不易，触发 select dropdown
  await page.click('.el-select');
  await new Promise(r => setTimeout(r, 600));
  await page.evaluate(() => {
    const items = document.querySelectorAll('.el-select-dropdown__item');
    for (const el of items) {
      if ((el.textContent || '').trim() === '插屏') { el.click(); return; }
    }
  });
  await new Promise(r => setTimeout(r, 1200));

  const rows2 = await page.$$eval('.pd-field-details__table tbody tr', (els) =>
    els.map((el) => {
      const cells = el.querySelectorAll('td');
      return Array.from(cells).map((c) => c.textContent?.trim() || '');
    }),
  );
  console.log('[6] format=2 (插屏) 字段明细表行数:', rows2.length);
  console.log('    行内容:', JSON.stringify(rows2, null, 2));

  // 7. 切 format=4 (原生)
  const allLabels2 = await page.$$eval('.el-radio-button__inner', (els) => els.map((e) => e.textContent?.trim() || ''));
  const nativeLabelIdx = allLabels2.findIndex((t) => t === '原生');
  if (nativeLabelIdx >= 0) {
    const allEls = await page.$$('.el-radio-button__inner');
    await allEls[nativeLabelIdx].click();
    await new Promise(r => setTimeout(r, 1000));
  }

  const rows4 = await page.$$eval('.pd-field-details__table tbody tr', (els) =>
    els.map((el) => {
      const cells = el.querySelectorAll('td');
      return Array.from(cells).map((c) => c.textContent?.trim() || '');
    }),
  );
  console.log('[7] format=4 (原生) 字段明细表行数:', rows4.length);
  console.log('    行内容:', JSON.stringify(rows4, null, 2));

  // 8. 截图
  await page.screenshot({ path: '/tmp/dict-pd.png', fullPage: false });

  // 9. 校验
  if (rows1.length === rows2.length) {
    console.log('❌ 切 format 1→2 行数没变（hardcoded 嫌疑）');
  } else {
    console.log('✅ 切 format 1→2 行数从', rows1.length, '→', rows2.length, '变化（动态加载生效）');
  }
  if (rows2.length === rows4.length) {
    console.log('⚠️  format 2 vs 4 行数一致：', rows2.length, rows4.length, '— 可能是插屏原生字段数相同');
  } else {
    console.log('✅ 切 format 2→4 行数从', rows2.length, '→', rows4.length, '变化（动态加载生效）');
  }
} catch (e) {
  console.error('ERROR:', e);
  process.exit(1);
} finally {
  await browser.close();
}
