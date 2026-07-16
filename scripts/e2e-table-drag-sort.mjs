// e2e-table-drag-sort.mjs - 验证综合报表表格列拖拽 + 指标列排序
import puppeteer from 'puppeteer';
import fs from 'fs';

const SHOTS = '/tmp/report-table-dnd-shots';
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

const BASE = 'http://localhost:5000';

const register = async () => {
  const res = await fetch(`${BASE}/api/v1/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `e2e_dnd_${Date.now()}@e2e.com`, password: 'Test123456',
      company: 'e2e_dnd', companyShortName: 'e2e_dnd',
      contactName: 'e2e', phone: '13800000000', accessType: 1,
    }),
  });
  return (await res.json()).data.token;
};

const updateBoard = async (token, id, config) => {
  await fetch(`${BASE}/api/v1/console/report/board/update/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ config }),
  });
};

const main = async () => {
  const token = await register();
  // 注册后系统自动 seed 1 个看版：3 metric + 1 dim
  const list = (await (await fetch(`${BASE}/api/v1/console/report/board/list?report_type=overview`, { headers: { 'Authorization': `Bearer ${token}` } })).json()).data;
  const board = list[0];
  console.log('default board:', board.id, JSON.stringify(board.config));

  const browser = await puppeteer.launch({
    headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  page.on('console', m => { if (m.text().includes('e2e-dnd')) console.log('[browser]', m.text()); });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.evaluate(tk => localStorage.setItem('token', tk), token);
  await page.goto(`${BASE}/report/overview`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  // 1. 初始列顺序
  const initial = await page.evaluate(() => {
    const ths = Array.from(document.querySelectorAll('.el-table__header-wrapper thead th'));
    return ths.map(th => th.querySelector('.cell')?.textContent?.trim() || '?');
  });
  console.log('--- 1. 初始列顺序 ---');
  console.log(initial);

  // 2. 模拟拖拽：把"展示数"(idx=1) 拖到"实际收益"(idx=3) 后面
  console.log('--- 2. 拖拽展示数 → 实际收益 后面 ---');
  const ths = await page.$$('.el-table__header-wrapper thead th');
  // ths[0]=日期 dim, ths[1]=展示数, ths[2]=点击数, ths[3]=实际收益
  // 目标: 展示数 排到 实际收益 后面 → 新顺序: 日期, 点击数, 实际收益, 展示数
  if (ths.length >= 4) {
    const from = await ths[1].boundingBox();
    const to = await ths[3].boundingBox();
    if (from && to) {
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await new Promise(r => setTimeout(r, 100));
      // 分步移动，触发 sortablejs
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        const x = from.x + (to.x + to.width - from.x) * (i / steps);
        const y = from.y + (to.y - from.y) * (i / steps) + 20; // 偏移避免 hover
        await page.mouse.move(x, y);
        await new Promise(r => setTimeout(r, 30));
      }
      await page.mouse.up();
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  const afterDrag = await page.evaluate(() => {
    const ths = Array.from(document.querySelectorAll('.el-table__header-wrapper thead th'));
    return ths.map(th => th.querySelector('.cell')?.textContent?.trim() || '?');
  });
  console.log('拖拽后列顺序:');
  console.log(afterDrag);

  // 检查 sortablejs 是否成功拖拽（任一列顺序变化视为成功）
  const dragOK = JSON.stringify(initial) !== JSON.stringify(afterDrag);
  console.log('[e2e-dnd] drag success:', dragOK);

  await page.screenshot({ path: `${SHOTS}/01-after-drag.png` });

  // 3. 验证后端持久化
  await new Promise(r => setTimeout(r, 1000));
  const saved = (await (await fetch(`${BASE}/api/v1/console/report/board/list?report_type=overview`, { headers: { 'Authorization': `Bearer ${token}` } })).json()).data[0];
  console.log('--- 3. 后端持久化 ---');
  console.log('  config.metrics:', saved.config.metrics);
  console.log('  config.dimensions:', saved.config.dimensions);

  // 4. 点击指标列表头测试排序（重新查 ths，列顺序已变）
  console.log('--- 4. 点击"展示数"列头升序 ---');
  const findClick = async (label) => {
    const allThs = await page.$$('.el-table__header-wrapper thead th');
    for (const th of allThs) {
      const txt = await page.evaluate(el => el.querySelector('.cell')?.textContent?.trim(), th);
      if (txt === label) return th;
    }
    return null;
  };
  const impressionsTh = await findClick('展示数');
  if (impressionsTh) {
    // 第一次点击升序
    await impressionsTh.click();
    await new Promise(r => setTimeout(r, 500));
    // 第二次点击降序
    const impressionsTh2 = await findClick('展示数');
    if (impressionsTh2) {
      await impressionsTh2.click();
      await new Promise(r => setTimeout(r, 500));
    }
  }
  const sortInfo = await page.evaluate(() => {
    // EP 排序 caret 可能在 th 的 .sort-caret 上
    const sortedThs = Array.from(document.querySelectorAll('.el-table__header-wrapper th.is-sortable'));
    const sorted = sortedThs.find(th => th.classList.contains('ascending') || th.classList.contains('descending'));
    return {
      col: sorted?.querySelector('.cell')?.textContent?.trim() || '?',
      hasAsc: !!document.querySelector('.el-table__header-wrapper th.ascending'),
      hasDesc: !!document.querySelector('.el-table__header-wrapper th.descending'),
    };
  });
  console.log('  排序状态:', JSON.stringify(sortInfo));
  await page.screenshot({ path: `${SHOTS}/02-after-sort.png` });

  await browser.close();

  console.log('--- 结果 ---');
  console.log('drag:', dragOK ? 'PASS' : 'FAIL');
  console.log('sort:', sortInfo.col === '展示数' ? 'PASS' : 'FAIL');
  console.log('persisted:', JSON.stringify(saved.config.metrics));
};

main().catch(e => { console.error(e); process.exit(1); });
