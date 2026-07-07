<template>
  <div class="auth-page">
    <!-- 左侧品牌区 -->
    <div class="auth-hero">
      <div class="auth-hero-bg">
        <div class="hero-grid"></div>
        <div class="hero-glow hero-glow-1"></div>
        <div class="hero-glow hero-glow-2"></div>
      </div>
      <div class="auth-hero-content">
        <div class="hero-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="rgba(255,255,255,0.15)"/>
            <path d="M12 18L21 12L36 21V33L21 42L12 36V18Z" fill="white" fill-opacity="0.95"/>
            <path d="M21 12V24M21 24L36 21M21 24V42" stroke="rgba(37,99,235,0.6)" stroke-width="1.5"/>
          </svg>
        </div>
        <h2 class="hero-heading">广告SDK聚合平台</h2>
        <p class="hero-desc">一站式广告源管理与流量变现解决方案<br/>精准配置 · 智能分发 · 数据驱动</p>
        <div class="hero-features">
          <div class="hero-feature">
            <span class="feature-dot"></span>
            <span>多广告源统一管理</span>
          </div>
          <div class="hero-feature">
            <span class="feature-dot"></span>
            <span>瀑布流策略精细化配置</span>
          </div>
          <div class="hero-feature">
            <span class="feature-dot"></span>
            <span>实时数据看板与对账</span>
          </div>
        </div>
      </div>
      <div class="auth-hero-footer">
        <span>&copy; 2026 AdSDK Platform</span>
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
          <el-form-item class="auth-form-actions">
            <el-button type="primary" :loading="loading" class="auth-submit-btn" native-type="submit">登录</el-button>
          </el-form-item>
        </el-form>
        <div class="auth-form-footer">
          还没有账号？<router-link to="/register" class="auth-link">立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({ email: '', password: '' });

const rules: FormRules = {
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
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
</script>
