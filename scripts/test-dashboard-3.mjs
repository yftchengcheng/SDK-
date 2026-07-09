import puppeteer from 'puppeteer';

async function testWithAccount(email, password, label) {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1400, deviceScaleFactor: 1 });
  
  // 监听所有响应
  const allResponses = [];
  page.on('response', async (res) => {
    const url = res.url();
    allResponses.push({ url, status: res.status() });
  });
  
  // 直接 API 登录
  const loginRes = await page.evaluate(async (em, pw) => {
    const r = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: em, password: pw, company: '' })
    });
    return { status: r.status, body: await r.text() };
  }, email, password);
  
  console.log(`=== ${label} (${email}) ===`);
  console.log('Login response:', loginRes.status, loginRes.body.slice(0, 200));
  
  // 用返回的 token 访问
  const dashRes = await page.evaluate(async () => {
    const r = await fetch('/api/v1/console/dashboard/overview', { credentials: 'include' });
    return { status: r.status, body: await r.text() };
  });
  console.log('Overview response:', dashRes.status, dashRes.body.slice(0, 200));
  
  await browser.close();
}

await testWithAccount('dash_test2@coze.com', 'Test123456', 'A: dash_test2@coze.com');
await new Promise(r => setTimeout(r, 500));
await testWithAccount('dashboard-test@demo.com', 'Test123456', 'B: dashboard-test@demo.com');
