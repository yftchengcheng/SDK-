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
  email: 'dbg-nam-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
})
const token = reg.data?.token

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
page.on('pageerror', e => console.log('[pageerror]', e.message))
page.on('console', m => console.log('[console.' + m.type() + ']', m.text()))
await page.setViewport({ width: 1440, height: 900 })
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' })
await page.evaluate((tk) => { localStorage.setItem('token', tk); localStorage.setItem('userInfo', JSON.stringify({ token: tk })) }, token)
await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 2500))

// Click 新建账号
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '+ 新建账号')
  btn?.click()
})
await new Promise(r => setTimeout(r, 1000))

// Check drawer
const drawerState = await page.evaluate(() => {
  const drawer = document.querySelector('.el-drawer')
  if (!drawer) return { open: false }
  return {
    title: drawer.querySelector('.el-drawer__title')?.textContent?.trim(),
    innerHTML_len: drawer.innerHTML.length,
    bodyText: drawer.querySelector('.el-drawer__body')?.textContent?.slice(0, 200),
  }
})
console.log('drawer state:', JSON.stringify(drawerState))

// Click select
await page.evaluate(() => {
  const drawer = document.querySelector('.el-drawer')
  const sel = drawer?.querySelector('.el-select')
  console.log('select elem:', sel?.outerHTML?.slice(0, 200))
  sel?.click()
})
await new Promise(r => setTimeout(r, 800))

// Click 穿山甲
await page.evaluate(() => {
  const opt = Array.from(document.querySelectorAll('.el-select-dropdown__item')).find(o => o.textContent.trim() === '穿山甲')
  opt?.click()
})
await new Promise(r => setTimeout(r, 1500))

// After selection, check schema
const afterSelect = await page.evaluate(() => {
  const drawer = document.querySelector('.el-drawer')
  const items = drawer?.querySelectorAll('.el-form-item')
  return {
    items: Array.from(items || []).map(i => i.querySelector('.el-form-item__label')?.textContent?.trim()),
    htmlSnippet: drawer?.querySelector('.el-drawer__body')?.innerHTML?.slice(0, 500),
  }
})
console.log('after select:', JSON.stringify(afterSelect, null, 2))

await browser.close()
