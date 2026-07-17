import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/workspace/projects';
const MD_PATH = path.join(ROOT, 'docs/SDK_MODULE_DESIGN.md');
const OUT_DIR = path.join(ROOT, 'public/architecture');
const TMP_DIR = path.join(OUT_DIR, '_sdk_tmp');
fs.mkdirSync(TMP_DIR, { recursive: true });

const md = fs.readFileSync(MD_PATH, 'utf8');

// 提取 4 个标题下的 mermaid 块
const targets = [
  { title: '2. 整体架构图', name: 'sdk_01_overall' },
  { title: '5.1 SDK 下载功能架构', name: 'sdk_02_download' },
  { title: '5.2 SDK 版本管理功能架构', name: 'sdk_03_version' },
  { title: '5.3 SDK 文档功能架构', name: 'sdk_04_doc' },
  { title: '5.4 隐私政策功能架构', name: 'sdk_05_privacy' },
];

const blocks = [];
for (const t of targets) {
  const idx = md.indexOf('## ' + t.title);
  if (idx === -1) {
    console.log('  ✗ not found:', t.title);
    continue;
  }
  // 找后面第一个 ```mermaid
  const mmStart = md.indexOf('```mermaid\n', idx);
  if (mmStart === -1) { console.log('  ✗ no mermaid:', t.title); continue; }
  const close = md.indexOf('\n```\n', mmStart);
  if (close === -1) { console.log('  ✗ no close:', t.title); continue; }
  const code = md.substring(mmStart + '```mermaid\n'.length, close).trim();
  blocks.push({ ...t, code });
}
console.log('Extracted', blocks.length, 'mermaid blocks');

// 生成 HTML（一张大图 + 5 个分图）
const htmlSections = blocks.map((b, i) => `
<div class="mermaid" data-name="${b.name}">${b.code}</div>
<hr/>
`).join('\n');

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
  body{margin:0;padding:24px;background:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
  .mermaid{background:#FAFBFC;padding:16px;border-radius:4px;margin-bottom:8px}
  .mermaid svg{max-width:100%!important;height:auto!important}
  hr{border:none;border-top:2px dashed #E2E8F0;margin:24px 0}
</style>
</head><body>
${htmlSections}
<script>
  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis', padding: 12 },
    themeVariables: {
      primaryColor: '#DBEAFE',
      primaryTextColor: '#0F172A',
      primaryBorderColor: '#3B82F6',
      lineColor: '#64748B',
      secondaryColor: '#F1F5F9',
      tertiaryColor: '#FEF3C7',
      fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif',
      fontSize: '13px'
    },
    securityLevel: 'loose'
  });
</script>
</body></html>`;

const htmlPath = path.join(TMP_DIR, 'all.html');
fs.writeFileSync(htmlPath, html);

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(() => {
    const svgs = document.querySelectorAll('.mermaid svg');
    return svgs.length > 0 && Array.from(svgs).every(s => s.getBoundingClientRect().width > 0);
  }, { timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));

  for (const b of blocks) {
    const el = await page.$(`.mermaid[data-name="${b.name}"]`);
    if (!el) { console.log('  ✗ not in DOM:', b.name); continue; }
    const out = path.join(OUT_DIR, `${b.name}.png`);
    await el.screenshot({ path: out });
    console.log('  ✓', b.name, '->', out);
  }
} finally {
  await browser.close();
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
}
console.log('done');
