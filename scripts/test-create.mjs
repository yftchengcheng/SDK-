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
  email: 'cr-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'pdt', companyShortName: 'pdt', contactName: 'pdt', phone: '13800000000', accessType: 1,
})
const token = reg.data.token
const appRes = await api('POST', '/api/v1/console/app/create', {
  appName: 'CRApp', packageName: 'com.test.cr' + Date.now(), platform: 1,
}, token)
const app = appRes.data

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
})
const page = await browser.newPage()
page.on('pageerror', e => console.log('[pageerror]', e.message))

const requests = []
page.on('request', req => {
  if (req.url().includes('/placement/') && !req.url().endsWith('.vue')) {
    requests.push({ method: req.method(), url: req.url(), body: req.postData() })
  }
})

await page.setViewport({ width: 1440, height: 1100 })
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' })
await page.evaluate((t) => {
  localStorage.setItem('token', t)
  localStorage.setItem('userInfo', JSON.stringify({ id: 1, email: 'x@x.com', company: 'pdt', companyShortName: 'pdt', accessType: 1, status: 1 }))
}, token)

await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 2500))

// Click first .app-master-item
const appItems = await page.$$('.app-master-item')
if (appItems.length > 0) await appItems[0].click()
await new Promise(r => setTimeout(r, 2000))

// Click "创建广告位" button
const clicked = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('.el-button'))
  const create = btns.find(b => b.textContent.trim() === '创建广告位')
  if (create) { create.click(); return true }
  return false
})
console.log('Clicked 创建广告位:', clicked)
await new Promise(r => setTimeout(r, 1500))

// Check drawer opened
const drawerOpen = await page.evaluate(() => {
  return !!document.querySelector('.el-drawer .pd-section-head')
})
console.log('Drawer open:', drawerOpen)
await page.screenshot({ path: '/tmp/cr-drawer.png', fullPage: true })

// Inspect sections
const sections = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.pd-section-head')).map(h => h.textContent.trim().replace(/\s+/g, ' '))
})
console.log('\n=== Drawer sections (CREATE mode) ===')
sections.forEach(s => console.log('  -', s))

const formItems = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.el-drawer .el-form-item')).map(i => {
    return (i.querySelector('.el-form-item__label')?.textContent?.trim() || '').replace(/\s*\*\s*$/, '').replace(/\s+/g, ' ')
  }).filter(Boolean)
})
console.log('\n=== Drawer form items (CREATE mode) ===')
formItems.forEach(f => console.log('  -', f))

// Check default format - is it 1 (横幅)?
const activeFormats = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.el-drawer .pd-format-grid .el-radio-button.is-active .el-radio-button__inner')).map(b => b.textContent.trim())
})
console.log('\nDefault active formats:', activeFormats)

// Verify all expected fields exist
const requiredFields = ['所属应用', '广告位名称', '广告形式', '竞价类型']
const missing = requiredFields.filter(f => !formItems.some(fi => fi.includes(f)))
console.log('\nRequired fields missing:', missing.length === 0 ? 'none ✓' : missing.join(', '))

await browser.close()
console.log('\n=== Test done ===')
