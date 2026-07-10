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
  email: 'ds-' + Date.now() + '@x.com', password: 'Test123456',
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

await page.evaluate(() => Array.from(document.querySelectorAll('.page-filter-actions button')).find(b => b.textContent.includes('新建账号'))?.click())
await new Promise(r => setTimeout(r, 1500))

const result = await page.evaluate(() => {
  const dlg = document.querySelector('.el-dialog')
  // Find the platform select (second form-item)
  const items = Array.from(dlg.querySelectorAll('.el-form-item'))
  const platformItem = items.find(item => item.querySelector('.el-form-item__label')?.textContent?.trim() === '广告平台')
  const select = platformItem?.querySelector('.el-select')
  const input = select?.querySelector('input')
  // Get the underlying Vue reactive state
  let comp = select?.__vueParentComponent
  const result = {
    selectInnerHTML: select?.innerHTML?.slice(0, 500),
    inputValue: input?.value,
    inputReadonly: input?.readOnly,
    placeholder: select?.querySelector('.el-input__placeholder')?.textContent,
    placeholderStyle: select?.querySelector('.el-input__placeholder')?.getAttribute('style'),
    selectedItem: select?.querySelector('.el-select__selected-item')?.textContent,
    selectedItemDisplay: select?.querySelector('.el-select__selected-item')?.getAttribute('style'),
  }
  // Walk up to find the form state
  let parent = comp
  while (parent && parent.type?.name !== 'NetworkAccountManager') {
    parent = parent.parent
  }
  if (parent) {
    result.networkDefId = parent.proxy.form?.network_def_id
    result.networkDefIdType = typeof parent.proxy.form?.network_def_id
    result.networksLen = parent.proxy.networks?.length
    result.firstNet = parent.proxy.networks?.[0]
  }
  return result
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
