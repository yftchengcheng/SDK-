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
await page.setViewport({ width: 1600, height: 1600 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

// 切到「用户价值」tab
await page.evaluate(() => {
  const tabs = Array.from(document.querySelectorAll('.behavior-subtabs .el-radio-button__inner, .el-tabs__item'));
  // 找 "用户价值"
  const target = tabs.find(t => t.textContent.trim() === '用户价值');
  target?.click();
});
await new Promise(r => setTimeout(r, 1500));

const info = await page.evaluate(() => {
  const trend = document.querySelector('.behavior-value-trend-pane');
  const table = document.querySelector('.behavior-value-table-pane');
  const chart = document.querySelector('.behavior-value-trend-pane canvas');
  const kpis = document.querySelectorAll('.behavior-value-trend-pane .freq-trend-kpi-item');
  const pickerBtn = Array.from(document.querySelectorAll('.behavior-value-trend-pane button')).find(b => b.textContent.trim() === '指标选择');
  const valueTable = document.querySelector('.behavior-value-table-pane .value-table');
  const headerCols = document.querySelectorAll('.behavior-value-table-pane .value-row--header .value-col');
  const rows = document.querySelectorAll('.behavior-value-table-pane .value-row:not(.value-row--header)');
  return {
    trendVisible: !!trend,
    trendH: trend ? Math.round(trend.getBoundingClientRect().height) : 0,
    chartVisible: !!chart,
    chartW: chart?.width,
    kpiCount: kpis.length,
    kpiNames: Array.from(kpis).map(k => k.querySelector('.freq-trend-kpi-name')?.textContent),
    pickerBtnFound: !!pickerBtn,
    tableVisible: !!table,
    tableW: table ? Math.round(table.getBoundingClientRect().width) : 0,
    valueTable: !!valueTable,
    headerCols: Array.from(headerCols).map(c => c.textContent.trim()),
    rowCount: rows.length,
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'public/value-tab.png', fullPage: true });
await browser.close();
