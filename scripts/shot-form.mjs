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
  email: 'sf-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
})
const token = reg.data?.token
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1100 })
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' })
await page.evaluate((tk) => { localStorage.setItem('token', tk); localStorage.setItem('userInfo', JSON.stringify({ token: tk })) }, token)
await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 2500))
await page.evaluate(() => Array.from(document.querySelectorAll('.page-filter-actions button')).find(b => b.textContent.includes('新建账号'))?.click())
await new Promise(r => setTimeout(r, 1000))
const sel = await page.$('.el-dialog .el-select')
await sel.click()
await new Promise(r => setTimeout(r, 1000))
const input = await page.$('.el-dialog .el-select input')
await input.focus()
await new Promise(r => setTimeout(r, 200))
const opts = await page.evaluate(() => Array.from(document.querySelectorAll('.el-select-dropdown__item')).map(o => o.textContent?.trim()))
const csjIdx = opts.indexOf('穿山甲')
for (let i = 0; i <= csjIdx; i++) { await page.keyboard.press('ArrowDown'); await new Promise(r => setTimeout(r, 50)) }
await page.keyboard.press('Enter')
await new Promise(r => setTimeout(r, 1500))
await page.screenshot({ path: '/tmp/nam-form.png', fullPage: true })
await browser.close()
