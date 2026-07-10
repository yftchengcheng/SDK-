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
  email: 'dr-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
})
const token = reg.data?.token
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
const allMsgs = []
page.on('pageerror', e => allMsgs.push('[pageerror] ' + e.message))
page.on('console', m => allMsgs.push('[' + m.type() + '] ' + m.text().slice(0, 400)))
page.on('requestfailed', r => allMsgs.push('[reqfail] ' + r.url() + ' ' + r.failure()?.errorText))

await page.setViewport({ width: 1440, height: 900 })
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' })
await page.evaluate((tk, user) => { 
  localStorage.setItem('token', tk)
  localStorage.setItem('userInfo', JSON.stringify({ token: tk, ...user }))
}, token, reg.data)
await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 5000))

// Click around the page
console.log('--- BEFORE INTERACTION ---')
allMsgs.forEach(m => console.log(m))

// Switch to 自定义 tab
await page.evaluate(() => {
  Array.from(document.querySelectorAll('.el-tabs__item')).find(t => t.textContent?.includes('自定义'))?.click()
})
await new Promise(r => setTimeout(r, 1500))

console.log('--- AFTER TAB SWITCH ---')
allMsgs.slice().forEach(m => console.log(m))

const state2 = await page.evaluate(() => ({
  url: location.href,
  customPageCardTitles: Array.from(document.querySelectorAll('.page-card-title')).map(t => t.textContent?.trim()),
  hasCustomContent: !!document.querySelector('.nam-custom, .custom-network'),
  visibleContent: document.querySelector('.el-tab-pane:not([style*="display: none"])')?.innerText?.slice(0, 300),
}))
console.log('\nCUSTOM TAB STATE:', JSON.stringify(state2, null, 2))

await page.screenshot({ path: '/tmp/deep-render.png', fullPage: true })
await browser.close()
