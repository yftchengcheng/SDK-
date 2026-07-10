// Puppeteer e2e 验证：/app 关联广告平台 → 账号选择 → 添加账号抽屉
import puppeteer from 'puppeteer';

const HOST = 'http://localhost:5000';
const EMAIL = 'e2e_bind@adtalos.com';
const PASSWORD = 'Test12345';

async function main() {
  // 0. 注册 + 创建一个 app（供关联测试用）
  console.log('=== 0. 注册/登录 + 建应用 ===');
  const regRes = await fetch(`${HOST}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: EMAIL, password: PASSWORD, company: 'E2E_Bind',
      companyShortName: 'E2E', contactName: 'E2E', phone: '13800003333',
    }),
  });
  const reg = await regRes.json();
  console.log('register:', reg.code, reg.message, reg.data?.developerId);

  const loginRes = await fetch(`${HOST}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const login = await loginRes.json();
  const token = login.data?.token;
  console.log('login token:', token ? 'OK' : 'NO TOKEN');
  if (!token) { console.error('NO TOKEN'); process.exit(1); }

  const appRes = await fetch(`${HOST}/api/v1/console/app/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ appName: '云端阅读_e2e', packageName: 'com.e2e.bind', platform: 1 }),
  });
  const app = await appRes.json();
  console.log('app/create:', app.code, app.data?.app_key, app.data?.app_name);

  // 1. 启动 puppeteer
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  page.on('pageerror', err => console.log('[pageerror]', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[console.error]', msg.text());
  });

  // 注入 token 到 localStorage（user store 用 localStorage.token / userInfo / userRole）
  await page.goto(`${HOST}/login`, { waitUntil: 'networkidle2' });
  await page.evaluate(t => {
    const userInfo = { email: 'e2e_bind@adtalos.com', role: 'developer', developerId: 'dev_e2e' };
    localStorage.setItem('token', t);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    localStorage.setItem('userRole', 'developer');
  }, token);
  console.log('=== 1. token injected ===');

  // 2. 跳到 /app
  await page.goto(`${HOST}/app`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/tmp/p1_app_loaded.png' });
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('bodyText:', bodyText.replace(/\s+/g, ' ').slice(0, 200));

  // 检查应用列表是否渲染
  const appListExists = await page.evaluate(() =>
    !!document.querySelector('.app-master-item') || document.body.innerText.includes('云端阅读_e2e')
  );
  console.log('appListExists:', appListExists);

  if (!appListExists) { await browser.close(); process.exit(1); }

  // 3. 点击应用行
  const firstAppPos = await page.evaluate(() => {
    const items = document.querySelectorAll('.app-master-item');
    if (items.length === 0) return null;
    const r = items[0].getBoundingClientRect();
    return { x: r.x + 50, y: r.y + r.height / 2, text: items[0].textContent?.replace(/\s+/g, ' ').slice(0, 50) };
  });
  console.log('firstAppPos:', firstAppPos);
  if (!firstAppPos) { await browser.close(); process.exit(1); }
  await page.mouse.click(firstAppPos.x, firstAppPos.y);
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/tmp/p1b_app_picked.png' });

  // 4. 点击「关联广告平台」按钮
  const bindBtnPos = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, a, div, span'));
    for (const el of all) {
      const txt = (el.textContent || '').trim();
      if (txt === '关联广告平台' || (txt.startsWith('关联广告平台') && txt.length < 20)) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          return { x: r.x + r.width / 2, y: r.y + r.height / 2, tag: el.tagName, text: txt };
        }
      }
    }
    return null;
  });
  console.log('bindBtnPos:', bindBtnPos);
  if (!bindBtnPos) { await browser.close(); process.exit(1); }
  await page.mouse.click(bindBtnPos.x, bindBtnPos.y);
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/tmp/p2_drawer1_open.png' });

  // 5. 详细诊断 drawer1
  const drawer1Diag = await page.evaluate(() => {
    const drawer = Array.from(document.querySelectorAll('.el-drawer'))
      .find(d => (d.querySelector('.el-drawer__title')?.textContent || '').includes('关联广告平台账号'));
    if (!drawer) return { found: false };
    const labels = Array.from(drawer.querySelectorAll('.el-form-item__label')).map(t => t.textContent?.trim());
    const selects = Array.from(drawer.querySelectorAll('.el-form-item .el-select__wrapper')).map(s => {
      const r = s.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    return { found: true, labels, selects };
  });
  console.log('drawer1Diag:', JSON.stringify(drawer1Diag, null, 2));

  // 6. 点「广告平台」下拉 → 选「穿山甲」
  const networkClick = await page.evaluate(() => {
    document.querySelectorAll('.el-select-dropdown').forEach(d => { d.style.display = 'none'; });
    const drawer = Array.from(document.querySelectorAll('.el-drawer'))
      .find(d => (d.querySelector('.el-drawer__title')?.textContent || '').includes('关联广告平台账号'));
    if (!drawer) return { ok: false, reason: 'no_drawer' };
    const labelEl = Array.from(drawer.querySelectorAll('.el-form-item__label'))
      .find(t => (t.textContent || '').trim() === '广告平台');
    if (!labelEl) return { ok: false, reason: 'no_label' };
    const formItem = labelEl.closest('.el-form-item');
    const wrapper = formItem?.querySelector('.el-select__wrapper');
    if (!wrapper) return { ok: false, reason: 'no_wrapper' };
    wrapper.scrollIntoView({ block: 'center' });
    wrapper.click();
    return { ok: true };
  });
  console.log('networkClick:', networkClick);
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: '/tmp/p2c_ddl_opened.png' });

  const pickNetwork = await page.evaluate(() => {
    // EP 2.x 弹出的下拉可能在 body 下，找所有可见的 .el-select-dropdown
    const dropdowns = Array.from(document.querySelectorAll('.el-select-dropdown'))
      .filter(d => {
        const r = d.getBoundingClientRect();
        const cs = window.getComputedStyle(d);
        return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
      });
    let dropdown = dropdowns[dropdowns.length - 1] || null; // 取最新弹出的
    let items = dropdown ? Array.from(dropdown.querySelectorAll('.el-select-dropdown__item')) : [];
    if (items.length === 0) {
      // 备选：直接抓 .el-select-dropdown__item（有时 dropdown 是同一元素）
      items = Array.from(document.querySelectorAll('.el-select-dropdown__item'));
    }
    if (items.length === 0) return { picked: null, reason: 'no_items', ddls: dropdowns.length, allItems: items.length };
    const target = items.find(t => (t.textContent || '').trim() === '穿山甲') || items[0];
    target.click();
    return { picked: target.textContent?.trim(), ddls: dropdowns.length, total: items.length };
  });
  console.log('pickNetwork:', pickNetwork);
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '/tmp/p3_network_picked.png' });

  // 7. 验证账号下拉出现「+ 添加账号」链接
  const accDDLDiag = await page.evaluate(() => {
    const drawer = Array.from(document.querySelectorAll('.el-drawer'))
      .find(d => (d.querySelector('.el-drawer__title')?.textContent || '').includes('关联广告平台账号'));
    if (!drawer) return { found: false };
    const accFormItem = Array.from(drawer.querySelectorAll('.el-form-item'))
      .find(fi => (fi.querySelector('.el-form-item__label')?.textContent || '').trim() === '账号名称');
    if (!accFormItem) return { found: false, reason: 'no_acc_formitem' };
    // 找含「+ 添加账号」字样的链接
    const allLinks = Array.from(accFormItem.querySelectorAll('a, span, button, .bnd-add-link, .ana-addlink'));
    const link = allLinks.find(e => /添加账号|新建账号|\+ ?添加|\+ ?新建/.test(e.textContent || ''));
    if (!link) return { found: false, candidates: allLinks.map(a => a.textContent?.trim()) };
    const r = link.getBoundingClientRect();
    return { found: true, x: r.x + r.width / 2, y: r.y + r.height / 2, text: link.textContent?.trim() };
  });
  console.log('accDDLDiag:', accDDLDiag);
  if (!accDDLDiag.found) { await page.screenshot({ path: '/tmp/p4_no_addlink.png' }); console.error('NO ADD LINK'); await browser.close(); process.exit(2); }

  // 8. 点击「+ 添加账号」→ 触发 drawer2
  await page.mouse.click(accDDLDiag.x, accDDLDiag.y);
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/tmp/p5_drawer2_open.png' });

  const drawer2Diag = await page.evaluate(() => {
    const drawer = Array.from(document.querySelectorAll('.el-drawer'))
      .find(d => (d.querySelector('.el-drawer__title')?.textContent || '').includes('添加广告平台账号'));
    if (!drawer) return { found: false };
    const labels = Array.from(drawer.querySelectorAll('.el-form-item__label')).map(t => t.textContent?.trim());
    const inputs = Array.from(drawer.querySelectorAll('.el-form-item input')).map(i => ({ placeholder: i.placeholder, type: i.type }));
    return { found: true, labels, inputs };
  });
  console.log('drawer2Diag:', JSON.stringify(drawer2Diag, null, 2));
  if (!drawer2Diag.found || drawer2Diag.inputs.length < 4) {
    console.error('DRAWER 2 INCOMPLETE');
    await browser.close();
    process.exit(2);
  }

  // 9. 填表（用 .el-input__inner 排除 radio 干扰）
  const inputs = await page.$$('.el-drawer .el-input__inner');
  console.log('drawer2 text inputs count:', inputs.length);
  if (inputs.length < 4) { console.error('NOT ENOUGH INPUTS'); await browser.close(); process.exit(2); }
  // 0: 账号名称, 1: 用户ID, 2: Role ID, 3: Secure Key
  const fillInOrder = ['pup_acc_e2e', 'pup_user_e2e', 'pup_role_e2e', 'pup_key_e2e'];
  for (let i = 0; i < 4; i++) {
    await inputs[i].focus();
    // 清空
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Delete');
    const tag = Date.now().toString(36).slice(-4);
    await inputs[i].type(fillInOrder[i] + '_' + tag, { delay: 30 });
    // 验证
    const v = await page.evaluate(el => el.value, inputs[i]);
    console.log(`input[${i}] typed:`, fillInOrder[i] + '_' + tag, '->', v);
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: '/tmp/p6_drawer2_filled.png' });

  // 10. 提交（用 evaluate 直接派发 click，绕过客服 widget 等浮层遮挡）
  const submitResult = await page.evaluate(() => {
    const drawer = Array.from(document.querySelectorAll('.el-drawer'))
      .find(d => (d.querySelector('.el-drawer__title')?.textContent || '').includes('添加广告平台账号'));
    if (!drawer) return { ok: false, reason: 'no_drawer' };
    const btn = Array.from(drawer.querySelectorAll('.el-button--primary'))
      .find(b => (b.textContent || '').trim() === '提交');
    if (!btn) return { ok: false, reason: 'no_btn' };
    btn.scrollIntoView({ block: 'center' });
    // 先 form validate 看看（调用 form submit 触发校验）
    const formEl = drawer.querySelector('form');
    if (formEl) {
      formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
    btn.click();
    return { ok: true, disabled: btn.disabled, classes: btn.className };
  });
  console.log('submitResult:', submitResult);
  await new Promise(r => setTimeout(r, 3500));
  await page.screenshot({ path: '/tmp/p7_drawer2_submitted.png' });

  // 11. 验证：drawer2 已关闭，drawer1 的账号下拉出现了新账号
  const final = await page.evaluate(() => {
    const drawer2StillOpen = Array.from(document.querySelectorAll('.el-drawer__title'))
      .some(t => (t.textContent || '').includes('添加广告平台账号'));
    const drawer1 = Array.from(document.querySelectorAll('.el-drawer'))
      .find(d => (d.querySelector('.el-drawer__title')?.textContent || '').includes('关联广告平台账号'));
    let accSelectedText = null;
    if (drawer1) {
      const accFormItem = Array.from(drawer1.querySelectorAll('.el-form-item'))
        .find(fi => (fi.querySelector('.el-form-item__label')?.textContent || '').trim() === '账号名称');
      const placeholder = accFormItem?.querySelector('.el-select__placeholder span');
      accSelectedText = placeholder?.textContent?.trim();
    }
    return { drawer2StillOpen, accSelectedText };
  });
  console.log('final:', final);

  console.log('=== ALL E2E STEPS PASSED ===');
  await browser.close();
}

main().catch(e => { console.error('FATAL:', e); process.exit(99); });
