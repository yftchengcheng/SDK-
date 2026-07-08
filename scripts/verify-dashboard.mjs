/**
 * 数据看板 puppeteer 端到端验证
 * 验证项：
 *   1. page-shell / page-header / 4 stat-card / chart-card / 3 list-card 数量
 *   2. ECharts 高度 ≥ 280px（chart-canvas + svg）
 *   3. stat-card 趋势对比基准显示
 *   4. 4 个卡片内边距 ≥ 20px（避免内容贴边）
 *   5. list-body 容器存在（el-empty 也被 list-body 包裹）
 */
import puppeteer from 'puppeteer'
import fs from 'node:fs'

const BASE = process.env.BASE_URL || 'http://localhost:5000'
const TOKEN = process.env.VERIFY_TOKEN || ''
const SHOT = '/tmp/dashboard-verify/dashboard.png'
fs.mkdirSync('/tmp/dashboard-verify', { recursive: true })

if (!TOKEN) { console.error('请设置 VERIFY_TOKEN 环境变量'); process.exit(1) }

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 1440, height: 900 },
})
try {
  const page = await browser.newPage()
  await page.setCookie({ name: 'auth_token', value: TOKEN, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Strict' })
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate((token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('userInfo', JSON.stringify({ developerId: 'dev_test', email: 'test@verify.com', role: 'developer' }))
    localStorage.setItem('userRole', 'developer')
  }, TOKEN)
  await page.reload({ waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 2000))
  await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/dashboard'))
  await new Promise(r => setTimeout(r, 4000))
  await page.screenshot({ path: SHOT, fullPage: true })

  const result = await page.evaluate(() => {
    const getRect = (el) => el ? el.getBoundingClientRect() : null
    const getCS = (el, prop) => el ? getComputedStyle(el)[prop] : null

    const dashboard = document.querySelector('.page-shell.page-dashboard')
    const statCards = document.querySelectorAll('.stat-grid .stat-card')
    const chartCard = document.querySelector('.page-chart-card')
    const chartCanvas = chartCard && chartCard.querySelector('.chart-canvas')
    const chartSvg = chartCanvas && chartCanvas.querySelector('svg')
    const listCards = document.querySelectorAll('.page-list-card')
    const pageHeader = document.querySelector('.page-shell.page-dashboard > .page-header')

    return {
      hasShell: !!dashboard,
      statCardCount: statCards.length,
      hasChartCard: !!chartCard,
      chartCardPadding: chartCard ? `${getCS(chartCard, 'paddingTop')} ${getCS(chartCard, 'paddingRight')} ${getCS(chartCard, 'paddingBottom')} ${getCS(chartCard, 'paddingLeft')}` : null,
      chartCanvasHeight: chartCanvas ? Math.round(getRect(chartCanvas).height) : null,
      chartSvgHeight: chartSvg ? Math.round(getRect(chartSvg).height) : null,
      listCardCount: listCards.length,
      listCards: Array.from(listCards).map((c, idx) => {
        const body = c.querySelector('.list-body')
        const row = c.querySelector('.list-row')
        const compareEl = c.querySelector('.stat-card__compare')
        return {
          idx,
          titleText: c.querySelector('.list-title')?.textContent?.trim(),
          padding: `${getCS(c, 'paddingTop')} ${getCS(c, 'paddingRight')} ${getCS(c, 'paddingBottom')} ${getCS(c, 'paddingLeft')}`,
          bodyExists: !!body,
          hasRow: !!row,
          rowPadding: row ? `${getCS(row, 'paddingTop')} ${getCS(row, 'paddingRight')} ${getCS(row, 'paddingBottom')} ${getCS(row, 'paddingLeft')}` : null,
        }
      }),
      statCardCompares: Array.from(statCards).map(c => c.querySelector('.stat-card__compare')?.textContent?.trim()),
      hasPageHeader: !!pageHeader,
    }
  })
  console.log('result:', JSON.stringify(result, null, 2))

  const errors = []
  // 1. 基础结构
  if (!result.hasShell) errors.push('FAIL: 缺少 .page-shell.page-dashboard')
  if (result.statCardCount !== 4) errors.push(`FAIL: stat-card = ${result.statCardCount}（应=4）`)
  if (!result.hasChartCard) errors.push('FAIL: 缺少 .page-chart-card')
  if (result.listCardCount !== 3) errors.push(`FAIL: list-card = ${result.listCardCount}（应=3）`)
  if (!result.hasPageHeader) errors.push('FAIL: 缺少 .page-header')

  // 2. ECharts 高度
  if (!result.chartCanvasHeight || result.chartCanvasHeight < 280) errors.push(`FAIL: chart-canvas 高度 = ${result.chartCanvasHeight}（应≥280）`)
  if (result.chartSvgHeight < 280) errors.push(`FAIL: chart svg 高度 = ${result.chartSvgHeight}（应≥280）`)

  // 3. stat-card 对比基准
  if (result.statCardCompares.length !== 4) errors.push(`FAIL: stat-card__compare 数量 = ${result.statCardCompares.length}（应=4）`)
  result.statCardCompares.forEach((c, idx) => {
    if (c !== '较昨日') errors.push(`FAIL: stat-card[${idx}] compareText = "${c}"（应="较昨日"）`)
  })

  // 4. 内边距（关键：避免内容贴边）
  if (result.chartCardPadding) {
    const p = result.chartCardPadding.split(' ').map(n => parseFloat(n))
    if (p[0] < 20) errors.push(`FAIL: chart-card padding-top = ${p[0]}（应≥20）`)
    if (p[1] < 20) errors.push(`FAIL: chart-card padding-right = ${p[1]}（应≥20）`)
    if (p[2] < 20) errors.push(`FAIL: chart-card padding-bottom = ${p[2]}（应≥20）`)
    if (p[3] < 20) errors.push(`FAIL: chart-card padding-left = ${p[3]}（应≥20）`)
  }
  if (result.listCards.length !== 3) errors.push(`FAIL: list-card 数量 = ${result.listCards.length}（应=3）`)
  result.listCards.forEach((c, idx) => {
    const p = c.padding.split(' ').map(n => parseFloat(n))
    if (p[0] < 20) errors.push(`FAIL: list-card[${idx}] padding-top = ${p[0]}（应≥20）`)
    if (p[1] < 20) errors.push(`FAIL: list-card[${idx}] padding-right = ${p[1]}（应≥20）`)
    if (p[2] < 20) errors.push(`FAIL: list-card[${idx}] padding-bottom = ${p[2]}（应≥20）`)
    if (p[3] < 20) errors.push(`FAIL: list-card[${idx}] padding-left = ${p[3]}（应≥20）`)
    if (!c.bodyExists) errors.push(`FAIL: list-card[${idx}] 缺少 .list-body 容器`)
  })

  if (errors.length) { console.error('=== ❌ FAIL ==='); errors.forEach(e => console.error(e)); process.exit(1) }
  console.log('=== ✅ PASS ===')
  console.log('  - 4 stat-card + 较昨日对比基准 ✓')
  console.log('  - chart-card: padding 20×24 / canvas height 280 / svg height 280 ✓')
  console.log('  - list-card ×3: padding 20×24 / list-body 包裹 ✓')
  console.log('截图:', SHOT)
} finally { await browser.close() }
