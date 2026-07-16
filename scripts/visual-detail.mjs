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
await page.setViewport({ width: 1920, height: 1500 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

const info = await page.evaluate(() => {
  // 1. frequency 表格 9 列对齐
  const freqRows = Array.from(document.querySelectorAll('.frequency-row')).slice(0, 4);
  const freqCols = freqRows.map(r => Array.from(r.querySelectorAll('.frequency-col')).map(c => ({
    text: c.textContent.trim().slice(0, 12),
    w: Math.round(c.getBoundingClientRect().width),
    x: Math.round(c.getBoundingClientRect().left),
  })));
  
  // 2. 表格卡片样式
  const card = document.querySelector('.frequency-table');
  const cardCS = getComputedStyle(card);
  
  // 3. 分页
  const pag = document.querySelector('.behavior-table-pagination');
  const pagCS = pag ? getComputedStyle(pag) : null;
  
  return {
    rowCount: freqRows.length,
    firstRowH: Math.round(freqRows[0].getBoundingClientRect().height),
    secondRowH: Math.round(freqRows[1].getBoundingClientRect().height),
    firstRowCols: freqCols[0].length,
    secondRowCols: freqCols[1].length,
    colWidths: freqCols[0]?.map(c => c.w),
    card: {
      bg: cardCS.backgroundColor,
      border: cardCS.borderRadius,
      boxShadow: cardCS.boxShadow.slice(0, 60),
    },
    pagination: pag ? {
      exists: true,
      bg: pagCS.backgroundColor,
      border: pagCS.borderRadius,
      height: Math.round(pag.getBoundingClientRect().height),
      visible: pag.offsetWidth > 0,
    } : { exists: false },
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
