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
  email: 'pdtest-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'pdt', companyShortName: 'pdt', contactName: 'pdt', phone: '13800000000', accessType: 1,
})
const token = reg.data.token
console.log('Registered')

// Create app
const appRes = await api('POST', '/api/v1/console/app/create', {
  appName: 'PDTestApp', packageName: 'com.test.pd' + Date.now(), platform: 1,
}, token)
const app = appRes.data
console.log('App created:', app.app_name, app.app_key)

// Create a placement
const plRes = await api('POST', '/api/v1/console/placement/create', {
  appKey: app.app_key, name: 'TestPlacement', format: 4, biddingType: 1,
  screenOrientation: 2, materialType: 1, templateStyle: 1, videoMute: 1, autoPlay: 1,
}, token)
console.log('Placement create:', plRes.code === 0 ? 'OK id=' + plRes.data.placement_id : JSON.stringify(plRes))

// Open browser
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
})
const page = await browser.newPage()
page.on('pageerror', e => console.log('[pageerror]', e.message))
page.on('console', m => { if (m.type() === 'error') console.log('[console-err]', m.text()) })

await page.setViewport({ width: 1440, height: 1100 })
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' })
await page.evaluate((t, u) => {
  localStorage.setItem('token', t)
  localStorage.setItem('userInfo', JSON.stringify(u))
}, token, {
  id: 1, email: reg.data.email, company: 'pdt', companyShortName: 'pdt',
  accessType: 1, status: 1
})

await page.goto('http://localhost:5000/app', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 2500))

// Click first app-master-item
const appItems = await page.$$('.app-master-item')
console.log('App items:', appItems.length)
if (appItems.length > 0) {
  await appItems[0].click()
  await new Promise(r => setTimeout(r, 2000))
}
await page.screenshot({ path: '/tmp/pd-app-selected.png', fullPage: true })

// Click first "编辑" button in placement table
const editButtons = await page.$$('.el-button--primary')
let clicked = false
for (const btn of editButtons) {
  const text = await page.evaluate(b => b.textContent.trim(), btn)
  if (text === '编辑') {
    await btn.click()
    clicked = true
    break
  }
}
console.log('Edit button clicked:', clicked)
await new Promise(r => setTimeout(r, 1500))
await page.screenshot({ path: '/tmp/pd-drawer-edit.png', fullPage: true })

// Inspect sections
const sections = await page.evaluate(() => {
  const heads = document.querySelectorAll('.pd-section-head')
  return Array.from(heads).map(h => h.textContent.trim().replace(/\s+/g, ' '))
})
console.log('\n=== Drawer sections ===')
sections.forEach(s => console.log('  -', s))

const formItems = await page.evaluate(() => {
  const items = document.querySelectorAll('.el-drawer .el-form-item')
  return Array.from(items).map(i => {
    const label = i.querySelector('.el-form-item__label')?.textContent?.trim() || ''
    return label.replace(/\s*\*\s*$/, '').replace(/\s+/g, ' ')
  }).filter(Boolean)
})
console.log('\n=== Drawer form items (format=4 原生) ===')
formItems.forEach(f => console.log('  -', f))

// Verify each option's value/label
const checkOptions = async (labelText, expectedOptions) => {
  const opts = await page.evaluate((lt) => {
    const labels = Array.from(document.querySelectorAll('.el-drawer .el-form-item__label'))
    const label = labels.find(l => l.textContent.includes(lt))
    if (!label) return null
    const formItem = label.closest('.el-form-item')
    const radios = Array.from(formItem.querySelectorAll('.el-radio-button__inner')).map(o => o.textContent.trim())
    const select = formItem.querySelector('.el-select__placeholder')?.textContent?.trim()
    return { radios, select: select || null, hasSelect: !!formItem.querySelector('.el-select') }
  }, labelText)
  if (!opts) { console.log(`  ✗ ${labelText} NOT FOUND`); return }
  if (opts.hasSelect) {
    console.log(`  ✓ ${labelText}: [el-select] ${opts.select}`)
  } else {
    const ok = JSON.stringify(opts.radios) === JSON.stringify(expectedOptions)
    console.log(`  ${ok ? '✓' : '✗'} ${labelText}: ${JSON.stringify(opts.radios)}  (expected ${JSON.stringify(expectedOptions)})`)
  }
}

console.log('\n=== Field options check ===')
await checkOptions('所属应用', null) // disabled input
await checkOptions('广告位名称', null) // input
await checkOptions('广告形式', ['横幅', '插屏', '开屏', '原生', '视频'])
await checkOptions('竞价类型', ['固价', '竞价'])
await checkOptions('屏幕方向', ['横屏', '竖屏', '横竖兼容'])
await checkOptions('广告展示大小', ['半屏', '全屏', '优选'])
await checkOptions('素材形式', ['图片', '视频', '视频+图片'])
await checkOptions('视频静音', ['否', '是'])
await checkOptions('自动播放', ['总是', '仅WIFI', '点击播放'])
await checkOptions('模版样式', null) // el-select

// Cleanup
const appToken2 = await api('POST', '/api/v1/auth/login', { email: reg.data.email, password: 'Test123456' })
await fetch('http://localhost:5000/api/v1/console/placement/delete?placementId=' + plRes.data.placement_id, {
  method: 'DELETE', headers: { 'Authorization': 'Bearer ' + appToken2.data.token }
})

await browser.close()
console.log('\n=== Test done ===')
