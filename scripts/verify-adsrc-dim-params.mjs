// 端到端验证「广告源维度参数」配置项是否完整渲染
import { writeFileSync, mkdirSync } from 'fs';
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5000';
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const SHOTS = '/tmp/adsrc-dim-params-shots';
mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[adsrc-dim]', ...a);

const register = async () => {
  const email = `dim${Date.now()}@e2e.com`;
  const r = await fetch(BASE + '/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email, password: 'Test123456', company: 'e2e', companyShortName: 'e2e',
      contactName: 'e2e', phone: '13800000000', accessType: 1,
    }),
  });
  const j = await r.json();
  return { token: j.data.token, developerId: j.data.developerId, email };
};

const api = async (method, path, { token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json() };
};

const main = async () => {
  const { token } = await register();

  const a1 = await api('POST', '/api/v1/console/app/create', {
    token, body: { appName: 'DimApp', packageName: `com.dim.${Date.now()}`, platform: 1 },
  });
  log('app create resp:', JSON.stringify(a1).slice(0, 200));
  const appKey = a1.body.data.app_key;
  log('app=' + a1.body.data.id, 'appKey=' + appKey);
  const p1 = await api('POST', '/api/v1/console/placement/create', {
    token, body: { appKey, name: 'Banner', format: 1 },
  });
  log('placement create resp:', JSON.stringify(p1).slice(0, 400));
  const pid = p1.body.data.id;
  log('placement=' + pid);

  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 设置 token cookie + 跳过登录页
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate((tk) => {
    localStorage.setItem('token', tk);
    const info = { token: tk };
    localStorage.setItem('userInfo', JSON.stringify(info));
  }, token);
  await page.goto(BASE + '/ad-source', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  log('current url:', page.url());
  log('page title:', await page.title());
  await page.screenshot({ path: SHOTS + '/01-list.png', fullPage: true });
  // 看 body 文本前 300
  const bodyText = await page.evaluate(() => (document.body?.innerText || '').slice(0, 300));
  log('body text:', bodyText);

  // 先选应用 - 找第一个 el-select（应用选择器）
  const appSelected = await page.evaluate((appKey) => {
    const selects = Array.from(document.querySelectorAll('.el-select'));
    if (!selects.length) return { ok: false, reason: 'no select' };
    // 第一个 select 是「应用」
    const appSelect = selects[0];
    appSelect.click();
    return { ok: true, count: selects.length, first: appSelect.textContent.trim() };
  });
  log('app select clicked:', JSON.stringify(appSelected));
  await sleep(400);
  // 等 dropdown 出现，选中含 appKey 的 option
  const appPicked = await page.evaluate((appKey) => {
    const items = Array.from(document.querySelectorAll('.el-select-dropdown__item'));
    const target = items.find((it) => (it.textContent || '').includes(appKey) || (it.getAttribute('label') || '').includes(appKey));
    if (target) { target.click(); return target.textContent.trim(); }
    return items.map((it) => it.textContent.trim()).slice(0, 5);
  }, appKey);
  log('app picked:', JSON.stringify(appPicked));
  await sleep(800);

  // 选 placement
  const plPicked = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('.el-select'));
    if (selects.length < 2) return { ok: false, count: selects.length };
    selects[1].click();
    return { ok: true };
  });
  await sleep(400);
  const plChosen = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.el-select-dropdown__item'));
    if (items.length) { items[0].click(); return items[0].textContent.trim(); }
    return null;
  });
  log('pl chosen:', JSON.stringify(plChosen));
  await sleep(800);

  // 点「添加广告源」
  const clickedBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => /添加广告源|新建广告源|\+ 添加/.test(x.textContent || ''));
    if (b) { b.click(); return b.textContent.trim(); }
    return null;
  });
  log('clicked button:', clickedBtn);
  if (!clickedBtn) throw new Error('未找到「添加广告源」按钮');
  await sleep(900);
  await page.screenshot({ path: SHOTS + '/02-drawer-opened.png', fullPage: true });

  // 在 drawer 里查找「广告源维度参数」section
  const sectionInfo = await page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll('.page-form-section-title, .el-form-item__label, h3, h4'));
    const dimTitle = titles.find((t) => (t.textContent || '').includes('广告源维度参数'));
    if (!dimTitle) return { found: false, all: titles.map((t) => t.textContent.trim()).slice(0, 20) };
    const sec = dimTitle.closest('.page-form-section') || dimTitle.closest('section') || dimTitle.parentElement?.parentElement;
    if (!sec) return { found: true, section: null };
    const inputs = sec.querySelectorAll('input');
    const buttons = Array.from(sec.querySelectorAll('button')).map((b) => (b.textContent || '').trim());
    const allText = sec.textContent || '';
    // 抓所有 el-form-item
    const formItems = Array.from(sec.querySelectorAll('.el-form-item')).map((fi) => ({
      labelText: (fi.querySelector('.el-form-item__label')?.textContent || '').trim(),
      childText: (fi.textContent || '').slice(0, 200),
      childHtml: fi.innerHTML.slice(0, 600),
    }));
    return {
      found: true,
      html: sec.outerHTML.substring(0, 1500),
      inputCount: inputs.length,
      inputPlaceholders: Array.from(inputs).map((i) => i.placeholder || ''),
      buttonLabels: buttons,
      hasAddBtn: buttons.some((b) => b.includes('添加参数')),
      hasEmptyState: allText.includes('暂无参数'),
      allText: allText.substring(0, 500),
      formItems,
    };
  });
  log('section info:', JSON.stringify(sectionInfo, null, 2));

  // 点「添加参数」按钮
  if (sectionInfo.hasAddBtn) {
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((x) => (x.textContent || '').includes('添加参数'));
      if (b) { b.click(); return true; }
      return false;
    });
    log('点击「添加参数」:', clicked);
    await sleep(400);
    await page.screenshot({ path: SHOTS + '/03-after-add.png', fullPage: true });

    // 再添加 1 个，凑 2 行
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((x) => (x.textContent || '').includes('添加参数'));
      if (b) b.click();
    });
    await sleep(300);
    await page.screenshot({ path: SHOTS + '/04-two-rows.png', fullPage: true });

    // 在第一个 row 输入 key/value
    const filled = await page.evaluate(() => {
      const sec = Array.from(document.querySelectorAll('.page-form-section'))
        .find((s) => (s.textContent || '').includes('广告源维度参数'));
      if (!sec) return { filled: 0 };
      const rows = sec.querySelectorAll('.adsrc-kv-row');
      const results = [];
      rows.forEach((row, idx) => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 2) {
          // 触发 v-model
          const setVal = (input, val) => {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeSetter.call(input, val);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          };
          setVal(inputs[0], `slot_id_${idx}`);
          setVal(inputs[1], `placement_${idx}_${Date.now()}`);
          results.push({ idx, key: inputs[0].value, value: inputs[1].value });
        }
      });
      return { filled: rows.length, rows: results };
    });
    log('填充结果:', JSON.stringify(filled, null, 2));
    await sleep(300);
    await page.screenshot({ path: SHOTS + '/05-after-fill.png', fullPage: true });

    // 数 row 数
    const rowInfo = await page.evaluate(() => {
      const sec = Array.from(document.querySelectorAll('.page-form-section'))
        .find((s) => (s.textContent || '').includes('广告源维度参数'));
      if (!sec) return { rowCount: 0 };
      const rows = sec.querySelectorAll('.adsrc-kv-row');
      return { rowCount: rows.length };
    });
    log('行数:', rowInfo.rowCount);
  }

  // 检查「流量分组」section
  const tgInfo = await page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll('.page-form-section-title'));
    const tgTitle = titles.find((t) => (t.textContent || '').includes('流量分组'));
    if (!tgTitle) return { found: false };
    const sec = tgTitle.closest('.page-form-section') || tgTitle.parentElement?.parentElement;
    return {
      found: true,
      text: (sec?.textContent || '').substring(0, 300),
    };
  });
  log('流量分组 section:', JSON.stringify(tgInfo, null, 2));

  await browser.close();
  log('DONE - 截图在 ' + SHOTS);
};

main().catch((e) => { console.error('FAIL:', e); process.exit(1); });
