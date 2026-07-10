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
  email: 'e2e-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
})
const token = reg.data?.token

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
page.on('pageerror', e => console.log('[pageerror]', e.message))
await page.setViewport({ width: 1440, height: 900 })
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' })
await page.evaluate((tk) => { localStorage.setItem('token', tk); localStorage.setItem('userInfo', JSON.stringify({ token: tk })) }, token)
await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 2500))

function pass(t) { console.log('  ✓', t) }
function fail(t) { console.log('  ✗', t); process.exit(1) }

// Check: no preset card, no "预设平台" card
const noPreset = await page.evaluate(() => {
  const titles = Array.from(document.querySelectorAll('.page-card-title')).map(t => t.textContent.trim())
  return !titles.some(t => t.includes('预置') || t.includes('预设'))
})
noPreset ? pass('no preset card') : fail('preset card still present')

// Open dialog
await page.evaluate(() => {
  Array.from(document.querySelectorAll('.page-filter-actions button')).find(b => b.textContent.includes('新建账号'))?.click()
})
await new Promise(r => setTimeout(r, 1000))
const dlgOpen = await page.evaluate(() => !!document.querySelector('.el-dialog .el-dialog__title'))
dlgOpen ? pass('dialog opens') : fail('dialog does not open')

// Fill 账号名称
const inputName = await page.$('.el-dialog .el-form-item:nth-child(1) input')
await inputName.click({ clickCount: 3 })
await inputName.type('CSJ-测试账号')
await new Promise(r => setTimeout(r, 200))

// Open platform select
const sel = await page.$('.el-dialog .el-select')
await sel.click()
await new Promise(r => setTimeout(r, 1000))
const input = await page.$('.el-dialog .el-select input')
await input.focus()
await new Promise(r => setTimeout(r, 200))

const opts = await page.evaluate(() => Array.from(document.querySelectorAll('.el-select-dropdown__item')).map(o => o.textContent?.trim()))
const csjIdx = opts.indexOf('穿山甲')
for (let i = 0; i <= csjIdx; i++) {
  await page.keyboard.press('ArrowDown')
  await new Promise(r => setTimeout(r, 50))
}
await page.keyboard.press('Enter')
await new Promise(r => setTimeout(r, 1000))

// Verify schema fields
const fields = await page.evaluate(() => Array.from(document.querySelectorAll('.el-dialog .el-form-item__label')).map(l => l.textContent?.trim()))
fields.includes('用户ID') ? pass('schema field 用户ID') : fail(`no 用户ID, got: ${JSON.stringify(fields)}`)
fields.includes('RoleID') ? pass('schema field RoleID') : fail('no RoleID')
fields.includes('Secure Key') ? pass('schema field Secure Key') : fail('no Secure Key')

// Fill schema fields
const credInputs = await page.$$('.el-dialog .el-form-item input')
// Find UserID, RoleID, SecureKey inputs
// Order: 账号名称, 广告平台, 账号名称 (dupe?), 报表API, 自动创建广告源, 用户ID, RoleID, Secure Key, 账号ID, 状态, 备注
// Let's just fill all visible inputs after the first 2 (which are 账号名称 + 广告平台)
for (let i = 5; i < 8; i++) {
  if (credInputs[i]) {
    await credInputs[i].click({ clickCount: 3 })
    await credInputs[i].type('val' + i)
    await new Promise(r => setTimeout(r, 100))
  }
}

// Submit
const submitBtn = await page.evaluateHandle(() => {
  return Array.from(document.querySelectorAll('.el-dialog button')).find(b => b.textContent.trim() === '提交')
})
if (submitBtn.asElement()) {
  await submitBtn.asElement().click()
  await new Promise(r => setTimeout(r, 2000))
}

// Check list updated
const listCount = await page.evaluate(() => {
  const table = document.querySelector('.el-table')
  return table ? table.querySelectorAll('tbody tr').length : 0
})
listCount > 0 ? pass(`account appears in list (${listCount} rows)`) : fail('account not in list')

await page.screenshot({ path: '/tmp/nam-e2e.png', fullPage: true })
console.log('saved /tmp/nam-e2e.png')
await browser.close()
console.log('\n✓ ALL CHECKS PASSED')
