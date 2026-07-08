import puppeteer from 'puppeteer';
import fs from 'fs';

const TOKEN = process.env.VERIFY_TOKEN;
if (!TOKEN) { console.error('VERIFY_TOKEN env required'); process.exit(1); }

const OUT_DIR = process.env.OUT_DIR || './verify-screenshots';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { path: '/placement', name: 'placement' },
  { path: '/ad-source', name: 'ad-source' },
  { path: '/traffic-group', name: 'traffic-group' },
  { path: '/network', name: 'network' },
];

const findChrome = () => {
  const base = '/root/.cache/puppeteer/chrome';
  if (!fs.existsSync(base)) return null;
  const dirs = fs.readdirSync(base).sort().reverse();
  for (const d of dirs) {
    const exe = `${base}/${d}/chrome-linux64/chrome`;
    if (fs.existsSync(exe)) return exe;
    const exe2 = `${base}/${d}/chrome`;
    if (fs.existsSync(exe2)) return exe2;
  }
  return null;
};

const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const exe = findChrome();
  console.log('chrome:', exe);
  if (!exe) { console.error('no chrome'); process.exit(1); }
  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') console.log('  [console.error]', m.text().slice(0, 200)); });
  page.on('pageerror', e => console.log('  [pageerror]', e.message.slice(0, 200)));

  // bootstrap
  await page.goto('http://localhost:5000/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('userInfo', JSON.stringify({ developerId: 'dev_W7dOvj90HaEGi3Ez', email: 'testuser@example.com', role: 'developer' }));
    localStorage.setItem('userRole', 'developer');
  }, TOKEN);

  for (const p of PAGES) {
    console.log(`\n=== ${p.name} (${p.path}) ===`);
    await page.goto(`http://localhost:5000${p.path}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(2000);
    // list 截图
    const listPath = `${OUT_DIR}/${p.name}-list.png`;
    await page.screenshot({ path: listPath, fullPage: false });
    console.log('list screenshot:', listPath);

    // 找创建按钮并点击
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, .el-button'));
      const target = buttons.find(b => {
        const t = (b.textContent || '').trim();
        return /新建|创建|上传|添加/.test(t) && !/查询|筛选|搜索|重置|批量|导出|删除|编辑/.test(t);
      });
      if (target) {
        target.scrollIntoView({ block: 'center' });
        target.click();
        return (target.textContent || '').trim();
      }
      return null;
    });
    console.log('clicked create button:', clicked);
    if (!clicked) { console.log('  no create button found'); continue; }
    await wait(1500);

    // 抽屉截图
    const drawerPath = `${OUT_DIR}/${p.name}-drawer.png`;
    await page.screenshot({ path: drawerPath, fullPage: false });
    console.log('drawer screenshot:', drawerPath);

    // 检查抽屉是否在视口
    const drawerInfo = await page.evaluate(() => {
      const drawers = Array.from(document.querySelectorAll('.el-drawer'));
      if (!drawers.length) return { count: 0 };
      const visible = drawers.find(d => d.offsetParent !== null);
      if (!visible) return { count: drawers.length, visible: false };
      const rect = visible.getBoundingClientRect();
      const body = visible.querySelector('.el-drawer__body');
      return {
        count: drawers.length,
        visible: true,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bodyHasOverflow: body ? getComputedStyle(body).overflowY : 'no-body',
      };
    });
    console.log('drawer info:', JSON.stringify(drawerInfo));

    // 检查列表是否仍可见
    const listVisible = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('.el-table'));
      return tables.filter(t => t.offsetParent !== null).map(t => ({
        rows: t.querySelectorAll('.el-table__row').length,
        width: t.getBoundingClientRect().width,
      }));
    });
    console.log('list visible:', JSON.stringify(listVisible));

    // 关闭抽屉
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.el-drawer__close-btn');
      if (closeBtn) closeBtn.click();
    });
    await wait(800);
  }

  await browser.close();
  console.log('\ndone');
})().catch(e => { console.error('fatal:', e); process.exit(1); });
