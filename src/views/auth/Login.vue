<template>
  <div class="auth-page">
    <!-- 左侧表单区 -->
    <div class="auth-form-side">
      <div class="auth-form-wrap">
        <div class="auth-form-logo">
          <img src="/logo.png" alt="新义聚合" class="auth-form-logo-img" />
          <span class="auth-form-logo-name">新义聚合</span>
        </div>
        <h1 class="auth-form-title">欢迎回来</h1>
        <p class="auth-form-subtitle">登录管理控制台</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="auth-form"
          @submit.prevent="handleLogin"
        >
          <!-- 邮箱 -->
          <el-form-item prop="email">
            <div class="auth-field">
              <svg class="auth-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>
              <el-input
                v-model="form.email"
                type="email"
                placeholder="请输入注册邮箱"
                autocomplete="email"
              />
            </div>
          </el-form-item>

          <!-- 密码 -->
          <el-form-item prop="password">
            <div class="auth-field">
              <svg class="auth-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                show-password
                autocomplete="current-password"
              />
            </div>
          </el-form-item>

          <!-- 验证码 -->
          <el-form-item prop="captcha">
            <div class="auth-captcha-row">
              <div class="auth-field auth-field--flex">
                <svg class="auth-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10a7 7 0 0 1-14 0"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <el-input
                  v-model="form.captcha"
                  placeholder="请输入验证码"
                  @keyup.enter="handleLogin"
                />
              </div>
              <canvas
                ref="captchaCanvas"
                class="auth-captcha-canvas"
                width="120"
                height="36"
                @click="generateCaptcha"
              ></canvas>
            </div>
          </el-form-item>

          <!-- 隐私政策 -->
          <el-form-item class="auth-form-item-policy">
            <el-checkbox v-model="agreed" class="auth-checkbox">
              <span class="auth-policy-text">
                请阅读并确认
                <a class="auth-policy-link" @click.prevent="showPrivacy = true">《新义聚合平台隐私政策》</a>
              </span>
            </el-checkbox>
          </el-form-item>

          <!-- 登录按钮 -->
          <el-form-item class="auth-form-item-btn">
            <el-button
              type="primary"
              class="auth-submit-btn"
              :loading="loading"
              :disabled="!agreed"
              @click="handleLogin"
            >
              登 录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="auth-form-footer">
          <span>还没有账号？</span>
          <router-link to="/register" class="auth-link">立即注册</router-link>
        </div>
      </div>
    </div>

    <!-- 右侧品牌区 -->
    <div class="auth-hero">
      <div class="auth-hero-bg"></div>
      <div class="auth-hero-content">
        <h2 class="auth-hero-title">智能聚合，高效变现</h2>
        <p class="auth-hero-desc">全方位广告SDK聚合管理平台，助力开发者实现精准流量分配与数据驱动决策</p>
        <div class="auth-hero-features">
          <div class="auth-hero-feature">
            <div class="auth-hero-feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 6-10"/></svg>
            </div>
            <div class="auth-hero-feature-text">
              <span class="auth-hero-feature-name">实时数据洞察</span>
              <span class="auth-hero-feature-desc">多维度数据分析</span>
            </div>
          </div>
          <div class="auth-hero-feature">
            <div class="auth-hero-feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m-9-11h2m18 0h2m-3.3-7.7l-1.4 1.4M5.7 18.3l-1.4 1.4m0-15.4l1.4 1.4m12.6 12.6l1.4 1.4"/></svg>
            </div>
            <div class="auth-hero-feature-text">
              <span class="auth-hero-feature-name">智能瀑布流</span>
              <span class="auth-hero-feature-desc">自动优化填充率</span>
            </div>
          </div>
          <div class="auth-hero-feature">
            <div class="auth-hero-feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20V10m0 0l-3 3m3-3l3 3"/><path d="M3 20h18"/></svg>
            </div>
            <div class="auth-hero-feature-text">
              <span class="auth-hero-feature-name">多维报表分析</span>
              <span class="auth-hero-feature-desc">收入趋势一目了然</span>
            </div>
          </div>
          <div class="auth-hero-feature">
            <div class="auth-hero-feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div class="auth-hero-feature-text">
              <span class="auth-hero-feature-name">安全合规</span>
              <span class="auth-hero-feature-desc">企业级数据保护</span>
            </div>
          </div>
        </div>
      </div>
      <div class="auth-hero-footer">© 2026 新义聚合平台 · All rights reserved</div>
    </div>

    <!-- 隐私政策弹窗 -->
    <el-dialog v-model="showPrivacy" title="新义聚合平台隐私政策" width="520px" :close-on-click-modal="true">
      <div class="auth-privacy-content">
        <p>新义聚合平台（以下简称"本平台"）非常重视用户隐私保护。本隐私政策说明本平台如何收集、使用、存储和保护您的个人信息。</p>
        <h4>一、信息收集</h4>
        <p>本平台在您注册账号时收集以下信息：邮箱地址、公司名称、联系人姓名、手机号码。这些信息用于身份验证和账号管理。</p>
        <h4>二、信息使用</h4>
        <p>您提供的信息仅用于：提供平台服务、账号安全验证、服务改进和通知推送。我们不会将您的信息出售给第三方。</p>
        <h4>三、信息保护</h4>
        <p>我们采用行业标准的安全措施保护您的信息，包括加密传输（SSL/TLS）、密码哈希存储、访问权限控制等。</p>
        <h4>四、信息存储</h4>
        <p>您的信息存储在安全的服务器中，仅在必要期限内保留。账号注销后，我们将删除您的个人信息。</p>
        <h4>五、您的权利</h4>
        <p>您有权访问、更正、删除您的个人信息。如需行使上述权利，请通过平台内联系方式与我们取得联系。</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const captchaCanvas = ref<HTMLCanvasElement>()
const loading = ref(false)
const agreed = ref(false)
const showPrivacy = ref(false)
const captchaCode = ref('')

const form = reactive({
  email: '',
  password: '',
  captcha: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email' as const, message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

function generateCaptcha(): void {
  if (!captchaCanvas.value) return
  const canvas = captchaCanvas.value
  const ctx = canvas.getContext('2d')!
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = '#F1F5F9'
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(148,163,184,${0.3 + Math.random() * 0.3})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.lineTo(Math.random() * w, Math.random() * h)
    ctx.stroke()
  }

  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(148,163,184,${0.3 + Math.random() * 0.4})`
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const colors = ['#1E40AF', '#2563EB', '#0F172A', '#334155']
  for (let i = 0; i < 4; i++) {
    const ch = chars[Math.floor(Math.random() * chars.length)]
    code += ch
    ctx.font = `bold ${16 + Math.random() * 4}px monospace`
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
    const x = 14 + i * 26
    const y = 22 + Math.random() * 6
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((Math.random() - 0.5) * 0.4)
    ctx.fillText(ch, 0, 0)
    ctx.restore()
  }
  captchaCode.value = code
}

async function handleLogin(): Promise<void> {
  if (!agreed.value) {
    ElMessage.warning('请先勾选确认隐私政策')
    return
  }
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (form.captcha.toUpperCase() !== captchaCode.value) {
    ElMessage.error('验证码错误')
    generateCaptcha()
    form.captcha = ''
    return
  }

  loading.value = true
  try {
    await userStore.login({
      email: form.email,
      password: form.password
    })
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '登录失败'
    ElMessage.error(msg)
    generateCaptcha()
    form.captcha = ''
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await nextTick()
  generateCaptcha()
})
</script>
