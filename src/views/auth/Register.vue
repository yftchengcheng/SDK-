<template>
  <div class="auth-page">
    <!-- 左侧品牌区 -->
    <div class="auth-hero">
      <div class="auth-hero-grid"></div>
      <div class="auth-hero-glow auth-hero-glow--1"></div>
      <div class="auth-hero-glow auth-hero-glow--2"></div>
      <div class="auth-hero-content">
        <div class="auth-hero-logo">
          <img src="/logo.png" alt="新义聚合" class="auth-hero-logo-img" />
          <div class="auth-hero-logo-text">
            <span class="auth-hero-logo-name">新义聚合</span>
            <span class="auth-hero-logo-sub">Xinyi Aggregation</span>
          </div>
        </div>
        <h2 class="auth-hero-title">广告SDK聚合平台</h2>
        <p class="auth-hero-desc">一站式流量变现解决方案</p>
        <div class="auth-hero-metrics">
          <div class="auth-hero-metric">
            <span class="auth-hero-metric-val">50+</span>
            <span class="auth-hero-metric-label">广告网络</span>
          </div>
          <div class="auth-hero-metric">
            <span class="auth-hero-metric-val">99.9%</span>
            <span class="auth-hero-metric-label">服务可用</span>
          </div>
          <div class="auth-hero-metric">
            <span class="auth-hero-metric-val">&lt;50ms</span>
            <span class="auth-hero-metric-label">配置延迟</span>
          </div>
        </div>
        <div class="auth-hero-trust">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>企业级数据安全 · 等保三级认证</span>
        </div>
      </div>
      <div class="auth-hero-footer">© 2026 新义聚合平台 · All rights reserved</div>
    </div>

    <!-- 右侧表单区 -->
    <div class="auth-form-side">
      <div class="auth-form-wrap">
        <h1 class="auth-form-title">创建账号</h1>
        <p class="auth-form-subtitle">开启高效流量变现之旅</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="auth-form"
          @submit.prevent="handleRegister"
        >
          <!-- 公司名称 -->
          <el-form-item label="公司名称" prop="company">
            <el-input
              v-model="form.company"
              placeholder="请输入公司名称"
            />
          </el-form-item>

          <!-- 联系人 -->
          <el-form-item label="联系人" prop="contactName">
            <el-input
              v-model="form.contactName"
              placeholder="请输入联系人姓名"
            />
          </el-form-item>

          <!-- 邮箱 -->
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="form.email"
              type="email"
              placeholder="请输入邮箱地址"
              autocomplete="email"
            />
          </el-form-item>

          <!-- 手机号 -->
          <el-form-item label="手机号" prop="phone">
            <el-input
              v-model="form.phone"
              placeholder="请输入手机号"
            />
          </el-form-item>

          <!-- 密码 -->
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请设置密码（至少6位）"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>

          <!-- 确认密码 -->
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>

          <!-- 验证码 -->
          <el-form-item label="验证码" prop="captcha">
            <div class="auth-captcha-row">
              <el-input
                v-model="form.captcha"
                placeholder="请输入验证码"
                @keyup.enter="handleRegister"
              />
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
                请阅读并勾选确认
                <a class="auth-policy-link" @click.prevent="showPrivacy = true">《新义聚合平台隐私政策》</a>
              </span>
            </el-checkbox>
          </el-form-item>

          <!-- 注册按钮 -->
          <el-form-item class="auth-form-item-btn">
            <el-button
              type="primary"
              class="auth-submit-btn"
              :loading="loading"
              :disabled="!agreed"
              @click="handleRegister"
            >
              注 册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="auth-form-footer">
          <span>已有账号？</span>
          <router-link to="/login" class="auth-link">立即登录</router-link>
        </div>
      </div>
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
  company: '',
  contactName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  captcha: ''
})

const validateConfirm = (_rule: unknown, value: string, callback: (err?: Error) => void) => {
  if (value !== form.password) {
    callback(new Error('两次密码输入不一致'))
  } else {
    callback()
  }
}

const rules = {
  company: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email' as const, message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
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

async function handleRegister(): Promise<void> {
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
    await userStore.register({
      email: form.email,
      password: form.password,
      company: form.company,
      contactName: form.contactName,
      phone: form.phone
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '注册失败'
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
