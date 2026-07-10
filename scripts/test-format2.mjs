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
  email: 'pd2-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'pdt', companyShortName: 'pdt', contactName: 'pdt', phone: '13800000000', accessType: 1,
})
const token = reg.data.token
const appRes = await api('POST', '/api/v1/console/app/create', {
  appName: 'PD2App', packageName: 'com.test.pd2' + Date.now(), platform: 1,
}, token)
const app = appRes.data

// Create a placement with format=2 (插屏) to show all fields
const plRes = await api('POST', '/api/v1/console/placement/create', {
  appKey: app.app_key, name: 'TestChaping', format: 2, biddingType: 1,
  screenOrientation: 2, adSize: 1, materialType: 1,
}, token)
console.log('Placement create:', plRes.code === 0 ? 'OK' : JSON.stringify(plRes))

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
})
const page = await browser.newPage()
page.on('pageerror', e => console.log('[pageerror]', e.message))
page.on('console', m => { if (m.type() === 'error') console.log('[console-err]', m.text()) })

await page.setViewport({ width: 1440, height: 1100 })
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' })
await page.evaluate((t) => {
  localStorage.setItem('token', t)
  localStorage.setItem('userInfo', JSON.stringify({ id: 1, email: 'x@x.com', company: 'pdt', companyShortName: 'pdt', accessType: 1, status: 1 }))
}, token)

await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 2500))
const appItems = await page.$$('.app-master-item')
if (appItems.length > 0) await appItems[0].click()
await new Promise(r => setTimeout(r, 2000))

// Click first 编辑
const editButtons = await page.$$('.el-button--primary')
for (const btn of editButtons) {
  const text = await page.evaluate(b => b.textContent.trim(), btn)
  if (text === '编辑') { await btn.click(); break }
}
await new Promise(r => setTimeout(r, 1500))
await page.screenshot({ path: '/tmp/pd-format2.png', fullPage: true })

const sections = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.pd-section-head')).map(h => h.textContent.trim().replace(/\s+/g, ' '))
})
console.log('\n=== Sections (format=2 插屏) ===')
sections.forEach(s => console.log('  -', s))

const formItems = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.el-drawer .el-form-item')).map(i => {
    return (i.querySelector('.el-form-item__label')?.textContent?.trim() || '').replace(/\s*\*\s*$/, '').replace(/\s+/g, ' ')
  }).filter(Boolean)
})
console.log('\n=== Form items (插屏) ===')
formItems.forEach(f => console.log('  -', f))

// Verify 广告展示大小 should now show
const adSizeFound = await page.evaluate(() => {
  const labels = Array.from(document.querySelectorAll('.el-drawer .el-form-item__label'))
  return labels.some(l => l.textContent.includes('广告展示大小'))
})
console.log('\n广告展示大小 present:', adSizeFound ? '✓' : '✗')

// Cleanup
const t2 = (await api('POST', '/api/v1/auth/login', { email: reg.data.email, password: 'Test123456' })).data.token
await fetch('http://localhost:5000/api/v1/console/placement/delete?placementId=' + plRes.data.placement_id, {
  method: 'DELETE', headers: { 'Authorization': 'Bearer ' + t2 }
})

await browser.close()
