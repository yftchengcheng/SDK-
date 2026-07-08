import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });

const t0 = Date.now();
const events = [];
const requests = [];
const wsConns = [];

page.on('console', (msg) => events.push({ t: Date.now() - t0, type: msg.type(), text: msg.text() }));
page.on('request', (req) => requests.push({ t: Date.now() - t0, phase: 'start', url: req.url().replace('http://localhost:5000','') }));
page.on('requestfinished', (req) => {
  const r = req.response();
  requests.push({ t: Date.now() - t0, phase: 'finish', url: req.url().replace('http://localhost:5000',''), status: r?.status() });
});
page.on('requestfailed', (req) => requests.push({ t: Date.now() - t0, phase: 'fail', url: req.url().replace('http://localhost:5000',''), err: req.failure()?.errorText }));
page.on('websocket', (ws) => {
  wsConns.push({ t: Date.now() - t0, url: ws.url(), opened: true });
  ws.on('close', () => wsConns[wsConns.length - 1].closed = Date.now() - t0);
  ws.on('framesent', (e) => wsConns[wsConns.length - 1].sent = (wsConns[wsConns.length - 1].sent || 0) + 1);
  ws.on('framereceived', (e) => wsConns[wsConns.length - 1].recv = (wsConns[wsConns.length - 1].recv || 0) + 1);
});

await page.goto('http://localhost:5000/', { waitUntil: 'networkidle0', timeout: 30000 });

// 等 5s 让一切稳定
await new Promise(r => setTimeout(r, 5000));

const state = await page.evaluate(() => ({
  appHTML: document.getElementById('app')?.innerHTML?.slice(0, 500),
  appChildCount: document.getElementById('app')?.childElementCount,
  title: document.title,
  docReadyState: document.readyState,
  url: location.href,
  text: document.body.innerText.slice(0, 300),
  allWsOpen: typeof WebSocket === 'function',
}));

await page.screenshot({ path: '/tmp/connecting-state.png', fullPage: true });

// 模拟「网络抖动」：等 3s 看是否有重连行为
const t_before = Date.now();
await new Promise(r => setTimeout(r, 3000));
const events3s = events.filter(e => e.t >= t_before - t0);

await browser.close();

console.log('\n=== WebSocket connections ===');
wsConns.forEach(w => console.log(`  +${w.t}ms  ${w.url}  sent=${w.sent || 0} recv=${w.recv || 0} closed=${w.closed !== undefined ? '+' + (w.closed - w.t) + 'ms' : 'no'}`));

console.log('\n=== State ===');
console.log(state);

console.log('\n=== Console (last 30) ===');
events.slice(-30).forEach(e => console.log(`  +${e.t}ms  [${e.type}]  ${e.text}`));

console.log('\n=== Any error/warn? ===');
const errs = events.filter(e => e.type === 'error' || e.type === 'warning');
console.log(`count: ${errs.length}`);
errs.forEach(e => console.log(`  +${e.t}ms  [${e.type}]  ${e.text.slice(0, 200)}`));
