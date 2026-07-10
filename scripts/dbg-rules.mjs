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
page.on('pageerror', e => console.log('[pageerror]', e.message))
await page.setViewport({ width: 1440, height: 1100 })
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' })
await page.evaluate((tk, u) => { localStorage.setItem('token', tk); localStorage.setItem('userInfo', JSON.stringify({ token: tk, ...u })) }, token, reg.data)
await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 3000))

await page.evaluate(() => Array.from(document.querySelectorAll('.page-filter-actions button')).find(b => b.textContent.includes('新建账号'))?.click())
await new Promise(r => setTimeout(r, 1500))

// Check the form's actual rules
const result = await page.evaluate(() => {
  const dlg = document.querySelector('.el-dialog')
  const items = Array.from(dlg.querySelectorAll('.el-form-item'))
  return items.map(item => {
    const label = item.querySelector('.el-form-item__label')?.textContent?.trim()
    const elInput = item.querySelector('.el-input, .el-textarea')
    let comp = elInput?.__vueParentComponent
    // Walk up to find el-form-item
    while (comp && comp.type?.__name !== 'ElFormItem') comp = comp.parent
    return {
      label,
      formItemProps: comp?.props ? Object.keys(comp.props) : [],
      hasRules: comp?.props?.rules !== undefined,
      rulesType: comp?.props?.rules ? typeof comp.props.rules : 'none',
      prop: comp?.props?.prop,
    }
  })
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
