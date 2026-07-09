import puppeteer from 'puppeteer';

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const browser = await puppeteer.launch({
  headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify({ developerId: 'dev_4SYXG6wRXqNSmbuG', email: 'verify-api-1783560900@example.com', role: 'developer', company: '测试公司' }));
    localStorage.setItem('userRole', 'developer');
  }, VERIFY_TOKEN);
  await page.goto('http://localhost:5000/profile', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  // 拦截 PATCH
  const patchCalls = [];
  page.on('response', async (res) => {
    if (res.url().includes('/api-token/expire') && res.request().method() === 'PATCH') {
      try {
        const body = await res.text();
        patchCalls.push({ status: res.status(), body: body.substring(0, 300) });
      } catch {}
    }
  });

  // 简化：直接派发到 PATCH 接口, 模拟 "保存生效时间" 按钮的调用
  // 测 picker 的 input
  const result = await page.evaluate(async () => {
    // 用 fetch 直接调 PATCH 接口模拟保存
    const res = await fetch('/api/v1/console/profile/api-token/expire', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ expireDate: '2031-08-20T15:30:00.000Z' }),
    });
    const text = await res.text();
    return { status: res.status, body: text };
  });
  console.log('Direct PATCH test:', JSON.stringify(result, null, 2));

  // 再用 vue setup 注入 draft
  const stateResult = await page.evaluate(() => {
    const root = document.querySelector('#app').__vue_app__;
    function walk(node) {
      if (!node || typeof node !== 'object') return null;
      if (node.setupState && node.setupState.tokenExpireDraft !== undefined) return node.setupState;
      // 通过 parent 链
      if (node.parent) return walk(node.parent);
      // 通过 subTree
      const sub = node.subTree;
      if (sub) {
        const r1 = walk(sub);
        if (r1) return r1;
        if (sub.component) {
          const r2 = walk(sub.component);
          if (r2) return r2;
        }
        if (sub.children && Array.isArray(sub.children)) {
          for (const c of sub.children) {
            const r3 = walk(c);
            if (r3) return r3;
          }
        }
      }
      return null;
    }
    const s = walk(root._instance);
    if (s) {
      s.tokenExpireDraft.value = '2031-08-20T15:30:00.000Z';
      return { found: true, value: s.tokenExpireDraft.value };
    }
    return { found: false };
  });
  console.log('State lookup:', JSON.stringify(stateResult, null, 2));

  await new Promise((r) => setTimeout(r, 500));
  // 点保存按钮
  const buttonResult = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll('.table-card')).find(c => c.querySelector('.card-title')?.textContent?.includes('Report API 密钥'));
    const btn = Array.from(card.querySelectorAll('.el-button')).find(b => b.textContent.trim() === '保存生效时间');
    if (btn) {
      btn.click();
      return { clicked: true };
    }
    return { clicked: false, buttonCount: card.querySelectorAll('.el-button').length };
  });
  console.log('Button click:', JSON.stringify(buttonResult, null, 2));

  await new Promise((r) => setTimeout(r, 1500));
  console.log('PATCH calls:', JSON.stringify(patchCalls, null, 2));
} finally {
  await browser.close();
}
