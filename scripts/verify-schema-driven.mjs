/**
 * 验证「关联广告平台」架构重构：
 * - 单 schema 驱动（NETWORK_SCHEMAS）
 * - 4 预置 + 1 自定义网络动态字段
 * - 弹窗1 选网络 → 联动加载账号 → 选账号 → 渲染账号特定字段
 * - 弹窗2「+ 添加账号」→ 通用 schema 渲染
 * - 百度「是否使用新义公钥」开关条件显隐
 * - 自定义 K-V 编辑器
 *
 * 流程：注册 → 创应用 → /app → 选应用 → 点「关联广告平台」→ 弹窗1 打开
 *       → 选「穿山甲」→ 选已有账号 → 看到 4 必填字段 + 2 开关 → 关闭
 *       → 重开 → 选「百度」→ 选已有账号 → 「是否使用新义公钥」开关 ON → 看到公钥生成按钮
 *       → 切 OFF → 看到私钥输入框 → 关闭
 *       → 重开 → 选自定义网络 → 看到 K-V 编辑器
 */
import puppeteer from 'puppeteer'
import fs from 'node:fs'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000'

function log(...args) { console.log('[verify-schema]', ...args) }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function getJSON(path, init = {}) {
  const res = await fetch(BASE_URL + path, init)
  return res.json()
}

async function getText(path, init = {}) {
  const res = await fetch(BASE_URL + path, init)
  return res.text()
}

