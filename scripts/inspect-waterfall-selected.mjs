import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const OUT_DIR = process.env.OUT_DIR || '/tmp/verify-screenshots';
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
  await new Promise((r) => setTimeout(r, 2500)); // 等 fetchPlacements 完成

  // 直接点击 el-select 打开下拉, 选第一个
  await page.click('.wf-select');
  await new Promise((r) => setTimeout(r, 800));
  // 拿 el-select-dropdown__item 第一项
  const firstOpt = await page.$('.el-select-dropdown__item');
  if (firstOpt) {
    await firstOpt.click();
    await new Promise((r) => setTimeout(r, 1000));
  }

  const m = await page.evaluate(() => {
    const $ = (s) => document.querySelector(s);
    const rect = (el) => el ? (() => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null;
    return {
      wfPanel: rect($('.wf-panel')),
      wfStepper: rect($('.wf-stepper')),
      wfStep0: rect($('.wf-step')),
      wfStepActive: rect($('.wf-step-active')),
      wfPanelBody: rect($('.wf-panel-body')),
      wfCurrent: rect($('.wf-current')),
      wfCurrentHead: rect($('.wf-current-head')),
      wfSelector: rect($('.wf-selector')),
    };
  });
  console.log(JSON.stringify(m, null, 2));

  await page.screenshot({ path: path.join(OUT_DIR, 'waterfall-selected.png'), fullPage: false });
  console.log('saved');
} finally {
  await browser.close();
}
