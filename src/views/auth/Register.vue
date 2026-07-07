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
          <h1 class="auth-form-title">创建账号</h1>
          <p class="auth-form-subtitle">注册广告SDK聚合平台</p>
        </div>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleRegister" class="auth-form">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" size="large" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="8-20位，包含字母和数字" show-password size="large" />
          </el-form-item>
          <div class="auth-form-row">
            <el-form-item label="公司名称" prop="company" class="auth-form-row-item">
              <el-input v-model="form.company" placeholder="请输入公司名称" size="large" />
            </el-form-item>
            <el-form-item label="联系人" prop="contactName" class="auth-form-row-item">
              <el-input v-model="form.contactName" placeholder="请输入联系人" size="large" />
            </el-form-item>
          </div>
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入手机号" size="large" />
          </el-form-item>
          <el-form-item label="接入方式" prop="accessType">
            <el-radio-group v-model="form.accessType">
              <el-radio :value="1">SDK接入</el-radio>
              <el-radio :value="2">API接入</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item class="auth-form-actions">
            <el-button type="primary" :loading="loading" class="auth-submit-btn" native-type="submit">注册</el-button>
          </el-form-item>
        </el-form>
        <div class="auth-form-footer">
          已有账号？<router-link to="/login" class="auth-link">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import request from '../../utils/request';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  email: '',
  password: '',
  company: '',
  contactName: '',
  phone: '',
  accessType: 1,
});

const rules: FormRules = {
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度为8-20位', trigger: 'blur' },
  ],
  company: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
};

const handleRegister = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    await request.post('/api/v1/auth/register', form);
    ElMessage.success('注册成功，请登录');
    router.push('/login');
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false;
  }
};
</script>
