<template>
  <div class="auth-page">
    <!-- 左侧品牌区 -->
    <div class="auth-hero">
      <div class="auth-hero-bg">
        <!-- 装饰层：大圆弧 -->
        <div class="hero-arc"></div>
        <!-- 装饰层：网格 -->
        <div class="hero-grid"></div>
        <!-- 装饰层：光晕 -->
        <div class="hero-glow hero-glow-1"></div>
        <div class="hero-glow hero-glow-2"></div>
        <div class="hero-glow hero-glow-3"></div>
        <!-- 装饰层：浮动数据卡片 -->
        <div class="hero-float-card hero-float-card-1">
          <span class="float-card-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4L6 2L14 6V12L6 16L2 14V4Z" fill="#3B82F6" opacity="0.8"/></svg>
          </span>
          <div class="float-card-body">
            <span class="float-card-label">填充率</span>
            <span class="float-card-value">96.8%</span>
          </div>
        </div>
        <div class="hero-float-card hero-float-card-2">
          <span class="float-card-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="4" height="10" rx="1" fill="#10B981" opacity="0.8"/><rect x="6" y="2" width="4" height="12" rx="1" fill="#10B981" opacity="0.6"/><rect x="11" y="6" width="4" height="8" rx="1" fill="#10B981" opacity="0.4"/></svg>
          </span>
          <div class="float-card-body">
            <span class="float-card-label">eCPM</span>
            <span class="float-card-value">¥42.6</span>
          </div>
        </div>
        <div class="hero-float-card hero-float-card-3">
          <span class="float-card-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#F59E0B" stroke-width="1.5" fill="none" opacity="0.8"/><path d="M8 5V8L10 10" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/></svg>
          </span>
          <div class="float-card-body">
            <span class="float-card-label">实时请求</span>
            <span class="float-card-value">1.2K/s</span>
          </div>
        </div>
      </div>
      <div class="auth-hero-content">
        <div class="hero-logo">
          <img src="/logo.png" alt="新义聚合" class="hero-logo-img" />
        </div>
        <h2 class="hero-heading">新义聚合</h2>
        <p class="hero-desc">广告SDK聚合平台 — 一站式流量变现解决方案</p>
        <div class="hero-divider"></div>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="hero-stat-value">50+</span>
            <span class="hero-stat-label">广告网络</span>
          </div>
          <div class="hero-stat-sep"></div>
          <div class="hero-stat">
            <span class="hero-stat-value">99.9%</span>
            <span class="hero-stat-label">服务可用</span>
          </div>
          <div class="hero-stat-sep"></div>
          <div class="hero-stat">
            <span class="hero-stat-value">&lt;50ms</span>
            <span class="hero-stat-label">配置延迟</span>
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
          <h1 class="auth-form-title">欢迎回来</h1>
          <p class="auth-form-subtitle">登录管理控制台</p>
        </div>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleLogin" class="auth-form">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入注册邮箱" size="large" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password size="large" />
          </el-form-item>
          <el-form-item label="验证码" prop="captcha">
            <div class="captcha-row">
              <el-input v-model="form.captcha" placeholder="请输入计算结果" size="large" class="captcha-input" />
              <div class="captcha-canvas" @click="refreshCaptcha" title="点击刷新验证码">
                <canvas ref="captchaCanvas" width="120" height="40"></canvas>
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
            <el-button type="primary" :loading="loading" :disabled="!form.privacy" class="auth-submit-btn" native-type="submit">登录</el-button>
          </el-form-item>
        </el-form>
        <div class="auth-form-footer">
          还没有账号？<router-link to="/register" class="auth-link">立即注册</router-link>
        </div>
      </div>
    </div>
    <!-- 隐私政策弹窗 -->
    <el-dialog v-model="privacyVisible" title="新义聚合平台隐私政策" width="560px" :close-on-click-modal="true" class="privacy-dialog">
      <div class="privacy-content">
        <h4>一、信息收集</h4>
        <p>我们收集您在注册和使用过程中主动提供的信息，包括邮箱、公司名称、联系人、联系电话等，用于账号创建和平台服务提供。</p>
        <h4>二、信息使用</h4>
        <p>收集的信息仅用于：提供广告聚合管理服务、改善用户体验、安全防护与反欺诈、法律法规要求的信息披露。</p>
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

// 验证码相关
const captchaAnswer = ref(0);

const generateCaptcha = () => {
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, result: number;
  if (op === '+') {
    a = Math.floor(Math.random() * 50) + 1;
    b = Math.floor(Math.random() * 50) + 1;
    result = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 50) + 10;
    b = Math.floor(Math.random() * a);
    result = a - b;
  } else {
    a = Math.floor(Math.random() * 12) + 1;
    b = Math.floor(Math.random() * 12) + 1;
    result = a * b;
  }
  return { text: `${a} ${op} ${b} = ?`, answer: result };
};

const drawCaptcha = () => {
  const canvas = captchaCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const captcha = generateCaptcha();
  captchaAnswer.value = captcha.answer;

  // 背景
  ctx.fillStyle = '#EFF6FF';
  ctx.fillRect(0, 0, 120, 40);

  // 干扰线
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 120, Math.random() * 40);
    ctx.lineTo(Math.random() * 120, Math.random() * 40);
    ctx.strokeStyle = `rgba(37,99,235,${0.12 + Math.random() * 0.12})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 干扰点
  for (let i = 0; i < 25; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 120, Math.random() * 40, 1, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(37,99,235,${0.15 + Math.random() * 0.15})`;
    ctx.fill();
  }

  // 文字
  ctx.font = 'bold 17px "PingFang SC", "Helvetica Neue", monospace';
  ctx.fillStyle = '#1E293B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(captcha.text, 60, 21);
};

const refreshCaptcha = () => {
  form.captcha = '';
  drawCaptcha();
};

const showPrivacy = () => {
  privacyVisible.value = true;
};

const form = reactive({ email: '', password: '', captcha: '', privacy: false });

const validateCaptcha = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入验证码'));
  } else if (Number(value) !== captchaAnswer.value) {
    callback(new Error('验证码错误'));
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
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, validator: validateCaptcha, trigger: 'blur' }],
  privacy: [{ validator: validatePrivacy, trigger: 'change' }],
};

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    await userStore.login(form.email, form.password);
    ElMessage.success('登录成功');
    router.push('/dashboard');
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
