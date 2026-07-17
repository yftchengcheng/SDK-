import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('file:///workspace/projects/public/architecture/01_0__系统整体架构.png', { waitUntil: 'networkidle0' });
  const dims = await page.evaluate(() => {
    const img = document.querySelector('img');
    return img ? { w: img.naturalWidth, h: img.naturalHeight } : null;
  });
  console.log('PNG dims:', dims);
} finally { await browser.close(); }
