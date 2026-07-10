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
  email: 'ss-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
})
const token = reg.data?.token
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
page.on('pageerror', e => console.log('[pageerror]', e.message))
await page.setViewport({ width: 1440, height: 1100 })
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' })
await page.evaluate((tk, u) => { localStorage.setItem('token', tk); localStorage.setItem('userInfo', JSON.stringify({ token: tk, ...u })) }, token, reg.data)
await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 3000))

await page.evaluate(() => Array.from(document.querySelectorAll('.page-filter-actions button')).find(b => b.textContent.includes('新建账号'))?.click())
await new Promise(r => setTimeout(r, 1500))

// Type into 账号名称
const nameInput = await page.$('.el-dialog .el-form-item:nth-child(1) input')
await nameInput.click({ clickCount: 3 })
await page.keyboard.type('TestDefault')
await new Promise(r => setTimeout(r, 200))

// Click submit without filling credential fields
const submitBtn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.el-dialog button')).find(b => b.textContent.trim() === '提交'))
await submitBtn.asElement().click()
await new Promise(r => setTimeout(r, 1500))

await page.screenshot({ path: '/tmp/nam-state.png', fullPage: true })

// Check the actual error text now
const errors = await page.evaluate(() => Array.from(document.querySelectorAll('.el-dialog .el-form-item__error')).map(e => e.textContent))
console.log('errors:', JSON.stringify(errors))
const dialogOpen = await page.evaluate(() => getComputedStyle(document.querySelector('.el-dialog').parentElement).display !== 'none')
console.log('dialog still open:', dialogOpen)

await browser.close()
