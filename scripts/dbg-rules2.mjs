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
  email: 'dr2-' + Date.now() + '@x.com', password: 'Test123456',
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

// Click submit and see what validate does
await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('.el-dialog .el-form-item'))
  return items.map(item => ({
    label: item.querySelector('.el-form-item__label')?.textContent?.trim(),
  }))
})

// Manually call validate
const validateResult = await page.evaluate(() => {
  // Find the form ref via Vue
  const dlg = document.querySelector('.el-dialog')
  const form = dlg?.querySelector('form')
  let comp = form?.__vueParentComponent
  const chain = []
  while (comp) {
    chain.push({ name: comp.type?.__name || comp.type?.name, hasValidate: typeof comp.proxy?.validate })
    comp = comp.parent
    if (chain.length > 20) break
  }
  return chain
})
console.log('chain:', JSON.stringify(validateResult, null, 2))

await browser.close()
