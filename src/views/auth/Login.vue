<template>
  <div class="auth-page">
    <!-- 左侧：表单区 -->
    <div class="auth-form-side">
      <div class="auth-form-container">
        <!-- Logo -->
        <div class="auth-form-logo">
          <img src="/logo.png" alt="新义聚合" class="auth-form-logo-img" />
          <span class="auth-form-logo-text">新义聚合</span>
        </div>

        <!-- 标题 -->
        <h1 class="auth-form-title">登录账号</h1>
        <p class="auth-form-subtitle">登录后即可管理您的应用与广告位</p>

        <!-- 表单 -->
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="auth-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item label="邮箱地址" prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入注册邮箱"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>

          <el-form-item label="验证码" prop="captcha">
            <div class="auth-captcha-row">
              <el-input
                v-model="form.captcha"
                placeholder="请输入验证码"
                class="auth-captcha-input"
              />
              <canvas
                ref="captchaCanvas"
                class="auth-captcha-canvas"
                width="220"
                height="64"
                @click="refreshCaptcha"
              />
            </div>
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="form.agreePrivacy" class="auth-privacy-check">
              <span class="auth-privacy-content">
                请阅读并勾选确认
                <a href="javascript:void(0)" class="auth-privacy-link" @click.prevent="showPrivacy">《新义聚合平台隐私政策》</a>
              </span>
            </el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="auth-submit-btn"
              :loading="loading"
              :disabled="!form.agreePrivacy"
              @click="handleLogin"
            >
              登 录
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 底部链接 -->
        <div class="auth-footer-link">
          还没有账号？<router-link to="/register" class="auth-link">立即注册</router-link>
        </div>
      </div>
    </div>

    <!-- 右侧：品牌区 -->
    <div class="auth-hero-side">
      <div class="auth-hero-content">
        <h2 class="auth-hero-title">一站式流量变现解决方案</h2>
        <p class="auth-hero-desc">
          聚合全球优质广告源，智能瀑布流优化，助力开发者收益最大化
        </p>

        <div class="auth-hero-features">
          <div class="auth-hero-feature">
            <div class="auth-hero-feature-icon">
              <el-icon :size="16"><TrendCharts /></el-icon>
            </div>
            <div class="auth-hero-feature-text">
              <div class="auth-hero-feature-name">实时数据洞察</div>
              <div class="auth-hero-feature-desc">多维度数据分析，精准把握流量价值</div>
            </div>
          </div>
          <div class="auth-hero-feature">
            <div class="auth-hero-feature-icon">
              <el-icon :size="16"><SetUp /></el-icon>
            </div>
            <div class="auth-hero-feature-text">
              <div class="auth-hero-feature-name">智能瀑布流</div>
              <div class="auth-hero-feature-desc">自动优化广告源排序，提升填充与收益</div>
            </div>
          </div>
          <div class="auth-hero-feature">
            <div class="auth-hero-feature-icon">
              <el-icon :size="16"><DataAnalysis /></el-icon>
            </div>
            <div class="auth-hero-feature-text">
              <div class="auth-hero-feature-name">多维报表分析</div>
              <div class="auth-hero-feature-desc">收益、展示、点击全链路可追溯</div>
            </div>
          </div>
          <div class="auth-hero-feature">
            <div class="auth-hero-feature-icon">
              <el-icon :size="16"><CircleCheck /></el-icon>
            </div>
            <div class="auth-hero-feature-text">
              <div class="auth-hero-feature-name">安全合规</div>
              <div class="auth-hero-feature-desc">数据加密传输，符合隐私合规要求</div>
            </div>
          </div>
        </div>
      </div>
      <div class="auth-hero-copyright">© 2024 新义聚合 All rights reserved.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { TrendCharts, SetUp, DataAnalysis, CircleCheck } from '@element-plus/icons-vue'
import request from '../../utils/request'

const router = useRouter()
const formRef = ref()
const captchaCanvas = ref<HTMLCanvasElement>()
const loading = ref(false)
const captchaText = ref('')

const form = reactive({
  email: '',
  password: '',
  captcha: '',
  agreePrivacy: false
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email' as const, message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 4, message: '验证码为4位字符', trigger: 'blur' }
  ]
}

function generateCaptchaText(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

function drawCaptcha(): void {
  const canvas = captchaCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  captchaText.value = generateCaptchaText()
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = '#F1F5F9'
  ctx.fillRect(0, 0, w, h)

  // 干扰线
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(148,163,184,${0.3 + Math.random() * 0.3})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.lineTo(Math.random() * w, Math.random() * h)
    ctx.stroke()
  }

  // 干扰点
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(148,163,184,${0.3 + Math.random() * 0.4})`
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
  }

  // 字符 (2x resolution for retina)
  ctx.font = '600 28px "Inter", monospace'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < captchaText.value.length; i++) {
    ctx.fillStyle = `rgba(30,58,138,${0.7 + Math.random() * 0.3})`
    ctx.save()
    ctx.translate(30 + i * 40, h / 2 + (Math.random() - 0.5) * 8)
    ctx.rotate((Math.random() - 0.5) * 0.3)
    ctx.fillText(captchaText.value[i], 0, 0)
    ctx.restore()
  }
}

function refreshCaptcha(): void {
  drawCaptcha()
  form.captcha = ''
}

function showPrivacy(): void {
  ElMessage.info('隐私政策页面开发中')
}

async function handleLogin(): Promise<void> {
  if (!form.agreePrivacy) {
    ElMessage.warning('请先阅读并勾选确认隐私政策')
    return
  }

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  if (form.captcha.toUpperCase() !== captchaText.value) {
    ElMessage.error('验证码错误')
    refreshCaptcha()
    return
  }

  loading.value = true
  try {
    const res = await request.post('/api/v1/auth/login', {
      email: form.email,
      password: form.password
    })
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token)
      ElMessage.success('登录成功')
      router.push('/dashboard')
    }
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '登录失败'
    ElMessage.error(errorMsg)
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  nextTick(() => drawCaptcha())
})
</script>
