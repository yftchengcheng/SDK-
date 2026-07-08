/**
 * 验证 dashboard 日期联动：切 7/14/30天 tab + 改 dateRange picker
 * 期望：每次切换都触发 refetch（URL 参数变化）
 */
import puppeteer from '/workspace/projects/node_modules/.pnpm/puppeteer-core@25.3.0/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const PORT = process.env.DEPLOY_RUN_PORT || '5000';
const HOST = `localhost:${PORT}`;
const BASE = `http://${HOST}`;

const EMAIL = 'dashboard-test@demo.com';
const PASSWORD = 'Test1234abcd';

async function main() {
  // 1) API 拿 token
  await fetch(`${BASE}/api/v1/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: EMAIL, password: PASSWORD, company: 'Demo Co',
      companyShortName: 'demo', contactName: 'Demo', phone: '13800000000',
    }),
  }).catch(() => {});
  const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginJson = await loginRes.json();
  const token = loginJson?.data?.token;
  const user = loginJson?.data;
  console.log('login OK, token:', token?.slice(0, 20) + '...');

  // 2) 启动 puppeteer
  const browser = await puppeteer.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument((t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('userInfo', JSON.stringify(u));
  }, token, user);

  // 记录所有 dashboard API
  const apiCalls = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/v1/console/dashboard/')) {
      const qs = url.split('?')[1] || '';
      apiCalls.push({ url: url.replace(BASE, ''), qs, status: res.status() });
    }
  });

  console.log('\n=== A. goto /dashboard 首屏 ===');
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.innerText.includes('数据看板'), { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 2000));
  console.log(`  API 收到 ${apiCalls.length} 次调用`);
  apiCalls.forEach((c) => console.log(`    [${c.status}] ${c.url.split('/').pop()}?${c.qs}`));

  console.log('\n=== B. 切换 30天 tab ===');
  apiCalls.length = 0;
  const clicked30 = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.chart-tab'));
    const t = tabs.find((el) => /30/.test(el.innerText));
    if (t) { t.click(); return true; }
    return false;
  });
  console.log(`  click 30d tab: ${clicked30}`);
  await new Promise((r) => setTimeout(r, 1500));
  console.log(`  API 收到 ${apiCalls.length} 次调用`);
  apiCalls.forEach((c) => console.log(`    [${c.status}] ${c.url.split('/').pop()}?${c.qs}`));

  console.log('\n=== C. 切回 7天 tab ===');
  apiCalls.length = 0;
  const clicked7 = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.chart-tab'));
    const t = tabs.find((el) => /7天/.test(el.innerText));
    if (t) { t.click(); return true; }
    return false;
  });
  console.log(`  click 7d tab: ${clicked7}`);
  await new Promise((r) => setTimeout(r, 1500));
  console.log(`  API 收到 ${apiCalls.length} 次调用`);
  apiCalls.forEach((c) => console.log(`    [${c.status}] ${c.url.split('/').pop()}?${c.qs}`));

  console.log('\n=== D. 直接修改 dateRange 触发 watch ===');
  apiCalls.length = 0;
  const changed = await page.evaluate(() => {
    // 通过 __vnode 直接修改 dateRange ref 不太稳，改用 page 内部方法
    // 真实做法：找 el-date-editor input，直接 dispatch input/change 事件
    // 简化：派发一个自定义事件让 Vue 的 @update:modelValue 触发
    // 实际 Vue 3 监听 input.value 即可
    const inputs = document.querySelectorAll('.el-date-editor input');
    if (inputs.length < 2) return { ok: false, count: inputs.length };
    // 设置新日期（用 valueAsDate 不行，el-date-picker 是 v-model 字符串）
    // 改为派发 picker 内部事件，但更直接的是触发 el-date-picker 的 hover/click 选日期
    // 简化路径：通过 document.body 上挂的 __vue_app 拿 ref
    const app = document.querySelector('#app')?.__vue_app__;
    if (!app) return { ok: false, reason: 'no vue_app' };
    return { ok: true, hint: 'use evaluate later' };
  });
  console.log(`  change dateRange (low-level):`, changed);
  if (changed.ok) {
    // 通过 Vue 暴露的内部实例改 dateRange
    const refResult = await page.evaluate(() => {
      // 找到 el-date-editor 包装组件实例
      const editors = document.querySelectorAll('.el-date-editor');
      if (editors.length === 0) return { ok: false };
      // Vue 3 在 _vnode 上挂 component 引用不直接，尝试 __vueParentComponent
      const target = editors[0];
      const vnode = target.__vueParentComponent;
      if (!vnode) return { ok: false, reason: 'no __vueParentComponent' };
      // 找到 dashboard 页面组件（向上找 data.pageName === 'Dashboard'）
      let cur = vnode;
      let dashboardComp = null;
      while (cur) {
        if (cur.type?.__name === 'Dashboard' || cur.type?.name === 'Dashboard') {
          dashboardComp = cur; break;
        }
        cur = cur.parent;
      }
      if (!dashboardComp) {
        // 尝试更宽泛：找有 setupState 含 dateRange 的
        cur = vnode;
        while (cur) {
          if (cur.setupState && cur.setupState.dateRange !== undefined) {
            dashboardComp = cur; break;
          }
          cur = cur.parent;
        }
      }
      if (!dashboardComp) return { ok: false, reason: 'dashboard comp not found' };
      // 修改 dateRange
      const newStart = new Date('2026-06-01');
      const newEnd = new Date('2026-06-30');
      dashboardComp.setupState.dateRange = [newStart, newEnd];
      return { ok: true, start: newStart.toISOString(), end: newEnd.toISOString() };
    });
    console.log(`  change dateRange result:`, refResult);
    await new Promise((r) => setTimeout(r, 1500));
    console.log(`  API 收到 ${apiCalls.length} 次调用`);
    apiCalls.forEach((c) => console.log(`    [${c.status}] ${c.url.split('/').pop()}?${c.qs}`));
  }

  await page.screenshot({ path: '/tmp/dashboard.png', fullPage: true });
  console.log('\nscreenshot: /tmp/dashboard.png');
  await browser.close();
}

main().catch((e) => { console.error('ERR:', e); process.exit(1); });
