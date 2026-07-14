// 验证 waterfall 新布局（master-detail）+ 过滤+三层配置
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const PORT = process.env.DEPLOY_RUN_PORT || '5000';
const SHOTS = '/tmp/wf-master-detail';
fs.mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, url, token, body) {
  const r = await fetch(`http://localhost:${PORT}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

(async () => {
  // 1) 注册新用户
  const stamp = Date.now();
  const reg = await api('POST', '/api/v1/auth/register', null, {
    email: `wfmd${stamp}@e2e.com`, password: 'Test123456', company: 'wfmd', companyShortName: 'wfmd',
    contactName: 'wfmd', phone: '13800000000', accessType: 1,
  });
  const token = reg.data.token;
  console.log('[reg] token ok');

  // 2) 创建 app + 2 placement + 2 ad-source
  const app = await api('POST', '/api/v1/console/app/create', token, { appName: 'MD-App', packageName: `com.md.${stamp}`, platform: 1 });
  const appKey = app.data.app_key;
  const p1 = await api('POST', '/api/v1/console/placement/create', token, { appKey, name: 'MD-Banner', format: 1 });
  const p2 = await api('POST', '/api/v1/console/placement/create', token, { appKey, name: 'MD-Splash', format: 4 });
  const p3 = await api('POST', '/api/v1/console/placement/create', token, { appKey, name: 'MD-Reward', format: 3 });
  const pid1 = p1.data.id, pid2 = p2.data.id, pid3 = p3.data.id;
  await api('POST', '/api/v1/console/ad-source/create', token, { networkCode: 'CSJ', sourceName: 'src-Banner', thirdAppId: 'a', thirdPlacementId: 'pa', appId: app.data.id, placementId: pid1 });
  await api('POST', '/api/v1/console/ad-source/create', token, { networkCode: 'YLH', sourceName: 'src-Splash', thirdAppId: 'b', thirdPlacementId: 'pb', appId: app.data.id, placementId: pid2 });
  await api('POST', '/api/v1/console/ad-source/create', token, { networkCode: 'BD', sourceName: 'src-Reward', thirdAppId: 'c', thirdPlacementId: 'pc', appId: app.data.id, placementId: pid3 });
  console.log('[data] 3 placements + 3 ad-sources ready');

  // 3) 启动浏览器
  const browser = await puppeteer.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    headless: 'new', args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`http://localhost:${PORT}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate((t) => localStorage.setItem('token', t), token);
  await page.goto(`http://localhost:${PORT}/waterfall`, { waitUntil: 'networkidle0' });
  await sleep(2500);
  await page.screenshot({ path: path.join(SHOTS, '01-master-detail-empty.png'), fullPage: true });

  // 4) 验证 master list 渲染
  const masterList = await page.evaluate(() => {
    const items = document.querySelectorAll('.app-master-item');
    return Array.from(items).map((el) => ({
      text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 80),
      active: el.classList.contains('active'),
    }));
  });
  console.log('[master] items:', masterList.length, JSON.stringify(masterList, null, 2));

  // 5) 点击第 2 个 placement (Splash)
  const items = await page.$$('.app-master-item');
  console.log('[master] click item[1] (Splash)');
  await items[1].click();
  await sleep(1500);
  await page.screenshot({ path: path.join(SHOTS, '02-splash-selected.png'), fullPage: true });

  // 6) 验证右侧 detail 显示
  const detail = await page.evaluate(() => {
    const name = document.querySelector('.app-detail-app-name')?.textContent || '';
    const detailCards = document.querySelectorAll('.detail-card');
    const cardTitles = Array.from(detailCards).map((c) => c.querySelector('.detail-card-title')?.textContent.replace(/\s+/g, ' ').trim() || '');
    const layerSources = Array.from(detailCards).map((c) => c.querySelectorAll('.el-table__body tr').length);
    return { name, detailCardsCount: detailCards.length, cardTitles, layerSources };
  });
  console.log('[detail]', JSON.stringify(detail, null, 2));

  // 7) 切换到 Banner
  const items2 = await page.$$('.app-master-item');
  console.log('[master] click item[0] (Banner)');
  await items2[0].click();
  await sleep(1500);
  await page.screenshot({ path: path.join(SHOTS, '03-banner-selected.png'), fullPage: true });

  // 8) 点击「添加代码位」按钮（取第一层卡内的）
  const addBtn = await page.$('.detail-card-header .el-button--primary');
  if (addBtn) {
    await addBtn.click();
    await sleep(1200);
    await page.screenshot({ path: path.join(SHOTS, '04-add-source-dialog.png'), fullPage: true });

    // 9) 打开 ad-source select
    const optSelect = await page.$('.el-dialog .el-select');
    if (optSelect) {
      await optSelect.click();
      await sleep(800);
      const options = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.el-select-dropdown__item'))
          .filter((el) => el.offsetParent !== null)
          .map((el) => el.textContent.replace(/\s+/g, ' ').trim());
      });
      console.log('[dialog] visible options:', options);
    }
  }

  // 10) 搜索过滤
  await page.keyboard.press('Escape');
  await sleep(400);
  const searchInput = await page.$('.app-master-panel input[type="text"]');
  if (searchInput) {
    await searchInput.click({ clickCount: 3 });
    await searchInput.type('Splash');
    await sleep(500);
    await page.screenshot({ path: path.join(SHOTS, '05-search-splash.png'), fullPage: true });
    const filtered = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.app-master-item')).map((el) =>
        el.textContent.replace(/\s+/g, ' ').trim().slice(0, 60));
    });
    console.log('[search "Splash"] items:', filtered);
  }

  await browser.close();
  console.log('DONE');
})().catch((e) => { console.error('FAIL:', e); process.exit(1); });
