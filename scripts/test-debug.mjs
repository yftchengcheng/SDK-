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
  email: 'dbg-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'pdt', companyShortName: 'pdt', contactName: 'pdt', phone: '13800000000', accessType: 1,
})
const token = reg.data.token
const app = (await api('POST', '/api/v1/console/app/create', {
  appName: 'DbgApp', packageName: 'com.test.dbg' + Date.now(), platform: 1, orientation: 2,
}, token)).data

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1100 })
await page.on('pageerror', e => console.log('[pageerror]', e.message))
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
  const c = btns.find(b => b.textContent.trim() === '创建广告位')
  if (c) c.click()
})
await new Promise(r => setTimeout(r, 2500))

// Debug: list all form items
const initialItems = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.el-drawer .el-form-item')).map(i => ({
    label: (i.querySelector('.el-form-item__label')?.textContent?.trim() || '').replace(/\s+/g, ' '),
    hasHelp: !!i.querySelector('.pd-form-help'),
  }))
})
console.log('Initial form items:')
initialItems.forEach(i => console.log('  -', i.label, i.hasHelp ? '(help)' : ''))

// Click 插屏 radio
const chaping = await page.evaluate(() => {
  const drawer = document.querySelector('.el-drawer')
  if (!drawer) return 'no drawer'
  const radios = drawer.querySelectorAll('.el-radio-button__inner')
  for (const r of radios) if (r.textContent.trim() === '插屏') { r.click(); return 'clicked 插屏' }
  return 'not found'
})
console.log('Click 插屏:', chaping)
await new Promise(r => setTimeout(r, 1000))

// After format change
const afterItems = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.el-drawer .el-form-item')).map(i => ({
    label: (i.querySelector('.el-form-item__label')?.textContent?.trim() || '').replace(/\s+/g, ' '),
    activeRadios: Array.from(i.querySelectorAll('.el-radio-button.is-active .el-radio-button__inner')).map(b => b.textContent.trim()),
    hasHelp: !!i.querySelector('.pd-form-help'),
    helpText: i.querySelector('.pd-form-help')?.textContent?.trim().replace(/\s+/g, ' '),
  }))
})
console.log('\nAfter format change:')
afterItems.forEach(i => console.log('  -', i.label, JSON.stringify(i.activeRadios), i.helpText || ''))

await page.screenshot({ path: '/tmp/dbg-drawer.png', fullPage: true })
await browser.close()
