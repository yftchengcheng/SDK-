<template>
  <div class="auth-page">
    <!-- 左侧品牌区 -->
    <div class="auth-hero">
      <div class="auth-hero-bg">
        <div class="hero-mesh"></div>
        <div class="hero-glow hero-glow-1"></div>
        <div class="hero-glow hero-glow-2"></div>
        <div class="hero-orbit hero-orbit-1"></div>
        <div class="hero-orbit hero-orbit-2"></div>
        <div class="hero-orbit hero-orbit-3"></div>
      </div>
      <div class="auth-hero-content">
        <div class="hero-brand">
          <img src="/logo.png" alt="新义聚合" class="hero-logo-img" />
          <div class="hero-brand-text">
            <span class="hero-brand-name">新义聚合</span>
            <span class="hero-brand-tag">Ad SDK Aggregation</span>
          </div>
        </div>
        <h2 class="hero-heading">开启高效<br/>流量变现之旅</h2>
        <p class="hero-desc">注册成为开发者，接入 50+ 广告网络，享受智能聚合与精细化运营工具</p>
        <div class="hero-metrics">
          <div class="hero-metric">
            <span class="hero-metric-value">50<span class="hero-metric-unit">+</span></span>
            <span class="hero-metric-label">广告网络</span>
          </div>
          <div class="hero-metric-divider"></div>
          <div class="hero-metric">
            <span class="hero-metric-value">99.9<span class="hero-metric-unit">%</span></span>
            <span class="hero-metric-label">服务可用</span>
          </div>
          <div class="hero-metric-divider"></div>
          <div class="hero-metric">
            <span class="hero-metric-value">&lt;50<span class="hero-metric-unit">ms</span></span>
            <span class="hero-metric-label">配置延迟</span>
          </div>
        </div>
        <div class="hero-trust">
          <div class="hero-trust-item">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1L10.5 5.5L15.5 6.3L11.75 9.9L12.6 14.9L8 12.5L3.4 14.9L4.25 9.9L0.5 6.3L5.5 5.5L8 1Z" fill="#60A5FA"/></svg>
            <span>穿山甲 · 优量汇 · 快手 · 百度 · Mintegral</span>
          </div>
          <div class="hero-trust-item">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 1H10L15 6V14C15 14.6 14.6 15 14 15H2C1.4 15 1.4 15 1 14V6L6 1Z" stroke="#059669" stroke-width="1.5" fill="none"/><path d="M6 10H10" stroke="#059669" stroke-width="1.5"/></svg>
            <span>数据加密 · 金融级安全 · 7×24 监控</span>
          </div>
        </div>
      </div>
      <div class="auth-hero-footer">
        <span>&copy; 2026 新义聚合平台 · All rights reserved</span>
      </div>
    </div>
    <!-- 右侧表单区 -->
    <div class="auth-form-side">
      <div class="auth-form-container">
        <div class="auth-form-header">
          <h1 class="auth-form-title">创建账号</h1>
          <p class="auth-form-subtitle">注册新义聚合平台开发者</p>
        </div>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleRegister" class="auth-form">
          <div class="auth-form-row">
            <el-form-item label="公司名称" prop="company" class="auth-form-row-item">
              <el-input v-model="form.company" placeholder="请输入公司名称" size="large" prefix-icon="OfficeBuilding" />
            </el-form-item>
            <el-form-item label="联系人" prop="contactName" class="auth-form-row-item">
              <el-input v-model="form.contactName" placeholder="请输入联系人" size="large" prefix-icon="User" />
            </el-form-item>
          </div>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" size="large" prefix-icon="Message" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码（6位以上）" show-password size="large" prefix-icon="Lock" />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password size="large" prefix-icon="Lock" />
          </el-form-item>
          <el-form-item label="验证码" prop="captcha">
            <div class="captcha-row">
              <el-input v-model="form.captcha" placeholder="请输入验证码" size="large" class="captcha-input" prefix-icon="Key" />
              <div class="captcha-canvas" @click="refreshCaptcha" title="点击刷新验证码">
                <canvas ref="captchaCanvas" width="130" height="40"></canvas>
              </div>
            </div>
          </el-form-item>
          <el-form-item prop="privacy">
            <div class="privacy-check">
              <el-checkbox v-model="form.privacy">
                请阅读并勾选确认<a href="javascript:void(0)" class="privacy-link" @click.prevent="showPrivacy">《新义聚合平台隐私政策》</a>
              </el-checkbox>
            </div>
          </el-form-item>
          <el-form-item class="auth-form-actions">
            <el-button type="primary" :loading="loading" :disabled="!form.privacy" class="auth-submit-btn" native-type="submit">注册</el-button>
          </el-form-item>
        </el-form>
        <div class="auth-form-footer">
          已有账号？<router-link to="/login" class="auth-link">立即登录</router-link>
        </div>
      </div>
    </div>
    <!-- 隐私政策弹窗 -->
    <el-dialog v-model="privacyVisible" title="新义聚合平台隐私政策" width="560px" :close-on-click-modal="true" class="privacy-dialog">
      <div class="privacy-content">
        <h4>一、信息收集</h4>
        <p>我们收集您在注册和使用过程中主动提供的信息，包括邮箱、公司名称、联系人、联系电话等，用于账号创建和平台服务提供。</p>
        <h4>二、信息使用</h4>
        <p>收集的信息仅用于：提供广告聚合管理服务、改善用户体验、安全防护与反欺诈、法律法规要求的信息要求的信息披露。</p>
        <h4>三、信息保护</h4>
        <p>我们采用业界标准的加密存储和传输技术保护您的个人信息，严格控制数据访问权限，定期进行安全审计。</p>
        <h4>四、信息共享</h4>
        <p>未经您的明确同意，我们不会向第三方共享您的个人信息，法律法规要求或政府主管部门依法要求除外。</p>
        <h4>五、您的权利</h4>
        <p>您有权访问、更正、删除您的个人信息，也可随时注销账号。如需行使相关权利，请通过平台内联系方式与我们取得联系。</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref<FormInstance>();
