/**
 * Puppeteer E2E + API 测试 - 系统类型 + Adapter 校验
 *
 * 覆盖：
 * A. 数据库 system_type 字段
 * B. 后端 create/update/list 返回 system_type
 * C. SDK config 按 app.platform 过滤 system_type
 * D. Adapter 类名格式校验（前端 + 后端）
 * E. init 必填校验
 */
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const puppeteer = require('puppeteer')
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome'

const BASE = 'http://localhost:5000'

async function api(method, url, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token
  const r = await fetch(BASE + url, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  })
  return r.json()
}

async function registerUser() {
  return api('POST', '/api/v1/auth/register', {
    email: 'st-' + Date.now() + Math.floor(Math.random() * 10000) + '@x.com',
    password: 'Test123456',
    company: 'pdt', companyShortName: 'pdt', contactName: 'pdt',
    phone: '13800000000', accessType: 1,
  })
}

let pass = 0, fail = 0
function check(label, ok, detail) {
  if (ok) { console.log(`  ✓ ${label}`); pass++ }
  else { console.log(`  ✗ ${label} ${detail ? '| ' + detail : ''}`); fail++ }
}

// ============== A. API: create/list/update system_type ==============
//   新语义：system_type 由 init 字段自动推导，不再是独立输入
//   1: 仅 android init
//   2: 仅 iOS init
//   3: 两者都填
console.log('=== A. API: system_type CRUD (auto-derive) ===')
const regA = await registerUser()
const tA = regA.data.token

const createA = await api('POST', '/api/v1/console/network/custom/create', {
  networkName: 'AndroidTest', networkCode: 'CUSTOM_ST_AND',
  adapterClassInitAndroid: 'com.test.Init',  // 仅 android → 派生 system_type=1
}, tA)
check('Create with only android init → system_type=1', createA.code === 0, createA.message)
check('Returns systemType in response', createA.data?.system_type === 1, 'got: ' + createA.data?.system_type)

const listA = await api('GET', '/api/v1/console/network/list?pageSize=200', null, tA)
const foundA = listA.data?.list?.find(n => n.network_code === 'CUSTOM_ST_AND')
check('List includes system_type', !!foundA && foundA.system_type === 1, 'system_type: ' + foundA?.system_type)

// Update: 加上 iOS init → 派生 system_type=3 (Both)
const updateA = await api('PUT', '/api/v1/console/network/custom/' + createA.data?.id, {
  networkName: 'AndroidTest', adapterClassInitIos: 'com.test.IosInit',
}, tA)
check('Add ios init → system_type becomes 3', updateA.code === 0, updateA.message)

const afterUpdate = await api('GET', '/api/v1/console/network/list?pageSize=200', null, tA)
const foundAfter = afterUpdate.data?.list?.find(n => n.id === createA.data?.id)
check('Updated system_type=3 (Both)', foundAfter?.system_type === 3, 'got: ' + foundAfter?.system_type)

const createDefault = await api('POST', '/api/v1/console/network/custom/create', {
  networkName: 'DefaultTest', networkCode: 'CUSTOM_ST_DEF',
  adapterClassInitAndroid: 'com.test.Init',  // 仅 android init → 派生 system_type=1
}, tA)
check('Only android init → system_type=1 (auto-derive)', createDefault.code === 0 && createDefault.data?.system_type === 1, 'got: ' + createDefault.data?.system_type)

for (const r of [createA, createDefault]) {
  if (r.data?.id) await fetch(BASE + '/api/v1/console/network/custom/' + r.data.id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + tA } })
}

// ============== B. SDK config filter by app.platform ==============
console.log('\n=== B. SDK config: filter by app.platform ===')
const regB = await registerUser()
const tB = regB.data.token

const andNet = await api('POST', '/api/v1/console/network/custom/create', {
  networkName: 'AND_B', networkCode: 'CUSTOM_ST_AND_' + Math.random().toString(36).slice(2, 7).toUpperCase(), adapterClassInitAndroid: 'com.a.B',  // 仅 android init → system_type=1
}, tB)
const iosNet = await api('POST', '/api/v1/console/network/custom/create', {
  networkName: 'IOS_B', networkCode: 'CUSTOM_ST_IOS_' + Math.random().toString(36).slice(2, 7).toUpperCase(), adapterClassInitIos: 'com.i.B',  // 仅 iOS init → system_type=2
}, tB)
const bothNet = await api('POST', '/api/v1/console/network/custom/create', {
  networkName: 'BOTH_B', networkCode: 'CUSTOM_ST_BOTH_' + Math.random().toString(36).slice(2, 7).toUpperCase(), adapterClassInitAndroid: 'com.b.BA', adapterClassInitIos: 'com.b.BI',  // 双 init → system_type=3
}, tB)
check('Created AND/IOS/BOTH networks', andNet.code === 0 && iosNet.code === 0 && bothNet.code === 0, `${andNet.message} / ${iosNet.message} / ${bothNet.message}`)

const andApp = await api('POST', '/api/v1/console/app/create', {
  appName: 'ANDApp_ST', packageName: 'com.st.android.' + Date.now(), platform: 1,
}, tB)
const iosApp = await api('POST', '/api/v1/console/app/create', {
  appName: 'IOSApp_ST', packageName: 'com.st.ios.' + Date.now(), platform: 2,
}, tB)
check('Created Android + iOS apps', andApp.code === 0 && iosApp.code === 0, `${andApp.message} / ${iosApp.message}`)

