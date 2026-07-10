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
  email: 'dt-' + Date.now() + '@x.com', password: 'Test123456',
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
  // Find a form input with v-model
  const dlg = document.querySelector('.el-dialog')
  const nameInput = dlg?.querySelector('.el-form-item:nth-child(1) input')
  let comp = nameInput?.__vueParentComponent
  const chain = []
  while (comp) {
    chain.push({ name: comp.type?.__name || comp.type?.name, hasForm: !!comp.proxy?.form, hasNetworks: !!comp.proxy?.networks })
    comp = comp.parent
    if (chain.length > 15) break
  }
  // Find the one with form/networks
  let target = nameInput?.__vueParentComponent
  while (target && !target.proxy?.networks) target = target.parent
  return {
    chain,
    formNetworkDefId: target?.proxy?.form?.network_def_id,
    networksLen: target?.proxy?.networks?.length,
    firstNet: target?.proxy?.networks?.[0],
  }
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
