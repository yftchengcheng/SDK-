<template>
  <div class="auth-page">
    <!-- 左侧：表单区 -->
    <div class="auth-form-side">
      <div class="auth-form-container auth-form-container--wide">
        <!-- Logo -->
        <div class="auth-form-logo">
          <img src="/logo.png" alt="新义聚合" class="auth-form-logo-img" />
          <span class="auth-form-logo-text">新义聚合</span>
        </div>

        <!-- 标题 -->
        <h1 class="auth-form-title">注册账号</h1>
        <p class="auth-form-subtitle">创建账号，开始您的流量变现之旅</p>

        <!-- 表单 -->
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="auth-form"
          @submit.prevent="handleRegister"
        >
          <!-- 公司名称 + 公司简称 -->
          <el-form-item label="公司名称" prop="company">
            <el-input
              v-model="form.company"
              placeholder="请输入公司全称"
              clearable
            />
          </el-form-item>

          <el-form-item label="公司简称" prop="companyShortName">
            <el-input
              v-model="form.companyShortName"
              placeholder="请输入公司简称（2-10字符）"
              clearable
            />
          </el-form-item>

          <!-- 联系人 + 联系电话 -->
          <el-form-item label="联系人" prop="contactName">
            <el-input
              v-model="form.contactName"
              placeholder="请输入联系人姓名"
              clearable
            />
          </el-form-item>

          <el-form-item label="联系电话" prop="phone">
            <el-input
              v-model="form.phone"
              placeholder="请输入11位手机号"
              clearable
              maxlength="11"
            />
          </el-form-item>

          <!-- 邮箱 -->
          <el-form-item label="邮箱地址" prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入注册邮箱"
              clearable
            />
          </el-form-item>

          <!-- 对接方式 -->
          <el-form-item label="对接方式" prop="accessType">
            <el-radio-group v-model="form.accessType" class="auth-radio-group">
              <el-radio-button :value="1">SDK 对接</el-radio-button>
              <el-radio-button :value="2">API 对接</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 密码 + 确认密码 -->
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请设置密码（至少6位）"
              show-password
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
            />
          </el-form-item>

          <!-- 验证码 -->
          <el-form-item label="验证码" prop="captcha">
            <div class="auth-captcha-row">
              <el-input
                v-model="form.captcha"
                placeholder="请输入验证码"
                class="auth-captcha-input"
                maxlength="4"
              />
              <canvas
                ref="captchaCanvas"
                class="auth-captcha-canvas"
                width="110"
                height="36"
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
              @click="handleRegister"
            >
              注 册
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 底部链接 -->
        <div class="auth-footer-link">
          已有账号？<router-link to="/login" class="auth-link">立即登录</router-link>
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
  company: '',
  companyShortName: '',
  contactName: '',
  phone: '',
  email: '',
  accessType: 1,
  password: '',
  confirmPassword: '',
  captcha: '',
  agreePrivacy: false
})

const validateConfirmPassword = (_rule: unknown, value: string, callback: (err?: Error) => void): void => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validatePhone = (_rule: unknown, value: string, callback: (err?: Error) => void): void => {
  if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入有效的11位手机号'))
  } else {
    callback()
  }
}

const rules = {
  company: [
    { required: true, message: '请输入公司名称', trigger: 'blur' },
    { min: 2, max: 50, message: '公司名称长度2-50字符', trigger: 'blur' }
  ],
  companyShortName: [
    { required: true, message: '请输入公司简称', trigger: 'blur' },
    { min: 2, max: 10, message: '公司简称长度2-10字符', trigger: 'blur' }
  ],
  contactName: [
    { required: true, message: '请输入联系人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度2-20字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email' as const, message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  accessType: [
    { required: true, message: '请选择对接方式', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
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

  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgba(148,163,184,${0.3 + Math.random() * 0.3})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.lineTo(Math.random() * w, Math.random() * h)
    ctx.stroke()
  }

  for (let i = 0; i < 15; i++) {
    ctx.fillStyle = `rgba(148,163,184,${0.3 + Math.random() * 0.4})`
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
  }

  ctx.font = '600 22px "Inter", monospace'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < captchaText.value.length; i++) {
    ctx.fillStyle = `rgba(30,58,138,${0.7 + Math.random() * 0.3})`
    ctx.save()
    ctx.translate(20 + i * 22, h / 2 + (Math.random() - 0.5) * 4)
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

async function handleRegister(): Promise<void> {
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
    const res = await request.post('/api/v1/auth/register', {
      company: form.company,
      companyShortName: form.companyShortName,
      contactName: form.contactName,
      phone: form.phone,
      email: form.email,
      accessType: form.accessType,
      password: form.password
    })
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token)
      ElMessage.success('注册成功')
      router.push('/dashboard')
    }
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '注册失败'
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