for (const net of [andNet, iosNet, bothNet]) {
  for (const appKey of [andApp.data.app_key, iosApp.data.app_key]) {
    await api('POST', '/api/v1/console/network/app/bind', {
      appKey, networkDefId: net.data.id, networkAppId: 't_' + net.data.id,
    }, tB)
  }
}

const sdkAnd = await api('GET', '/api/v1/sdk/config?app_key=' + andApp.data.app_key, null, null)
const andCodes = (sdkAnd.data?.customAdapters || []).map(a => a.networkCode).sort()
check('Android app gets AND+BOTH (no IOS)', JSON.stringify(andCodes) === JSON.stringify([andNet.data.network_code, bothNet.data.network_code]), 'got: ' + JSON.stringify(andCodes))

const sdkIos = await api('GET', '/api/v1/sdk/config?app_key=' + iosApp.data.app_key, null, null)
const iosCodes = (sdkIos.data?.customAdapters || []).map(a => a.networkCode).sort()
check('iOS app gets IOS+BOTH (no AND)', JSON.stringify(iosCodes) === JSON.stringify([bothNet.data.network_code, iosNet.data.network_code]), 'got: ' + JSON.stringify(iosCodes))

// Cleanup
for (const r of [andNet, iosNet, bothNet]) {
  if (r.data?.id) await fetch(BASE + '/api/v1/console/network/custom/' + r.data.id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + tB } })
}
for (const a of [andApp, iosApp]) {
  if (a.data?.id) await fetch(BASE + '/api/v1/console/app/' + a.data.id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + tB } })
}

// ============== C. API: Adapter format validation ==============
console.log('\n=== C. API: Adapter format validation ===')
const regC = await registerUser()
const tC = regC.data.token

const tests = [
  { name: 'valid FQN', code: 'VALID_FORMAT', init: 'com.test.MyInit', expect: 0 },
  { name: 'valid with numbers', code: 'VALID_FMT2', init: 'com.test.MyClass2Init', expect: 0 },
  { name: 'valid single char', code: 'VALID_S', init: 'com.adnet.MyAdX', expect: 0 },
  { name: 'no class name', code: 'NO_CLASS', init: 'com.test', expect: 400 },
  { name: 'lowercase class', code: 'LOWER_CLS', init: 'com.test.init', expect: 400 },
  { name: 'space in class', code: 'SPACE_CLS', init: 'com.test.My Init', expect: 400 },
  { name: 'chinese chars', code: 'CN_CLS', init: 'com.test.我的初始化', expect: 400 },
  { name: 'starts with number', code: 'NUM_START', init: '1com.test.X', expect: 400 },
  { name: 'empty', code: 'EMPTY_INIT', init: '', expect: 400 },
]
for (const t of tests) {
  const r = await api('POST', '/api/v1/console/network/custom/create', {
    networkName: t.code + '_Net', networkCode: 'CUSTOM_' + t.code,
    systemType: 3, adapterClassInitAndroid: t.init,
  }, tC)
  check(`[${t.name}] init="${t.init}" expect ${t.expect === 0 ? 'OK' : 'REJECTED'}`, r.code === t.expect, `got ${r.code}: ${r.message}`)
  if (r.data?.id) await fetch(BASE + '/api/v1/console/network/custom/' + r.data.id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + tC } })
}

// Test optional adapter fields format validation
const optionalTest = await api('POST', '/api/v1/console/network/custom/create', {
  networkName: 'OptTest', networkCode: 'CUSTOM_ST_OPT_' + Math.random().toString(36).slice(2, 7).toUpperCase(),
  adapterClassInitAndroid: 'com.test.Init',
  adapterClassBannerAndroid: 'bad-banner',  // invalid
}, tC)
check('Invalid optional banner rejected', optionalTest.code === 400 && optionalTest.message?.includes('格式错误'), `got: ${optionalTest.code} ${optionalTest.message}`)

// ============== D. Frontend: system_type selector + validator ==============
console.log('\n=== D. Frontend: system_type selector + validators ===')
const regD = await registerUser()
const tD = regD.data.token

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1100 })

await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
await page.evaluate(t => {
  localStorage.setItem('token', t)
  localStorage.setItem('userInfo', JSON.stringify({ id: 1, email: 'x@x.com', company: 'pdt', companyShortName: 'pdt', accessType: 1, status: 1 }))
}, tD)
await page.goto(BASE + '/network', { waitUntil: 'domcontentloaded' })
await new Promise(r => setTimeout(r, 3500))

// Open create dialog
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent.includes('创建自定义'))
  if (btn) btn.click()
})
await new Promise(r => setTimeout(r, 2000))

// Check that system_type selector exists
const systemTypeExists = await page.evaluate(() => {
  const drawer = document.querySelector('.el-drawer')
  if (!drawer) return false
  const text = drawer.textContent
  return text.includes('系统类型') || text.includes('Android') || text.includes('iOS')
})
check('System type selector visible in form', systemTypeExists)

// Check that init placeholder has class FQN hint
const initPlaceholder = await page.evaluate(() => {
  const inputs = document.querySelectorAll('.el-drawer .el-input__inner')
  for (const inp of inputs) {
    if (inp.placeholder?.includes('Init') || inp.placeholder?.includes('Init')) return inp.placeholder
  }
  return null
})
check('Init placeholder mentions class name', initPlaceholder?.includes('类完整路径') || initPlaceholder?.includes('Init') || initPlaceholder?.includes('MyInit') || initPlaceholder?.includes('Adapter') || initPlaceholder?.includes('FQN'), 'placeholder: ' + initPlaceholder)

await browser.close()

console.log(`\n=== Total: ${pass} pass / ${fail} fail ===`)
process.exit(fail > 0 ? 1 : 0)
