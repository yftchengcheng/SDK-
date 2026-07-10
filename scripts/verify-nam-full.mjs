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
  email: 'full-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
})
const token = reg.data?.token
const me = await api('GET', '/api/v1/auth/me', null, token)
const developerId = me.data?.developerId
console.log('me OK, developerId:', developerId)

const networks = await api('GET', '/api/v1/console/network/list', null, token)
const csj = networks.data?.list?.find(n => n.network_code === 'CSJ' || n.network_name?.includes('穿山甲'))
if (!csj) { console.log('no CSJ, networks:', networks.data?.list?.slice(0,3).map(n => ({name: n.network_name, code: n.network_code, is_preset: n.is_preset}))); process.exit(1) }
console.log('CSJ network:', csj.id, csj.network_name, 'is_preset:', csj.is_preset)

// === Backend CRUD test via API ===
const createR = await api('POST', '/api/v1/console/network/account/create', {
  accountName: 'API-CSJ-' + Date.now(),
  networkDefId: csj.id,
  accountId: 'A12345',
  credentials: { userId: 'test_uid', roleId: 'test_rid', secureKey: 'test_sk' },
  status: 1,
  remark: 'e2e test',
}, token)
console.log('create:', createR)
const acctId = createR.data?.id
if (!acctId) { console.log('create failed'); process.exit(1) }
console.log('  ✓ account created', acctId)

const listR = await api('GET', '/api/v1/console/network/account/list', null, token)
const found = listR.data?.list?.find(a => a.id === acctId)
found ? console.log('  ✓ account in list') : (() => { console.log('  ✗ not in list', listR); process.exit(1) })()

const updateR = await api('PATCH', '/api/v1/console/network/account/' + acctId, {
  remark: 'updated',
  status: 2,
}, token)
updateR.code === 0 ? console.log('  ✓ updated remark & status') : (() => { console.log('  ✗ update failed', updateR); process.exit(1) })()

const viewR = await api('GET', '/api/v1/console/network/account/detail?id=' + acctId, null, token)
viewR.data?.credentials?.userId === 'test_uid' ? console.log('  ✓ credentials stored correctly') : (() => { console.log('  ✗ cred lost', viewR); process.exit(1) })()

const delR = await api('DELETE', '/api/v1/console/network/account/' + acctId, null, token)
delR.code === 0 ? console.log('  ✓ deleted') : (() => { console.log('  ✗ delete failed', delR); process.exit(1) })()

// === Frontend schema render test ===
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
page.on('pageerror', e => console.log('[pageerror]', e.message))
await page.setViewport({ width: 1440, height: 900 })
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' })
await page.evaluate((tk) => { localStorage.setItem('token', tk); localStorage.setItem('userInfo', JSON.stringify({ token: tk })) }, token)
await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 2500))

// Seed an account via API so the list has data
const seedR = await api('POST', '/api/v1/console/network/account/create', {
  accountName: 'UI-Seed-CSJ',
  networkDefId: csj.id,
  accountId: 'SEED123',
  credentials: { userId: 'seed_uid', roleId: 'seed_rid', secureKey: 'seed_sk' },
  status: 1,
  remark: 'for UI',
}, token)
const seedId = seedR.data?.id
await new Promise(r => setTimeout(r, 1500))
await page.reload({ waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 2500))

function pass(t) { console.log('  ✓', t) }
function fail(t) { console.log('  ✗', t); process.exit(1) }

// 1. No preset card
const titles = await page.evaluate(() => Array.from(document.querySelectorAll('.page-card-title')).map(t => t.textContent.trim()))
titles.some(t => t.includes('预置') || t.includes('预设')) ? (() => { fail('preset card present: ' + titles) })() : pass('no preset card')

// 2. Tab order: 账号 first, 自定义 second
const tabLabels = await page.evaluate(() => Array.from(document.querySelectorAll('.el-tabs__item')).map(t => t.textContent.trim()))
const accountsIdx = tabLabels.findIndex(t => t.includes('账号'))
const customIdx = tabLabels.findIndex(t => t.includes('自定义'))
accountsIdx < customIdx ? pass('tab order: 账号 first, 自定义 second') : (() => { fail('tab order wrong: ' + tabLabels) })()

// 3. List shows seeded account
const listNames = await page.evaluate(() => Array.from(document.querySelectorAll('.nam-table tbody tr .nam-name')).map(s => s.textContent.trim()))
listNames.includes('UI-Seed-CSJ') ? pass('account appears in list') : (() => { fail('seeded account not in list: ' + listNames) })()

// 4. Open dialog, select 穿山甲, check schema fields
await page.evaluate(() => Array.from(document.querySelectorAll('.page-filter-actions button')).find(b => b.textContent.includes('新建账号'))?.click())
await new Promise(r => setTimeout(r, 1000))
const sel = await page.$('.el-dialog .el-select')
await sel.click()
await new Promise(r => setTimeout(r, 1000))
const inp = await page.$('.el-dialog .el-select input')
await inp.focus()
await new Promise(r => setTimeout(r, 200))
const opts = await page.evaluate(() => Array.from(document.querySelectorAll('.el-select-dropdown__item')).map(o => o.textContent?.trim()))
const csjIdx = opts.indexOf('穿山甲')
for (let i = 0; i <= csjIdx; i++) {
  await page.keyboard.press('ArrowDown')
  await new Promise(r => setTimeout(r, 50))
}
await page.keyboard.press('Enter')
await new Promise(r => setTimeout(r, 1000))

const fields = await page.evaluate(() => Array.from(document.querySelectorAll('.el-dialog .el-form-item__label')).map(l => l.textContent?.trim()))
const hasCSJFields = fields.includes('用户ID') && fields.includes('RoleID') && fields.includes('Secure Key')
const hasDivider = await page.evaluate(() => !!document.querySelector('.el-dialog .nam-divider'))
hasCSJFields ? pass('schema fields render for 穿山甲') : (() => { fail('no CSJ fields: ' + fields) })()
hasDivider ? pass('divider 凭证字段 present') : (() => { fail('no divider') })()

// 5. Close dialog
await page.evaluate(() => Array.from(document.querySelectorAll('.el-dialog button')).find(b => b.textContent.trim() === '取消')?.click())
await new Promise(r => setTimeout(r, 500))

// 6. View credentials
const viewBtn = await page.evaluateHandle(() => {
  return Array.from(document.querySelectorAll('.nam-table tbody tr button')).find(b => b.textContent.trim() === '查看')
})
if (viewBtn.asElement()) {
  await viewBtn.asElement().click()
  await new Promise(r => setTimeout(r, 1500))
  const drawerText = await page.evaluate(() => document.querySelector('.el-drawer')?.textContent || '')
  drawerText.includes('UI-Seed-CSJ') ? pass('view drawer shows account name') : (() => { fail('view drawer missing name') })()
  drawerText.includes('userId') || drawerText.includes('seed_uid') ? pass('view drawer shows credentials') : (() => { fail('view drawer no cred: ' + drawerText.slice(0, 200)) })()
} else {
  fail('view button not found')
}

await page.screenshot({ path: '/tmp/nam-full.png', fullPage: true })
console.log('saved /tmp/nam-full.png')

// Cleanup seed account
await api('DELETE', '/api/v1/console/network/account/' + seedId, null, token)

await browser.close()
console.log('\n✓ ALL E2E CHECKS PASSED')
