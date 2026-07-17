import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/workspace/projects';
const MD_PATH = path.join(ROOT, 'docs/ARCHITECTURE.md');
const OUT_DIR = path.join(ROOT, 'public/architecture');

const md = fs.readFileSync(MD_PATH, 'utf8');
const idx = md.indexOf('## 附录：模块依赖关系图');
const appendix = md.substring(idx);
const m = appendix.match(/```mermaid\n([\s\S]*?)```/);
if (!m) { console.log('not found'); process.exit(1); }
const code = m[1].trim();
console.log('Found appendix mermaid, length:', code.length);

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>body{margin:0;padding:24px;background:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
.mermaid{background:#FAFBFC;padding:16px;border-radius:4px}
.mermaid svg{max-width:100%!important;height:auto!important}</style>
</head><body>
<div class="mermaid">${code}</div>
<script>mermaid.initialize({startOnLoad:true,theme:'default',flowchart:{useMaxWidth:true,htmlLabels:true,curve:'basis'},themeVariables:{primaryColor:'#DBEAFE',primaryTextColor:'#0F172A',primaryBorderColor:'#3B82F6',lineColor:'#64748B',secondaryColor:'#F1F5F9',fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif',fontSize:'13px'},securityLevel:'loose'});</script>
</body></html>`;
const htmlPath = path.join(OUT_DIR, '_appendix.html');
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
    const s = document.querySelector('.mermaid svg');
    return s && s.getBoundingClientRect().width > 0;
  }, { timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));
  const el = await page.$('.mermaid');
  const out = path.join(OUT_DIR, '15_模块依赖关系图.png');
  await el.screenshot({ path: out });
  console.log('  ✓', out);
} finally { await browser.close(); }
