import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const puppeteer = require('puppeteer')
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome'

async function api(method, url, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token
  const r = await fetch('http://localhost:5000' + url, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  })
  return r.json()
}

const reg = await api('POST', '/api/v1/auth/register', {
  email: 'in4-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'pdt', companyShortName: 'pdt', contactName: 'pdt', phone: '13800000000', accessType: 1,
})
const token = reg.data.token

const scenarios = [
  { name: '横屏', orientation: 1, expected: '横屏' },
  { name: '竖屏', orientation: 2, expected: '竖屏' },
  { name: '横竖兼容', orientation: 3, expected: '横竖兼容' },
]

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
})

let allPass = true
for (const sc of scenarios) {
  const app = (await api('POST', '/api/v1/console/app/create', {
    appName: 'InA' + sc.orientation, packageName: 'com.test.ina' + Date.now() + sc.orientation, platform: 1,
    orientation: sc.orientation,
  }, token)).data
  console.log(`\n--- App orientation=${sc.orientation} (${sc.name}) ---`)

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 1100 })
  await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate((t) => {
    localStorage.setItem('token', t)
    localStorage.setItem('userInfo', JSON.stringify({ id: 1, email: 'x@x.com', company: 'pdt', companyShortName: 'pdt', accessType: 1, status: 1 }))
  }, token)
  await page.goto('http://localhost:5000/app', { waitUntil: 'domcontentloaded' })
  await new Promise(r => setTimeout(r, 3500))

  await page.evaluate((appKey) => {
    const items = document.querySelectorAll('.app-master-item')
    for (const it of items) if (it.textContent && it.textContent.includes(appKey)) { it.click(); return }
  }, app.app_key)
  await new Promise(r => setTimeout(r, 2000))

  // Click 创建广告位
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const c = btns.find(b => b.textContent.trim() === '创建广告位' && b.offsetParent !== null)
    if (c) c.click()
  })
  await new Promise(r => setTimeout(r, 2000))

  // Switch to 插屏 in placement drawer
  await page.evaluate(() => {
    const drawers = Array.from(document.querySelectorAll('.el-drawer'))
    for (const d of drawers) {
      if (d.querySelector('.el-drawer__title')?.textContent?.trim() === '创建广告位') {
        const labels = d.querySelectorAll('.pd-format-grid .el-radio-button')
        for (const l of labels) {
          const inner = l.querySelector('.el-radio-button__inner')
          if (inner && inner.textContent.trim() === '插屏') { l.click(); return }
        }
      }
    }
  })
  await new Promise(r => setTimeout(r, 1000))

  // Now check the active screen orientation
  const result = await page.evaluate(() => {
    const drawers = Array.from(document.querySelectorAll('.el-drawer'))
    for (const d of drawers) {
      if (d.querySelector('.el-drawer__title')?.textContent?.trim() === '创建广告位') {
        const items = d.querySelectorAll('.el-form-item')
        for (const it of items) {
          const label = it.querySelector('.el-form-item__label')?.textContent?.trim()
          if (label && label.includes('屏幕方向')) {
            return {
              found: true,
              active: it.querySelector('.el-radio-button.is-active .el-radio-button__inner')?.textContent?.trim() || null,
              help: it.querySelector('.pd-form-help')?.textContent?.trim().replace(/\s+/g, ' ') || null,
            }
          }
        }
      }
    }
    return { found: false }
  })
  console.log('Result:', JSON.stringify(result))
  if (result.found && result.active === sc.expected) {
    console.log(`✓ Active=${result.active} matches expected=${sc.expected}`)
  } else {
    console.log(`✗ Active=${result.active} expected=${sc.expected}`)
    allPass = false
  }

  await page.close()
}

await browser.close()
console.log('\n=== Final:', allPass ? '✓ All pass' : '✗ Failures', '===')
