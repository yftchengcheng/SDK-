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
await page.setViewport({ width: 1440, height: 1600 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

// === 分天 ===
const dailyInfo = await page.evaluate(() => {
  const daily = document.querySelector('.funnel-bottom-daily');
  const summary = Array.from(document.querySelectorAll('.funnel-bottom-summary-item')).map(el => ({
    label: el.querySelector('.funnel-bottom-summary-label')?.textContent,
    value: el.querySelector('.funnel-bottom-summary-value')?.textContent,
  }));
  const tableRows = document.querySelectorAll('.funnel-bottom-table .el-table__row');
  const firstRowCells = tableRows[0] ? Array.from(tableRows[0].querySelectorAll('td')).map(td => td.textContent) : [];
  const chart = document.querySelector('.funnel-bottom-chart canvas');
  return {
    dailyVisible: !!daily,
    dailyHeight: daily?.getBoundingClientRect().height,
    summaryCount: summary.length,
    summary,
    tableRowCount: tableRows.length,
    firstRowCells,
    chartVisible: !!chart,
  };
});
console.log('=== 分天 ===');
console.log(JSON.stringify(dailyInfo, null, 2));
await page.screenshot({ path: 'public/funnel-daily.png', fullPage: true });

// === 切到趋势 ===
await page.evaluate(() => {
  // 找 "趋势" radio
  const radios = Array.from(document.querySelectorAll('.funnel-bottom-toolbar .el-radio-button__inner'));
  const trend = radios.find(r => r.textContent.trim() === '趋势');
  trend?.click();
});
await new Promise(r => setTimeout(r, 1500));
const trendInfo = await page.evaluate(() => {
  const trend = document.querySelector('.funnel-bottom-trend');
  const checks = document.querySelectorAll('.funnel-bottom-trend-checks .el-checkbox');
  const chart = document.querySelector('.funnel-bottom-chart canvas');
  // 抓 echarts 内部 series 数
  const ecInst = window.echarts ? window.echarts.getInstanceByDom(document.querySelector('.funnel-bottom-chart')) : null;
  let series = null;
  if (ecInst) {
    const opt = ecInst.getOption();
    series = opt.series?.length;
    legend = opt.legend?.[0]?.data;
  }
  return {
    trendVisible: !!trend,
    checkCount: checks.length,
    checkLabels: Array.from(checks).map(c => c.textContent.trim()),
    chartVisible: !!chart,
    series, legend,
  };
});
console.log('=== 趋势 ===');
console.log(JSON.stringify(trendInfo, null, 2));
await page.screenshot({ path: 'public/funnel-trend.png', fullPage: true });

await browser.close();
