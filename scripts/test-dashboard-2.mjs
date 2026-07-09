import puppeteer from 'puppeteer';

async function testWithAccount(email, password, label) {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1400, deviceScaleFactor: 1 });
  
  const apiResponses = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/v1/console/dashboard/')) {
      try {
        const body = await res.text();
        apiResponses.push({ url: url.split('?')[0].split('/api/v1/console/dashboard/')[1], status: res.status(), body: body.slice(0, 200) });
      } catch {}
    }
  });
  
  // 先访问登录页
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  // 填表
  await page.evaluate((em, pw) => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(i => {
      if (i.type === 'email' || i.placeholder?.includes('邮箱') || i.placeholder?.includes('账号')) i.value = em;
      if (i.type === 'password') i.value = pw;
    });
  }, email, password);
  // 找登录按钮点击
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    btns.forEach(b => { if (b.textContent.includes('登录') || b.textContent.includes('sign in')) b.click(); });
  });
  await new Promise(r => setTimeout(r, 3000));
  
  await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));
  
  const data = await page.evaluate(() => {
    const incomeCards = Array.from(document.querySelectorAll('.stat-card--income')).map(card => ({
      label: card.querySelector('.stat-card__label')?.textContent?.trim(),
      period: card.querySelector('.stat-card__period')?.textContent?.trim(),
      value: card.querySelector('.stat-card__value')?.textContent?.trim(),
    }));
    return { incomeCards };
  });
  
  console.log(`=== ${label} (${email}) ===`);
  console.log('Income cards:', JSON.stringify(data.incomeCards));
  console.log('APIs:', apiResponses.map(r => `[${r.status}] ${r.url} => ${r.body}`).join('\n'));
  
  await browser.close();
}

// 测两个账号
await testWithAccount('dash_test2@coze.com', 'Test123456', 'A: dash_test2@coze.com');
await new Promise(r => setTimeout(r, 1000));
await testWithAccount('dashboard-test@demo.com', 'Test123456', 'B: dashboard-test@demo.com');
