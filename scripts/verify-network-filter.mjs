// verify-network-filter.mjs
// 验证 BindNetworkDrawer 网络下拉框过滤逻辑：
//   1. 新 dev（无账号）→ 4 预置全部不在下拉，仅自定义显示 + 空状态 CTA
//   2. 建 1 个穿山甲账号 → 穿山甲出现，其他 3 个预置仍不出现
import puppeteer from 'puppeteer'

const BASE = 'http://localhost:5000'

async function api(path, init = {}) {
  const res = await fetch(BASE + path, init)
  return res.json()
}

async function main() {
  const ts = Date.now()
  const reg = await api('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `filt-${ts}@x.com`,
      password: 'Test123456',
      company: 'c',
      companyShortName: 'c',
      contactName: 'c',
      phone: '13800000000',
      accessType: 1,
    }),
  })
  const tk = reg.data.token
  console.log(`[filt]   ✓ register token: ${tk.slice(0, 20)}...`)

  const appRes = await api('/api/v1/console/app/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
    body: JSON.stringify({ appName: 'filtapp', packageName: 'com.filt', platform: 1 }),
  })
  const appKey = appRes.data.app_key
  console.log(`[filt]   ✓ app_key: ${appKey}`)

  const defs = await api('/api/v1/console/network/list?status=1', {
    headers: { Authorization: `Bearer ${tk}` },
  })
  const allPresets = defs.data.list.filter(n => n.network_type === 1)
  const customs = defs.data.list.filter(n => n.network_type === 2)
  console.log(`[filt]   ad_network_def: ${allPresets.length} 预置, ${customs.length} 自定义`)

  const browser = await puppeteer.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  // 注入 auth
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2' })
  await page.evaluate((t) => {
    localStorage.setItem('auth_token', t)
    localStorage.setItem('token', t)
  }, tk)
  await page.goto(BASE + '/app', { waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 1500))

  // 点开 app 详情
  await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('div, tr, li'))
      .filter(el => el.textContent && el.textContent.includes('filtapp') && el.children.length < 20)
    if (candidates[0]) candidates[0].click()
  })
  await new Promise(r => setTimeout(r, 800))

  // 点 "关联广告平台"
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim().includes('关联广告平台'))
    if (btn) btn.click()
  })
  await new Promise(r => setTimeout(r, 1500))

  // 找到 bind drawer（标题 "关联广告平台"）下的 el-select
  const openBindDropdown = await page.evaluate(() => {
    // 找到含标题 "关联广告平台" 的 .el-drawer
    const drawers = Array.from(document.querySelectorAll('.el-drawer'))
    const bindDrawer = drawers.find(d => d.querySelector('.bnd-header-title')?.textContent?.includes('关联广告平台'))
    if (!bindDrawer) return { ok: false, reason: 'no_bind_drawer' }
    const select = bindDrawer.querySelector('.el-select__wrapper')
    if (!select) return { ok: false, reason: 'no_select' }
    select.click()
    return { ok: true, drawerId: bindDrawer.className }
  })
  console.log(`[filt]   open bind dropdown: ${JSON.stringify(openBindDropdown)}`)
  if (!openBindDropdown.ok) {
    await page.screenshot({ path: '/tmp/filt-fail.png', fullPage: true })
    throw new Error('open dropdown failed')
  }
  await new Promise(r => setTimeout(r, 800))

  // 阶段 A：列出 bind drawer 内可见下拉项
  const stageA = await page.evaluate(() => {
    // dropdown 是 el-select 渲染的 .el-select-dropdown，挂在 body
    // 找到所有可见 .el-select-dropdown__item，按"全选"测内容是否包含平台关键字
    const items = Array.from(document.querySelectorAll('.el-select-dropdown__item'))
      .filter(i => i.offsetParent !== null) // 可见
    const empty = document.querySelector('.bnd-select-empty')
    const tip = document.querySelector('.bnd-select-tip')
    // 过滤：跳过排序/类型/状态/分页这种项（它们以非平台关键字开头）
    const platformKeywords = ['穿山甲', '优量汇', '快手', '百度', 'CSJ', 'YLH', 'KS', 'BD', '自定义']
    const platformOptions = items.filter(i => {
      const t = i.textContent.trim()
      return platformKeywords.some(k => t.includes(k))
    })
    return {
      totalVisible: items.length,
      platformOptionCount: platformOptions.length,
      platformOptions: platformOptions.map(i => i.textContent.trim()),
      hasEmpty: !!empty,
      emptyText: empty ? empty.textContent.replace(/\s+/g, ' ').trim() : null,
      hasTip: !!tip,
    }
  })
  console.log(`[filt]   stage A: ${JSON.stringify(stageA, null, 2)}`)

  const stageAOk = stageA.platformOptionCount === customs.length && stageA.hasEmpty
  console.log(`[filt]   stage A ${stageAOk ? '✓' : '✗'}: 预置过滤 + 空状态 CTA`)

  // 关闭 dropdown，点 CTA 跳转到 /network
  await page.evaluate(() => {
    const cta = document.querySelector('.bnd-select-empty-cta')
    if (cta) cta.click()
  })
  await new Promise(r => setTimeout(r, 1500))
  const stageANav = page.url().includes('/network')
  console.log(`[filt]   stage A ${stageANav ? '✓' : '✗'}: CTA 跳转 /network (now: ${page.url()})`)

  // 阶段 B：建一个穿山甲账号
  const accRes = await api('/api/v1/console/network/account/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
    body: JSON.stringify({
      networkDefId: 1,
      accountName: '穿山甲默认账号',
      appId: 0,
      credentials: { userId: 'u1', roleId: 'r1', secureKey: 's1', reportApi: false, autoCreateSource: true },
      status: 1,
    }),
  })
  console.log(`[filt]   create CSJ account: ${accRes.code === 0 ? '✓' : '✗ ' + accRes.message}`)

  // 回到 /app
  await page.goto(BASE + '/app', { waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 1200))
  await page.evaluate(() => {
    const c = Array.from(document.querySelectorAll('div, tr, li')).filter(el => el.textContent && el.textContent.includes('filtapp') && el.children.length < 20)
    if (c[0]) c[0].click()
  })
  await new Promise(r => setTimeout(r, 600))
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim().includes('关联广告平台'))
    if (btn) btn.click()
  })
  await new Promise(r => setTimeout(r, 1500))

  // 重新点开 bind drawer 的下拉
  await page.evaluate(() => {
    const drawers = Array.from(document.querySelectorAll('.el-drawer'))
    const bindDrawer = drawers.find(d => d.querySelector('.bnd-header-title')?.textContent?.includes('关联广告平台'))
    const select = bindDrawer?.querySelector('.el-select__wrapper')
    if (select) select.click()
  })
  await new Promise(r => setTimeout(r, 800))

  const stageB = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.el-select-dropdown__item')).filter(i => i.offsetParent !== null)
    const platformKeywords = ['穿山甲', '优量汇', '快手', '百度', 'CSJ', 'YLH', 'KS', 'BD']
    const platformOptions = items.filter(i => platformKeywords.some(k => i.textContent.trim().includes(k)))
    return {
      totalVisible: items.length,
      platformOptionCount: platformOptions.length,
      platformOptions: platformOptions.map(i => i.textContent.trim()),
    }
  })
  console.log(`[filt]   stage B: ${JSON.stringify(stageB, null, 2)}`)

  const hasCSJ = stageB.platformOptions.some(o => o.includes('穿山甲') || o.includes('CSJ'))
  const noOtherPresets = !stageB.platformOptions.some(o => o.includes('优量汇') || o.includes('快手') || o.includes('百度'))
  const expectedCount = customs.length + 1
  const countOk = stageB.platformOptionCount === expectedCount
  console.log(`[filt]   stage B ${hasCSJ ? '✓' : '✗'}: 穿山甲已出现`)
  console.log(`[filt]   stage B ${noOtherPresets ? '✓' : '✗'}: 其他 3 预置不出现`)
  console.log(`[filt]   stage B ${countOk ? '✓' : '✗'}: 总数正确 (${stageB.platformOptionCount}/${expectedCount})`)

  await page.screenshot({ path: '/tmp/filt-stage-b.png' })
  await browser.close()

  if (!stageAOk || !stageANav || !hasCSJ || !noOtherPresets || !countOk) {
    console.log('[filt] FAIL')
    process.exit(1)
  }
  console.log('[filt] === ALL CHECKS PASSED ===')
}

main().catch(e => { console.error('[filt] ERR:', e); process.exit(1) })
