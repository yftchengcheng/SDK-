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
  email: 'vd5-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
})
const token = reg.data?.token
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
page.on('pageerror', e => console.log('[pageerror]', e.message))
page.on('request', req => { if (req.url().includes('/api/v1/console/network/account/')) console.log('[req]', req.method(), req.url().split('?')[0], req.postData()?.slice(0, 300)) })
page.on('response', async resp => { if (resp.url().includes('/api/v1/console/network/account/create')) console.log('[resp]', resp.status(), (await resp.text()).slice(0, 300)) })
await page.setViewport({ width: 1440, height: 1100 })
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' })
await page.evaluate((tk, u) => { localStorage.setItem('token', tk); localStorage.setItem('userInfo', JSON.stringify({ token: tk, ...u })) }, token, reg.data)
await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 3000))

function pass(t) { console.log('  ✓', t) }
function fail(t) { console.log('  ✗', t); process.exit(1) }

await page.evaluate(() => Array.from(document.querySelectorAll('.page-filter-actions button')).find(b => b.textContent.includes('新建账号'))?.click())
await new Promise(r => setTimeout(r, 1500))

// 1. Platform auto-selected
const platformLabel = await page.evaluate(() => document.querySelector('.el-dialog .el-form-item:nth-child(2) .el-select')?.textContent?.replace(/\s+/g, ' ').trim())
platformLabel ? pass(`platform auto-selected: "${platformLabel}"`) : fail('not auto-selected')

// 2. Inline validation
const nameInput = await page.$('.el-dialog .el-form-item:nth-child(1) input')
await nameInput.click({ clickCount: 3 })
await page.keyboard.type('TestDefault')
await new Promise(r => setTimeout(r, 200))

let submitBtn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.el-dialog button')).find(b => b.textContent.trim() === '提交'))
await submitBtn.asElement().click()
await new Promise(r => setTimeout(r, 1000))

const errors = await page.evaluate(() => Array.from(document.querySelectorAll('.el-dialog .el-form-item__error')).map(e => e.textContent))
errors.length >= 1 ? pass(`inline validation: ${errors.length} errors, first: "${errors[0]}"`) : fail('no inline errors')

// 3. Use Vue setup state to fill the required fields (bypass puppeteer el-input issue)
const errKeys = errors.map(e => { const m = e.match(/credentials\.(\w+) is required/); return m ? m[1] : null }).filter(Boolean)
console.log('  required keys:', errKeys.join(', '))

const fillResult = await page.evaluate((keys) => {
  const items = Array.from(document.querySelectorAll('.el-dialog .el-form-item'))
  const filled = []
  for (const k of keys) {
    // Find the form-item by label, then find its input
    // We need to find the input whose v-model corresponds to credentials[k]
    // Walk each input and check the el-form-item's el-input
    for (const item of items) {
      const inp = item.querySelector('input, textarea')
      if (!inp) continue
      // Try to set the value via Vue's reactive form
      // Get the el-input's __vueParentComponent which has setupState.modelValue
      const elInput = item.querySelector('.el-input') || inp.parentElement
      let comp = elInput?.__vueParentComponent
      // Walk up to find the el-form-item then form
      while (comp && !comp.props?.prop) comp = comp.parent
      if (comp?.props?.prop === k) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(inp, 'val_' + k)
        inp.dispatchEvent(new Event('input', { bubbles: true }))
        inp.dispatchEvent(new Event('change', { bubbles: true }))
        filled.push(k)
        break
      }
    }
  }
  return filled
}, errKeys)
console.log('  filled:', fillResult.join(', '))
await new Promise(r => setTimeout(r, 500))

submitBtn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.el-dialog button')).find(b => b.textContent.trim() === '提交'))
await submitBtn.asElement().click()
await new Promise(r => setTimeout(r, 2500))

const after = await page.evaluate(() => ({
  dialogOpen: getComputedStyle(document.querySelector('.el-dialog').parentElement).display !== 'none',
  errors: Array.from(document.querySelectorAll('.el-dialog .el-form-item__error')).map(e => e.textContent),
  rowCount: document.querySelector('.el-table')?.querySelectorAll('tbody tr:not(.el-table__empty-row)').length || 0,
}))
!after.dialogOpen ? pass('dialog closed after submit') : fail('dialog still open, errors: ' + after.errors)
after.rowCount > 0 ? pass(`account created (${after.rowCount} rows)`) : fail('no row in table')

await page.screenshot({ path: '/tmp/nam-final.png', fullPage: true })
await browser.close()
console.log('\n✓ ALL CHECKS PASSED')
