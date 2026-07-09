import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const OUT_DIR = process.env.OUT_DIR || '/tmp/verify-screenshots';
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
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

  // 拦截所有网络请求，看 traffic-group/list 的请求参数
  const trafficRequests = [];
  page.on('request', (req) => {
    if (req.url().includes('traffic-group/list')) {
      trafficRequests.push({ url: req.url(), method: req.method() });
    }
  });
  page.on('response', async (res) => {
    if (res.url().includes('traffic-group/list')) {
      try {
        const body = await res.text();
        trafficRequests[trafficRequests.length - 1].response = body.substring(0, 200);
        trafficRequests[trafficRequests.length - 1].status = res.status();
      } catch {}
    }
  });

  await page.goto('http://localhost:5000/traffic-group', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  const m = await page.evaluate(() => {
    // el-select 的 placeholder 在有值时会变成 v-model 的 text
    const elSelect = document.querySelector('.page-filter .el-select');
    const selectInput = elSelect?.querySelector('.el-select__placeholder') || elSelect?.querySelector('.el-input__inner');
    const placeholderText = elSelect?.querySelector('.el-select__placeholder span')?.textContent || '';
    // 拿 el-select 的 placeholder 父节点的 text（v-model 实际值）
    const selectedEl = elSelect?.querySelector('.el-select__selected-item');
    return {
      placeholderVisible: !!elSelect?.querySelector('.el-select__placeholder.is-transparent, .el-select__placeholder[style*="display: none"]'),
      placeholderText,
      selectedItemText: selectedEl?.textContent || null,
    };
  });
  console.log('select state:', JSON.stringify(m, null, 2));
  console.log('traffic-group/list requests:', JSON.stringify(trafficRequests, null, 2));

  await page.screenshot({ path: path.join(OUT_DIR, 'traffic-group-default.png'), fullPage: false });
  console.log('saved');
} finally {
  await browser.close();
}
