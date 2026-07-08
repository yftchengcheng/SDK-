/**
 * 数据看板 puppeteer 端到端验证
 * 验证：page-shell / stat-grid / chart-card / list-grid / ECharts 高度
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
  await page.evaluate(() => {
    const inst = document.querySelector('#app').__vue_app__
    inst.config.globalProperties.$router.push('/dashboard')
  })
  await new Promise(r => setTimeout(r, 4000))
  await page.screenshot({ path: SHOT, fullPage: true })

  const result = await page.evaluate(() => {
    const dashboard = document.querySelector('.page-shell.page-dashboard')
    const statCards = document.querySelectorAll('.stat-grid .stat-card')
    const chartCard = document.querySelector('.page-chart-card')
    const chartCanvas = chartCard && chartCard.querySelector('.chart-canvas')
    const chartCanvasRect = chartCanvas && chartCanvas.getBoundingClientRect()
    const chartSvg = chartCanvas && chartCanvas.querySelector('svg')
    const chartSvgRect = chartSvg && chartSvg.getBoundingClientRect()
    const listCards = document.querySelectorAll('.list-grid .page-list-card')
    const pageHeader = document.querySelector('.page-shell.page-dashboard > .page-header')
    return {
      hasShell: !!dashboard,
      statCardCount: statCards.length,
      hasChartCard: !!chartCard,
      chartCanvasHeight: chartCanvasRect && Math.round(chartCanvasRect.height),
      chartSvgHeight: chartSvgRect && Math.round(chartSvgRect.height),
      listCardCount: listCards.length,
      hasPageHeader: !!pageHeader,
    }
  })
  console.log('result:', JSON.stringify(result, null, 2))

  const errors = []
  if (!result.hasShell) errors.push('FAIL: 缺少 .page-shell.page-dashboard')
  if (result.statCardCount !== 4) errors.push(`FAIL: stat-card = ${result.statCardCount}（应=4）`)
  if (!result.hasChartCard) errors.push('FAIL: 缺少 .page-chart-card')
  if (!result.chartCanvasHeight || result.chartCanvasHeight < 280) errors.push(`FAIL: chart-canvas 高度 = ${result.chartCanvasHeight}（应≥280）`)
  if (result.chartSvgHeight < 280) errors.push(`FAIL: chart svg 高度 = ${result.chartSvgHeight}（应≥280）`)
  if (result.listCardCount !== 3) errors.push(`FAIL: list-card = ${result.listCardCount}（应=3）`)
  if (!result.hasPageHeader) errors.push('FAIL: 缺少 .page-header')

  if (errors.length) { console.error('=== ❌ FAIL ==='); errors.forEach(e => console.error(e)); process.exit(1) }
  console.log('=== ✅ PASS ===')
} finally { await browser.close() }
