// scripts/render-architecture.mjs
// 用 puppeteer + mermaid.js 渲染 ARCHITECTURE.md 里的所有 mermaid 图为 PNG

import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/workspace/projects';
const MD_PATH = path.join(ROOT, 'docs/ARCHITECTURE.md');
const OUT_DIR = path.join(ROOT, 'public/architecture');
const OUT_MD_DIR = path.join(ROOT, 'docs/architecture');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(OUT_MD_DIR, { recursive: true });

// 解析 markdown 提取所有 mermaid 块 + 对应标题
const md = fs.readFileSync(MD_PATH, 'utf8');
const blocks = [];
const re = /## (\d+\. [^\n]+)\n[\s\S]*?```mermaid\n([\s\S]*?)```/g;
let m;
while ((m = re.exec(md)) !== null) {
  const title = m[1].trim();
  const code = m[2].trim();
  // 生成 id
  const id = title.replace(/[^\w\u4e00-\u9fa5]/g, '_').substring(0, 80);
  blocks.push({ id, title, code });
}

console.log(`Found ${blocks.length} mermaid blocks`);
blocks.forEach((b, i) => console.log(`  ${i + 1}. ${b.title}  (id=${b.id})`));

// 生成 HTML
const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #ffffff; margin: 0; padding: 24px; }
  .arch { margin-bottom: 64px; border: 1px solid #E2E8F0; border-radius: 8px; padding: 24px; background: #fff; }
  .arch h2 { font-size: 18px; color: #0F172A; margin: 0 0 16px 0; font-weight: 600; }
  .arch .mermaid { background: #FAFBFC; padding: 16px; border-radius: 4px; overflow: visible; }
  .arch .mermaid svg { max-width: 100% !important; height: auto !important; }
</style>
</head>
<body>
${blocks.map(b => `<div class="arch" id="arch-${b.id}">
  <h2>${b.title}</h2>
  <div class="mermaid">${b.code}</div>
</div>`).join('\n')}
<script>
  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
    themeVariables: {
      primaryColor: '#DBEAFE',
      primaryTextColor: '#0F172A',
      primaryBorderColor: '#3B82F6',
      lineColor: '#64748B',
      secondaryColor: '#F1F5F9',
      tertiaryColor: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
    },
    securityLevel: 'loose',
  });
</script>
</body>
</html>`;

const htmlPath = path.join(OUT_DIR, '_render.html');
fs.writeFileSync(htmlPath, html);
console.log(`HTML written to ${htmlPath}`);

// 启动 puppeteer 截图
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 60000 });
  // 等所有 mermaid 渲染完
  await page.waitForFunction(() => {
    const svgs = document.querySelectorAll('.mermaid svg');
    return svgs.length > 0 && Array.from(svgs).every(s => s.getBoundingClientRect().width > 0);
  }, { timeout: 60000 });
  // 多等 1s 让动画稳定
  await new Promise(r => setTimeout(r, 1500));

  // 逐个截图
  for (const b of blocks) {
    const sel = `#arch-${b.id}`;
    const el = await page.$(sel);
    if (!el) { console.log(`  ✗ ${b.title}: not found`); continue; }
    // 等 mermaid svg 完全渲染
    const svg = await el.$('.mermaid svg');
    if (!svg) { console.log(`  ✗ ${b.title}: no svg`); continue; }
    const box = await el.boundingBox();
    const fileName = `${String(blocks.indexOf(b) + 1).padStart(2, '0')}_${b.id}.png`;
    const outPath = path.join(OUT_DIR, fileName);
    await el.screenshot({ path: outPath });
    console.log(`  ✓ ${b.title} → ${fileName}  (${Math.round(box.width)}×${Math.round(box.height)})`);
  }
} finally {
  await browser.close();
}

console.log('All done');
