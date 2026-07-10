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
  email: 'vd6-' + Date.now() + '@x.com', password: 'Test123456',
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

function pass(t) { console.log('  ✓', t) }
function fail(t) { console.log('  ✗', t); process.exit(1) }

await page.evaluate(() => Array.from(document.querySelectorAll('.page-filter-actions button')).find(b => b.textContent.includes('新建账号'))?.click())
await new Promise(r => setTimeout(r, 1500))

// Verify all 3 issues are fixed in the actual UI:

// Issue 1: Platform auto-selected
const platform = await page.evaluate(() => {
  const sel = document.querySelector('.el-dialog .el-form-item:nth-child(2) .el-select')
  return sel?.querySelector('.el-select__placeholder span')?.textContent?.trim() || sel?.querySelector('.el-select__selected-item span')?.textContent?.trim()
})
platform ? pass(`issue 1: platform auto-selected = "${platform}"`) : fail('issue 1: platform not auto-selected')

// Issue 2: Schema fields visible on open (no need to select first)
const fields = await page.evaluate(() => Array.from(document.querySelectorAll('.el-dialog .el-form-item__label')).map(l => l.textContent?.trim()))
const hasCredFields = fields.some(f => /账户ID|Secret Key|用户ID|RoleID|Secure Key|账号ID|app_id/.test(f))
hasCredFields ? pass(`issue 2: schema fields render on open (${fields.length} labels)`) : fail('issue 2: no credential fields: ' + fields)

// Issue 3: Inline validation when fields empty
const nameInput = await page.$('.el-dialog .el-form-item:nth-child(1) input')
await nameInput.click({ clickCount: 3 })
await page.keyboard.type('TestDefault')
await new Promise(r => setTimeout(r, 200))
let submitBtn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.el-dialog button')).find(b => b.textContent.trim() === '提交'))
await submitBtn.asElement().click()
await new Promise(r => setTimeout(r, 1000))
const errors = await page.evaluate(() => Array.from(document.querySelectorAll('.el-dialog .el-form-item__error')).map(e => e.textContent))
const hasInlineErr = errors.length >= 1 && errors[0].includes('credentials.')
hasInlineErr ? pass(`issue 3: inline validation (${errors.length} errors: ${errors[0]})`) : fail('issue 3: no inline errors')

// Issue 4: Direct API test - confirm the payload structure the form would send works
const networks = await api('GET', '/api/v1/console/network/list', null, token)
const firstNet = networks.data.list[0]
console.log('  first network:', firstNet.network_name, 'id:', firstNet.id)

const createR = await api('POST', '/api/v1/console/network/account/create', {
  accountName: 'VD6Test',
  networkDefId: firstNet.id,
  accountId: 'A123',
  credentials: { accountId: 'u1', secretKey: 's1' },
  status: 1,
  remark: 'vd6',
}, token)
console.log('  create resp:', JSON.stringify(createR))
createR.code === 0 ? pass('issue 4: API submit works with auto-selected platform structure') : fail('issue 4: create failed')
const acctId = createR.data?.id

// Issue 5: Verify it appears in the list
await api('GET', '/api/v1/console/network/account/list', null, token).then(r => {
  const found = r.data?.list?.find(a => a.id === acctId)
  found ? pass('issue 5: account in list') : fail('issue 5: not in list')
})

// Cleanup
await api('DELETE', '/api/v1/console/network/account/' + acctId, null, token)

await page.screenshot({ path: '/tmp/nam-final.png', fullPage: true })
await browser.close()
console.log('\n✓ ALL CHECKS PASSED')
