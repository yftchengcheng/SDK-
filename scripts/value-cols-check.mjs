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

// 切到 value
await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('.behavior-master-item'));
  const it = items.find(el => el.textContent && el.textContent.trim().includes('用户价值'));
  if (it) it.click();
});
await new Promise(r => setTimeout(r, 2000));

const vInfo = await page.evaluate(() => {
  const tbl = document.querySelector('.value-table');
  if (!tbl) return { exists: false };
  const headerRow = document.querySelector('.value-row--header');
  const dataRow = document.querySelector('.value-row:not(.value-row--header)');
  return {
    exists: true,
    headerCols: headerRow ? Array.from(headerRow.querySelectorAll('.value-col')).map(c => c.textContent.trim().slice(0, 8)) : [],
    dataCols: dataRow ? Array.from(dataRow.querySelectorAll('.value-col')).map(c => ({
      text: c.textContent.trim().slice(0, 8),
      w: Math.round(c.getBoundingClientRect().width),
    })) : [],
    dataH: dataRow ? Math.round(dataRow.getBoundingClientRect().height) : 0,
    tblW: Math.round(tbl.getBoundingClientRect().width),
  };
});

await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('.behavior-master-item'));
  const it = items.find(el => el.textContent && el.textContent.trim().includes('使用时长'));
  if (it) it.click();
});
await new Promise(r => setTimeout(r, 2000));

const dInfo = await page.evaluate(() => {
  const tbl = document.querySelector('.duration-table');
  if (!tbl) return { exists: false };
  const dataRow = document.querySelector('.duration-row:not(.duration-row--header)');
  return {
    exists: true,
    dataCols: dataRow ? Array.from(dataRow.querySelectorAll('.duration-col')).map(c => ({
      text: c.textContent.trim().slice(0, 10),
      w: Math.round(c.getBoundingClientRect().width),
    })) : [],
    dataH: dataRow ? Math.round(dataRow.getBoundingClientRect().height) : 0,
    tblW: Math.round(tbl.getBoundingClientRect().width),
  };
});
console.log('VALUE:', JSON.stringify(vInfo, null, 2));
console.log('DURATION:', JSON.stringify(dInfo, null, 2));
await browser.close();
