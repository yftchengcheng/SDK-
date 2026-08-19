import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const logs = [];
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`));
page.on('request', req => {
  if (req.url().includes('/app/sdks/export') || req.url().includes('export-sdk-policy') || req.url().includes('sdk-versions') || req.url().includes('placement-candidates')) {
    console.log('[req]', req.method(), req.url().replace('http://localhost:5000', ''));
  }
});
page.on('response', async res => {
  if (res.url().includes('/app/sdks/export') || res.url().includes('export-sdk-policy') || res.url().includes('sdk-versions') || res.url().includes('placement-candidates')) {
    console.log('[res]', res.status(), res.url().replace('http://localhost:5000', ''));
  }
});

await page.goto('http://localhost:5000/', { waitUntil: 'networkidle0' });
await page.evaluate(async () => {
  const r = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dashboard-test@demo.com', password: 'Test123456' }),
  });
  const j = await r.json();
  if (j.data && j.data.token) {
    localStorage.setItem('token', j.data.token);
    if (j.data.userInfo) localStorage.setItem('userInfo', JSON.stringify(j.data.userInfo));
  }
});
await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 3000));

// 找按钮
const btn = await page.evaluateHandle(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  return btns.find(b => b.textContent.trim() === 'SDK预置策略');
});

const btnExists = await btn.evaluate(b => !!b);
console.log('按钮存在:', btnExists);

if (btnExists) {
  // 点击
  await btn.click();
  await new Promise(r => setTimeout(r, 1000));
  console.log('已点击按钮');
}

// 查所有 dialog 相关 DOM
const dom = await page.evaluate(() => {
  const all = document.body.innerHTML;
  const hasPolicyDialog = all.includes('policy-dialog');
  const hasExportDialogTitle = all.includes('导出 SDK 预置策略');
  const hasSdksExport = all.includes('export-sdk-policy');
  return {
    bodyLength: all.length,
    hasPolicyDialogClass: hasPolicyDialog,
    hasExportDialogTitle: hasExportDialogTitle,
    hasSdksExport: hasSdksExport,
    overlayCount: document.querySelectorAll('.el-overlay').length,
    overlayVisible: document.querySelectorAll('.el-overlay').length > 0 ? getComputedStyle(document.querySelector('.el-overlay')).display : 'N/A',
    elDialogCount: document.querySelectorAll('.el-dialog').length,
    policyDialogCount: document.querySelectorAll('.policy-dialog').length,
  };
});
console.log('--- 1. DOM 状态 ---');
console.log(JSON.stringify(dom, null, 2));

// 查 Vue 内部 state（看 exportSdkDialogVisible 是否真变 true）
const vueState = await page.evaluate(() => {
  // 找 Index.vue 组件实例
  const app = document.querySelector('#app');
  if (!app) return { error: 'no #app' };
  const vNode = app.__vueParentComponent || app.__vue__;
  if (!vNode) return { error: 'no vue parent' };
  
  // 找 Index.vue 组件（递归找）
  function findInstance(v, name) {
    if (!v) return null;
    if (v.type && v.type.__name === name) return v;
    if (v.subTree) {
      const f = findInstance(v.subTree.component, name);
      if (f) return f;
    }
    if (v.children) {
      for (const c of v.children) {
        const f = findInstance(c, name);
        if (f) return f;
      }
    }
    return null;
  }
  
  return { error: 'cannot easily access Vue instance from outside' };
});
console.log('--- 2. Vue state ---');
console.log(JSON.stringify(vueState, null, 2));

await page.screenshot({ path: '/tmp/dialog-test3.png', fullPage: false });
console.log('截图: /tmp/dialog-test3.png');

console.log('--- 3. console 日志 ---');
logs.slice(-15).forEach(l => console.log(l));

await browser.close();
