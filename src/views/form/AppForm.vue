<template>
  <div class="page-shell page-form-shell">
    <!-- Form Header（sticky 顶部） -->
    <header class="page-form-header">
      <button class="page-back" @click="onBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <div class="page-form-header-titles">
        <h1 class="page-form-header-title">
          <span>{{ isEdit ? '编辑应用' : '创建应用' }}</span>
          <el-tag v-if="isEdit" type="warning" effect="light" size="small">编辑模式</el-tag>
        </h1>
        <p class="page-form-header-subtitle">
          {{ isEdit ? '修改应用信息，保存后立即生效' : '填写以下信息以创建一个新应用' }}
        </p>
      </div>
      <div class="page-form-header-actions">
        <el-button :icon="RefreshLeft" @click="onReset">重置</el-button>
      </div>
    </header>

    <!-- Form Body -->
    <div class="page-form-body">
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-position="top"
        @submit.prevent
      >
        <!-- 区块 1：基础信息 -->
        <section class="page-form-section">
          <div class="page-form-section-header">
            <h2 class="page-form-section-title">
              <el-icon><InfoFilled /></el-icon>
              <span>基础信息</span>
              <span class="page-form-section-count">(3 项必填)</span>
            </h2>
          </div>
          <p class="page-form-section-desc">应用的基本资料，包括名称、包名和图标</p>

          <div class="page-form-grid">
            <el-form-item label="应用图标" prop="icon" class="span-2">
              <div class="app-icon-uploader">
                <div class="app-icon-box" :class="{ 'has-icon': !!form.iconUrl, 'is-error': !!iconError }">
                  <img
                    v-if="form.iconUrl"
                    :src="form.iconUrl"
                    alt="icon"
                    class="app-icon-image"
                    @error="onIconPreviewError"
                  />
                  <div v-else class="app-icon-empty">
                    <el-icon :size="24"><Picture /></el-icon>
                  </div>
                  <div v-if="form.iconUploading" class="app-icon-loading">
                    <el-icon class="is-loading" :size="20"><Loading /></el-icon>
                  </div>
                </div>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  style="display:none"
                  @change="onFileInputChange"
                />
                <div class="app-icon-actions">
                  <el-button type="primary" plain :loading="form.iconUploading" @click="triggerFilePicker">
                    <el-icon :size="14"><Upload /></el-icon>
                    <span style="margin-left:4px">{{ form.iconUrl ? '更换图标' : '上传图标' }}</span>
                  </el-button>
                  <el-button v-if="form.iconUrl" link type="danger" :disabled="form.iconUploading" @click="clearIcon">
                    <el-icon :size="14"><Delete /></el-icon>
                    <span style="margin-left:4px">移除</span>
                  </el-button>
                </div>
              </div>
              <div class="form-help">支持 JPG / PNG 格式，建议 1:1 比例，单张 ≤ 200KB</div>
              <div v-if="iconError" class="form-error">
                <el-icon :size="12"><WarningFilled /></el-icon>
                <span>{{ iconError }}</span>
              </div>
            </el-form-item>

            <el-form-item label="应用名称" prop="app_name">
              <template #label>
                <span class="required-mark">*</span>
                <span>应用名称</span>
              </template>
              <el-input v-model="form.app_name" placeholder="请输入应用名称（最多 50 字）" maxlength="50" show-word-limit clearable />
            </el-form-item>

            <el-form-item label="应用包名" prop="package_name">
              <template #label>
                <span class="required-mark">*</span>
                <span>应用包名</span>
              </template>
              <el-input v-model="form.package_name" placeholder="Android：com.xxx.app / iOS：Bundle ID" clearable />
            </el-form-item>
          </div>
        </section>

        <!-- 区块 2：平台与对接 -->
        <section class="page-form-section">
          <div class="page-form-section-header">
            <h2 class="page-form-section-title">
              <el-icon><Cellphone /></el-icon>
              <span>平台与对接</span>
            </h2>
            <span class="page-form-section-tag">注册时锁定</span>
          </div>

          <div class="page-form-grid">
            <el-form-item label="系统平台" prop="platform">
              <template #label>
                <span class="required-mark">*</span>
                <span>系统平台</span>
              </template>
              <el-radio-group v-model="form.platform">
                <el-radio-button :value="1">Android</el-radio-button>
                <el-radio-button :value="2">iOS</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="对接方式">
              <div class="locked-access-type">
                <el-tag :type="userAccessType === 1 ? 'primary' : 'success'" size="default" effect="light">
                  {{ userAccessType === 1 ? 'SDK 对接' : 'API 对接' }}
                </el-tag>
                <span class="locked-tip">注册时已锁定</span>
              </div>
            </el-form-item>
          </div>
        </section>

        <!-- 区块 3：分类与超时 -->
        <section class="page-form-section">
          <div class="page-form-section-header">
            <h2 class="page-form-section-title">
              <el-icon><Setting /></el-icon>
              <span>分类与超时</span>
            </h2>
          </div>

          <div class="page-form-grid">
            <el-form-item label="应用分类" prop="category">
              <el-select v-model="form.category" placeholder="请选择分类" clearable style="width: 100%">
                <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item label="请求超时（ms）" prop="timeout_ms">
              <el-input-number
                v-model="form.timeout_ms"
                :min="100"
                :max="60000"
                :step="100"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
            <el-form-item label="应用商店地址" prop="store_url" class="span-2">
              <el-input v-model="form.store_url" placeholder="如：https://apps.apple.com/cn/app/xxx 或应用宝/华为市场等" clearable />
            </el-form-item>
          </div>
        </section>

        <!-- 区块 4：微信配置（仅 SDK 接入） -->
        <section v-if="userAccessType === 1" class="page-form-section">
          <div class="page-form-section-header">
            <h2 class="page-form-section-title">
              <el-icon><ChatDotRound /></el-icon>
              <span>微信分享配置</span>
            </h2>
            <span class="page-form-section-tag">仅 SDK 对接时显示</span>
          </div>

          <div class="page-form-grid">
            <el-form-item label="微信 APP ID" prop="wechat_app_id">
              <el-input v-model="form.wechat_app_id" placeholder="请输入微信开放平台申请的 APP ID" maxlength="32" show-word-limit clearable />
            </el-form-item>
            <el-form-item v-if="form.platform === 2" label="微信 Universal Link" prop="wechat_universal_link">
              <el-input v-model="form.wechat_universal_link" placeholder="https://yourdomain.com/uni-link/" clearable />
              <div class="form-help">iOS 微信分享必填，需以 https:// 开头</div>
            </el-form-item>
          </div>
        </section>
      </el-form>
    </div>

    <!-- Form Footer（sticky 底部） -->
    <footer class="page-form-footer">
      <div class="page-form-footer-left">
        <el-icon><InfoFilled /></el-icon>
        <span>带 * 为必填项</span>
      </div>
      <div class="page-form-footer-right">
        <el-button :icon="ArrowLeft" @click="onBack">取消</el-button>
        <el-button type="primary" :loading="submitting" :icon="Check" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '创建应用' }}
        </el-button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import request from '../../utils/request';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { ArrowLeft, Check, RefreshLeft, InfoFilled, Cellphone, ChatDotRound, Setting, Picture, Delete, Loading, Upload, WarningFilled } from '@element-plus/icons-vue';
