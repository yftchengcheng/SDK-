const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const OUT = '/workspace/projects/scripts/agg-test';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Login first
  console.log('Step 1: Login');
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1500));
  // Register a fresh user (works only if not registered yet)
  const regRes = await page.evaluate(async () => {
    const r = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'aggtest@xinyi.cn', password: 'Test123456',
        company: '测试公司', companyShortName: '测',
        contactName: '测试', phone: '13800000000', accessType: 1,
      }),
    });
    return { status: r.status, body: await r.json() };
  });
  console.log('  Register status:', regRes.status, 'code:', regRes.body?.code);

  // Login directly via API (bypass captcha)
  const loginRes = await page.evaluate(async () => {
    const r = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: 'aggtest@xinyi.cn', password: 'Test123456' }),
    });
    return { status: r.status, body: await r.json() };
  });
  console.log('  Login API status:', loginRes.status, 'hasToken:', !!loginRes.body?.data?.token);

  if (loginRes.body?.data?.token) {
    await page.evaluate((data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('userRole', data.role || 'admin');
    }, loginRes.body.data);
  }
  await new Promise(r => setTimeout(r, 500));
  console.log('  Token in localStorage:', await page.evaluate(() => !!localStorage.getItem('token')));

  // Test 1: Visit /aggregation/waterfall (default redirect)
  console.log('Step 2: Visit /aggregation/waterfall');
  await page.goto('http://localhost:5000/aggregation/waterfall', { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT, '01-waterfall.png'), fullPage: false });

  const waterfallInfo = await page.evaluate(() => {
    const breadcrumb = document.querySelector('.el-breadcrumb');
    const tabs = document.querySelectorAll('.aggregation-el-tabs .el-tabs__item');
    const activeTab = document.querySelector('.aggregation-el-tabs .el-tabs__item.is-active');
    const sidebar = document.querySelector('.sidebar');
    return {
      breadcrumbText: breadcrumb ? breadcrumb.innerText.replace(/\n/g, ' | ') : null,
      tabs: Array.from(tabs).map(t => t.innerText.trim()),
      activeTabText: activeTab ? activeTab.innerText.trim() : null,
      hasSubmenu: !!document.querySelector('.nav-sublist'),
      sidebarGroup: !!document.querySelector('.nav-item--group'),
    };
  });
  console.log('  Aggregation waterfall:', JSON.stringify(waterfallInfo, null, 2));

  // Test 2: Click "流量分组" tab
  console.log('Step 3: Click 流量分组 tab');
  await page.evaluate(() => {
    const items = document.querySelectorAll('.aggregation-el-tabs .el-tabs__item');
    for (const it of items) {
      if (it.innerText.includes('流量分组')) { it.click(); return; }
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT, '02-traffic-group.png'), fullPage: false });
  const tgInfo = await page.evaluate(() => {
    const url = window.location.pathname;
    const activeTab = document.querySelector('.aggregation-el-tabs .el-tabs__item.is-active');
    const rows = document.querySelectorAll('.el-table__body-wrapper .el-table__row');
    return {
      url,
      activeTab: activeTab ? activeTab.innerText.trim() : null,
      rowCount: rows.length,
    };
  });
  console.log('  Traffic group tab:', JSON.stringify(tgInfo, null, 2));

  // Test 3: Click "广告源管理" tab
  console.log('Step 4: Click 广告源管理 tab');
  await page.evaluate(() => {
    const items = document.querySelectorAll('.aggregation-el-tabs .el-tabs__item');
    for (const it of items) {
      if (it.innerText.includes('广告源管理')) { it.click(); return; }
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT, '03-ad-source.png'), fullPage: false });
  const adsInfo = await page.evaluate(() => {
    const url = window.location.pathname;
    const activeTab = document.querySelector('.aggregation-el-tabs .el-tabs__item.is-active');
    return {
      url,
      activeTab: activeTab ? activeTab.innerText.trim() : null,
      hasSidePanel: !!document.querySelector('.adsource-side'),
    };
  });
  console.log('  Ad source tab:', JSON.stringify(adsInfo, null, 2));

  // Test 4: Verify old URL redirect
  console.log('Step 5: Old URL /waterfall redirect');
  await page.goto('http://localhost:5000/waterfall', { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1000));
  const redirectUrl = await page.evaluate(() => window.location.pathname);
  console.log('  /waterfall ->', redirectUrl);

  // Test 5: Visit /aggregation directly
  console.log('Step 6: /aggregation default redirect');
  await page.goto('http://localhost:5000/aggregation', { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1000));
  const aggRedirect = await page.evaluate(() => window.location.pathname);
  console.log('  /aggregation ->', aggRedirect);
  await page.screenshot({ path: path.join(OUT, '04-aggregation-default.png'), fullPage: false });

  // Test 6: Sidebar submenu - click 聚合管理 parent
  console.log('Step 7: Click 聚合管理 sidebar parent');
  await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1000));
  const sidebarBefore = await page.evaluate(() => {
    const sublist = document.querySelector('.nav-sublist');
    return sublist ? 'expanded' : 'collapsed';
  });
  console.log('  Submenu state at /dashboard:', sidebarBefore);

  // Click 聚合管理 in sidebar
  await page.evaluate(() => {
    const groups = document.querySelectorAll('.nav-item--group');
    for (const g of groups) {
      if (g.innerText.includes('聚合管理')) { g.click(); return; }
    }
  });
  await new Promise(r => setTimeout(r, 500));
  const sidebarAfter = await page.evaluate(() => {
    const sublist = document.querySelector('.nav-sublist');
    return sublist ? 'expanded' : 'collapsed';
  });
  console.log('  After click 聚合管理:', sidebarAfter);
  await page.screenshot({ path: path.join(OUT, '05-sidebar-expanded.png'), fullPage: false });

  // Click sub-item 流量分组
  await page.evaluate(() => {
    const subs = document.querySelectorAll('.nav-item--sub');
    for (const s of subs) {
      if (s.innerText.includes('流量分组')) { s.click(); return; }
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  const afterClick = await page.evaluate(() => ({
    url: window.location.pathname,
    activeSub: document.querySelector('.nav-item--sub.active')?.innerText.trim(),
    activeTab: document.querySelector('.aggregation-el-tabs .el-tabs__item.is-active')?.innerText.trim(),
  }));
  console.log('  After click sub-item:', JSON.stringify(afterClick, null, 2));
  await page.screenshot({ path: path.join(OUT, '06-sidebar-clicked.png'), fullPage: false });

  await browser.close();
  console.log('\nDone. Screenshots saved to', OUT);
})().catch(e => { console.error('FAIL:', e); process.exit(1); });
