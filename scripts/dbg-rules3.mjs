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
  email: 'dr3-' + Date.now() + '@x.com', password: 'Test123456',
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

// Find ElForm directly
const result = await page.evaluate(() => {
  const dlg = document.querySelector('.el-dialog')
  const items = Array.from(dlg.querySelectorAll('.el-form-item'))
  // Find ElFormItem directly from the item element
  return items.slice(0, 8).map(item => {
    const label = item.querySelector('.el-form-item__label')?.textContent?.trim()
    // Use vnode to get the ElFormItem component
    const vnode = item.__vnode
    let comp = item.__vueParentComponent
    // Walk up
    let result = { label }
    while (comp) {
      const name = comp.type?.__name || comp.type?.name
      if (name === 'ElFormItem') {
        result.prop = comp.props?.prop
        result.rulesCount = comp.props?.rules?.length
        result.firstRuleMsg = comp.props?.rules?.[0]?.message
        break
      }
      comp = comp.parent
    }
    return result
  })
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
