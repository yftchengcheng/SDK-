// e2e 验证：已关联的广告平台卡片可点击 → 弹出只读查看抽屉
import puppeteer from 'puppeteer'

const BASE = 'http://localhost:5000'
const TS = Date.now().toString(36)
const EMAIL = `vnd-${TS}@demo.com`
const PASS = 'Test123456'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const log = (...a) => console.log('[view-network]', ...a)

const fail = (msg) => { log('FAIL:', msg); process.exit(1) }

async function main() {
  log('=== step 1: register ===')
  const reg = await fetch(`${BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: EMAIL, password: PASS, company: '看配置测试',
      companyShortName: '看', contactName: '看', phone: '13800000000', accessType: 1,
    }),
  })
  const regJ = await reg.json()
  if (!regJ.data?.token) fail('register failed: ' + JSON.stringify(regJ))
  const TOKEN = regJ.data.token
  const DEV_ID = regJ.data.developerId
  log('  ✓ token:', TOKEN.slice(0, 20) + '...')

  log('=== step 2: create app ===')
  const create = await fetch(`${BASE}/api/v1/console/app/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ appName: 'viewtest', packageName: 'com.vt', platform: 1 }),
  })
  const appJ = await create.json()
  if (!appJ.data?.app_key) fail('app create failed: ' + JSON.stringify(appJ))
  const APP_KEY = appJ.data.app_key
  log('  ✓ app_key:', APP_KEY)

  log('=== step 3: bind CSJ (id=1) with full config ===')
  // 用足字段绑一次
  const bind = await fetch(`${BASE}/api/v1/console/network/app/bind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({
      appKey: APP_KEY,
      networkDefId: 1,
      networkAppId: 'csj_view_001',
      extraParams: {
        accountId: 100,
        credentials: {
          accountName: '穿山甲默认账号',
          reportApi: true,
          autoCreateSource: true,
          userId: 'VIEW_USER_1234',
          roleId: 'VIEW_ROLE_5678',
          secureKey: 'VIEW_SECURE_KEY_ABCD',
        },
      },
      status: 1,
    }),
  })
  const bindJ = await bind.json()
  if (bindJ.code !== 0) fail('bind failed: ' + JSON.stringify(bindJ))
  log('  ✓ bind OK')

  log('=== step 4: verify /app/list returns network_name + code ===')
  const list = await fetch(`${BASE}/api/v1/console/network/app/list?appKey=${APP_KEY}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  const listJ = await list.json()
  const items = listJ.data?.list || []
  log('  list count:', items.length)
  if (items.length !== 1) fail('expected 1 binding, got ' + items.length)
  const binding = items[0]
  log('  network_name:', binding.network_name, '| code:', binding.network_code)
  if (binding.network_name !== '穿山甲') fail('network_name wrong')
  if (binding.network_code !== 'CSJ') fail('network_code wrong')
  log('  credentials:', JSON.stringify(binding.extra_params?.credentials))

  log('=== step 5: launch puppeteer & inject auth ===')
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  // 注入 token 到 localStorage
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' })
  await page.evaluate((tk, dev) => {
    localStorage.setItem('token', tk)
    localStorage.setItem('userInfo', JSON.stringify(dev))
  }, TOKEN, { developerId: DEV_ID, email: EMAIL, company: '看配置测试', accessType: 1, role: 'developer' })
  // 注入 cookie
  await page.setCookie({
    name: 'auth_token',
    value: TOKEN,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
  })
  page.on('pageerror', (e) => log('  [page error]', e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') log('  [console error]', m.text())
  })

  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle0', timeout: 15000 })
  await sleep(2000)

  log('=== step 5.5: inspect page state ===')
  const state = await page.evaluate(() => {
    return {
      url: location.href,
      title: document.title,
      h2Texts: Array.from(document.querySelectorAll('h1, h2, h3')).map((n) => n.textContent?.trim().slice(0, 50)),
      bodyText: document.body.textContent?.slice(0, 200),
      hasMasterList: !!document.querySelector('.app-master-list, .app-master-items'),
      classNames: Array.from(document.querySelectorAll('[class*="app-master"]')).map((n) => n.className).slice(0, 5),
    }
  })
  log('  state:', JSON.stringify(state, null, 2))

  log('=== step 6: click first app card (master list) ===')
  // 找应用条目并点击
  const appClicked = await page.evaluate(() => {
    const items = document.querySelectorAll('.app-master-item')
    if (items.length === 0) return { ok: false, found: null, count: 0 }
    items[0].click()
    return { ok: true, found: items[0].textContent.slice(0, 60) }
  })
  log('  app click:', appClicked)
  if (!appClicked.ok) fail('app not clicked, count=' + appClicked.count)
  await sleep(1000)

  log('=== step 7: wait bound network card visible ===')
  const cardInfo = await page.evaluate(() => {
    const cards = document.querySelectorAll('.network-item-clickable')
    if (cards.length === 0) return { ok: false, count: 0 }
    const first = cards[0]
    const name = first.querySelector('.network-item-name')?.textContent
    const code = first.querySelector('.meta-chip')?.textContent
    return { ok: true, count: cards.length, name, code }
  })
  log('  network card info:', cardInfo)
  if (!cardInfo.ok) fail('no network card found')
  if (cardInfo.name !== '穿山甲') fail('card name not 穿山甲')
  if (cardInfo.code !== 'CSJ') fail('card code not CSJ')

  log('=== step 8: click the network card to open view drawer ===')
  const clickResult = await page.evaluate(() => {
    const card = document.querySelector('.network-item-clickable')
    if (!card) return { ok: false, reason: 'no card' }
    card.click()
    return { ok: true, classes: card.className }
  })
  log('  click result:', clickResult)
  await sleep(800)

  log('=== step 9: verify view drawer opened ===')
  const drawer = await page.evaluate(() => {
    const root = document.querySelector('.vnd-root')
    if (!root) return { ok: false }
    return {
      ok: true,
      title: root.querySelector('.vnd-title')?.textContent,
      subtitle: root.querySelector('.vnd-subtitle')?.textContent,
      infoRows: Array.from(root.querySelectorAll('.vnd-info-label')).map((n) => n.textContent),
      fields: Array.from(root.querySelectorAll('.vnd-field-label')).map((n) => n.textContent.replace('*', '').trim()),
      fieldValues: Array.from(root.querySelectorAll('.vnd-text, .vnd-switch-val')).map((n) => n.textContent),
      hasAccountId: !!root.querySelector('.vnd-account-id'),
      accountIdText: root.querySelector('.vnd-account-id')?.textContent,
      hasJsonCollapse: !!root.querySelector('.vnd-json, details'),
    }
  })
  log('  drawer title:', drawer.title)
  log('  info rows:', drawer.infoRows)
  log('  fields:', drawer.fields)
  log('  field values:', drawer.fieldValues)
  log('  accountId:', drawer.accountIdText)
  if (!drawer.ok) fail('drawer not opened')
  if (drawer.title !== '广告平台配置详情') fail('title wrong')
  if (drawer.infoRows.length < 4) fail('info rows missing')
  if (!drawer.infoRows.includes('广告平台')) fail('info row 广告平台 missing')
  if (!drawer.infoRows.includes('账号 ID')) fail('info row 账号 ID missing')
  if (drawer.fields.length < 5) fail('fields count too small: ' + drawer.fields.length)
  if (!drawer.fields.includes('账号名称')) fail('字段 账号名称 missing')
  if (!drawer.fields.includes('用户ID')) fail('字段 用户ID missing')
  if (!drawer.fields.includes('Secure Key')) fail('字段 Secure Key missing')
  if (drawer.accountIdText !== 'csj_view_001') fail('accountId not echoed: ' + drawer.accountIdText)

  // 验证字段值正确回显
  const vals = drawer.fieldValues.join('|')
  if (!vals.includes('VIEW_USER_1234')) fail('userId not echoed in drawer')
  if (!vals.includes('VIEW_ROLE_5678')) fail('roleId not echoed in drawer')
  if (!vals.includes('VIEW_SECURE_KEY_ABCD')) fail('secureKey not echoed in drawer')
  log('  ✓ all credentials echoed back in view drawer')

  log('=== step 10: close drawer (× button) ===')
  // 用 puppeteer 原生 click（不用 dispatchEvent）— 模拟真实用户点击
  try {
    await page.click('.vnd-close', { timeout: 2000 })
  } catch (e) {
    log('  click .vnd-close failed:', e.message)
  }
  await sleep(1200)
  // 详细检查 DOM
  const domState = await page.evaluate(() => {
    const root = document.querySelector('.vnd-root')
    const drawer = document.querySelector('.el-drawer')
    const overlay = document.querySelector('.el-overlay')
    const wrapper = document.querySelector('.el-drawer__wrapper')
    return {
      vndRoot: !!root,
      drawer: !!drawer,
      overlay: !!overlay,
      wrapper: !!wrapper,
      drawerHidden: drawer ? drawer.getAttribute('aria-hidden') : null,
      drawerStyle: drawer ? drawer.getAttribute('style') : null,
      vndRootStyle: root ? root.getAttribute('style') : null,
    }
  })
  log('  dom state after × click:', JSON.stringify(domState, null, 2))
  let drawerGone = await page.evaluate(() => !document.querySelector('.vnd-root'))
  log('  drawer closed after puppeteer click:', drawerGone)
  if (!drawerGone) fail('drawer did not close via × button')

  log('=== step 11: reopen via "查看" button ===')
  const reopen = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.el-button'))
      .find((b) => b.textContent && b.textContent.trim() === '查看')
    if (!btn) return { ok: false }
    btn.click()
    return { ok: true }
  })
  log('  查看 btn click:', reopen)
  await sleep(500)
  const reopenDrawer = await page.evaluate(() => !!document.querySelector('.vnd-root'))
  if (!reopenDrawer) fail('reopen failed')
  log('  ✓ reopened via 查看 button')

  await browser.close()
  log('=== ALL STEPS PASSED ===')
}

main().catch((e) => { console.error('[view-network] ERR:', e); process.exit(1) })