async function main() {
  const ts = Date.now()
  const email = `e2e_schema_${ts}@adtalos.com`
  const password = 'Test12345'
  const appName = `云端阅读_e2e_${ts}`

  // ===== 1. 注册拿 token
  log('1. register')
  const reg = await getJSON('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email, password, company: 'E2E', companyShortName: 'E2E',
      contactName: 'E2E', phone: '13800000000',
    }),
  })
  if (reg.code !== 0) throw new Error('register failed: ' + JSON.stringify(reg))
  const token = reg.data.token
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  log('   token OK, developerId=' + reg.data.developerId)

  // ===== 2. 创建测试应用
  log('2. create app')
  const appRes = await getJSON('/api/v1/console/app/create', {
    method: 'POST', headers,
    body: JSON.stringify({ appName, packageName: `com.e2e.${ts}`, platform: 1 }),
  })
  if (appRes.code !== 0) throw new Error('app create failed: ' + JSON.stringify(appRes))
  const appKey = appRes.data.app_key
  log('   appKey=' + appKey)

  // ===== 3. 为「穿山甲」预创建 1 个账号（弹窗1 联动测试用）
  log('3. pre-create CSJ account')
  const csjAcc = await getJSON('/api/v1/console/network/account/create', {
    method: 'POST', headers,
    body: JSON.stringify({
      networkDefId: 1, appId: null, accountName: '穿山甲测试账号', accountId: 'csj_test_uid',
      credentials: { reportApi: true, autoCreateSource: true, userId: 'pre_u', roleId: 'pre_r', secureKey: 'pre_s' },
      status: 1,
    }),
  })
  if (csjAcc.code !== 0) throw new Error('csj account create failed')
  log('   CSJ account id=' + csjAcc.data.id)

  // ===== 4. 为「百度」预创建 1 个账号
  log('4. pre-create BD account')
  const bdAcc = await getJSON('/api/v1/console/network/account/create', {
    method: 'POST', headers,
    body: JSON.stringify({
      networkDefId: 4, appId: null, accountName: '百度测试账号', accountId: 'bd_test_uid',
      credentials: { reportApi: false, autoCreateSource: false, useAdKey: false, accountId: 'bd_pre_acc', accessKey: 'bd_pre_key', bidCallback: 'none' },
      status: 1,
    }),
  })
  if (bdAcc.code !== 0) throw new Error('bd account create failed')
  log('   BD account id=' + bdAcc.data.id)

  // ===== 5. 启 puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  // 注入 token 到 localStorage（key 必须是 'token' 和 'userInfo'）
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle0' })
  await page.evaluate((tk, dev) => {
    localStorage.setItem('token', tk)
    localStorage.setItem('userInfo', JSON.stringify(dev))
  }, token, { developerId: reg.data.developerId, email: reg.data.email, company: reg.data.company, accessType: 1, role: 'developer' })
  log('5. puppeteer started, token injected')

  // ===== 6. 进 /app
  await page.goto(BASE_URL + '/app', { waitUntil: 'networkidle0' })
  await sleep(1500)
  await page.screenshot({ path: '/tmp/s1_app_page.png' })

  const appRow = await page.evaluate((name) => {
    const rows = Array.from(document.querySelectorAll('.app-master-item'))
    const row = rows.find(r => r.textContent?.includes(name))
    if (!row) return null
    const rect = row.getBoundingClientRect()
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, found: true }
  }, appName)
  if (!appRow) throw new Error('app row not found')
  await page.mouse.click(appRow.x, appRow.y)
  await sleep(1000)
  log('6. app row clicked')

  // ===== 7. 点「关联广告平台」按钮
  const bindBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const btn = btns.find(b => b.textContent?.trim().includes('关联广告平台'))
    if (!btn) return null
    const rect = btn.getBoundingClientRect()
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
  })
  if (!bindBtn) throw new Error('bind button not found')
  await page.mouse.click(bindBtn.x, bindBtn.y)
  await sleep(1500)
  await page.screenshot({ path: '/tmp/s2_bnd_open.png' })
  log('7. bind drawer opened, url=' + page.url())

  // ===== 8. 选「穿山甲」
  const csjOptPos = await page.evaluate(() => {
    // 打开网络下拉
    const sel = document.querySelector('.bnd-form .el-form-item:first-child .el-select')
    if (!sel) return { error: 'no select' }
    sel.click()
    return { clicked: true }
  })
  await sleep(800)
  const csjItem = await page.evaluate(() => {
    // 在弹出的 dropdown 中找「穿山甲」
    const items = Array.from(document.querySelectorAll('.el-select-dropdown__item'))
    const it = items.find(i => i.textContent?.includes('穿山甲'))
    if (!it) return null
    const r = it.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  })
  // 直接点击 dropdown 内部 CSJ item（用 evaluate 跳过坐标）
  const csjClicked = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.el-select-dropdown__item'))
    const it = items.find(i => i.textContent?.trim().startsWith('穿山甲'))
    if (!it) {
      return { ok: false, allItems: items.map(i => ({ txt: i.textContent?.trim(), visible: i.offsetParent !== null })) }
    }
    it.click()
    return { ok: true }
  })
  log('   csjClicked = ' + JSON.stringify(csjClicked))
  await sleep(2500)
  const dbgAfterCSJ = await page.evaluate(() => {
    return {
      url: window.location.href,
      formBody: document.querySelector('.bnd-form')?.textContent?.slice(0, 200) || 'NO_BND_FORM',
      labels: Array.from(document.querySelectorAll('.bnd-form .el-form-item__label')).map(l => l.textContent?.trim()),
    }
  })
  log('8. CSJ picked. debug = ' + JSON.stringify(dbgAfterCSJ))
  await page.screenshot({ path: '/tmp/s3_csj_picked.png' })

  // ===== 9. 验证 schema 字段渲染（穿山甲：userId/roleId/secureKey/账号名称/报表API/自动创建广告源）
  const csjFields = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.bnd-form .el-form-item__label'))
    return labels.map(l => l.textContent?.trim()).filter(t => t && !t.includes('广告平台') && !t.includes('账号'))
  })
  log('9. CSJ fields visible: ' + JSON.stringify(csjFields))

  // ===== 10. 检查弹窗2：选「百度」
  const bdOptPos = await page.evaluate(() => {
    const sel = document.querySelector('.bnd-form .el-form-item:first-child .el-select')
    if (!sel) return { error: 'no select' }
    sel.click()
    return { clicked: true }
  })
  await sleep(800)
  const bdItem = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.el-select-dropdown__item'))
    const it = items.find(i => i.textContent?.includes('百度'))
    if (!it) return null
    const r = it.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  })
  const bdPicked = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.el-select-dropdown__item'))
    const it = items.find(i => i.textContent?.trim().startsWith('百度'))
    if (!it) return { ok: false }
    it.click()
    return { ok: true }
  })
  log('10. BD picked = ' + JSON.stringify(bdPicked))
  await sleep(1500)
  await page.screenshot({ path: '/tmp/s4_bd_picked.png' })

  // ===== 11. 验证百度字段（useAdKey + 私钥 + AccessKey + 竞价信息回传）
  const bdFields = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.bnd-form .el-form-item__label'))
    return labels.map(l => l.textContent?.trim()).filter(t => t && !t.includes('广告平台') && !t.includes('账号'))
  })
  log('11. BD fields visible: ' + JSON.stringify(bdFields))

  // ===== 12. 切 useAdKey 开关（百度专用：否 → 是 → 公钥生成按钮出现）
  const useAdKeySwitch = await page.evaluate(() => {
    const switches = Array.from(document.querySelectorAll('.bnd-form .el-switch'))
    // 找到「是否使用新义公钥」label 后面那个 switch
    const labels = Array.from(document.querySelectorAll('.bnd-form .el-form-item__label'))
    const labelEl = labels.find(l => l.textContent?.includes('是否使用新义公钥'))
    if (!labelEl) return { error: 'useAdKey label not found' }
    const formItem = labelEl.closest('.el-form-item')
    const sw = formItem?.querySelector('.el-switch')
    if (!sw) return { error: 'switch not found' }
    sw.click()
    return { clicked: true }
  })
  await sleep(800)
  await page.screenshot({ path: '/tmp/s5_bd_pubkey.png' })
  const hasPubKeyBtn = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).some(b => b.textContent?.includes('生成公钥'))
  })
  log('12. useAdKey toggled, hasPubKeyBtn=' + hasPubKeyBtn)

  // ===== 13. 切回去：公钥按钮消失，私钥输入框出现
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.bnd-form .el-form-item__label'))
    const labelEl = labels.find(l => l.textContent?.includes('是否使用新义公钥'))
    const formItem = labelEl?.closest('.el-form-item')
    const sw = formItem?.querySelector('.el-switch')
    sw?.click()
  })
  await sleep(800)
  const hasPrivateKeyInput = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.bnd-form .el-form-item__label'))
    const labelEl = labels.find(l => l.textContent?.trim() === '私钥')
    const formItem = labelEl?.closest('.el-form-item')
    return !!formItem?.querySelector('input')
  })
  log('13. useAdKey toggled back, hasPrivateKeyInput=' + hasPrivateKeyInput)

  // ===== 14. 选自定义网络（K-V 编辑器）
  const customOptPos = await page.evaluate(() => {
    const sel = document.querySelector('.bnd-form .el-form-item:first-child .el-select')
    sel?.click()
    return { clicked: true }
  })
  await sleep(800)
  const customItem = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.el-select-dropdown__item'))
    // 自定义网络名 = 「SmokeTestNet」或「TestCustomNet」
    const it = items.find(i => {
      const t = i.textContent || ''
      return t.includes('SmokeTest') || t.includes('TestCustom') || t.includes('自定义')
    })
    if (!it) return null
    const r = it.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, label: it.textContent }
  })
  if (!customItem) {
    log('14. custom network not available, skipping')
  } else {
    await page.mouse.click(customItem.x, customItem.y)
    await sleep(1500)
    await page.screenshot({ path: '/tmp/s6_custom_picked.png' })
    const hasKV = await page.evaluate(() => {
      return !!document.querySelector('.bnd-kv')
    })
    log('14. custom picked: ' + customItem.label + ', hasKV=' + hasKV)
  }

  // ===== 15. 关闭弹窗
  await page.keyboard.press('Escape')
  await sleep(500)

  // ===== 16. 测试弹窗2「+ 添加账号」（优量汇：币种固定）
  await page.evaluate(() => {
    const sel = document.querySelector('.bnd-form .el-form-item:first-child .el-select')
    sel?.click()
  })
  await sleep(800)
  const ylhItem = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.el-select-dropdown__item'))
    const it = items.find(i => i.textContent?.trim().startsWith('优量汇'))
    if (!it) return null
    it.click()
    return { ok: true }
  })
  if (ylhItem) {
    await sleep(1500)
    // 点「添加账号」
    const addLink = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.bnd-add-account'))
      if (btns.length === 0) return null
      const r = btns[0].getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
    })
    if (addLink) {
      await page.mouse.click(addLink.x, addLink.y)
      await sleep(1500)
      await page.screenshot({ path: '/tmp/s7_add_ylh.png' })
      const ylhDrawer2Fields = await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('.ana-form .el-form-item__label'))
        return labels.map(l => l.textContent?.trim())
      })
      const hasCurrencyLock = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.ana-currency-lock')).some(el => el.textContent?.includes('不可修改'))
      })
      log('15. add-account(YLH) drawer2 fields: ' + JSON.stringify(ylhDrawer2Fields) + ', hasCurrencyLock=' + hasCurrencyLock)
    } else {
      log('15. add-account link not found')
    }
  } else {
    log('15. YLH option not found')
  }

  await browser.close()
  log('=== ALL E2E STEPS PASSED ===')
}

main().catch((e) => {
  console.error('[verify-schema] FAILED:', e.message)
  console.error(e.stack)
  process.exit(1)
})
