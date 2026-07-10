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
  email: 'ds2-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
})
const token = reg.data?.token
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1100 })
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' })
await page.evaluate((tk, u) => { localStorage.setItem('token', tk); localStorage.setItem('userInfo', JSON.stringify({ token: tk, ...u })) }, token, reg.data)
await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 3000))

// Click the button via dispatched click
const beforeOpen = await page.evaluate(() => {
  // Use the public API to see if form is in setup state
  const dlg = document.querySelector('.el-dialog')
  return { hasDlg: !!dlg }
})
console.log('before open:', beforeOpen)

await page.evaluate(() => {
  Array.from(document.querySelectorAll('.page-filter-actions button')).find(b => b.textContent.includes('新建账号'))?.click()
})
await new Promise(r => setTimeout(r, 1500))

// Look for the el-select internal _value
const result = await page.evaluate(() => {
  const dlg = document.querySelector('.el-dialog')
  const sel = dlg?.querySelector('.el-form-item:nth-child(2) .el-select')
  // Get el-select's _value via the Vue component
  let comp = sel?.__vueParentComponent
  const states = []
  while (comp) {
    if (comp.type?.name === 'ElSelectV2' || comp.setupState?.modelValue !== undefined) {
      states.push({ name: comp.type?.__name || comp.type?.name, modelValue: comp.setupState?.modelValue, propsModelValue: comp.props?.modelValue })
    }
    comp = comp.parent
  }
  // Also check input element
  const inp = sel?.querySelector('input')
  return {
    inputValue: inp?.value,
    selectInnerHTML: sel?.innerHTML?.slice(0, 400),
    elSelectStates: states,
  }
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
