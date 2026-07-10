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
  email: 'edt-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'pdt', companyShortName: 'pdt', contactName: 'pdt', phone: '13800000000', accessType: 1,
})
const token = reg.data.token

// Create app with orientation=1 (横屏)
const app = (await api('POST', '/api/v1/console/app/create', {
  appName: 'EdtApp', packageName: 'com.test.edt' + Date.now(), platform: 1, orientation: 1,
}, token)).data

// Create placement with screen_orientation=2 (竖屏) - DIFFERENT from app's orientation
const pl = (await api('POST', '/api/v1/console/placement/create', {
  appKey: app.app_key, name: 'OverridePlacement', format: 2, biddingType: 1,
  screenOrientation: 2,  // 竖屏 - different from app's 横屏
  adSize: 1, materialType: 1,
}, token)).data
console.log('Created placement with screenOrientation=2 (竖屏), even though app is 横屏')

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
})

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
await new Promise(r => setTimeout(r, 2500))

// Click 编辑 in placement table
await page.evaluate(() => {
  // Find placement table edit button
  const editBtns = Array.from(document.querySelectorAll('.el-button--primary')).filter(b => b.textContent.trim() === '编辑')
  if (editBtns.length > 0) editBtns[editBtns.length - 1].click()  // last edit button is placement
})
await new Promise(r => setTimeout(r, 2000))

// Check active screen orientation - should be 竖屏 (from placement data, not from app)
const result = await page.evaluate(() => {
  const drawers = Array.from(document.querySelectorAll('.el-drawer'))
  for (const d of drawers) {
    if (d.querySelector('.el-drawer__title')?.textContent?.trim() === '编辑广告位') {
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
console.log('Edit drawer result:', JSON.stringify(result))
console.log('Expected active: 竖屏 (the placement\'s own value, not app\'s 横屏)')

// Cleanup
const t2 = (await api('POST', '/api/v1/auth/login', { email: reg.data.email, password: 'Test123456' })).data.token
await fetch('http://localhost:5000/api/v1/console/placement/delete?placementId=' + pl.placement_id, {
  method: 'DELETE', headers: { 'Authorization': 'Bearer ' + t2 }
})

await browser.close()
