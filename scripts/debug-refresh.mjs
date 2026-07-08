import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const rounds = 3;
for (let r = 1; r <= rounds; r++) {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);  // 禁用缓存
  await page.setViewport({ width: 1280, height: 800 });

  const t0 = Date.now();
  const events = [];
  page.on('console', (msg) => events.push({ t: Date.now() - t0, type: msg.type(), text: msg.text() }));

  try {
    await page.goto('http://localhost:5000/', { waitUntil: 'load', timeout: 30000 });
    const t_loaded = Date.now() - t0;

    // 等待 main.ts 真正执行
    await page.waitForFunction(
      () => document.getElementById('app')?.childElementCount > 0,
      { timeout: 15000 }
    );
    const t_mounted = Date.now() - t0;

    const vitals = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      const slow = resources.filter(r => r.duration > 100).map(r => ({ name: r.name.replace('http://localhost:5000', ''), dur: Math.round(r.duration) }));
      return {
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        loadEvent: nav ? Math.round(nav.loadEventEnd) : null,
        totalResources: resources.length,
        slowResources: slow,
        text: document.body.innerText.slice(0, 100),
      };
    });

    console.log(`\n=== Round ${r} ===`);
    console.log(`  page loaded: ${t_loaded}ms`);
    console.log(`  app mounted: ${t_mounted}ms`);
    console.log(`  DOMContentLoaded: ${vitals.domContentLoaded}ms`);
    console.log(`  loadEvent: ${vitals.loadEvent}ms`);
    console.log(`  total resources: ${vitals.totalResources}`);
    console.log(`  slow resources (>100ms): ${vitals.slowResources.length}`);
    vitals.slowResources.slice(0, 5).forEach(s => console.log(`    - ${s.dur}ms  ${s.name}`));
    console.log(`  body text: ${vitals.text.replace(/\n/g, ' | ').slice(0, 150)}`);

    console.log(`  [vite] timeline:`);
    events.filter(e => e.text.includes('vite') || e.text.includes('main.ts') || e.text.includes('DevGuard')).forEach(e =>
      console.log(`    +${e.t}ms [${e.type}] ${e.text}`)
    );
  } catch (err) {
    console.log(`\n=== Round ${r} FAILED: ${err.message} ===`);
  }
  await page.close();
}

await browser.close();
