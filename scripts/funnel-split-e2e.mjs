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
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
await page.goto('http://localhost:5000/report/funnel', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2000));
const result = await page.evaluate(() => {
  const blocks = Array.from(document.querySelectorAll('.funnel-block'));
  const lms = Array.from(document.querySelectorAll('.funnel-metric-left'));
  const rms = Array.from(document.querySelectorAll('.funnel-metric-right'));
  const bTops = blocks.map(b => Math.round(b.getBoundingClientRect().top));
  const lmTops = lms.map(m => Math.round(m.getBoundingClientRect().top));
  const rmTops = rms.map(m => Math.round(m.getBoundingClientRect().top));
  // 找 5 个左指标应该对齐的 block 索引
  const alignCheck = lms.map(m => {
    const idxAttr = m.style.gridRow; // "5"
    const idx = parseInt(idxAttr) - 1;
    const myTop = Math.round(m.getBoundingClientRect().top);
    const bTop = Math.round(blocks[idx]?.getBoundingClientRect().top || 0);
    return { idx, myTop, bTop, diff: Math.abs(myTop - bTop) };
  });
  return { bTops, lmTops, rmTops, alignCheck };
});
console.log(JSON.stringify(result, null, 2));
const maxDiff = Math.max(...result.alignCheck.map(c => c.diff));
console.log('MAX DIFF:', maxDiff, '(must be 0)');
await browser.close();
