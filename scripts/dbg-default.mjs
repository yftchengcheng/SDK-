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
  email: 'ddf-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
})
const token = reg.data?.token
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
page.on('pageerror', e => console.log('[pageerror]', e.message))
page.on('console', m => { if (m.type() === 'log') console.log('[log]', m.text().slice(0, 200)) })
await page.setViewport({ width: 1440, height: 1100 })
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' })
await page.evaluate((tk, u) => { localStorage.setItem('token', tk); localStorage.setItem('userInfo', JSON.stringify({ token: tk, ...u })) }, token, reg.data)
await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 3000))

await page.evaluate(() => Array.from(document.querySelectorAll('.page-filter-actions button')).find(b => b.textContent.includes('新建账号'))?.click())
await new Promise(r => setTimeout(r, 1500))

const state = await page.evaluate(() => {
  const dlg = document.querySelector('.el-dialog')
  return {
    hasDialog: !!dlg,
    selectValue: dlg?.querySelector('.el-select input')?.value,
    selectText: dlg?.querySelector('.el-select .el-select__selected-item')?.textContent?.trim(),
    selectPlaceholder: dlg?.querySelector('.el-select .el-input__placeholder')?.textContent?.trim(),
    hasDivider: !!dlg?.querySelector('.nam-divider'),
    formItems: Array.from(dlg?.querySelectorAll('.el-form-item__label') || []).map(l => l.textContent?.trim()),
  }
})
console.log('STATE:', JSON.stringify(state, null, 2))

await page.screenshot({ path: '/tmp/dbg-d.png', fullPage: true })
await browser.close()
