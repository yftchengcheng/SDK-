import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const puppeteer = require('puppeteer')
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome'

async function api(method, url, body, token) {
  const r = await fetch('http://localhost:5000' + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? {Authorization: 'Bearer ' + token} : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return r.json()
}

const reg = await api('POST', '/api/v1/auth/register', {
  email: 'rc-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
})
const token = reg.data?.token
console.log('Token obtained')

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
const errors = []
page.on('pageerror', e => { errors.push('[pageerror] ' + e.message); console.log('[pageerror]', e.message) })
page.on('console', m => { if (m.type() === 'error') console.log('[' + m.type() + ']', m.text().slice(0, 300)) })

await page.setViewport({ width: 1440, height: 900 })
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' })
await page.evaluate((tk, user) => { 
  localStorage.setItem('token', tk)
  localStorage.setItem('userInfo', JSON.stringify({ token: tk, ...user }))
}, token, reg.data)
await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 4000))

const state = await page.evaluate(() => {
  return {
    url: location.href,
    bodyText: document.body?.innerText?.slice(0, 300),
    elDialog: !!document.querySelector('.el-dialog'),
    elTabs: Array.from(document.querySelectorAll('.el-tabs__item')).map(t => t.textContent?.trim()),
    networkAccountManager: !!document.querySelector('.network-account-manager'),
    namTable: !!document.querySelector('.nam-table'),
    pageCardTitles: Array.from(document.querySelectorAll('.page-card-title')).map(t => t.textContent?.trim()),
    pageFilterActionsBtns: Array.from(document.querySelectorAll('.page-filter-actions button')).map(b => b.textContent?.trim()),
    errorBoundary: !!document.querySelector('.error-boundary, [class*="error"]'),
  }
})
console.log('\nSTATE:', JSON.stringify(state, null, 2))
console.log('Total errors:', errors.length)
await page.screenshot({ path: '/tmp/render-check.png', fullPage: true })
await browser.close()
