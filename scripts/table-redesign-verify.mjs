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

// 测 3 个视口宽度
async function checkTable(name, viewport) {
  await page.setViewport(viewport);
  await page.goto('http://localhost:5000/report/behavior', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));
  // 默认在展示频次
  const info = await page.evaluate(() => {
    const tbl = document.querySelector('.frequency-table');
    if (!tbl) return { error: 'no table' };
    const firstRow = document.querySelector('.frequency-row:not(.frequency-row--header)');
    const headerRow = document.querySelector('.frequency-row--header');
    const cs = firstRow ? getComputedStyle(firstRow) : null;
    const hcs = headerRow ? getComputedStyle(headerRow) : null;
    const cells = firstRow ? Array.from(firstRow.querySelectorAll('.frequency-col')).map(c => {
      const ccs = getComputedStyle(c);
      return { text: c.textContent.trim().slice(0, 12), align: ccs.textAlign, w: Math.round(c.getBoundingClientRect().width) };
    }) : [];
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
      cells,
    };
  });
  console.log(`=== ${name} ${viewport.width}px ===`);
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: `public/table-${viewport.width}.png`, fullPage: true });
}

await checkTable('展示频次', { width: 1440, height: 1500 });
await checkTable('展示频次', { width: 1920, height: 1500 });

// 切到用户价值
await page.evaluate(() => {
  Array.from(document.querySelectorAll('.behavior-master-item'))
    .find(i => i.textContent.includes('用户价值'))?.click();
});
await new Promise(r => setTimeout(r, 1500));
await page.setViewport({ width: 1920, height: 1500 });
const value = await page.evaluate(() => {
  const tbl = document.querySelector('.value-table');
  return { w: Math.round(tbl.getBoundingClientRect().width) };
});
console.log('value tbl w:', value.w);
await page.screenshot({ path: 'public/value-1920.png', fullPage: true });

await browser.close();
