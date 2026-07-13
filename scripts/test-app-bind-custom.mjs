#!/usr/bin/env node
// E2E: 应用管理-关联广告平台 (BindNetworkDrawer)
// 验证：
//  1) 预设网络：自动创建「默认账号」并绑定
//  2) 自定义网络：必须选择已有账号，accountId 写入 binding

const BASE = 'http://localhost:5000'

function genEmail() {
  return 'bindapp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8) + '@t.com'
}

async function call(method, url, body, token) {
  const res = await fetch(BASE + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  return json
}

function check(label, cond, extra) {
  const mark = cond ? '✅' : '❌'
  console.log(mark + ' ' + label, cond ? '' : (extra ? JSON.stringify(extra) : ''))
  if (!cond) process.exitCode = 1
}

;(async () => {
  // 1. 注册
  const reg = await call('POST', '/api/v1/auth/register', {
    email: genEmail(), password: 'Test1234', company: 'T', companyShortName: 'T', contactName: 'T', phone: '13800138000',
  })
  check('register ok', reg.code === 0 && !!reg.data?.token, reg)
  const token = reg.data.token
  const devId = reg.data.userInfo?.id

  // 2. 建应用
  const app = await call('POST', '/api/v1/console/app/create', {
    appName: 'BindApp_' + Date.now(), packageName: 'com.bindapp.' + Date.now(), platform: 1,
  }, token)
  check('app create ok', app.code === 0, app)
  const appKey = app.data.app_key

  // 3. 建自定义网络
  const net = await call('POST', '/api/v1/console/network/custom/create', {
    networkName: 'TestCustomNet_' + Date.now(),
    networkCode: 'tcn_' + Date.now(),
    adapterClassInitAndroid: 'com.demo.MyInitAdapter',
  }, token)
  check('custom network create ok', net.code === 0, net)
  const netId = net.data.id

  // 4. 在自定义网络下建 2 个账号
  const acct1 = await call('POST', '/api/v1/console/network/account/create', {
    account_name: '账号 A', network_def_id: netId, credentials: { app_id: 'aaa' },
  }, token)
  check('account A create ok', acct1.code === 0, acct1)
  const acct2 = await call('POST', '/api/v1/console/network/account/create', {
    account_name: '账号 B', network_def_id: netId, credentials: { app_id: 'bbb' },
  }, token)
  check('account B create ok', acct2.code === 0, acct2)

  // 5. 拉取账号列表（模拟前端 fetchCustomAccounts）
  const acctList = await call('GET', `/api/v1/console/network/account/list?network_def_id=${netId}&pageSize=1000&status=1`, null, token)
  check('account list ok', acctList.code === 0 && Array.isArray(acctList.data?.list) && acctList.data.list.length === 2, acctList)
  const firstId = acctList.data.list[0].id
  const secondId = acctList.data.list[1].id

  // 6. 自定义网络关联：传 accountId + 应用维度参数
  const bind1 = await call('POST', '/api/v1/console/network/app/bind', {
    appKey, networkDefId: netId,
    networkAppId: String(firstId),
    accountId: firstId,
    extraParams: { app_dim_params: { 'app ID': '123456', channel: 'huawei' } },
  }, token)
  check('custom bind ok', bind1.code === 0, bind1)
  check('custom bind account_id persisted', bind1.data?.account_id === firstId, bind1.data)
  check('custom bind app_dim_params persisted', bind1.data?.extra_params?.app_dim_params?.['app ID'] === '123456', bind1.data?.extra_params)

  // 7. 列表查询：应能查到 account_id
  const list1 = await call('GET', `/api/v1/console/network/app/list?networkDefId=${netId}`, null, token)
  check('list ok', list1.code === 0 && Array.isArray(list1.data?.list) && list1.data.list.length >= 1, list1)
  const found = list1.data.list.find((b) => b.app_key === appKey)
  check('list contains account_id', found && found.account_id === firstId, found)

  // 8. accountId 越权验证：使用其他开发的账号应被拒
  const otherReg = await call('POST', '/api/v1/auth/register', {
    email: genEmail() + '.other', password: 'Test1234', company: 'O', companyShortName: 'O', contactName: 'O', phone: '13800138000',
  })
  const otherApp = await call('POST', '/api/v1/console/app/create', {
    appName: 'OtherApp_' + Date.now(), packageName: 'com.other.' + Date.now(), platform: 1,
  }, otherReg.data.token)
  const crossBind = await call('POST', '/api/v1/console/network/app/bind', {
    appKey: otherApp.data.app_key, networkDefId: netId, networkAppId: '1', accountId: firstId,
  }, otherReg.data.token)
  check('cross-developer accountId rejected', crossBind.code === 403, crossBind)

  console.log('--- DONE ---')
})()
