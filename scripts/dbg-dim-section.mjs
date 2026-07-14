// 抓维度参数 section 完整 DOM
import puppeteer from 'puppeteer';
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const register = async () => {
  const r = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `dbg2${Date.now()}@e2e.com`, password: 'Test123456', company: 'e2e', companyShortName: 'e2e',
      contactName: 'e2e', phone: '13800000000', accessType: 1,
    }),
  });
  return (await r.json()).data.token;
};

const main = async () => {
  const tk = await register();
  // 建 app + placement
  const a = await fetch('http://localhost:5000/api/v1/console/app/create', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tk}` },
    body: JSON.stringify({ appName: 'Dbg2', packageName: `com.dbg2.${Date.now()}`, platform: 1 }),
  }).then(r => r.json());
  const appKey = a.data.app_key;
  await fetch('http://localhost:5000/api/v1/console/placement/create', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tk}` },
    body: JSON.stringify({ appKey, name: 'Ban', format: 1 }),
  });
  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tk) => { localStorage.setItem('token', tk); }, tk);
  await page.goto('http://localhost:5000/ad-source', { waitUntil: 'networkidle2' });
  await sleep(2000);
  // 选 app+placement+打开 drawer
  await page.evaluate(() => document.querySelectorAll('.el-select')[0]?.click());
  await sleep(300);
  await page.evaluate(() => document.querySelector('.el-select-dropdown__item')?.click());
  await sleep(500);
  await page.evaluate(() => document.querySelectorAll('.el-select')[1]?.click());
  await sleep(300);
  await page.evaluate(() => document.querySelector('.el-select-dropdown__item')?.click());
  await sleep(500);
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /添加广告源/.test(x.textContent));
    b?.click();
  });
  await sleep(1500);

  // 找「广告源维度参数」title
  const out = await page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll('.page-form-section-title'));
    const t = titles.find((x) => /广告源维度参数/.test(x.textContent || ''));
    if (!t) return 'NO TITLE';
    const sec = t.closest('.page-form-section');
    return sec ? sec.outerHTML : 'NO SEC';
  });
  process.stdout.write('===FULL HTML===\n' + out + '\n===END===\n');
  await browser.close();
};
main().catch(console.error);
