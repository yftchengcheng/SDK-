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
  email: 'dbg2-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'pdt', companyShortName: 'pdt', contactName: 'pdt', phone: '13800000000', accessType: 1,
})
const token = reg.data.token
const app = (await api('POST', '/api/v1/console/app/create', {
  appName: 'Dbg2App', packageName: 'com.test.dbg2' + Date.now(), platform: 1, orientation: 2,
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

// List all radio buttons in drawer
const allRadios = await page.evaluate(() => {
  const drawer = document.querySelector('.el-drawer')
  if (!drawer) return []
  return Array.from(drawer.querySelectorAll('.el-radio-button')).map(r => ({
    text: r.textContent.trim(),
    inner: r.querySelector('.el-radio-button__inner')?.textContent?.trim() || '',
  }))
})
console.log('All radios in drawer:')
allRadios.forEach(r => console.log(`  - "${r.text}" (inner="${r.inner}")`))

// Click 插屏 using label selector
const clicked = await page.evaluate(() => {
  const drawer = document.querySelector('.el-drawer')
  if (!drawer) return 'no drawer'
  // The label is a parent of el-radio-button__inner
  const labels = drawer.querySelectorAll('.el-radio-button')
  for (const l of labels) {
    const inner = l.querySelector('.el-radio-button__inner')
    if (inner && inner.textContent.trim() === '插屏') {
      l.click()
      return 'clicked 插屏'
    }
  }
  return 'not found'
})
console.log('Click 插屏:', clicked)
await new Promise(r => setTimeout(r, 1000))

// Check after click
const afterItems = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.el-drawer .el-form-item')).map(i => ({
    label: (i.querySelector('.el-form-item__label')?.textContent?.trim() || '').replace(/\s+/g, ' '),
    activeRadios: Array.from(i.querySelectorAll('.el-radio-button.is-active .el-radio-button__inner')).map(b => b.textContent.trim()),
    helpText: i.querySelector('.pd-form-help')?.textContent?.trim().replace(/\s+/g, ' '),
  }))
})
console.log('\nAfter click 插屏:')
afterItems.forEach(i => console.log(`  - ${i.label} ${JSON.stringify(i.activeRadios)} | help: ${i.helpText || '-'}`))

await page.screenshot({ path: '/tmp/dbg2.png', fullPage: true })
await browser.close()
