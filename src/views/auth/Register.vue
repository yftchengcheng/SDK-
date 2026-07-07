<template>
  <div class="login-page">
    <div class="register-card">
      <div class="login-brand">
        <div class="brand-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#2563EB"/>
            <path d="M8 12L14 8L24 14V22L14 28L8 24V12Z" fill="white" fill-opacity="0.9"/>
            <path d="M14 8V16M14 16L24 14M14 16V28" stroke="#2563EB" stroke-width="1.5"/>
          </svg>
        </div>
        <h1 class="login-title">创建账号</h1>
        <p class="login-subtitle">注册广告SDK聚合平台</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleRegister">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" size="large" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="8-20位，包含字母和数字" show-password size="large" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="公司名称" prop="company" class="form-row-item">
            <el-input v-model="form.company" placeholder="请输入公司名称" size="large" />
          </el-form-item>
          <el-form-item label="联系人" prop="contactName" class="form-row-item">
            <el-input v-model="form.contactName" placeholder="请输入联系人姓名" size="large" />
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
        <el-form-item>
          <el-button type="primary" :loading="loading" class="login-btn" native-type="submit">注册</el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        已有账号？<router-link to="/login" class="text-link">立即登录</router-link>
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
