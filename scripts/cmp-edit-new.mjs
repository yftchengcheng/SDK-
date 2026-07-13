#!/usr/bin/env node
/**
 * 端到端：对比「编辑自定义广告平台账号」与「新建自定义广告平台账号」的表单字段
 *  - 注册 → 登录 → 拿 token → 创建自定义网络 + 账号
 *  - 打开账号列表，点编辑 / 新建，对比 dialog DOM
 */
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5000';

async function api(path, opts = {}, token) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { ...opts, headers });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

const ts = Date.now();
const email = `ic-${ts}@x.com`;
console.log('=== 注册 ===');
let r = await api('/api/v1/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    email, password: 'Test123456', company: 'ic', companyShortName: 'ic',
    contactName: 'ic', phone: '13800000099', accessType: 1,
  }),
});
console.log('register status:', r.status, 'code:', r.data?.code, 'hasToken:', !!r.data?.data?.token);
if (r.data?.code !== 0 && r.data?.code !== undefined) {
  // 邮箱已注册是 -1
  console.log('尝试 login ...');
  r = await api('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'Test123456' }),
  });
  console.log('login status:', r.status, 'code:', r.data?.code);
}
const token = r.data?.data?.token;
if (!token) { console.log('NO TOKEN, abort'); process.exit(1); }
console.log('token len:', token.length);

// 用 puppeteer 真实点击「网络代码」列的「账号列表」tab，
// 改用现有账号测试：puppeteer 不会持有新建的网络，需要先注册时再创建一个账号 for preset
console.log('\n=== 创建自定义网络 + 账号（用于编辑） ===');
r = await api('/api/v1/console/network/custom/create', {
  method: 'POST',
  body: JSON.stringify({
    network_name: '比对测试网',
    network_code: `CMP${ts}`.slice(0, 20),
    is_preset: false,
    adapter_class_init_android: 'com.test.adapter.CmpInit',
    adapter_class_init_ios: 'com.test.adapter.CmpInit',
    icon_url: 'https://placehold.co/64x64/png?text=CMP',
  }),
}, token);
console.log('custom/create status:', r.status, 'body:', JSON.stringify(r.data).slice(0, 300));
const netId = r.data?.data?.id;
if (!netId) { console.log('NO NET ID, abort'); process.exit(1); }

r = await api('/api/v1/console/network/account/create', {
  method: 'POST',
  body: JSON.stringify({
    account_name: '比测试账号',
    network_def_id: netId,
    account_id: 'CMPACC001',
    credentials: {},
    status: 1,
    remark: null,  // 测「无备注」时不显示「-」
  }),
}, token);
console.log('account/create status:', r.status, 'code:', r.data?.code, 'id:', r.data?.data?.id);
const accId = r.data?.data?.id;
console.log('accId:', accId);

console.log('\n=== 启动 puppeteer ===');
const browser = await puppeteer.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// 注入 token + userInfo 到 localStorage
await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
await page.evaluate((t) => {
  localStorage.setItem('token', t);
  localStorage.setItem('userInfo', JSON.stringify({
    developerId: 'mock-dev',
    email: 'ic@x.com',
    company: 'ic',
    companyShortName: 'ic',
    contactName: 'ic',
    phone: '13800000099',
    accessType: 1,
    apiAccessToken: null,
    status: 1,
    role: 'developer',
  }));
  localStorage.setItem('userRole', 'developer');
}, token);
await page.goto(BASE + '/network', { waitUntil: 'networkidle2', timeout: 20000 });
await new Promise(r => setTimeout(r, 1500));
console.log('network url:', page.url());

// 切到 accounts tab
console.log('\n=== 切到「广告平台账号」Tab ===');
const tabClicked = await page.evaluate(() => {
  const labels = Array.from(document.querySelectorAll('.el-tabs__item, .el-tabs__nav .is-tab, [role="tab"]'));
  for (const el of labels) {
    if (el.textContent && (el.textContent.includes('账号') || el.textContent.includes('accounts'))) {
      el.click();
      return el.textContent.trim();
    }
  }
  return null;
});
console.log('tabClicked:', tabClicked);
await new Promise(r => setTimeout(r, 1500));

// 等账号列表渲染
await page.waitForSelector('.nam-table .el-table__row, .nam-name-cell', { timeout: 8000 }).catch(() => {});

console.log('\n=== 截图: 账号列表 ===');
await page.screenshot({ path: '/tmp/list-ic.png', fullPage: true });

