// 真实打开浏览器，登录 → 进入 /network → 切到「广告平台账号」Tab → 截图
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');

const BASE = 'http://localhost:5000';
const reg = await fetch(`${BASE}/api/v1/auth/register`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'shot-' + Date.now() + '@x.com', password: 'Test123456',
    company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
  }),
}).then(r => r.json());
const token = reg.data?.token;

// 提前创建 CSJ/YLH/SIG 账号（这样列表里就有这几行可以看 icon）
const nets = await fetch(`${BASE}/api/v1/console/network/list`, { headers: { Authorization: 'Bearer ' + token } }).then(r => r.json());
const csj = nets.data.list.find(n => n.network_code === 'CSJ');
const ylh = nets.data.list.find(n => n.network_code === 'YLH');
const sig = nets.data.list.find(n => n.network_code === 'SIGMOB');
for (const [name, n] of [['CSJ', csj], ['YLH', ylh], ['SIG', sig]]) {
  if (!n) continue;
  await fetch(`${BASE}/api/v1/console/network/account/create`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({
      network_def_id: n.id, account_name: `${name}测试账号`, account_id: `${name.toLowerCase()}-001`, credentials: { app_id: 'x' },
    }),
  });
}
const browser = await puppeteer.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message));
page.on('console', m => { if (m.type() === 'error') console.log('[console.error]', m.text()); });

await page.setViewport({ width: 1440, height: 900 });

// 用 localStorage 登录（前端路由 guard 读 localStorage）
await page.evaluateOnNewDocument((t) => {
  localStorage.setItem('token', t);
  localStorage.setItem('developerId', '');
}, token);
await page.goto(BASE + '/network', { waitUntil: 'networkidle2', timeout: 30000 });
// 重新设置 localStorage（evaluateOnNewDocument 在新 document 时才生效，goto 后 document 已存在）
await page.evaluate((t) => localStorage.setItem('token', t), token);
// 拦截 /account/list 看真实响应（必须在 reload 前注册）
const networkResponses = [];
page.on('response', async (resp) => {
  const url = resp.url();
  if (url.includes('/account/list') || url.includes('/network/list')) {
    try {
      const j = await resp.json();
      networkResponses.push({ url, status: resp.status(), body: j });
    } catch (e) {}
  }
});
await page.goto(BASE + '/network', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 4000));

try {
  await page.click('text=广告平台账号');
} catch (e) {
  console.log('click tab failed:', e.message);
}
await new Promise(r => setTimeout(r, 3500));

// 调试：dump 整个 body 头
const head = await page.evaluate(() => {
  return {
    url: location.href,
    title: document.title,
    elTabs: document.querySelectorAll('.el-tabs__item').length,
    elTabLabels: Array.from(document.querySelectorAll('.el-tabs__item')).map(e => e.innerText),
    activeIdx: Array.from(document.querySelectorAll('.el-tabs__item')).findIndex(e => e.classList.contains('is-active')),
  };
});
console.log('=== page state ===');
console.log(JSON.stringify(head, null, 2));

// 检查 page 里实际给 Vue 的 row 数据
const rowDump = await page.evaluate(() => {
  const rows = document.querySelectorAll('.el-table__row');
  return Array.from(rows).map(r => ({
    html: r.outerHTML.slice(0, 600),
    data: Array.from(r.querySelectorAll('.nam-net-avatar')).map(a => ({
      cls: a.className,
      inner: a.innerHTML.slice(0, 200),
    })),
  }));
});
console.log('=== Vue row DOM ===');
for (const d of rowDump) console.log(JSON.stringify(d));

// 拦截网络响应后，访问 window 上挂的 fetch 失败没
const fetchUrl = await page.evaluate(async () => {
  try {
    const r = await fetch('/api/v1/console/network/account/list', { credentials: 'include' });
    const j = await r.json();
    return j.data.list.slice(0, 3);
  } catch (e) { return 'err: ' + e.message; }
});
console.log('=== /account/list direct fetch ===');
console.log(JSON.stringify(fetchUrl, null, 2));

console.log('=== /account/list 响应 ===');
for (const r of networkResponses) {
  const rows = r.body?.data?.list || [];
  console.log('row count:', rows.length);
  for (const x of rows) console.log(' ', JSON.stringify(x).slice(0, 1500));
}

const dataDump = await page.evaluate(() => {
  const avatars = document.querySelectorAll('.nam-net-avatar');
  return Array.from(avatars).slice(0, 5).map(el => ({
    outerHTML: el.outerHTML.slice(0, 500),
  }));
});
console.log('=== DOM dump ===');
for (const d of dataDump) console.log(JSON.stringify(d));

await page.screenshot({ path: '/tmp/nam-icon-check.png', fullPage: true });
console.log('screenshot: /tmp/nam-icon-check.png');

const imgs = await page.$$eval('img.nam-net-avatar-img', els => els.map(e => ({ src: e.src, alt: e.alt, w: e.naturalWidth, h: e.naturalHeight })));
console.log('avatar <img> count:', imgs.length);
for (const i of imgs) console.log(' ', i);

const avatars = await page.$$eval('.nam-net-avatar', els => els.map(e => ({
  html: e.innerHTML.slice(0, 300),
  classes: e.className,
})));
console.log('avatar container count:', avatars.length);
for (const a of avatars.slice(0, 5)) console.log(' ', a);

await browser.close();
