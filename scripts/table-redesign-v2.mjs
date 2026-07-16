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

async function checkTable(name, viewport) {
  await page.setViewport(viewport);
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tk) => localStorage.setItem('token', tk), tk);
  await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));
  const info = await page.evaluate(() => {
    const tbl = document.querySelector('.frequency-table');
    if (!tbl) {
      // 看 body 内容
      return { error: 'no table', body: document.body.innerHTML.length, hasBehavior: !!document.querySelector('.behavior') };
    }
    const firstRow = document.querySelector('.frequency-row:not(.frequency-row--header)');
    const headerRow = document.querySelector('.frequency-row--header');
    const cs = firstRow ? getComputedStyle(firstRow) : null;
    const hcs = headerRow ? getComputedStyle(headerRow) : null;
    return {
      tblW: Math.round(tbl.getBoundingClientRect().width),
      tblBg: getComputedStyle(tbl).backgroundColor,
      tblBR: getComputedStyle(tbl).borderRadius,
      tblShadow: getComputedStyle(tbl).boxShadow,
      rowH: firstRow ? Math.round(firstRow.getBoundingClientRect().height) : 0,
      rowBg: cs?.backgroundColor,
      rowColor: cs?.color,
      rowFont: cs?.fontSize,
      headerH: headerRow ? Math.round(headerRow.getBoundingClientRect().height) : 0,
      headerBg: hcs?.backgroundColor,
      headerColor: hcs?.color,
      headerFont: hcs?.fontSize,
      headerWeight: hcs?.fontWeight,
    };
  });
  console.log(`=== ${name} ${viewport.width}px ===`);
  console.log(JSON.stringify(info, null, 2));
}

await checkTable('展示频次', { width: 1440, height: 1500 });
await checkTable('展示频次', { width: 1920, height: 1500 });
await browser.close();