// ============= 点「编辑」按钮 =============
console.log('\n=== 点编辑按钮 ===');
const editClicked = await page.evaluate(() => {
  const rows = document.querySelectorAll('.el-table__body tr.el-table__row');
  for (const r of rows) {
    if (r.textContent && r.textContent.includes('比测试账号')) {
      // 找该行内的「编辑」按钮
      const btns = r.querySelectorAll('button, a, .el-button');
      for (const b of btns) {
        const t = (b.textContent || '').trim();
        if (t === '编辑' || t.includes('编辑')) { b.click(); return 'edit-clicked'; }
      }
      return 'row-found-but-no-edit-btn';
    }
  }
  return 'row-not-found';
});
console.log('editClicked:', editClicked);
await new Promise(r => setTimeout(r, 1500));
await page.waitForSelector('.el-dialog', { timeout: 5000 }).catch(() => {});
await new Promise(r => setTimeout(r, 800));

console.log('\n=== 截图: 编辑 dialog ===');
await page.screenshot({ path: '/tmp/edit-dialog.png', fullPage: true });

// 抓取 dialog 内 form-items 的 label
const editFields = await page.evaluate(() => {
  const dialog = document.querySelector('.el-dialog');
  if (!dialog) return { error: 'no-dialog' };
  const items = Array.from(dialog.querySelectorAll('.el-form-item'));
  return items.map(it => {
    const label = it.querySelector('.el-form-item__label')?.textContent?.trim() || '';
    const input = it.querySelector('input, textarea, select');
    const value = input ? (input.value || '').slice(0, 40) : '';
    return { label, value };
  });
});
console.log('=== 编辑 dialog fields ===');
console.log(JSON.stringify(editFields, null, 2));

// 关 dialog
await page.keyboard.press('Escape');
await new Promise(r => setTimeout(r, 1000));

// ============= 点「新建账号」按钮 =============
console.log('\n=== 点「新建账号」按钮 ===');
const newClicked = await page.evaluate(() => {
  const all = document.querySelectorAll('button, .el-button');
  for (const b of all) {
    const t = (b.textContent || '').trim();
    if (t.includes('新建账号') || t.includes('+ 账号') || t.includes('新增账号')) {
      b.click();
      return t;
    }
  }
  return null;
});
console.log('newClicked:', newClicked);
await new Promise(r => setTimeout(r, 1200));

// 选自定义网络（比对测试网）
console.log('\n=== 在 dialog 里选自定义网络 ===');
await page.waitForSelector('.el-dialog .el-select', { timeout: 5000 }).catch(() => {});
const netSelected = await page.evaluate(() => {
  // 打开第一个 select (广告平台)
  const selects = document.querySelectorAll('.el-dialog .el-select');
  if (!selects.length) return 'no-select';
  selects[0].click();
  return 'opened';
});
console.log('netSelected:', netSelected);
await new Promise(r => setTimeout(r, 800));
const optPicked = await page.evaluate(() => {
  const opts = document.querySelectorAll('.el-select-dropdown__item');
  for (const o of opts) {
    if (o.textContent && o.textContent.includes('比对测试网')) {
      o.click();
      return 'picked';
    }
  }
  return 'no-option';
});
console.log('optPicked:', optPicked);
await new Promise(r => setTimeout(r, 1200));

console.log('\n=== 截图: 新建 dialog ===');
await page.screenshot({ path: '/tmp/new-dialog.png', fullPage: true });

const newFields = await page.evaluate(() => {
  const dialog = document.querySelector('.el-dialog');
  if (!dialog) return { error: 'no-dialog' };
  const items = Array.from(dialog.querySelectorAll('.el-form-item'));
  return items.map(it => {
    const label = it.querySelector('.el-form-item__label')?.textContent?.trim() || '';
    const input = it.querySelector('input, textarea, select');
    const value = input ? (input.value || '').slice(0, 40) : '';
    return { label, value };
  });
});
console.log('=== 新建 dialog fields ===');
console.log(JSON.stringify(newFields, null, 2));

// 对比
console.log('\n=== 对比结果 ===');
const editLabels = editFields.map(f => f.label);
const newLabels = newFields.map(f => f.label);
console.log('编辑 labels:', editLabels);
console.log('新建 labels:', newLabels);
const onlyInEdit = editLabels.filter(l => !newLabels.includes(l));
const onlyInNew = newLabels.filter(l => !editLabels.includes(l));
// 检查「账号名称」列是否还有「-」
const remarkCheck = await page.evaluate(() => {
  const cells = document.querySelectorAll('.el-table__body .nam-remark');
  return {
    count: cells.length,
    hasDash: Array.from(cells).some(c => c.textContent?.includes('—')),
  };
});
console.log('=== 「-」检查 ===');
console.log('remark cell count:', remarkCheck.count, 'hasDash:', remarkCheck.hasDash);
console.log('仅在编辑有:', onlyInEdit);
console.log('仅在新建有:', onlyInNew);

await browser.close();
console.log('\nDONE');