const loading = ref(false);
const privacyVisible = ref(false);
const captchaCanvas = ref<HTMLCanvasElement>();

// 验证码 - 随机字符
const captchaText = ref('');
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateCaptchaText = (): string => {
  let text = '';
  for (let i = 0; i < 4; i++) {
    text += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return text;
};

const drawCaptcha = () => {
  const canvas = captchaCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  captchaText.value = generateCaptchaText();

  const grad = ctx.createLinearGradient(0, 0, 130, 40);
  grad.addColorStop(0, '#EFF6FF');
  grad.addColorStop(1, '#E0E7FF');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 130, 40);

  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 130, Math.random() * 40);
    ctx.bezierCurveTo(
      Math.random() * 130, Math.random() * 40,
      Math.random() * 130, Math.random() * 40,
      Math.random() * 130, Math.random() * 40
    );
    ctx.strokeStyle = `rgba(37,99,235,${0.15 + Math.random() * 0.15})`;
    ctx.lineWidth = 0.8 + Math.random();
    ctx.stroke();
  }

  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 130, Math.random() * 40, 0.8 + Math.random() * 0.8, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(37,99,235,${0.2 + Math.random() * 0.2})`;
    ctx.fill();
  }

  const colors = ['#1E293B', '#1E40AF', '#0F766E', '#1E3A8A'];
  for (let i = 0; i < captchaText.value.length; i++) {
    ctx.save();
    const x = 18 + i * 28;
    const y = 24 + (Math.random() - 0.5) * 8;
    const angle = (Math.random() - 0.5) * 0.4;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.font = `bold ${15 + Math.floor(Math.random() * 4)}px "Courier New", "PingFang SC", monospace`;
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(captchaText.value[i], 0, 0);
    ctx.restore();
  }
};

const refreshCaptcha = () => {
  form.captcha = '';
  drawCaptcha();
};

const showPrivacy = () => {
  privacyVisible.value = true;
};

const form = reactive({
  company: '',
  contactName: '',
  email: '',
  password: '',
  confirmPassword: '',
  captcha: '',
  privacy: false,
});

const validateCaptcha = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入验证码'));
  } else if (value.toUpperCase() !== captchaText.value) {
    callback(new Error('验证码错误，请重新输入'));
  } else {
    callback();
  }
};

const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请确认密码'));
  } else if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const validatePrivacy = (_rule: unknown, value: boolean, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请阅读并勾选确认隐私政策'));
  } else {
    callback();
  }
};

const rules: FormRules = {
  company: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码不少于6位', trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }],
  captcha: [{ required: true, validator: validateCaptcha, trigger: 'blur' }],
  privacy: [{ validator: validatePrivacy, trigger: 'change' }],
};

const handleRegister = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    await userStore.register({
      email: form.email,
      password: form.password,
      company: form.company,
      contactName: form.contactName,
    });
    ElMessage.success('注册成功，请登录');
    router.push('/login');
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  nextTick(() => {
    drawCaptcha();
  });
});
</script>
