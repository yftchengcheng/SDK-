import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 2000));
await page.evaluate(async () => {
  const r = await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'dashboard-test@demo.com', password: 'Test123456' }) });
  const j = await r.json();
  if (j.data && j.data.token) { localStorage.setItem('token', j.data.token); if (j.data.userInfo) localStorage.setItem('userInfo', JSON.stringify(j.data.userInfo)); }
});
await page.goto('http://localhost:5000/app', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000));
const btn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'SDK预置策略'));
await btn.click();
await new Promise(r => setTimeout(r, 3000));
// 选一个 placement 让 chip 显示数字
await page.evaluate(() => {
  const cbs = document.querySelectorAll('.el-dialog__body .el-checkbox');
  if (cbs.length > 0) cbs[0].click();
});
await new Promise(r => setTimeout(r, 1000));
const status = await page.evaluate(() => {
  const chip = document.querySelector('.policy-footer__chip');
  const chipNum = document.querySelector('.policy-footer__chip-num');
  const chipLabel = document.querySelector('.policy-footer__chip-label');
  const exportBtn = document.querySelector('.policy-footer__actions .el-button--primary');
  const allBtn = document.querySelector('.policy-footer__actions');
  return {
    chipFound: !!chip,
    chipText: chip ? chip.textContent.replace(/\s+/g, '').trim() : '',
    chipBg: chip ? getComputedStyle(chip).backgroundColor : 'N/A',
    chipNumFound: !!chipNum,
    chipNumText: chipNum ? chipNum.textContent.trim() : '',
    chipNumColor: chipNum ? getComputedStyle(chipNum).color : 'N/A',
    chipNumFontSize: chipNum ? getComputedStyle(chipNum).fontSize : 'N/A',
    chipNumFontWeight: chipNum ? getComputedStyle(chipNum).fontWeight : 'N/A',
    chipLabelText: chipLabel ? chipLabel.textContent.trim() : '',
    exportBtnFound: !!exportBtn,
    exportBtnBg: exportBtn ? getComputedStyle(exportBtn).backgroundImage.slice(0, 50) : 'N/A',
    exportBtnDisabled: exportBtn ? exportBtn.disabled : 'N/A',
  };
});
console.log(JSON.stringify(status, null, 2));
await page.screenshot({ path: '/tmp/dialog-visual.png' });
await browser.close();
