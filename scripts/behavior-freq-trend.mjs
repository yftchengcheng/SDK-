import puppeteer from 'puppeteer';

const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'e2e' + Date.now() + '@e2e.com', password: 'Test123456', company: 'e2e', companyShortName: 'e2e', contactName: 'e2e', phone: '13800000000', accessType: 1 }),
});
const tk = (await reg.json()).data.token;
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1200 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

const info = await page.evaluate(() => {
  // 展示频次 tab 默认是激活
  const layout = document.querySelector('.behavior-freq-layout');
  const trendPane = document.querySelector('.behavior-freq-trend-pane');
  const kpi = document.querySelectorAll('.freq-trend-kpi-item');
  const chart = document.querySelector('.freq-trend-chart canvas');
  const picker = document.querySelector('.freq-trend-picker');
  const tablePane = document.querySelector('.behavior-freq-table-pane .frequency-table');
  return {
    layoutVisible: !!layout,
    layoutCols: layout ? getComputedStyle(layout).gridTemplateColumns : '',
    trendPaneVisible: !!trendPane,
    kpiCount: kpi.length,
    kpi: Array.from(kpi).map(k => ({
      name: k.querySelector('.freq-trend-kpi-name')?.textContent,
      value: k.querySelector('.freq-trend-kpi-value')?.textContent,
      delta: k.querySelector('.freq-trend-kpi-delta')?.textContent,
      color: getComputedStyle(k.querySelector('.freq-trend-kpi-value')).color,
    })),
    chartVisible: !!chart,
    chartW: chart?.width,
    chartH: chart?.height,
    tableVisible: !!tablePane,
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'public/behavior-freq-trend.png', fullPage: true });
await browser.close();
