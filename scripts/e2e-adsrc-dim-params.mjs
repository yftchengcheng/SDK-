// 完整端到端：建 custom 网络 + 创建带 KV + 流量分组的 ad-source + 列表回显 + 编辑回显
import { writeFileSync, mkdirSync } from 'fs';
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5000';
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const SHOTS = '/tmp/adsrc-dim-params-shots';
mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[adsrc-e2e]', ...a);

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

  // 1. custom 网络
  const net = await api(tk, 'POST', '/api/v1/console/network/custom/create', {
    networkCode: `E2E_${Date.now()}`,
    networkName: 'E2E Test Network',
    adapterClassInitAndroid: 'com.e2e.Init',
    adapterClassInitIos: 'com.e2e.Init',
  });
  log('custom network:', net.data?.id);
  const nid = net.data.id;

  // 2. app + placement
  const a = await api(tk, 'POST', '/api/v1/console/app/create', {
    appName: 'E2E', packageName: `com.e2e.${Date.now()}`, platform: 1,
  });
  const appKey = a.data.app_key;
  const p = await api(tk, 'POST', '/api/v1/console/placement/create', { appKey, name: 'Ban', format: 1 });
  const pid = p.data.id;
  log('appKey=' + appKey, 'placementId=' + pid);

  // 3. 流量分组
  const tg = await api(tk, 'POST', '/api/v1/console/traffic-group/create', {
    placementId: pid, groupName: `E2E-Group-${Date.now()}`, conditions: { region: 'CN' }, status: 1, description: 'e2e group',
  });
  log('traffic group:', tg.data?.id);
  const tgId = tg.data.id;

  // 4. 启动浏览器
  const browser = await puppeteer.launch({
    headless: 'new', executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  page.on('console', (msg) => log('PAGE>', msg.text()));
  // 抓 onTrafficGroupChange 内部 vals
  await page.exposeFunction('__tgValReport', (vals) => log('TG VALS:', JSON.stringify(vals)));
  await page.evaluateOnNewDocument(() => {
    window.__tgValReport = window.__tgValReport || (() => {});
  });
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tk) => { localStorage.setItem('token', tk); }, tk);
  await page.goto(BASE + '/ad-source?networkId=' + nid + '&networkName=E2E+Test', { waitUntil: 'networkidle2' });
  await sleep(2000);

  // 5. 选 app + placement
  await page.evaluate(() => document.querySelectorAll('.el-select')[0]?.click());
  await sleep(400);
  await page.evaluate(() => document.querySelector('.el-select-dropdown__item')?.click());
  await sleep(700);
  await page.evaluate(() => document.querySelectorAll('.el-select')[1]?.click());
  await sleep(400);
  await page.evaluate(() => document.querySelector('.el-select-dropdown__item')?.click());
  await sleep(700);

  // 6. 点添加广告源
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /添加广告源/.test(x.textContent || ''));
    b?.click();
  });
  await sleep(1500);
  await page.screenshot({ path: SHOTS + '/10-drawer.png', fullPage: true });

  // 7. 填基本字段
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('.el-drawer__body input'));
    // 第一个 input 是「广告源名称」
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (inputs[0]) {
      nativeSetter.call(inputs[0], 'E2E-KV-Source');
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    }
    // 三方 App ID
    const appIdInput = Array.from(document.querySelectorAll('.el-drawer__body .el-form-item'))
      .find((fi) => /三方 App ID/.test(fi.textContent || ''))?.querySelector('input');
    if (appIdInput) {
      nativeSetter.call(appIdInput, 'e2e_app_123');
      appIdInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    // 三方代码位
    const plIdInput = Array.from(document.querySelectorAll('.el-drawer__body .el-form-item'))
      .find((fi) => /三方代码位/.test(fi.textContent || ''))?.querySelector('input');
    if (plIdInput) {
      nativeSetter.call(plIdInput, 'e2e_pl_456');
      plIdInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await sleep(400);

  // 8. 维度参数：点 2 次「添加参数」+ 填值
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((x) => /添加参数/.test(x.textContent || ''));
    btn?.click();
  });
  await sleep(200);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((x) => /添加参数/.test(x.textContent || ''));
    btn?.click();
  });
  await sleep(300);
  await page.evaluate(() => {
    const sec = Array.from(document.querySelectorAll('.page-form-section')).find((s) => /广告源维度参数/.test(s.textContent || ''));
    if (!sec) return;
    const rows = sec.querySelectorAll('.adsrc-kv-row');
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const setVal = (input, val) => { nativeSetter.call(input, val); input.dispatchEvent(new Event('input', { bubbles: true })); };
    if (rows[0]) {
      const ins = rows[0].querySelectorAll('input');
      setVal(ins[0], 'slot_id');
      setVal(ins[1], '8880001');
    }
    if (rows[1]) {
      const ins = rows[1].querySelectorAll('input');
      setVal(ins[0], 'ad_type');
      setVal(ins[1], 'splash');
    }
  });
  await sleep(400);
  await page.screenshot({ path: SHOTS + '/11-kv-filled.png', fullPage: true });

  // 9. 流量分组：打开 select + 选 1 个
  const tgSec = await page.evaluate(() => {
    const sec = Array.from(document.querySelectorAll('.page-form-section')).find((s) => /流量分组配置/.test(s.textContent || ''));
    if (!sec) return { ok: false };
    const sel = sec.querySelector('.el-select');
    if (!sel) return { ok: false };
    sel.click();
    return { ok: true };
  });
  log('tg select open:', tgSec);
  await sleep(700);
  // 看 dropdown items
  const dropdownInfo = await page.evaluate(() => {
    const dropdowns = document.querySelectorAll('.el-select-dropdown__item');
    return Array.from(dropdowns).map((it) => it.textContent.trim());
  });
  log('dropdown items:', dropdownInfo);
  // 强制 dispatch hover 事件（EP 需要 hover 才显示 clickable），然后 click
  const picked = await page.evaluate(() => {
    const items = document.querySelectorAll('.el-select-dropdown__item');
    const target = Array.from(items).find((it) => /E2E-Group/.test(it.textContent || ''));
    if (!target) return null;
    // 模拟 EP 期望的事件
    ['mouseenter', 'mousedown', 'mouseup', 'click'].forEach((ev) => {
      target.dispatchEvent(new MouseEvent(ev, { bubbles: true, cancelable: true, view: window, button: 0 }));
    });
    return target.textContent.trim();
  });
  log('picked:', picked);
  await sleep(900);
  await page.screenshot({ path: SHOTS + '/12-tg-selected.png', fullPage: true });

  // 10. 找开关 + 改 binding（不开 default binding 的 status，但把价格/限频设上）
  await page.evaluate(() => {
    const sec = Array.from(document.querySelectorAll('.page-form-section')).find((s) => /流量分组配置/.test(s.textContent || ''));
    if (!sec) return;
    // 找所有 .adsrc-tg-item，把第一个的价格设上
    const items = sec.querySelectorAll('.adsrc-tg-item');
    if (items.length) {
      // 价格 input-number 第二个 row
      const rows = items[0].querySelectorAll('.adsrc-tg-row');
      const priceInput = rows[1]?.querySelector('input');
      if (priceInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(priceInput, '1.5');
        priceInput.dispatchEvent(new Event('input', { bubbles: true }));
        priceInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await sleep(400);
  await page.screenshot({ path: SHOTS + '/13-final-form.png', fullPage: true });

  // 11. 提交
  const submitted = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.el-drawer__body button'));
    const sub = btns.find((b) => /^创\s*建/.test(b.textContent || ''));
    if (sub) { sub.click(); return true; }
    return false;
  });
  log('submitted:', submitted);
  await sleep(1500);
  await page.screenshot({ path: SHOTS + '/14-after-submit.png', fullPage: true });

  // 12. 看 list 是否出现新行
  const list = await api(tk, 'GET', '/api/v1/console/ad-source/list?page=1&pageSize=20');
  log('list count:', list.data?.list?.length, 'total:', list.data?.total);
  const me = (list.data?.list || []).find(r => r.source_name === 'E2E-KV-Source');
  log('matched row:', me ? { id: me.id, network_code: me.network_code, network_def_id: me.network_def_id, store_dim_params: me.store_dim_params, traffic_group_bindings: me.traffic_group_bindings } : null);

  if (me) {
    // 13. 编辑回显测试
    await page.evaluate((id) => {
      // 找到操作列的「编辑」按钮
      const rows = Array.from(document.querySelectorAll('tr'));
      for (const r of rows) {
        if (r.textContent && r.textContent.includes('E2E-KV-Source')) {
          const editBtn = Array.from(r.querySelectorAll('button')).find((b) => /编辑/.test(b.textContent || ''));
          editBtn?.click();
          return;
        }
      }
    }, me.id);
    await sleep(1500);
    await page.screenshot({ path: SHOTS + '/15-edit-restore.png', fullPage: true });

    const edit = await page.evaluate(() => {
      const sec = Array.from(document.querySelectorAll('.page-form-section')).find((s) => /广告源维度参数/.test(s.textContent || ''));
      const tgSec = Array.from(document.querySelectorAll('.page-form-section')).find((s) => /流量分组配置/.test(s.textContent || ''));
      const kvRows = sec ? sec.querySelectorAll('.adsrc-kv-row').length : 0;
      const tgItems = tgSec ? tgSec.querySelectorAll('.adsrc-tg-card').length : 0;
      const tgPicked = tgSec ? (tgSec.querySelector('.adsrc-tg-picker-select .el-select__placeholder')?.textContent || '') : '';
      const kvContent = sec ? Array.from(sec.querySelectorAll('.adsrc-kv-row')).map(r => Array.from(r.querySelectorAll('input')).map(i => i.value)) : [];
      return { kvRows, tgItems, tgPicked, kvContent };
    });
    log('edit restore:', edit);
  }

  await browser.close();
  log('DONE');
};

main().catch((e) => { console.error('FAIL:', e); process.exit(1); });
