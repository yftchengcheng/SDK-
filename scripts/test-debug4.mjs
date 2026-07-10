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
  email: 'dbg4-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'pdt', companyShortName: 'pdt', contactName: 'pdt', phone: '13800000000', accessType: 1,
})
const token = reg.data.token
const app = (await api('POST', '/api/v1/console/app/create', {
  appName: 'Dbg4App', packageName: 'com.test.dbg4' + Date.now(), platform: 1, orientation: 2,
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

// List all buttons on the page
const allBtns = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button')).map(b => ({
    text: b.textContent.trim().replace(/\s+/g, ' '),
    visible: b.offsetParent !== null,
  }))
})
console.log('All buttons on page:')
allBtns.forEach(b => console.log(`  - [${b.visible ? 'V' : 'X'}] "${b.text}"`))

// Click 创建广告位
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'))
  // Find the visible one
  const c = btns.find(b => b.textContent.trim() === '创建广告位' && b.offsetParent !== null)
  if (c) c.click()
})
await new Promise(r => setTimeout(r, 2500))

// Check all drawrs
const drawers = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.el-drawer')).map(d => ({
    title: d.querySelector('.el-drawer__title')?.textContent?.trim() || '',
    open: d.style.display !== 'none' && !d.classList.contains('el-drawer-fade-leave-to'),
    sections: Array.from(d.querySelectorAll('.pd-section-head')).map(h => h.textContent.trim().replace(/\s+/g, ' ')),
  }))
})
console.log('\nDrawers on page:')
drawers.forEach(d => console.log(`  - title="${d.title}" sections=${JSON.stringify(d.sections)}`))

await page.screenshot({ path: '/tmp/dbg4.png', fullPage: true })
await browser.close()
