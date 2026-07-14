// e2e: 验证 waterfall 页面配置列表 card + traffic group 切换
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const HOST = 'http://localhost:5000';
const OUT = '/tmp/wf-config-list';
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // 1) 注册 + 创建 1 placement + 2 traffic_group + 1 ad-source
  const reg = await fetch(`${HOST}/api/v1/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `wf${Date.now()}@e2e.com`, password: 'Test123456', company: 'w', companyShortName: 'w', contactName: 'w', phone: '13800000000', accessType: 1 }),
  }).then((r) => r.json());
  const token = reg.data.token;
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  console.log('[setup] user registered, token len =', token.length);

  const app = await fetch(`${HOST}/api/v1/console/app/create`, { method: 'POST', headers: H, body: JSON.stringify({ appName: 'Cfg', packageName: 'com.cfg.' + Date.now(), platform: 1 }) }).then((r) => r.json());
  const appKey = app.data.app_key;
  const placement = await fetch(`${HOST}/api/v1/console/placement/create`, { method: 'POST', headers: H, body: JSON.stringify({ appKey, name: 'Cfg-Pl', format: 1 }) }).then((r) => r.json());
  const pid = placement.data.id;
  console.log('[setup] placement id =', pid, 'placement_id =', placement.data.placement_id);

  const tg1 = await fetch(`${HOST}/api/v1/console/traffic-group/create`, { method: 'POST', headers: H, body: JSON.stringify({ placementId: placement.data.placement_id, groupName: '国内用户', conditions: [{ field: 'country', op: 'eq', value: 'CN' }] }) }).then((r) => r.json());
  const tg2 = await fetch(`${HOST}/api/v1/console/traffic-group/create`, { method: 'POST', headers: H, body: JSON.stringify({ placementId: placement.data.placement_id, groupName: '海外用户', conditions: [{ field: 'country', op: 'eq', value: 'US' }] }) }).then((r) => r.json());
  console.log('[setup] traffic groups:', tg1.data?.id, tg2.data?.id);

  const ad = await fetch(`${HOST}/api/v1/console/ad-source/create`, { method: 'POST', headers: H, body: JSON.stringify({ networkCode: 'CSJ', sourceName: 'srcA', thirdAppId: 'a', thirdPlacementId: 'pa', appId: app.data.id, placementId: pid }) }).then((r) => r.json());
  console.log('[setup] ad source id =', ad.data?.id);

  // 默认分组 + tg1 + tg2 各保存一份 config
  for (const gid of [0, tg1.data.id, tg2.data.id]) {
    const sv = await fetch(`${HOST}/api/v1/console/waterfall/update`, { method: 'POST', headers: H, body: JSON.stringify({ placementId: placement.data.placement_id, trafficGroupId: gid, layers: [{ layer_type: 2, ad_source_id: ad.data.id, sort_price: 1 + gid * 0.1, timeout_ms: 3000, priority: 0 }] }) }).then((r) => r.json());
    console.log('[setup] save tg=' + gid + ' ->', sv.code, sv.message);
  }

  // 2) puppeteer: set auth then open waterfall directly
  const b = await puppeteer.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', headless: 'new', args: ['--no-sandbox'] });
  const page = await b.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('console', (m) => { if (m.type() === 'error' || m.text().includes('Error')) console.log('[browser]', m.type(), m.text().slice(0, 200)); });

  // prime cookie + localStorage on the same origin first
  await page.goto(`${HOST}/login`, { waitUntil: 'networkidle0' });
  await page.setCookie({ name: 'auth_token', value: token, url: HOST, sameSite: 'Strict' });
  await page.evaluate((t) => { localStorage.setItem('token', t); }, token);

  await page.goto(`${HOST}/waterfall`, { waitUntil: 'networkidle0' });
  await sleep(2500);

  await page.screenshot({ path: path.join(OUT, '01-loaded.png') });
  console.log('[browser] url =', page.url());

  // find placement item by name
  const items = await page.$$eval('.app-master-item', (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 80)));
  console.log('[master] items:', items);

  if (items.length > 0) {
    await page.click('.app-master-item');
    await sleep(2000);
  }
  await page.screenshot({ path: path.join(OUT, '02-selected.png') });

  // check config list card
  const configListInfo = await page.evaluate(() => {
    const card = document.querySelector('.wf-config-list-card');
    if (!card) return { has: false };
    const rows = card.querySelectorAll('.el-table__row');
    return {
      has: true,
      cardTitle: card.querySelector('.detail-card-title')?.textContent?.replace(/\s+/g, ' ').trim(),
      rowCount: rows.length,
      rowTexts: Array.from(rows).map((r) => r.textContent.replace(/\s+/g, ' ').trim().slice(0, 120)),
      activeRowText: card.querySelector('.wf-row-active')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100),
    };
  });
  console.log('[config list]', JSON.stringify(configListInfo, null, 2));

  // check tg selector
  const tgSelector = await page.evaluate(() => {
    const el = document.querySelector('.wf-tg-selector');
    if (!el) return { has: false };
    const input = el.querySelector('input');
    return { has: true, placeholder: input?.placeholder, value: input?.value };
  });
  console.log('[tg selector]', JSON.stringify(tgSelector, null, 2));

  // click second row (tg1) via clicking
  const rowHandle = await page.$('.wf-config-list-card .el-table__row:nth-child(2)');
  if (rowHandle) {
    await rowHandle.click();
    await sleep(1500);
  }
  await page.screenshot({ path: path.join(OUT, '03-tg1-loaded.png') });
  const afterClick = await page.evaluate(() => {
    const card = document.querySelector('.wf-config-list-card');
    return {
      activeRowText: card?.querySelector('.wf-row-active')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100),
      tgSelectorValue: document.querySelector('.wf-tg-selector input')?.value,
    };
  });
  console.log('[after click row 2]', JSON.stringify(afterClick, null, 2));

  // click third row (tg2)
  const row3 = await page.$('.wf-config-list-card .el-table__row:nth-child(3)');
  if (row3) {
    await row3.click();
    await sleep(1500);
  }
  await page.screenshot({ path: path.join(OUT, '04-tg2-loaded.png') });
  const afterClick2 = await page.evaluate(() => {
    const card = document.querySelector('.wf-config-list-card');
    return {
      activeRowText: card?.querySelector('.wf-row-active')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100),
      tgSelectorValue: document.querySelector('.wf-tg-selector input')?.value,
    };
  });
  console.log('[after click row 3]', JSON.stringify(afterClick2, null, 2));

  // now add source to bid layer + save
  const addBtn = await page.$('.detail-card .detail-card-actions .el-button--primary');
  if (addBtn) {
    await addBtn.click();
    await sleep(1000);
  }
  await page.screenshot({ path: path.join(OUT, '05-add-dialog.png') });
  const dialogInfo = await page.evaluate(() => {
    const dlg = document.querySelector('.el-dialog');
    if (!dlg) return { has: false };
    const opts = dlg.querySelectorAll('.el-select-dropdown__item');
    return {
      has: true,
      title: dlg.querySelector('.el-dialog__title')?.textContent,
      selectOptions: Array.from(opts).map((o) => o.textContent.trim()).slice(0, 5),
    };
  });
  console.log('[add dialog]', JSON.stringify(dialogInfo, null, 2));

  await b.close();
  console.log('done');
})();
