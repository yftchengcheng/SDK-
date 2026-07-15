// scripts/test-overview-dimpicker.cjs
// 验证综合报表的「维度选择器」+「指标选择器」集成
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 注入 JWT token
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGV2XzAxSEFaVFlSIiwiZGV2ZWxvcGVyX2lkIjoiZGV2XzAxSEFaVFlSIiwidHlwZSI6ImRldmVsb3BlciIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.test';
    localStorage.setItem('token', token);
  });

  // 跳到综合报表
  await page.goto('http://localhost:5000/report/overview', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // 1) 截图当前状态
  await page.screenshot({ path: '/tmp/test-overview-1-initial.png', fullPage: false });
  console.log('截图1 已保存 /tmp/test-overview-1-initial.png');

  // 2) 检查是否有"编辑维度"按钮
  const dimBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.filter(b => b.textContent.includes('编辑维度')).length;
  });
  console.log('找到 "编辑维度" 按钮数:', dimBtn);

  // 3) 点击"编辑维度"按钮
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.textContent.includes('编辑维度'));
    if (target) { target.click(); return true; }
    return false;
  });
  console.log('点击 "编辑维度" 成功:', clicked);
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/tmp/test-overview-2-dimpicker.png', fullPage: false });
  console.log('截图2 已保存 /tmp/test-overview-2-dimpicker.png');

  // 4) 检查 dim picker 是否打开
  const dimPickerOpen = await page.evaluate(() => {
    return !!document.querySelector('.dimension-picker-dialog');
  });
  console.log('DimensionPicker 弹窗打开:', dimPickerOpen);

  // 5) 点击"设置指标"按钮
  const metricClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.textContent.includes('设置指标'));
    if (target) { target.click(); return true; }
    return false;
  });
  console.log('点击 "设置指标" 成功:', metricClicked);
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/tmp/test-overview-3-metricpicker.png', fullPage: false });
  console.log('截图3 已保存 /tmp/test-overview-3-metricpicker.png');

  await browser.close();
  console.log('测试完成');
})().catch(e => { console.error(e); process.exit(1); });
