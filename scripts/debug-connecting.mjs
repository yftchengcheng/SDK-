// 用 puppeteer 模拟用户刷新页面，抓 [vite] connecting 之后的真实 timeline
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();

const t0 = Date.now();
const consoleEvents = [];
const requests = [];

page.on('console', (msg) => {
  const t = Date.now() - t0;
  consoleEvents.push({ t, type: msg.type(), text: msg.text() });
});
page.on('request', (req) => {
  const t = Date.now() - t0;
  requests.push({ t, phase: 'start', url: req.url().replace('http://localhost:5000', '') });
});
page.on('requestfinished', (req) => {
  const t = Date.now() - t0;
  const resp = req.response();
  const timing = resp ? resp.timing() : null;
  requests.push({
    t,
    phase: 'finish',
    url: req.url().replace('http://localhost:5000', ''),
    status: resp ? resp.status() : null,
    duration: timing ? timing.receiveHeadersEnd : null,
  });
});
page.on('requestfailed', (req) => {
  const t = Date.now() - t0;
  requests.push({ t, phase: 'fail', url: req.url().replace('http://localhost:5000', ''), err: req.failure()?.errorText });
});

// 注入时间标记：从这里开始计时
await page.evaluateOnNewDocument(() => {
  window.__events = [];
  const t0 = performance.now();
  const log = (label) => window.__events.push({ t: Math.round(performance.now() - t0), label });
  window.__log = log;
  log('evaluateOnNewDocument-installed');
});

await page.goto('http://localhost:5000/', { waitUntil: 'networkidle0', timeout: 30000 });

// 收集 DOM 事件
const domEvents = await page.evaluate(() => window.__events || []);

// 收集 DOM state
const state = await page.evaluate(() => {
  return {
    appInnerHTML: document.getElementById('app')?.innerHTML?.slice(0, 200),
    appChildCount: document.getElementById('app')?.childElementCount || 0,
    title: document.title,
    docReadyState: document.readyState,
  };
});

await browser.close();

console.log('\n=== DOM events (from page) ===');
domEvents.forEach((e) => console.log(`  +${e.t}ms  ${e.label}`));

console.log('\n=== Console events ===');
consoleEvents.forEach((e) => console.log(`  +${e.t}ms  [${e.type}]  ${e.text}`));

console.log('\n=== State ===');
console.log(state);

console.log('\n=== Network (start/finish) ===');
requests.forEach((r) => {
  if (r.phase === 'start') console.log(`  +${r.t}ms  START   ${r.url}`);
  else if (r.phase === 'finish') console.log(`  +${r.t}ms  ${r.status}  (${Math.round(r.duration)}ms)  ${r.url}`);
  else console.log(`  +${r.t}ms  FAIL    ${r.err}  ${r.url}`);
});
