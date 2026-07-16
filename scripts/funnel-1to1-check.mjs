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
await page.setViewport({ width: 1440, height: 1200 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

// 1:1 对照 user 给的 HTML
const v = await page.evaluate(() => {
  const L1 = document.querySelector('.chart-panel-container .left-box .process-box__1');
  const L1Content = L1?.querySelector('.process-box__content');
  const L1Value = L1?.querySelector('.value');
  const L1Tips = L1?.querySelector('.tips');
  const L1Icon = L1?.querySelector('.tips i');
  const R1 = document.querySelector('.chart-panel-container .right-box .process-box__1');
  const R1Tips = R1?.querySelector('.tips');
  const R1Icon = R1?.querySelector('.tips i');
  return {
    // user HTML 关键 1:1 检查
    L1_content_class: L1Content?.className,
    L1_value_inner: L1Value?.innerHTML,
    L1_tips_inner: L1Tips?.innerHTML,
    L1_icon_class: L1Icon?.className,
    L1_icon_style: L1Icon?.getAttribute('style'),
    R1_tips_inner: R1Tips?.innerHTML,
    R1_icon_class: R1Icon?.className,
    // main-item 类
    step0_class: document.querySelector('.chart-panel-container .main-item')?.className,
    // step 颜色
    step0_bg: document.querySelectorAll('.chart-panel-container .main-item')[0]?.style.backgroundColor,
    step4_bg: document.querySelectorAll('.chart-panel-container .main-item')[4]?.style.backgroundColor,
    step10_bg: document.querySelectorAll('.chart-panel-container .main-item')[10]?.style.backgroundColor,
    // tips 数量
    tipsL_count: document.querySelectorAll('.chart-panel-container .left-box .tips i').length,
    tipsR_count: document.querySelectorAll('.chart-panel-container .right-box .tips i').length,
  };
});
console.log(JSON.stringify(v, null, 2));
await browser.close();
