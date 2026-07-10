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
  email: 'dbg3-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'pdt', companyShortName: 'pdt', contactName: 'pdt', phone: '13800000000', accessType: 1,
})
const token = reg.data.token
const app = (await api('POST', '/api/v1/console/app/create', {
  appName: 'Dbg3App', packageName: 'com.test.dbg3' + Date.now(), platform: 1, orientation: 2,
}, token)).data

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
await new Promise(r => setTimeout(r, 2000))

await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'))
  const c = btns.find(b => b.textContent.trim() === '创建广告位')
  if (c) c.click()
})
await new Promise(r => setTimeout(r, 2500))

// List ALL radio buttons anywhere
const allRadios = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.el-radio-button')).map(r => ({
    text: r.textContent.trim(),
    active: r.classList.contains('is-active'),
    parentDrawer: !!r.closest('.el-drawer'),
  }))
})
console.log('All .el-radio-button in document:')
allRadios.forEach(r => console.log(`  - "${r.text}" active=${r.active} drawer=${r.parentDrawer}`))

// Check the actual DOM structure of the format group
const formatGroup = await page.evaluate(() => {
  const fg = document.querySelector('.pd-format-grid')
  if (!fg) return 'NO .pd-format-grid FOUND'
  return {
    innerHTML: fg.outerHTML.substring(0, 500),
    childrenCount: fg.children.length,
  }
})
console.log('\n.pd-format-grid structure:')
console.log(JSON.stringify(formatGroup, null, 2))

// Check the title
const title = await page.evaluate(() => {
  return document.querySelector('.el-drawer__title')?.textContent?.trim()
})
console.log('Drawer title:', title)

await page.screenshot({ path: '/tmp/dbg3.png', fullPage: true })
await browser.close()
