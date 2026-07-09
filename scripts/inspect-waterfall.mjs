// 验证 waterfall 页面布局
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const OUT_DIR = process.env.OUT_DIR || '/tmp/verify-screenshots';
if (!VERIFY_TOKEN) throw new Error('VERIFY_TOKEN required');
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify({ developerId: 'dev_W7dOvj90HaEGi3Ez', email: 'testuser@example.com', role: 'developer', company: '验证公司' }));
    localStorage.setItem('userRole', 'developer');
  }, VERIFY_TOKEN);
  await page.goto('http://localhost:5000/waterfall', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  // 测出 panel 的所有 box 几何
  const measurements = await page.evaluate(() => {
    const data = {};
    const measure = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        padding: s.padding, margin: s.margin, gap: s.gap,
      };
    };
    data.wfPanel = measure('.wf-panel');
    data.wfPanelHeader = measure('.wf-panel-header');
    data.wfPanelTitles = measure('.wf-panel-titles');
    data.wfTitle = measure('.wf-title');
    data.wfSubtitle = measure('.wf-subtitle');
    data.wfStepper = measure('.wf-stepper');
    data.wfSteps = Array.from(document.querySelectorAll('.wf-step')).map((e) => measure('.wf-step'));
    data.wfBubbles = Array.from(document.querySelectorAll('.wf-step-bubble')).map((e) => measure('.wf-step-bubble'));
    data.wfDividers = Array.from(document.querySelectorAll('.wf-step-divider')).map((e) => measure('.wf-step-divider'));
    data.wfPanelDivider = measure('.wf-panel-divider');
    data.wfPanelBody = measure('.wf-panel-body');
    data.wfSelector = measure('.wf-selector');
    data.wfSelectorHead = measure('.wf-selector-head');
    data.wfSelect = measure('.wf-select');
    return data;
  });

  console.log(JSON.stringify(measurements, null, 2));

  await page.screenshot({ path: path.join(OUT_DIR, 'waterfall-before.png'), fullPage: false });
  console.log('saved waterfall-before.png');
} finally {
  await browser.close();
}
