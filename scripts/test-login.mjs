import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const puppeteer = require('puppeteer')
const CHROME = '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome'

async function api(method, url, body) {
  const r = await fetch('http://localhost:5000' + url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return r.json()
}

const reg = await api('POST', '/api/v1/auth/register', {
  email: 'login-test-' + Date.now() + '@x.com', password: 'Test123456',
  company: 'c', companyShortName: 'c', contactName: 'c', phone: '13800000000', accessType: 1,
})
const email = reg.data?.email
console.log('Registered email:', email)

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
page.on('pageerror', e => console.log('[pageerror]', e.message))
page.on('console', msg => { if (msg.type() === 'error') console.log('[console error]', msg.text()) })

await page.setViewport({ width: 1440, height: 1100 })
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 2000))

// Fill email
await page.type('input[placeholder="请输入注册邮箱"]', email)
await new Promise(r => setTimeout(r, 200))

// Fill password
await page.type('input[placeholder="请输入密码"]', 'Test123456')
await new Promise(r => setTimeout(r, 200))

// Get captcha text by reading canvas
const captchaText = await page.evaluate(() => {
  const canvas = document.querySelector('canvas')
  if (!canvas) return null
  return canvas.getAttribute('data-captcha') || 'NO_DATA_ATTR'
})
console.log('Canvas data-captcha attr:', captchaText)

// Read captcha via window global if available
const captchaGlobal = await page.evaluate(() => {
  return window.__captchaText || null
})
console.log('Window captchaText:', captchaGlobal)

// Try to read captcha from any global state
const captchaFromState = await page.evaluate(() => {
  // Try to extract from Vue's reactive state
  const app = document.querySelector('#app')?.__vue_app__
  return app ? 'FOUND_VUE' : 'NO_VUE'
})

// Fill captcha with the test captcha text from a known value
// Let me try reading the captcha from the canvas pixel data
const captchaViaCanvas = await page.evaluate(() => {
  const canvas = document.querySelector('canvas')
  if (!canvas) return null
  const ctx = canvas.getContext('2d')
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  // The captcha text is stored in Vue ref, let's try to find it
  return canvas.toDataURL().substring(0, 50)
})
console.log('Canvas dataURL prefix:', captchaViaCanvas)

// Check the form state via dev tools
const formState = await page.evaluate(() => {
  const inputs = document.querySelectorAll('input')
  return Array.from(inputs).map(i => ({ name: i.name, placeholder: i.placeholder, value: i.value, type: i.type }))
})
console.log('Form inputs:', formState)

await page.screenshot({ path: '/tmp/login-page.png', fullPage: true })
await browser.close()
