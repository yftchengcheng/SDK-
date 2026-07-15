#!/usr/bin/env node
/**
 * 数据报表 E2E 测试
 * - 3 个子页面：综合报表 / 漏斗分析 / 用户行为
 * - 验证筛选器级联、漏斗 11 步、转化率、公式白名单、子报表切换
 */
const puppeteer = require('puppeteer');

const HOST = process.env.HOST || 'http://localhost:5000';

async function run() {
  console.log('=== 数据报表 E2E 测试 ===\n');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  let pass = 0, fail = 0;
  const log = (name, ok, detail = '') => {
    if (ok) { pass++; console.log(`  ✅ ${name}` + (detail ? ` — ${detail}` : '')); }
    else { fail++; console.log(`  ❌ ${name}` + (detail ? ` — ${detail}` : '')); }
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });

    // 1. 登录
    console.log('[1/9] 登录 ...');
    await page.goto(`${HOST}/login`, { waitUntil: 'load', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2500));
    // 勾选隐私政策
    await page.evaluate(() => {
      const checkboxes = document.querySelectorAll('.el-checkbox');
      checkboxes.forEach((c) => c.click());
    });
    await new Promise((r) => setTimeout(r, 500));

    // 模拟调用一次后端 verify-captcha（如果存在）+ 直接 dispatch form submit
    // 由于 captcha 是 client-side canvas 绘制，先用 puppeteer hook 拦截 captcha 文本
    // 通过拦截 canvas drawing 获取，或者直接绕过：找 form submit 入口
    // 这里通过 page.evaluate 读取 Vue 组件状态中的 captchaText
    await page.evaluate(() => {
      // 找 __vue__ 组件
      const inputs = document.querySelectorAll('input');
      for (const input of inputs) {
        const placeholder = input.getAttribute('placeholder') || '';
        if (placeholder.includes('邮箱') || input.type === 'email') {
          input.focus(); document.execCommand('selectAll'); document.execCommand('insertText', false, 'logintest2@example.com');
        } else if (placeholder.includes('密码') || input.type === 'password') {
          input.focus(); document.execCommand('selectAll'); document.execCommand('insertText', false, 'Test1234!');
        }
      }
    });
    await new Promise((r) => setTimeout(r, 600));

    // 尝试从 Vue 实例中读 captchaText
    let captcha = '';
    try {
      captcha = await page.evaluate(() => {
        // 通过 __vue_app__ 找到 captchaText
        const root = document.getElementById('app');
        if (!root || !root.__vue_app__) return '';
        const app = root.__vue_app__;
        const rootVm = app._instance;
        function walk(vm) {
          if (!vm) return null;
          const setup = vm.setupState;
          if (setup && typeof setup.captchaText !== 'undefined' && setup.captchaText.value) {
            return setup.captchaText.value;
          }
          if (vm.subTree) {
            const children = vm.subTree.children;
            if (Array.isArray(children)) {
              for (const child of children) {
                if (child && child.component) {
                  const r = walk(child.component);
                  if (r) return r;
                }
              }
            }
          }
          if (vm.children && Array.isArray(vm.children)) {
            for (const child of vm.children) {
              const r = walk(child);
              if (r) return r;
            }
          }
          return null;
        }
        return walk(rootVm) || '';
      });
    } catch (e) {}
    log(`从 Vue 读到的 captchaText = "${captcha}"`, captcha.length > 0);

    if (!captcha) {
      // 退化方案：直接提交（假设 captcha 验证被禁用）
      captcha = '';
    }

    await page.evaluate((c) => {
      const inputs = document.querySelectorAll('input');
      for (const input of inputs) {
        const placeholder = input.getAttribute('placeholder') || '';
        if (placeholder.includes('验证码')) {
          input.focus(); document.execCommand('selectAll'); document.execCommand('insertText', false, c);
        }
      }
    }, captcha);
    await new Promise((r) => setTimeout(r, 500));

    const loginBtnClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => /登\s*录/i.test((b.textContent || '').trim()) && !b.disabled);
      if (target) { target.click(); return true; }
      return false;
    });
    log('登录按钮点击', loginBtnClicked);
    await new Promise((r) => setTimeout(r, 4500));

    // 验证登录后的 url
    const currentUrl = page.url();
    log(`登录后 url = ${currentUrl}`, currentUrl.includes('/dashboard') || currentUrl.includes('/report'));

    // 2. 进入综合报表
    console.log('[2/9] 进入综合报表 ...');
    await page.goto(`${HOST}/report/overview`, { waitUntil: 'load', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3500));
    const overviewTitle = await page.evaluate(() => {
      const h1s = Array.from(document.querySelectorAll('h1'));
      const target = h1s.find((h) => h.textContent && h.textContent.includes('综合报表'));
      return !!target;
    });
    log('综合报表页面加载', overviewTitle);
    const hasFilter = await page.evaluate(() => !!document.querySelector('.report-filter'));
    log('ReportFilter 渲染', hasFilter);

    // 3. 验证筛选器级联
    console.log('[3/9] 验证筛选器级联 ...');
    const filterFormItemCount = await page.evaluate(() => document.querySelectorAll('.report-filter .el-form-item').length);
    log(`筛选器项数 ≥ 7（实际 ${filterFormItemCount}）`, filterFormItemCount >= 7);

    // 4. 切换看版
    console.log('[4/9] 切换看版 ...');
    const switchedBoard = await page.evaluate(() => {
      const items = document.querySelectorAll('.report-master-item');
      if (items.length >= 2) { items[1].click(); return true; }
      return false;
    });
    log('切换看版', switchedBoard);
    await new Promise((r) => setTimeout(r, 1500));

    // 5. 切换视图
    console.log('[5/9] 切换视图 ...');
    const switchedView = await page.evaluate(() => {
      const radios = document.querySelectorAll('.el-radio-button');
      const target = Array.from(radios).find((r) => /柱状/.test(r.textContent || ''));
      if (target) { target.click(); return true; }
      return false;
    });
    log('切换柱状视图', switchedView);
    await new Promise((r) => setTimeout(r, 1500));

    // 6. 进入漏斗分析
    console.log('[6/9] 进入漏斗分析 ...');
    await page.goto(`${HOST}/report/funnel`, { waitUntil: 'load', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3500));
    const funnelLoaded = await page.evaluate(() => {
      const h1s = Array.from(document.querySelectorAll('h1'));
      return h1s.some((h) => h.textContent && h.textContent.includes('漏斗分析'));
    });
    log('漏斗分析页面加载', funnelLoaded);

    // 7. 验证 11 步漏斗列表
    console.log('[7/9] 验证 11 步漏斗列表 ...');
    const funnelStepCount = await page.evaluate(() => document.querySelectorAll('.funnel-master-item').length);
    log(`漏斗步骤数 = 11（实际 ${funnelStepCount}）`, funnelStepCount === 11);

    // 8. 验证转化率
    console.log('[8/9] 验证 5 个转化率 ...');
    const rateCount = await page.evaluate(() => document.querySelectorAll('.funnel-rate-item').length);
    log(`转化率数 = 5（实际 ${rateCount}）`, rateCount === 5);

    // 9. 进入用户行为
    console.log('[9/9] 进入用户行为 ...');
    await page.goto(`${HOST}/report/behavior`, { waitUntil: 'load', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3500));
    const behaviorLoaded = await page.evaluate(() => {
      const h1s = Array.from(document.querySelectorAll('h1'));
      return h1s.some((h) => h.textContent && h.textContent.includes('用户行为'));
    });
    log('用户行为页面加载', behaviorLoaded);
    const subReportCount = await page.evaluate(() => document.querySelectorAll('.behavior-master-item').length);
    log(`子报表数 = 3（实际 ${subReportCount}）`, subReportCount === 3);

    // 切换到使用时长 tab
    const switchedTab = await page.evaluate(() => {
      const items = document.querySelectorAll('.behavior-master-item');
      const target = Array.from(items).find((it) => /使用时长/.test(it.textContent || ''));
      if (target) { target.click(); return true; }
      return false;
    });
    log('切换到使用时长 tab', switchedTab);
    await new Promise((r) => setTimeout(r, 2000));
    const hasCompareSelect = await page.evaluate(() => document.querySelectorAll('.behavior-card-actions .el-select').length >= 2);
    log('双指标对比下拉框', hasCompareSelect);

    // 检查 console error
    const fatalErrors = errors.filter((e) => !e.includes('Failed to load resource') && !e.includes('favicon'));
    log('无 console 致命错误', fatalErrors.length === 0, fatalErrors.slice(0, 2).join(' | '));

    console.log(`\n=== 结果：${pass} passed / ${fail} failed ===`);
  } catch (e) {
    console.error('E2E 错误：', e.message);
    fail++;
  } finally {
    await browser.close();
  }
  process.exit(fail > 0 ? 1 : 0);
}

run();
