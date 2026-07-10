// scripts/verify-preset-filter.mjs
// 验证：/network 「平台管理」Tab 的预置平台表格只显示 developer 至少建过 1 个账号的预置平台
// 顶部 + 行内 +新建账号 按钮可点击 → 切到「广告平台账号」Tab 并打开新建弹窗（预选 platform）
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const puppeteer = require('puppeteer')

const APP_URL = process.env.APP_URL || 'http://localhost:5000'
const API = APP_URL

const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome'
if (!fs.existsSync(CHROME)) {
  console.error('chrome not found at', CHROME)
  process.exit(1)
}

function log(s) { console.log(`[preset-filter] ${s}`) }
function pad(s, n=20) { return String(s).padEnd(n) }

async function api(method, url, body, token) {
  const res = await fetch(API + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

const fail = (msg) => { console.error('FAIL:', msg); process.exit(1) }
const ok = (msg) => log('✓ ' + msg)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const main = async () => {
  // === Step 1: 注册 + 创建 app ===
  const reg = await api('POST', '/api/v1/auth/register', {
    email: `preset-${Date.now()}@x.com`,
    password: 'Test123456',
    company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
  })
  const token = reg.data?.token
  if (!token) fail('register failed: ' + JSON.stringify(reg))
  ok(`register token: ${token.slice(0, 30)}...`)

  const c1 = await api('POST', '/api/v1/console/app/create', { appName: 'e', packageName: 'c.e', platform: 1 }, token)
  const appKey = c1.data?.app_key
  if (!appKey) fail('create app failed: ' + JSON.stringify(c1))
  ok(`app_key: ${appKey}`)

  // === Step 2: 查 ad_network_def 看有几个预置 ===
  const nl = await api('GET', '/api/v1/console/network/list', null, token)
  const allDefs = nl.data?.list || []
  const preset = allDefs.filter(n => n.network_type === 1)
  const custom = allDefs.filter(n => n.network_type === 2)
  log(`ad_network_def: ${preset.length} 预置, ${custom.length} 自定义`)
  if (preset.length < 2) fail('need at least 2 preset networks for this test')

  // === Step 3: puppeteer 打开 /network ===
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  // 注入 auth
  await page.goto(APP_URL + '/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate((tk) => {
    localStorage.setItem('token', tk)
    localStorage.setItem('userInfo', JSON.stringify({ token: tk, developerId: 'test' }))
  }, token)
  await page.goto(APP_URL + '/network', { waitUntil: 'domcontentloaded' })
  await sleep(4000) // 等 fetchList + fetchAccounts 完成

  // === Step 4: stage A — 新 dev 没有账号，预置平台表格应为空 ===
  const stageA = await page.evaluate(() => {
    const allCards = Array.from(document.querySelectorAll('.page-card'))
    let presetTable = null
    for (const c of allCards) {
      const title = c.querySelector('.page-card-title')?.textContent || ''
      if (title.includes('预置平台')) {
        presetTable = c.querySelector('table.el-table__body') || c.querySelector('table')
        break
      }
    }
    if (!presetTable) return { error: 'preset table not found' }
    const rows = presetTable.querySelectorAll('tbody tr')
    const dataRowCount = Array.from(rows).filter(r => !r.querySelector('.el-table__empty-block')).length
    return {
      rowCount: dataRowCount,
      totalRowElems: rows.length,
      emptyText: presetTable.parentElement?.querySelector('.el-table__empty-text')?.textContent || null,
      topBtn: !!Array.from(document.querySelectorAll('.page-filter-actions button')).find(b => b.textContent.includes('新建账号')),
      rowActionBtnExists: dataRowCount > 0 ? Array.from(presetTable.querySelectorAll('button')).some(b => b.textContent.includes('新建账号')) : false,
    }
  })
  log('stage A: ' + JSON.stringify(stageA))
  if (stageA.rowCount !== 0) fail(`stage A: expected 0 preset rows, got ${stageA.rowCount}`)
  if (!stageA.topBtn) fail('stage A: top "+新建账号" button missing')
  ok('stage A ✓: 0 预置行（无账号），顶部+新建账号按钮存在')

  // === Step 5: 点顶部「+ 新建账号」→ 切 tab + 打开弹窗 ===
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.page-filter-actions button')).find(b => b.textContent.includes('新建账号'))
    btn?.click()
  })
  await sleep(800)
  const stageA2 = await page.evaluate(() => {
    return {
      activeTab: Array.from(document.querySelectorAll('.el-tabs__item')).find(t => t.classList.contains('is-active'))?.textContent || null,
      drawerOpen: !!document.querySelector('.el-dialog__wrapper:not([style*="display: none"]) .el-dialog, .el-overlay-dialog:not([style*="display: none"])'),
    }
  })
  log('after top btn: ' + JSON.stringify(stageA2))
  if (!stageA2.activeTab?.includes('账号')) fail('top btn: should switch to accounts tab')
  if (!stageA2.drawerOpen) fail('top btn: should open create drawer')
  ok('stage A.2 ✓: 顶部按钮切到 accounts tab + 打开新建弹窗')
  // 关闭弹窗
  await page.evaluate(() => {
    const close = document.querySelector('.el-dialog__close, .el-dialog__headerbtn')
    close?.click()
  })
  await sleep(400)

  // === Step 6: 通过 API 创建穿山甲账号 ===
  const c2 = await api('POST', '/api/v1/console/network/account/create', {
    networkDefId: preset[0].id,
    accountName: '穿山甲默认账号',
    extraParams: { credentials: { accountName: '穿山甲默认账号' } },
  }, token)
  log('create CSJ account: ' + (c2.code === 0 ? '✓' : JSON.stringify(c2)))
  if (c2.code !== 0) fail('create CSJ account failed')
  // 再建一个第 2 个预置账号，确认能显示 2 个
  const c3 = await api('POST', '/api/v1/console/network/account/create', {
    networkDefId: preset[1].id,
    accountName: preset[1].network_name + '默认账号',
    extraParams: { credentials: { accountName: preset[1].network_name + '默认账号' } },
  }, token)
  if (c3.code !== 0) log('create ' + preset[1].network_code + ' (warn): ' + JSON.stringify(c3))
  else log('create ' + preset[1].network_code + ': ✓')

  // 验证 list 确实有 2 个账号
  const acctList = await api('GET', '/api/v1/console/network/account/list?pageSize=1000', null, token)
  log('account list after create: count=' + (acctList.data?.list?.length || 0) + ' def_ids=' + JSON.stringify(acctList.data?.list?.map(a => a.network_def_id)))

  // === Step 7: 回到「平台管理」Tab，验证预置平台表格显示有账号的 ===
  await page.goto(APP_URL + '/network')
  await sleep(5000)
  const stageB = await page.evaluate((presetNames) => {
    const allCards = Array.from(document.querySelectorAll('.page-card'))
    let presetTable = null
    for (const c of allCards) {
      const title = c.querySelector('.page-card-title')?.textContent || ''
      if (title.includes('预置平台')) {
        // Element Plus renders el-table__header + el-table__body as separate tables
        presetTable = c.querySelector('table.el-table__body') || c.querySelector('table')
        break
      }
    }
    if (!presetTable) return { error: 'preset table not found' }
    const rows = Array.from(presetTable.querySelectorAll('tbody tr')).filter(r => !r.querySelector('.el-table__empty-block'))
    const names = rows.map(r => r.querySelector('td:first-child .cell, td:first-child')?.textContent?.trim() || '').filter(Boolean)
    const actionBtns = Array.from(presetTable.querySelectorAll('button')).filter(b => b.textContent.includes('新建账号'))
    return { count: rows.length, names, actionBtnCount: actionBtns.length }
  }, preset.map(p => p.network_name))
  log('stage B: ' + JSON.stringify(stageB))
  // Debug: 总是打印所有 cards 状态
  const debug = await page.evaluate(() => {
    const allCards = Array.from(document.querySelectorAll('.page-card'))
    return allCards.map(c => ({
      title: c.querySelector('.page-card-title')?.textContent || '(no title)',
      hasTable: !!c.querySelector('table'),
      rowCount: c.querySelectorAll('tbody tr:not(.el-table__empty-row)').length,
    }))
  })
  log('debug cards: ' + JSON.stringify(debug))
  if (stageB.count < 1) fail(`stage B: expected at least 1 preset row with account, got ${stageB.count}`)
  if (stageB.count > preset.length) fail(`stage B: too many rows ${stageB.count} > ${preset.length}`)
  if (stageB.actionBtnCount !== stageB.count) fail(`stage B: action button count ${stageB.actionBtnCount} != row count ${stageB.count}`)
  ok(`stage B ✓: 显示 ${stageB.count} 个有账号的预置平台，每个行内都有「+ 新建账号」`)

  // === Step 8: 点行内「+ 新建账号」→ 弹窗预选该平台 ===
  // 重新打开弹窗
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.page-card button')).find(b => b.textContent.includes('新建账号'))
    btn?.click()
  })
  await sleep(800)
  const stageB2 = await page.evaluate(() => {
    // 在打开的弹窗里找 el-select 选中值
    const drawer = document.querySelector('.el-overlay-dialog:not([style*="display: none"]), .el-dialog__wrapper:not([style*="display: none"])')
    if (!drawer) return { error: 'drawer not found' }
    // 第一个 el-select 应该是"广告平台"
    const selectWrap = drawer.querySelector('.el-select__wrapper')
    return {
      activeTab: Array.from(document.querySelectorAll('.el-tabs__item')).find(t => t.classList.contains('is-active'))?.textContent || null,
      drawerOpen: !!drawer,
      selectPlaceholder: selectWrap?.querySelector('.el-select__placeholder')?.textContent || null,
    }
  })
  log('after row btn: ' + JSON.stringify(stageB2))
  if (!stageB2.activeTab?.includes('账号')) fail('row btn: should switch to accounts tab')
  if (!stageB2.drawerOpen) fail('row btn: should open create drawer')
  ok('stage B.2 ✓: 行内「+ 新建账号」切 tab + 打开弹窗')

  await browser.close()
  log('=== ALL CHECKS PASSED ===')
}

main().catch(e => { console.error(e); process.exit(1) })
