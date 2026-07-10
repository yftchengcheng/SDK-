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
  email: 'dbg2-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
})
const token = reg.data?.token

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
page.on('pageerror', e => console.log('[pageerror]', e.message))
page.on('console', m => { if (m.type() === 'error' || m.text().includes('openCreate')) console.log('[' + m.type() + ']', m.text()) })
await page.setViewport({ width: 1440, height: 900 })
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' })
await page.evaluate((tk) => { localStorage.setItem('token', tk); localStorage.setItem('userInfo', JSON.stringify({ token: tk })) }, token)
await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 2500))

// Find all buttons with "新建账号"
const allButtons = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'))
  return btns.filter(b => b.textContent.includes('新建账号')).map(b => ({
    text: b.textContent.trim(),
    className: b.className,
    parent: b.closest('.page-filter-actions, .page-card')?.className?.split(' ').filter(c => c.startsWith('page-')).join(' '),
  }))
})
console.log('all 新建账号 buttons:', JSON.stringify(allButtons, null, 2))

// Click the toolbar one
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('.page-filter-actions button')).find(b => b.textContent.includes('新建账号'))
  if (btn) {
    console.log('Clicking button:', btn.textContent.trim())
    btn.click()
  } else {
    console.log('Button not found in .page-filter-actions')
  }
})
await new Promise(r => setTimeout(r, 1500))

// Check dialog
const dialogState = await page.evaluate(() => {
  const dialogs = document.querySelectorAll('.el-dialog')
  return {
    dialogCount: dialogs.length,
    dialogs: Array.from(dialogs).map(d => ({
      title: d.querySelector('.el-dialog__title')?.textContent,
      visible: d.style.display !== 'none' && !d.classList.contains('is-closed') && getComputedStyle(d).visibility !== 'hidden',
      parentVisible: d.parentElement?.style.display !== 'none' && !d.parentElement.classList.contains('is-closed'),
      hasWrapper: !!d.closest('.el-dialog__wrapper'),
    })),
  }
})
console.log('dialog state:', JSON.stringify(dialogState, null, 2))

await browser.close()