import { useUserStore } from '../../stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const isEdit = computed(() => !!route.params.id);
const userAccessType = computed(() => userStore.userInfo?.accessType ?? 1);

const formRef = ref<FormInstance | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const submitting = ref(false);
const iconError = ref('');
const categories = ['工具', '社交', '娱乐', '教育', '游戏', '新闻', '生活', '其他'];

const form = reactive({
  app_name: '',
  package_name: '',
  platform: 1,
  category: '',
  timeout_ms: 5000,
  store_url: '',
  iconUrl: '',
  iconUploading: false,
  wechat_app_id: '',
  wechat_universal_link: '',
});

const formRules: FormRules = {
  app_name: [
    { required: true, message: '请输入应用名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度 2-50 字符', trigger: 'blur' },
  ],
  package_name: [
    { required: true, message: '请输入应用包名', trigger: 'blur' },
  ],
  platform: [
    { required: true, message: '请选择系统平台', trigger: 'change' },
  ],
  category: [
    { required: true, message: '请选择应用分类', trigger: 'change' },
  ],
};

function onBack() {
  if (router.options.history.state?.back) {
    router.back();
  } else {
    router.push('/app');
  }
}

function onReset() {
  if (isEdit.value) {
    loadEditData();
  } else {
    form.app_name = '';
    form.package_name = '';
    form.platform = 1;
    form.category = '';
    form.timeout_ms = 5000;
    form.store_url = '';
    form.iconUrl = '';
    form.wechat_app_id = '';
    form.wechat_universal_link = '';
    iconError.value = '';
  }
  formRef.value?.clearValidate();
}

function triggerFilePicker() {
  fileInputRef.value?.click();
}

async function onFileInputChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  if (file.size > 200 * 1024) {
    iconError.value = '图标大小不能超过 200KB';
    target.value = '';
    return;
  }
  iconError.value = '';
  form.iconUploading = true;
  try {
    // 简化：直接 base64 预览
    const reader = new FileReader();
    reader.onload = () => {
      form.iconUrl = reader.result as string;
      form.iconUploading = false;
    };
    reader.readAsDataURL(file);
  } catch (e) {
    form.iconUploading = false;
    iconError.value = '图标读取失败';
  }
  target.value = '';
}

function clearIcon() {
  form.iconUrl = '';
}

function onIconPreviewError() {
  iconError.value = '图标预览失败';
}

async function loadEditData() {
  if (!isEdit.value) return;
  const id = route.params.id as string;
  try {
    const res: any = await request.get(`/api/v1/console/app/${id}`);
    if (res.code === 0) {
      const d = res.data;
      form.app_name = d.app_name;
      form.package_name = d.package_name;
      form.platform = d.platform;
      form.category = d.category;
      form.timeout_ms = d.timeout_ms;
      form.store_url = d.store_url || '';
      form.iconUrl = d.icon_url || '';
      form.wechat_app_id = d.wechat_app_id || '';
      form.wechat_universal_link = d.wechat_universal_link || '';
    }
  } catch (e) {
    ElMessage.error('加载应用详情失败');
  }
}

async function handleSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    const payload = {
      app_name: form.app_name,
      package_name: form.package_name,
      platform: form.platform,
      category: form.category,
      timeout_ms: form.timeout_ms,
      store_url: form.store_url,
      icon_url: form.iconUrl,
      wechat_app_id: form.wechat_app_id,
      wechat_universal_link: form.wechat_universal_link,
    };
    let res: any;
    if (isEdit.value) {
      res = await request.put(`/api/v1/console/app/${route.params.id}`, payload);
    } else {
      res = await request.post('/api/v1/console/app', payload);
    }
    if (res.code === 0) {
      ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
      router.push('/app');
    } else {
      ElMessage.error(res.message || '操作失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败');
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadEditData();
});

watch(() => route.params.id, () => {
  if (isEdit.value) loadEditData();
});
</script>
