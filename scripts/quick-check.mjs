import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const puppeteer = require('puppeteer')
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome'

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
page.on('pageerror', e => console.log('[pageerror]', e.message))
page.on('console', m => { console.log('[' + m.type() + ']', m.text().slice(0, 300)) })

await page.setViewport({ width: 1440, height: 900 })
await page.goto('http://localhost:5000/login', { waitUntil: 'domcontentloaded' })
await page.evaluate(() => { localStorage.setItem('token', 'test'); localStorage.setItem('userInfo', JSON.stringify({})) })
await page.goto('http://localhost:5000/network', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 3000))

const state = await page.evaluate(() => {
  return {
    url: location.href,
    bodyText: document.body?.innerText?.slice(0, 200),
    elDialog: !!document.querySelector('.el-dialog'),
    elTabs: document.querySelectorAll('.el-tabs__item').length,
    networkAccountManager: !!document.querySelector('.network-account-manager'),
    appRoot: !!document.getElementById('app'),
    appHtml: document.getElementById('app')?.innerHTML?.slice(0, 200) || 'empty',
  }
})
console.log('\nSTATE:', JSON.stringify(state, null, 2))
await browser.close()
