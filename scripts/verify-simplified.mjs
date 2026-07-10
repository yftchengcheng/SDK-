// 验证简化后的「关联广告平台」流程：
// 弹窗 1：应用 + 广告平台 + 网络特定字段（无账号选择、无添加账号链接）
// 提交：先 account/create 再 app/bind

import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5000';
const BASE_URL = BASE;
const TEST_EMAIL = `e2e_simp_${Date.now()}@adtalos.com`;
const TEST_PASS = 'Test12345';

async function api(method, path, body = null, cookie = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, setCookie };
}

function extractCookie(setCookieHeader) {
  const m = setCookieHeader.match(/auth_token=([^;]+)/);
  return m ? `auth_token=${m[1]}` : null;
}

const log = (...args) => console.log('[verify-simplified]', ...args);

async function main() {
  // 1. 注册拿 token
  log('=== 1. register ===');
  const reg = await api('POST', '/api/v1/auth/register', {
    email: TEST_EMAIL,
    password: TEST_PASS,
    company: 'SimpCo',
    companyShortName: 'SC',
    contactName: 'SC',
    phone: '13800003333',
  });
  if (reg.status !== 200) throw new Error(`register failed: ${reg.status}`);
  const cookie = extractCookie(reg.data?.data ? '' : reg.setCookie) || `auth_token=${reg.data?.data?.token}`;
  log('   registered, cookie len:', cookie?.length);
  const token = cookie.match(/auth_token=([^;]+)/)[1];

  // 2. 创建 app
  log('=== 2. create app ===');
  const appRes = await api('POST', '/api/v1/console/app/create', {
    appName: '云端阅读_simp',
    packageName: `com.simp.${Date.now()}`,
    platform: 1,
  }, cookie);
  if (appRes.status !== 200) throw new Error(`app create failed: ${JSON.stringify(appRes.data)}`);
  const appKey = appRes.data.data.app_key;
  log('   appKey =', appKey);

  // 3. 启动 puppeteer
  log('=== 3. launch puppeteer ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // 注入 token 到 localStorage
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle0' })
  await page.evaluate((tk, dev) => {
    localStorage.setItem('token', tk)
    localStorage.setItem('userInfo', JSON.stringify(dev))
  }, token, { developerId: reg.data.data.developerId, email: reg.data.data.email, company: reg.data.data.company, accessType: 1, role: 'developer' })

  // 4. 访问 /app
  log('=== 4. visit /app ===');
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // 5. 关闭客服 widget 浮层
  await page.evaluate(() => {
    document.querySelectorAll('[class*="kf"], [class*="service"], [class*="widget"]').forEach(el => {
      try { el.style.display = 'none' } catch {}
    });
  });

  // 6. 点击应用行
  log('=== 6. click app row ===');
  const appRowClicked = await page.evaluate((appKey) => {
    const rows = document.querySelectorAll('.app-master-item');
    for (const r of rows) {
      if (r.textContent?.includes(appKey) || r.getAttribute('data-app-key') === appKey) {
        r.click();
        return true;
      }
    }
    return false;
  }, appKey);
  log('   appRowClicked:', appRowClicked);
  await new Promise(r => setTimeout(r, 1500));

  // 7. 找到「关联广告平台」按钮
  log('=== 7. find bind button ===');
  const bindBtnPos = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent?.includes('关联广告平台')) {
        const rect = b.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      }
    }
    return null;
  });
  log('   bindBtn:', bindBtnPos);
  if (!bindBtnPos) throw new Error('bind button not found');

  await page.evaluate((pos) => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent?.includes('关联广告平台')) {
        b.click();
        return;
      }
    }
  }, bindBtnPos);
  await new Promise(r => setTimeout(r, 1500));

  // 8. 验证弹窗 1 显示
  log('=== 8. verify drawer 1 opened ===');
  const drawerLabels1 = await page.evaluate(() => {
    const items = document.querySelectorAll('.bnd-form .el-form-item__label');
    return Array.from(items).map(l => l.textContent?.trim()).filter(Boolean);
  });
  log('   drawer 1 labels (should NOT include 账号):', drawerLabels1);
  const hasAccountField = drawerLabels1.includes('账号');
  log('   has 账号 field (should be false):', hasAccountField);

  await page.screenshot({ path: '/tmp/simp1_drawer_opened.png' });

  // 9. 选「穿山甲」
  log('=== 9. pick 穿山甲 ===');
  // 找到弹窗 1 内的「广告平台」select
  const networkPicked = await page.evaluate(() => {
    // 点击 .bnd-form 内第一个 el-select 的 input
    const selects = document.querySelectorAll('.bnd-form .el-form-item:nth-child(2) .el-select');
    if (selects.length === 0) return { ok: false, reason: 'no_network_select' };
    selects[0].click();
    return { ok: true };
  });
  log('   networkPicked click:', networkPicked);
  await new Promise(r => setTimeout(r, 800));

  // 在 dropdown 里找「穿山甲 (CSJ)」
  const csjClicked = await page.evaluate(() => {
    const items = document.querySelectorAll('.el-select-dropdown__item');
    for (const it of items) {
      const txt = it.textContent?.trim() || '';
      if (txt.startsWith('穿山甲')) {
        it.click();
        return { ok: true, picked: txt };
      }
    }
    return { ok: false, items: Array.from(items).map(i => i.textContent?.trim()).slice(0, 20) };
  });
  log('   csjClicked:', csjClicked);
  if (!csjClicked.ok) throw new Error(`CSJ not found: ${JSON.stringify(csjClicked)}`);
  await new Promise(r => setTimeout(r, 1200));

  // 10. 验证 schema 字段直接显示（不再需要先选账号）
  log('=== 10. verify schema fields show directly ===');
  const drawerLabels2 = await page.evaluate(() => {
    const items = document.querySelectorAll('.bnd-form .el-form-item__label');
    return Array.from(items).map(l => l.textContent?.trim()).filter(Boolean);
  });
  log('   drawer 1 labels (after pick CSJ):', drawerLabels2);
  const hasCSJFields = ['报表API', '自动创建广告源', '用户ID', 'RoleID', 'Secure Key'].every(f => drawerLabels2.includes(f));
  log('   has CSJ 6 fields:', hasCSJFields);

  await page.screenshot({ path: '/tmp/simp2_csj_picked.png' });

  // 11. 填字段
  log('=== 11. fill CSJ fields ===');
  const fillRes = await page.evaluate(() => {
    const inputs = document.querySelectorAll('.bnd-form .el-input__inner');
    // inputs 顺序: 网络下拉 / 用户ID / RoleID / Secure Key / (accountName 不一定有 input)
    const result = {};
    for (let i = 0; i < inputs.length; i++) {
      const label = inputs[i].closest('.el-form-item')?.querySelector('.el-form-item__label')?.textContent?.trim();
      const placeholder = inputs[i].placeholder || '';
      result[`input_${i}_label=${label}_ph=${placeholder}`] = 'present';
    }
    return result;
  });
  log('   inputs:', fillRes);

  // 找到「用户ID」label 后的 input 并 fill
  const userIdFilled = await page.evaluate(() => {
    const items = document.querySelectorAll('.bnd-form .el-form-item');
    for (const it of items) {
      const label = it.querySelector('.el-form-item__label')?.textContent?.trim();
      if (label === '用户ID') {
        const input = it.querySelector('input.el-input__inner');
        if (input) {
          input.focus();
          input.value = 'simp_uid_001';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.blur();
          return true;
        }
      }
    }
    return false;
  });
  log('   userId filled:', userIdFilled);

  // 同样 fill RoleID / Secure Key
  const roleIdFilled = await page.evaluate(() => {
    const items = document.querySelectorAll('.bnd-form .el-form-item');
    for (const it of items) {
      const label = it.querySelector('.el-form-item__label')?.textContent?.trim();
      if (label === 'RoleID') {
        const input = it.querySelector('input.el-input__inner');
        if (input) {
          input.focus();
          input.value = 'simp_role_001';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.blur();
          return true;
        }
      }
    }
    return false;
  });
  log('   roleId filled:', roleIdFilled);

  const secKeyFilled = await page.evaluate(() => {
    const items = document.querySelectorAll('.bnd-form .el-form-item');
    for (const it of items) {
      const label = it.querySelector('.el-form-item__label')?.textContent?.trim();
      if (label === 'Secure Key') {
        const input = it.querySelector('input.el-input__inner');
        if (input) {
          input.focus();
          input.value = 'simp_seckey_001';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.blur();
          return true;
        }
      }
    }
    return false;
  });
  log('   secKey filled:', secKeyFilled);

  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: '/tmp/simp3_filled.png' });

  // 12. 提交
  log('=== 12. submit ===');
  const submitRes = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent?.includes('确认关联')) {
        b.click();
        return { ok: true, disabled: b.disabled, classes: b.className };
      }
    }
    return { ok: false };
  });
  log('   submit:', submitRes);
  await new Promise(r => setTimeout(r, 2500));

  await page.screenshot({ path: '/tmp/simp4_submitted.png' });

  // 13. 验证后端收到 bind 成功
  log('=== 13. verify bind via /app/list ===');
  await new Promise(r => setTimeout(r, 2000)); // 等 PostgREST cache
  const listRes = await api('GET', `/api/v1/console/network/app/list?appKey=${appKey}`, null, cookie);
  log('   bind list:', listRes.status, JSON.stringify(listRes.data?.data || []).slice(0, 300));

  // 14. 验证账号已自动创建
  log('=== 14. verify auto-created default account ===');
  const acctRes = await api('GET', '/api/v1/console/network/account/list?networkDefId=1&pageSize=5', null, cookie);
  const acctList = acctRes.data?.data?.list || [];
  const simpAcct = acctList.find(a => a.account_name === '默认账号' || a.account_id?.includes('simp'));
  log('   found simp account:', simpAcct ? { id: simpAcct.id, name: simpAcct.account_name, cred_keys: Object.keys(simpAcct.credentials || {}) } : 'NONE');

  // 总结
  const allOk = !hasAccountField && hasCSJFields && userIdFilled && roleIdFilled && secKeyFilled && submitRes.ok;
  log('=== ALL OK:', allOk, '===');
  log('Summary:');
  log('  - 账号字段已删除:', !hasAccountField);
  log('  - CSJ 6 字段直接显示:', hasCSJFields);
  log('  - 字段可填:', userIdFilled && roleIdFilled && secKeyFilled);
  log('  - 提交按钮:', submitRes.ok);
  log('  - bind list:', listRes.data?.data?.length || 0, 'rows');
  log('  - 默认账号已建:', !!simpAcct);

  await browser.close();

  if (!allOk) {
    process.exit(1);
  }
}

main().catch(e => {
  console.error('FAIL:', e);
  process.exit(1);
});
