import puppeteer from 'puppeteer';
import http from 'http';

async function login(): Promise<{ token: string; developerId: string }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email: 'smoketest@coze.com', password: 'SmokeTest123' });
    const req = http.request('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.code === 0) resolve({ token: json.data.token, developerId: json.data.developerId });
          else reject(new Error(body));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const pages: { url: string; path: string; filename: string }[] = [
  { url: 'http://localhost:5000/dashboard', path: '/dashboard', filename: 'screenshot_dashboard.png' },
  { url: 'http://localhost:5000/report', path: '/report', filename: 'screenshot_report.png' },
  { url: 'http://localhost:5000/network', path: '/network', filename: 'screenshot_network.png' },
  { url: 'http://localhost:5000/reconciliation', path: '/reconciliation', filename: 'screenshot_reconciliation.png' },
];

async function main() {
  console.log('1. 登录获取 token...');
  const { token, developerId } = await login();
  console.log(`   ✓ Token: ${token.slice(0, 20)}...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const allErrors: string[] = [];

  for (const pageInfo of pages) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    page.setDefaultTimeout(30000);

    page.on('pageerror', (err) => {
      allErrors.push(`[${pageInfo.path}] [PageError] ${err.message}`);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        allErrors.push(`[${pageInfo.path}] [Console] ${msg.text()}`);
      }
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        allErrors.push(`[${pageInfo.path}] [HTTP ${response.status()}] ${response.url()}`);
      }
    });

    await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ token, developerId }) => {
      localStorage.clear();
      localStorage.setItem('token', token);
      localStorage.setItem('userInfo', JSON.stringify({ developerId, email: 'smoketest@coze.com' }));
    }, { token, developerId });

    console.log(`${pageInfo.path}...`);
    await page.goto(pageInfo.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 5000));

    await page.screenshot({ path: `/tmp/${pageInfo.filename}`, fullPage: true });
    console.log('   ✓ 已截图');
    await page.close();
  }

  await browser.close();

  console.log('\n=== 错误汇总 ===');
  if (allErrors.length === 0) {
    console.log('   ✓ 无错误');
  } else {
    for (const err of allErrors) {
      console.log('  -', err);
    }
  }
}

main().catch((err) => { console.error('Error:', err); process.exit(1); });
