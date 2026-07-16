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

// 切到趋势
await page.evaluate(() => {
  const radios = Array.from(document.querySelectorAll('.funnel-bottom-toolbar .el-radio-button__inner'));
  const trend = radios.find(r => r.textContent.trim() === '趋势');
  trend?.click();
});
await new Promise(r => setTimeout(r, 1500));

const trendInfo = await page.evaluate(() => {
  const trend = document.querySelector('.funnel-bottom-trend');
  const checks = document.querySelectorAll('.funnel-bottom-trend-checks .el-checkbox');
  const chartCanvas = document.querySelector('.funnel-bottom-trend .funnel-bottom-chart canvas');
  // 拿 echarts 实例
  const chartEl = document.querySelector('.funnel-bottom-trend .funnel-bottom-chart > div');
  const ec = window.echarts;
  let seriesInfo = null;
  if (ec && chartEl) {
    const inst = ec.getInstanceByDom(chartEl);
    if (inst) {
      const opt = inst.getOption();
      seriesInfo = {
        count: opt.series?.length,
        names: opt.series?.map(s => s.name),
        dataLens: opt.series?.map(s => s.data?.length),
        firsts: opt.series?.map(s => Array.isArray(s.data) ? s.data.slice(0, 5) : null),
        xDataLen: opt.xAxis?.[0]?.data?.length,
        xSample: opt.xAxis?.[0]?.data?.slice(0, 5),
        legendData: opt.legend?.[0]?.data,
      };
    }
  }
  return {
    trendVisible: !!trend,
    trendHeight: trend?.getBoundingClientRect().height,
    checkCount: checks.length,
    checkLabels: Array.from(checks).map(c => c.textContent.trim()),
    chartCanvas: !!chartCanvas,
    seriesInfo,
  };
});
console.log('=== 趋势 ===');
console.log(JSON.stringify(trendInfo, null, 2));
await page.screenshot({ path: 'public/funnel-trend.png', fullPage: true });

// 试切一个 checkbox 看是否动态更新
await page.evaluate(() => {
  const checks = Array.from(document.querySelectorAll('.funnel-bottom-trend-checks .el-checkbox'));
  // 选 "isReady成功率" 和 "展示Gap"
  const targetNames = ['isReady成功率', '展示Gap'];
  for (const c of checks) {
    const lbl = c.querySelector('.funnel-bottom-trend-chip')?.textContent?.trim();
    if (targetNames.includes(lbl)) c.click();
  }
});
await new Promise(r => setTimeout(r, 800));
const trend2 = await page.evaluate(() => {
  const chartEl = document.querySelector('.funnel-bottom-trend .funnel-bottom-chart > div');
  const inst = window.echarts.getInstanceByDom(chartEl);
  const opt = inst.getOption();
  return {
    seriesCount: opt.series?.length,
    seriesNames: opt.series?.map(s => s.name),
  };
});
console.log('=== 勾选后 ===');
console.log(JSON.stringify(trend2, null, 2));
await page.screenshot({ path: 'public/funnel-trend-2.png', fullPage: true });

await browser.close();
