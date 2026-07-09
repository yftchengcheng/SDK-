import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1400, deviceScaleFactor: 1 });

const allResponses = [];
page.on('response', async (res) => {
  const url = res.url();
  try {
    const body = await res.text();
    allResponses.push({ url: url.replace('http://localhost:5000',''), status: res.status(), body: body.slice(0, 500) });
  } catch {}
});

// 1. 访问 login 页
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
console.log('=== Login page loaded ===');

// 2. 看 input 标签
const inputs = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('input, .el-input__inner, [type=text], [type=password]')).map(i => ({
    tag: i.tagName,
    type: i.type,
    name: i.name,
    placeholder: i.placeholder,
    classList: Array.from(i.classList).join(' '),
  }));
});
console.log('=== INPUTS ===', JSON.stringify(inputs, null, 2));

// 3. 真实填写
await page.evaluate(() => {
  const ins = Array.from(document.querySelectorAll('input'));
  ins.forEach(i => {
    if (i.type === 'text' || i.type === 'email') i.value = 'dashboard-test@demo.com';
    if (i.type === 'password') i.value = 'Test123456';
  });
});

// 4. 找登录按钮
const buttons = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button')).map(b => ({
    text: b.textContent?.trim().slice(0, 20),
    classList: Array.from(b.classList).join(' '),
  }));
});
console.log('=== BUTTONS ===', JSON.stringify(buttons, null, 2));

// 5. 点击登录
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const loginBtn = btns.find(b => b.textContent?.includes('登录') || b.textContent?.includes('登录') || b.textContent?.toLowerCase().includes('sign in'));
  if (loginBtn) loginBtn.click();
});

await new Promise(r => setTimeout(r, 3000));
console.log('=== AFTER LOGIN URL ===', page.url());

// 6. 跳到 dashboard
await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 5000));

// 7. 看 income cards
const data = await page.evaluate(() => {
  const incomeCards = Array.from(document.querySelectorAll('.stat-card--income')).map(card => ({
    label: card.querySelector('.stat-card__label')?.textContent?.trim(),
    value: card.querySelector('.stat-card__value')?.textContent?.trim(),
  }));
  const localStorageKeys = Object.keys(localStorage);
  const token = localStorage.getItem('token');
  const userInfo = localStorage.getItem('userInfo');
  return { incomeCards, localStorageKeys, token: token?.slice(0, 30), userInfo: userInfo?.slice(0, 200) };
});
console.log('=== INCOME CARDS ===', JSON.stringify(data.incomeCards, null, 2));
console.log('=== localStorage token (first 30 chars) ===', data.token);
console.log('=== userInfo ===', data.userInfo);
console.log('=== localStorage keys ===', data.localStorageKeys);

console.log('=== ALL API RESPONSES (last 20) ===');
allResponses.slice(-20).forEach(r => console.log(`[${r.status}] ${r.url} => ${r.body.slice(0, 150)}`));

await browser.close();
