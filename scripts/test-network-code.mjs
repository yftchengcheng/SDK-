/**
 * Puppeteer E2E 测试 - 自定义广告平台代码（方案 A）
 *
 * 覆盖场景：
 * 1. 合法代码（含 CUSTOM_ 前缀）→ 200 OK
 * 2. 预置代码冲突（YLH）→ 前端行内报错，阻止提交
 * 3. 小写代码自动转大写 → DB 存 CUSTOM_LOWER_V6
 * 4. 无效格式（小写带连字符）→ 前端行内报错
 * 5. 太短（2 位）→ 前端行内报错
 * 6. 后端 snake_case / camelCase 双兼容
 *
 * 运行：node scripts/test-network-code.mjs
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
    email: 'nc-' + Date.now() + Math.floor(Math.random() * 1000) + '@x.com',
    password: 'Test123456',
    company: 'pdt', companyShortName: 'pdt', contactName: 'pdt',
    phone: '13800000000', accessType: 1,
  })
}

async function openCreateDialog(page) {
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.includes('创建自定义'))
    if (btn) btn.click()
  })
  await new Promise(r => setTimeout(r, 2000))
}

async function fillForm(page, { name, code, adapter }) {
  const inputs = await page.$$('.el-drawer .el-input__inner')
  for (const inp of inputs) {
    const ph = await page.evaluate(el => el.placeholder, inp)
    if (ph?.includes('MyAdNetwork') && name != null) {
      await inp.click(); await inp.type(name)
    } else if (ph?.includes('MYAD') && code != null) {
      await inp.click(); await inp.type(code)
    } else if ((ph?.includes('Adapter') || ph?.includes('类名')) && adapter != null) {
      await inp.click(); await inp.type(adapter)
    }
  }
  await page.click('body', { offset: { x: 0, y: 0 } })
  await new Promise(r => setTimeout(r, 500))
}

async function getFormState(page) {
  return page.evaluate(() => {
    const form = document.querySelector('form.el-form')
    const codeItem = Array.from(form?.querySelectorAll('.el-form-item') || [])
      .find(it => it.querySelector('.el-form-item__label')?.textContent?.trim()?.includes('代码'))
    return {
      error: codeItem?.querySelector('.el-form-item__error')?.textContent?.trim() || '',
      hasError: codeItem?.className.includes('is-error') || false,
    }
  })
}

async function submitForm(page) {
  await page.evaluate(() => {
    const drawer = document.querySelector('.el-drawer')
    const footer = drawer?.querySelector('.page-form-footer-right')
    const submit = footer ? Array.from(footer.querySelectorAll('button'))
      .find(b => b.textContent.includes('创建自定义广告平台')) : null
    if (submit) submit.click()
  })
}

async function closeDrawer(page) {
  await page.evaluate(() => {
    const drawer = document.querySelector('.el-drawer')
    const cancel = drawer ? Array.from(drawer.querySelectorAll('button'))
      .find(b => b.textContent.includes('取消')) : null
    if (cancel) cancel.click()
  })
  await new Promise(r => setTimeout(r, 1000))
}

async function deleteByName(token, name) {
  const list = await api('GET', '/api/v1/console/network/list?pageSize=200', null, token)
  const f = list.data?.list?.find(n => n.network_name === name)
  if (f) {
    await fetch(BASE + '/api/v1/console/network/custom/' + f.id, {
      method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token }
    })
  }
  return f
}

async function loginAndOpen(page, token) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate((t) => {
    localStorage.setItem('token', t)
    localStorage.setItem('userInfo', JSON.stringify({ id: 1, email: 'x@x.com', company: 'pdt', companyShortName: 'pdt', accessType: 1, status: 1 }))
  }, token)
  await page.goto(BASE + '/network', { waitUntil: 'domcontentloaded' })
  await new Promise(r => setTimeout(r, 3500))
}

async function runCase(page, token, { name, code, adapter, expectedError, expectedCode, label }) {
  console.log(`\n=== ${label} ===`)
  await openCreateDialog(page)
  await fillForm(page, { name, code, adapter })
  const before = await getFormState(page)
  await submitForm(page)
  await new Promise(r => setTimeout(r, 2500))
  const list = await api('GET', '/api/v1/console/network/list?pageSize=200', null, token)
  const found = list.data?.list?.find(n => n.network_name === name)
  let ok = false
  if (expectedError) {
    if (!found && (before.hasError || before.error)) {
      console.log(`  ✓ 阻止提交, 错误: ${before.error || '服务器拒绝'}`)
      ok = true
    } else {
      console.log(`  ✗ 应被阻止, 但${found ? '已创建: ' + found.network_code : '未显示错误'}`)
    }
  } else if (expectedCode) {
    if (found && found.network_code === expectedCode) {
      console.log(`  ✓ DB 存储: ${found.network_code}`)
      ok = true
    } else {
      console.log(`  ✗ 应存为 ${expectedCode}, 实际: ${found?.network_code || '未找到'}`)
    }
  }
  if (found) await deleteByName(token, name)
  await closeDrawer(page)
  return ok
}

async function run() {
  const reg = await registerUser()
  const token = reg.data.token

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 1100 })
  await loginAndOpen(page, token)

  let pass = 0, fail = 0

  // 前端校验场景
  if (await runCase(page, token, {
    name: 'ValidA', code: 'CUSTOM_E2E_A', adapter: 'com.test.A',
    expectedCode: 'CUSTOM_E2E_A', label: 'Case 1: 合法代码（含前缀）',
  })) pass++; else fail++

  if (await runCase(page, token, {
    name: 'LowerB', code: 'CUSTOM_lower_b', adapter: 'com.test.B',
    expectedCode: 'CUSTOM_LOWER_B', label: 'Case 2: 小写转大写',
  })) pass++; else fail++

  if (await runCase(page, token, {
    name: 'PresetCSJ', code: 'CSJ', adapter: 'com.test.C',
    expectedError: true, label: 'Case 3: 预置代码冲突（前端拦截）',
  })) pass++; else fail++

  if (await runCase(page, token, {
    name: 'BadHyphen', code: 'CUSTOM_b@d', adapter: 'com.test.D',
    expectedError: true, label: 'Case 4: 无效字符（前端拦截）',
  })) pass++; else fail++

  if (await runCase(page, token, {
    name: 'TooShortE', code: 'CUSTOM_A', adapter: 'com.test.E',
    expectedError: true, label: 'Case 5: 太短（前端拦截）',
  })) pass++; else fail++

  await browser.close()

  // 后端 API 回归
  console.log('\n=== 后端 API 回归 ===')
  const reg2 = await registerUser()
  const t2 = reg2.data.token

  const cases = [
    { body: { networkName: 'APIReg1', networkCode: 'CUSTOM_API_REG1', adapterClassInit: 'com.R1' }, expectOk: true, label: 'camelCase' },
    { body: { network_name: 'APIReg2', network_code: 'CUSTOM_API_REG2', adapter_class_init: 'com.R2' }, expectOk: true, label: 'snake_case' },
    { body: { network_name: 'APIReg3', network_code: 'AB', adapter_class_init: 'com.R3' }, expectOk: false, label: '2字符拒绝' },
    { body: { network_name: 'APIReg4', network_code: 'CSJ', adapterClassInit: 'com.R4' }, expectOk: false, label: '预置CSJ拒绝' },
  ]
  for (const c of cases) {
    const r = await api('POST', '/api/v1/console/network/custom/create', c.body, t2)
    if (c.expectOk ? r.code === 0 : r.code === 400) {
      console.log(`  ✓ ${c.label}: ${r.code} ${r.message}`)
      pass++
    } else {
      console.log(`  ✗ ${c.label}: ${r.code} ${r.message}`)
      fail++
    }
    if (r.code === 0) await deleteByName(t2, c.body.networkName || c.body.network_name)
  }

  // 唯一性测试
  await api('POST', '/api/v1/console/network/custom/create', { network_name: 'DupTest', network_code: 'CUSTOM_DUP_TEST' }, t2)
  const dup = await api('POST', '/api/v1/console/network/custom/create', { network_name: 'DupTest2', network_code: 'CUSTOM_DUP_TEST' }, t2)
  if (dup.code === 400 && dup.message?.includes('占用')) {
    console.log(`  ✓ 唯一性约束: ${dup.message}`)
    pass++
  } else {
    console.log(`  ✗ 唯一性约束: ${dup.code} ${dup.message}`)
    fail++
  }
  await deleteByName(t2, 'DupTest')

  console.log(`\n=== Result: ${pass} pass / ${fail} fail ===`)
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(e => { console.error(e); process.exit(1) })
