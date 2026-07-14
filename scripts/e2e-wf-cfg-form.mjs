// 端到端验证：保存配置弹窗 + 列表展示新字段 + 默认分组视觉
import puppeteer from 'puppeteer';

const PORT = '5000';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const stamp = Date.now();
  const reg = await (await fetch(`http://localhost:${PORT}/api/v1/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `wfcfg${stamp}@e2e.com`, password: 'Test123456', company: 'wfcfg', companyShortName: 'wfcfg', contactName: 'wfcfg', phone: '13800000000', accessType: 1 })
  })).json();
  if (reg.code !== 0) { console.error('register fail', reg); process.exit(1); }
  const token = reg.data.token;
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // 1. 创建 app + placement
  const app = await (await fetch(`http://localhost:${PORT}/api/v1/console/app/create`, {
    method: 'POST', headers: H, body: JSON.stringify({ appName: '手游C', packageName: `com.wfcfg.${stamp}`, platform: 1 })
  })).json();
  const p1 = await (await fetch(`http://localhost:${PORT}/api/v1/console/placement/create`, {
    method: 'POST', headers: H, body: JSON.stringify({ appKey: app.data.app_key, name: 'BannerC', format: 1 })
  })).json();
  const p2 = await (await fetch(`http://localhost:${PORT}/api/v1/console/placement/create`, {
    method: 'POST', headers: H, body: JSON.stringify({ appKey: app.data.app_key, name: 'SplashC', format: 4 })
  })).json();
  console.log('seed ok app=' + app.data.app_name + ' p1=' + p1.data.id + ' p2=' + p2.data.id);

  // 2. 创建流量分组 (含一条默认分组 + 一条国内 + 一条海外)
  const tg1 = await (await fetch(`http://localhost:${PORT}/api/v1/console/traffic-group/create`, {
    method: 'POST', headers: H, body: JSON.stringify({ placementId: p1.data.placement_id, groupName: '国内-安卓', conditions: [{ field: 'country', op: 'eq', value: 'CN' }, { field: 'os', op: 'eq', value: 'android' }] })
  })).json();
  console.log('tg1', tg1.code, tg1.data?.id);

  // 3. 创建广告源 (供 save 弹窗用)
  const src1 = await (await fetch(`http://localhost:${PORT}/api/v1/console/ad-source/create`, {
    method: 'POST', headers: H, body: JSON.stringify({ networkCode: 'pangle', sourceName: 'Bidding-A', thirdAppId: 'appA', thirdPlacementId: 'plA', appId: app.data.id, placementId: p1.data.id, storeDimParams: [{ key: 'app_id', value: 'com.wfcfg' }] })
  })).json();
  console.log('src1', src1.code, src1.data?.id);
  if (src1.code !== 0) { console.error('ad-source create fail', src1); process.exit(1); }

  // 4. 创建 waterfall_config v1（默认分组，无任何来源）
  await (await fetch(`http://localhost:${PORT}/api/v1/console/waterfall/update`, {
    method: 'POST', headers: H, body: JSON.stringify({
      placementId: p1.data.id, trafficGroupId: 0,
      configName: '默认初始配置', description: '第一版默认',
      layers: [],
    })
  })).json();
  // 5. 创建 waterfall_config v2（默认分组，有 1 个来源）
  await (await fetch(`http://localhost:${PORT}/api/v1/console/waterfall/update`, {
    method: 'POST', headers: H, body: JSON.stringify({
      placementId: p1.data.id, trafficGroupId: 0,
      configName: '默认-加入Bidding-A',
      description: '加入头部竞价',
      layers: [{ layer_type: 1, ad_source_id: src1.data.id, sort_price: 50, timeout_ms: 3000 }],
    })
  })).json();
  // 6. 创建 waterfall_config for 国内-安卓
  await (await fetch(`http://localhost:${PORT}/api/v1/console/waterfall/update`, {
    method: 'POST', headers: H, body: JSON.stringify({
      placementId: p1.data.id, trafficGroupId: tg1.data.id,
      configName: '国内-安卓-主推', description: '国内安卓用户主推',
      layers: [{ layer_type: 1, ad_source_id: src1.data.id, sort_price: 60, timeout_ms: 3000 }],
    })
  })).json();

  // 7. puppeteer 走 /waterfall，验证列表展示
  const browser = await puppeteer.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('console', m => { if (m.type() === 'error') console.log('CON-ERR', m.text().slice(0, 200)); });
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  await page.goto(`http://localhost:${PORT}/login`, { waitUntil: 'networkidle0' });
  await page.setCookie({ name: 'auth_token', value: token, url: `http://localhost:${PORT}`, sameSite: 'Strict' });
  await page.evaluate((t) => localStorage.setItem('token', t), token);
  await page.goto(`http://localhost:${PORT}/waterfall`, { waitUntil: 'networkidle0' });
  await sleep(2000);

  // 点 BannerC
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.app-master-item'));
    const t = items.find(el => el.textContent.includes('BannerC'));
    if (t) t.click();
  });
  await sleep(2500);
  await page.screenshot({ path: '/tmp/wf-cfg/save-list.png', fullPage: true });

  // 抓列表行
  const rows = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.el-table__body tr')).map(tr => {
      const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim().replace(/\s+/g, ' '));
      const isDefault = !!tr.querySelector('.wf-config-group--default');
      return { cells, isDefault, html: tr.outerHTML.slice(0, 300) };
    });
  });
  console.log('=== 配置列表行 ===');
  rows.forEach((r, i) => {
    console.log(`  [${i}] default=${r.isDefault}: ${r.cells.join(' | ')}`);
  });

  // 期望: 3 行 (默认 v1 + 默认 v2 + 国内安卓 v1)
  if (rows.length !== 3) { console.error('FAIL: 期望 3 行，实际 ' + rows.length); process.exit(1); }
  if (!rows[0].isDefault || !rows[1].isDefault) { console.error('FAIL: 默认分组未排在最前'); process.exit(1); }
  if (rows[2].isDefault) { console.error('FAIL: 国内-安卓 不应该是默认分组'); process.exit(1); }

  // 验证国内-安卓行包含「国内-安卓」+ 「手游C」+ 「country = CN」
  const cellTxt = rows[2].cells.join(' | ');
  if (!cellTxt.includes('国内-安卓') || !cellTxt.includes('手游C') || !cellTxt.includes('country')) {
    console.error('FAIL: 国内-安卓 行字段缺失，cells=' + cellTxt);
    process.exit(1);
  }
  console.log('✅ 列表行展示正确');

  // 8. 验证保存弹窗：切换到「默认分组」，点保存按钮，弹窗应出现
  await page.evaluate(() => {
    // 切换到「默认分组」流量分组（id=0）
    const options = document.querySelectorAll('.wf-tg-selector .el-select-dropdown__item');
    if (options.length) (options[0]).click(); // 第一个就是默认
  });
  await sleep(800);
  // 点击保存按钮
  const saveBtn = await page.$('button.el-button--primary');
  if (!saveBtn) { console.error('FAIL: 找不到保存按钮'); process.exit(1); }
  await saveBtn.click();
  await sleep(800);
  await page.screenshot({ path: '/tmp/wf-cfg/save-dialog.png' });

  // 弹窗存在？
  const dialogInfo = await page.evaluate(() => {
    const d = document.querySelector('.wf-save-dialog');
    if (!d) return { exists: false };
    return {
      exists: true,
      title: d.querySelector('.el-dialog__title')?.innerText,
      summaryCount: d.querySelectorAll('.wf-save-summary-item').length,
      inputValue: d.querySelector('.wf-save-form .el-input__inner')?.value,
    };
  });
  console.log('=== 保存弹窗 ===');
  console.log(' ', JSON.stringify(dialogInfo));
  if (!dialogInfo.exists) { console.error('FAIL: 弹窗未出现'); process.exit(1); }
  if (dialogInfo.summaryCount !== 3) { console.error('FAIL: 摘要 3 项缺失'); process.exit(1); }
  if (!dialogInfo.inputValue?.includes('默认配置-BannerC')) { console.error('FAIL: 默认配置名未自动填入: ' + dialogInfo.inputValue); process.exit(1); }
  console.log('✅ 保存弹窗正常');

  // 提交（不填名字直接提交应该警告，但 inputValue 已经填了默认 → 直接确认）
  const confirmBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.wf-save-dialog .el-dialog__footer button'));
    const ok = btns.find(b => b.innerText.includes('保存为'));
    if (ok) ok.click();
    return ok?.innerText;
  });
  console.log('点了确认:', confirmBtn);
  await sleep(2500);
  await page.screenshot({ path: '/tmp/wf-cfg/save-after.png' });

  // 列表应该多一行（v3）
  const rows2 = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.el-table__body tr')).map(tr => tr.innerText.trim().replace(/\s+/g, ' '));
  });
  console.log('=== 保存后列表 ===');
  rows2.forEach((r, i) => console.log(`  [${i}] ${r.slice(0, 200)}`));
  if (rows2.length !== 4) { console.error('FAIL: 期望 4 行，实际 ' + rows2.length); process.exit(1); }
  console.log('✅ 保存后列表新增 1 行');

  // 9. 验证 traffic-group 页面：默认分组固定在第一行 + 不可删
  await page.goto(`http://localhost:${PORT}/traffic-group`, { waitUntil: 'networkidle0' });
  await sleep(3500);
  await page.screenshot({ path: '/tmp/wf-cfg/traffic-group.png' });
  const tgRows = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.el-table__body tr')).map(tr => {
      const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim().replace(/\s+/g, ' '));
      const hasDefault = !!tr.querySelector('.cell-default-icon');
      const hasDeleteBtn = !!Array.from(tr.querySelectorAll('button')).find(b => b.innerText === '删除');
      return { cells, hasDefault, hasDeleteBtn };
    });
  });
  console.log('=== 流量分组列表 ===');
  tgRows.forEach((r, i) => console.log(`  [${i}] default=${r.hasDefault} delete=${r.hasDeleteBtn}: ${r.cells[0]}`));
  if (!tgRows[0].hasDefault) { console.error('FAIL: 默认分组未在第一行'); process.exit(1); }
  if (tgRows[0].hasDeleteBtn) { console.error('FAIL: 默认分组不该有删除按钮'); process.exit(1); }
  console.log('✅ 流量分组默认分组视觉正确');

  console.log('\n========== ALL PASS ==========');
  await browser.close();
})();
