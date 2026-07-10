import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const puppeteer = require('puppeteer')
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome'

async function api(method, url, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token
  const r = await fetch('http://localhost:5000' + url, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  })
  return r.json()
}

const reg = await api('POST', '/api/v1/auth/register', {
  email: 'sub2-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'pdt', companyShortName: 'pdt', contactName: 'pdt', phone: '13800000000', accessType: 1,
})
const token = reg.data.token
const appRes = await api('POST', '/api/v1/console/app/create', {
  appName: 'SubApp2', packageName: 'com.test.sub2' + Date.now(), platform: 1,
}, token)
const app = appRes.data

const plRes = await api('POST', '/api/v1/console/placement/create', {
  appKey: app.app_key, name: 'Sub2TestPlacement', format: 4, biddingType: 1,
  screenOrientation: 1, materialType: 1, templateStyle: 1, videoMute: 0, autoPlay: 1,
}, token)
console.log('Initial placement:', plRes.code === 0 ? 'OK id=' + plRes.data.placement_id : JSON.stringify(plRes))

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
})
const page = await browser.newPage()
page.on('pageerror', e => console.log('[pageerror]', e.message))

const requests = []
page.on('request', req => {
  if (req.url().includes('/placement/')) requests.push({ method: req.method(), url: req.url(), body: req.postData() })
})

await page.setViewport({ width: 1440, height: 1100 })
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' })
await page.evaluate((t) => {
  localStorage.setItem('token', t)
  localStorage.setItem('userInfo', JSON.stringify({ id: 1, email: 'x@x.com', company: 'pdt', companyShortName: 'pdt', accessType: 1, status: 1 }))
}, token)

await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 2500))
await page.screenshot({ path: '/tmp/sub2-list.png', fullPage: true })

// Click first .app-master-item
const appItems = await page.$$('.app-master-item')
if (appItems.length > 0) await appItems[0].click()
await new Promise(r => setTimeout(r, 2000))
await page.screenshot({ path: '/tmp/sub2-detail.png', fullPage: true })

// Find edit button specifically in placement table (right side detail)
const editButtons = await page.$$('.detail-card .el-button--primary, .placement-table .el-button--primary, .page-table-wrap .el-button--primary')
console.log('Edit buttons in detail:', editButtons.length)
if (editButtons.length === 0) {
  // fallback - any "编辑" button in main content
  const all = await page.$$('.el-button')
  for (const b of all) {
    const t = await page.evaluate(b => b.textContent.trim(), b)
    if (t === '编辑') {
      // Skip app master edit, only the detail one
      const inDetail = await page.evaluate(b => !!b.closest('.detail-card, .page-table-wrap, .placement-table, .placement-section'), b)
      if (inDetail) { await b.click(); break }
    }
  }
} else {
  await editButtons[0].click()
}
await new Promise(r => setTimeout(r, 1500))
await page.screenshot({ path: '/tmp/sub2-drawer.png', fullPage: true })

// Get the current state
const state = await page.evaluate(() => {
  return {
    name: document.querySelector('.el-drawer input[maxlength="40"]')?.value,
    activeRadios: Array.from(document.querySelectorAll('.el-drawer .el-radio-button.is-active .el-radio-button__inner')).map(b => b.textContent.trim()),
  }
})
console.log('Drawer state:', JSON.stringify(state))

// Click 确定保存 button in drawer footer
const saveBtn = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('.el-drawer .el-button'))
  const save = btns.find(b => b.textContent.includes('保存'))
  if (save) { save.click(); return 'clicked: ' + save.textContent.trim() }
  return 'NOT FOUND'
})
console.log('Save:', saveBtn)
await new Promise(r => setTimeout(r, 2000))

// Print captured requests
console.log('\n=== Captured placement requests ===')
requests.forEach(r => console.log(r.method, r.url, '\n   body=' + r.body))

// Verify in DB
const list = await api('GET', '/api/v1/console/placement/list?appKey=' + app.app_key, null, token)
const found = list.data.list.find(p => p.placement_id === plRes.data.placement_id)
console.log('\n=== After save, DB state ===')
console.log('  name:', found?.name)
console.log('  format:', found?.format)
console.log('  bidding_type:', found?.bidding_type)
console.log('  screen_orientation:', found?.screen_orientation)
console.log('  material_type:', found?.material_type)
console.log('  video_mute:', found?.video_mute)
console.log('  auto_play:', found?.auto_play)
console.log('  template_style:', found?.template_style)

// Cleanup
const t2 = (await api('POST', '/api/v1/auth/login', { email: reg.data.email, password: 'Test123456' })).data.token
await fetch('http://localhost:5000/api/v1/console/placement/delete?placementId=' + plRes.data.placement_id, {
  method: 'DELETE', headers: { 'Authorization': 'Bearer ' + t2 }
})

await browser.close()
console.log('\n=== Test done ===')
