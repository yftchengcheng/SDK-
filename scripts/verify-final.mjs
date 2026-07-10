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
  email: 'vf-' + Date.now() + '@x.com', password: 'Test123456',
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

// Issue 1: Platform auto-selected
const platformText = await page.evaluate(() => document.querySelector('.el-dialog .el-form-item:nth-child(2) .el-select')?.textContent?.trim())
platformText ? pass(`1. platform auto-selected: "${platformText}"`) : fail('1. not auto-selected')

// Issue 2: Schema fields visible immediately
const fields = await page.evaluate(() => Array.from(document.querySelectorAll('.el-dialog .el-form-item__label')).map(l => l.textContent?.trim()))
const hasCredField = fields.some(f => /账户ID|Secret Key|用户ID|RoleID|Secure Key/.test(f))
hasCredField ? pass(`2. schema fields render on open (${fields.length} fields)`) : fail('2. no schema fields: ' + fields)

// Issue 3: Inline Chinese validation
const nameInput = await page.$('.el-dialog .el-form-item:nth-child(1) input')
await nameInput.click({ clickCount: 3 })
await page.keyboard.type('TestDefault')
await new Promise(r => setTimeout(r, 200))
let submitBtn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.el-dialog button')).find(b => b.textContent.trim() === '提交'))
await submitBtn.asElement().click()
await new Promise(r => setTimeout(r, 1000))
const errors = await page.evaluate(() => Array.from(document.querySelectorAll('.el-dialog .el-form-item__error')).map(e => e.textContent))
const hasChineseErr = errors.length > 0 && /^请填写/.test(errors[0])
const dialogOpen = await page.evaluate(() => getComputedStyle(document.querySelector('.el-dialog').parentElement).display !== 'none')
hasChineseErr ? pass(`3. Chinese inline validation: ${errors.join(' | ')}`) : fail('3. errors not Chinese: ' + errors)
dialogOpen ? pass('3b. dialog stays open') : fail('3b. dialog closed unexpectedly')

// Issue 4: API submit with proper data structure works
const networks = await api('GET', '/api/v1/console/network/list', null, token)
const firstNet = networks.data.list[0]
const createR = await api('POST', '/api/v1/console/network/account/create', {
  accountName: 'VFFinal',
  networkDefId: firstNet.id,
  accountId: 'A123',
  credentials: { accountId: 'u1', secretKey: 's1' },
  status: 1,
  remark: 'final',
}, token)
createR.code === 0 ? pass(`4. API submit works: id=${createR.data.id}, net_name=${createR.data.network_name}`) : fail('4. create failed: ' + JSON.stringify(createR))

// Issue 5: Account appears in list
const listR = await api('GET', '/api/v1/console/network/account/list', null, token)
const found = listR.data?.list?.find(a => a.account_name === 'VFFinal')
found ? pass(`5. account in list, network_name="${found.network_name}"`) : fail('5. not in list')

// Cleanup
await api('DELETE', '/api/v1/console/network/account/' + createR.data.id, null, token)

await page.screenshot({ path: '/tmp/nam-final2.png', fullPage: true })
await browser.close()
console.log('\n✓ ALL 5 ISSUES FIXED')
