<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">广告SDK聚合平台</h1>
      <p class="login-subtitle">登录管理控制台</p>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" native-type="submit">登录</el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        还没有账号？<router-link to="/register" class="text-link">立即注册</router-link>
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

<style scoped>
.login-page {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F9FAFB;
}
.login-card {
  width: 400px;
  background: #FFFFFF;
  border-radius: 8px;
  padding: 40px 32px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.login-title {
  font: var(--fs-page-title);
  color: #111827;
  text-align: center;
  margin-bottom: 8px;
}
.login-subtitle {
  font: var(--fs-body);
  color: #6B7280;
  text-align: center;
  margin-bottom: 24px;
}
.login-footer {
  text-align: center;
  font: var(--fs-body);
  color: #6B7280;
  margin-top: 16px;
}
</style>
