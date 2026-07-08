<template>
  <div class="page-container page-app">
    <!-- 顶部 Header -->
    <div class="page-header">
      <div>
        <h1>应用管理</h1>
        <div class="page-subtitle">管理你的移动应用，配置 SDK 接入参数</div>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">创建应用</el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column label="图标" width="80" align="center">
          <template #default="{ row }">
            <div class="app-icon-cell">
              <img v-if="row.iconUrlResolved" :src="row.iconUrlResolved" :alt="row.app_name" class="app-icon-thumb" />
              <div v-else class="app-icon-default">
                <el-icon :size="18"><Picture /></el-icon>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="app_name" label="应用名称" min-width="160">
          <template #default="{ row }">
            <div class="app-name-cell">
              <span class="app-name-text">{{ row.app_name }}</span>
              <span class="app-package-text">{{ row.package_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="app_key" label="应用 TOKEN" min-width="220">
          <template #default="{ row }">
            <div class="app-key-cell">
              <code class="app-key-text">{{ row.app_key }}</code>
              <el-icon class="copy-btn" @click="copyText(row.app_key)"><CopyDocument /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="系统" width="90">
          <template #default="{ row }">
            <el-tag :type="row.platform === 1 ? 'primary' : 'success'" size="small" effect="light" round>
              <el-icon style="margin-right: 4px; vertical-align: -2px">
                <component :is="row.platform === 1 ? 'Cellphone' : 'Iphone'" />
              </el-icon>
              {{ row.platform === 1 ? 'Android' : 'iOS' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="接入方式" width="100">
          <template #default="{ row }">
            <el-tag :type="row.access_type === 1 ? 'primary' : 'success'" size="small" effect="plain">
              {{ row.access_type === 1 ? 'SDK' : 'API' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="90">
          <template #default="{ row }">
            <span v-if="row.category" class="category-text">{{ row.category }}</span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <span :class="['status-dot', row.status === 1 ? 'on' : 'off']">
              <span class="dot" />
              {{ row.status === 1 ? '已启用' : '已禁用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button link :type="row.status === 1 ? 'warning' : 'success'" size="small" @click="handleToggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @change="fetchList"
        />
      </div>
    </div>

    <!-- 创建/编辑应用 Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="isEdit ? '编辑应用' : '创建新应用'"
      width="640px"
      destroy-on-close
      :close-on-click-modal="false"
      class="app-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-position="top"
        class="app-form"
        @submit.prevent
      >
        <!-- SECTION 1：基础信息 -->
        <div class="form-section">
          <div class="form-section-header">
            <div class="form-section-title">
              <span class="form-section-index">01</span>
              <span>基础信息</span>
            </div>
            <div class="form-section-tip">应用图标会展示在控制台和报表中</div>
          </div>

          <!-- 应用图标（自定义上传：纯 input + 完整预览） -->
          <div class="form-row form-row-icon">
            <div class="form-label">
              应用图标
              <span class="form-label-required">*</span>
            </div>
            <div class="form-icon-area">
              <div
                class="app-icon-uploader"
                :class="{ 'is-loading': iconUploading, 'has-error': iconError }"
              >
                <!-- 预览/占位区 -->
                <div
                  v-if="form.iconUrl"
                  class="app-icon-preview"
                  @click="triggerFileInput"
                >
                  <img :src="form.iconUrl" alt="icon" />
                  <div v-if="iconUploading" class="app-icon-uploading">
                    <el-icon class="is-loading"><Loading /></el-icon>
                  </div>
                  <div v-else class="app-icon-mask">
                    <el-icon><Camera /></el-icon>
                    <span>更换</span>
                  </div>
                </div>
                <div
                  v-else
                  class="app-icon-placeholder"
                  @click="triggerFileInput"
                >
                  <el-icon v-if="!iconUploading" :size="22"><Plus /></el-icon>
                  <el-icon v-else class="is-loading" :size="22"><Loading /></el-icon>
                  <span class="placeholder-text">{{ iconUploading ? '上传中...' : '点击上传' }}</span>
                </div>

                <!-- 提示区 -->
                <div class="app-icon-meta">
                  <div class="meta-row">
                    <el-icon class="meta-icon"><InfoFilled /></el-icon>
                    <span>支持 JPG / PNG 格式，1:1 方形，≤ 200KB</span>
                  </div>
                  <div v-if="iconError" class="meta-row meta-error">
                    <el-icon class="meta-icon"><WarningFilled /></el-icon>
                    <span>{{ iconError }}</span>
                  </div>
                  <div v-else-if="form.iconKey" class="meta-row meta-success">
                    <el-icon class="meta-icon"><CircleCheckFilled /></el-icon>
                    <span>图标已上传 · {{ form.iconSize }}</span>
                  </div>
                  <div v-else class="meta-row meta-hint">
                    <el-icon class="meta-icon"><Promotion /></el-icon>
                    <span>建议尺寸 256×256，浅色背景适配更好</span>
                  </div>
                </div>
              </div>

              <!-- 隐藏的 file input -->
              <input
                ref="fileInputRef"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                style="display: none"
                @change="onFileInputChange"
              />
            </div>
          </div>

          <!-- 应用名称 + 包名 -->
          <div class="form-row form-row-2col">
            <el-form-item label="应用名称" prop="app_name" class="form-col">
              <el-input
                v-model="form.app_name"
                placeholder="例如：开心消消乐"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="应用包名" prop="package_name" class="form-col">
              <el-input
                v-model="form.package_name"
                placeholder="com.xxx.app"
              />
            </el-form-item>
          </div>

          <!-- 系统 + 接入方式 -->
          <div class="form-row form-row-2col">
            <el-form-item label="系统平台" prop="platform" class="form-col">
              <el-radio-group v-model="form.platform">
                <el-radio-button :value="1">
                  <el-icon style="margin-right: 4px; vertical-align: -2px"><Cellphone /></el-icon>
                  Android
                </el-radio-button>
                <el-radio-button :value="2">
                  <el-icon style="margin-right: 4px; vertical-align: -2px"><Iphone /></el-icon>
                  iOS
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="接入方式" class="form-col">
              <div class="locked-access-type">
                <el-tag :type="userAccessType === 1 ? 'primary' : 'success'" effect="plain" round>
                  {{ userAccessType === 1 ? 'SDK 接入' : 'API 接入' }}
                </el-tag>
                <el-tooltip content="注册时已锁定，不可修改" placement="top">
                  <el-icon class="lock-icon"><Lock /></el-icon>
                </el-tooltip>
              </div>
            </el-form-item>
          </div>
        </div>

        <!-- SECTION 2：分类与配置 -->
        <div class="form-section">
          <div class="form-section-header">
            <div class="form-section-title">
              <span class="form-section-index">02</span>
              <span>分类与配置</span>
            </div>
            <div class="form-section-tip">便于在报表中筛选和统计</div>
          </div>

          <div class="form-row form-row-2col">
            <el-form-item label="应用分类" prop="category" class="form-col">
              <el-select v-model="form.category" placeholder="请选择分类" clearable style="width: 100%">
                <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item label="请求超时 (ms)" prop="timeout_ms" class="form-col">
              <el-input-number
                v-model="form.timeout_ms"
                :min="100"
                :max="60000"
                :step="100"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </div>

          <div class="form-row form-row-1col">
            <el-form-item label="应用商店地址" prop="store_url">
              <el-input
                v-model="form.store_url"
                placeholder="如：https://apps.apple.com/cn/app/xxx 或应用宝/华为市场等"
                clearable
              />
            </el-form-item>
          </div>
        </div>

        <!-- SECTION 3：微信配置（仅 SDK 接入） -->
        <template v-if="userAccessType === 1">
          <div class="form-section">
            <div class="form-section-header">
              <div class="form-section-title">
                <span class="form-section-index">03</span>
                <span>微信配置</span>
                <el-tag size="small" type="warning" effect="plain" round>SDK 必填</el-tag>
              </div>
              <div class="form-section-tip">用于微信登录/支付/分享</div>
            </div>

            <div class="form-row form-row-1col">
              <el-form-item label="微信 APP ID" prop="wechat_app_id">
                <el-input
                  v-model="form.wechat_app_id"
                  placeholder="请输入微信开放平台申请的 APP ID"
                  maxlength="32"
                  show-word-limit
                />
                <div class="form-item-hint">在微信开放平台 (open.weixin.qq.com) 注册应用后获得</div>
              </el-form-item>
            </div>

            <div v-if="form.platform === 2" class="form-row form-row-1col">
              <el-form-item label="微信 Universal Link" prop="wechat_universal_link">
                <el-input
                  v-model="form.wechat_universal_link"
                  placeholder="https://yourdomain.com/uni-link/"
                />
                <div class="form-item-hint">iOS 14+ 必须以 https:// 开头，需在微信开放平台配置</div>
              </el-form-item>
            </div>
          </div>
        </template>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '立即创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import request from '../../utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  Plus,
  Picture,
  CopyDocument,
  Cellphone,
  Iphone,
  Camera,
  Loading,
  Lock,
  InfoFilled,
  WarningFilled,
  CircleCheckFilled,
  Promotion,
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { useUserStore } from '../../stores/user';

const userStore = useUserStore();
const userAccessType = computed<number>(() => userStore.userInfo?.accessType ?? 1);

const categories = ['游戏', '工具', '社交', '电商', '教育', '娱乐', '新闻', '其他'];
const loading = ref(false);
const tableData = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const showCreateDialog = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const isEdit = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const iconUploading = ref(false);

const defaultForm = (): {
  app_key: string;
  app_name: string;
  package_name: string;
  platform: 1 | 2;
  category: string;
  timeout_ms: number;
  store_url: string;
  wechat_app_id: string;
  wechat_universal_link: string;
  iconKey: string;
  iconUrl: string;
  iconSize: string;
} => ({
  app_key: '',
  app_name: '',
  package_name: '',
  platform: 1,
  category: '',
  timeout_ms: 1000,
  store_url: '',
  wechat_app_id: '',
  wechat_universal_link: '',
  iconKey: '',
  iconUrl: '',
  iconSize: '',
});

const form = reactive(defaultForm());
const iconError = ref('');

const formRules = computed<FormRules>(() => ({
  app_name: [
    { required: true, message: '请输入应用名称', trigger: 'blur' },
    { max: 50, message: '最多 50 个字符', trigger: 'blur' },
  ],
  package_name: [
    { required: true, message: '请输入应用包名', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_.-]*$/, message: '包名格式不正确（字母开头，可含字母数字 . _ -）', trigger: 'blur' },
  ],
  platform: [{ required: true, message: '请选择系统', trigger: 'change' }],
  timeout_ms: [{ required: true, message: '请输入超时时间', trigger: 'blur' }],
  store_url: [
    {
      validator: (_r: unknown, v: string, cb: (e?: Error) => void) => {
        if (!v) return cb();
        if (!/^https?:\/\//i.test(v)) return cb(new Error('请输入合法的 URL（http/https 开头）'));
        cb();
      },
      trigger: 'blur',
    },
  ],
  wechat_app_id: userAccessType.value === 1
    ? [
        { required: true, message: 'SDK 接入必须填写微信 APP ID', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_]{1,32}$/, message: '微信 APP ID 格式不正确（字母数字下划线）', trigger: 'blur' },
      ]
    : [],
  wechat_universal_link: (userAccessType.value === 1 && form.platform === 2)
    ? [
        { required: true, message: 'iOS + SDK 接入必须填写微信 Universal Link', trigger: 'blur' },
        {
          validator: (_r: unknown, v: string, cb: (e?: Error) => void) => {
            if (!v) return cb();
            if (!/^https:\/\//i.test(v)) return cb(new Error('Universal Link 必须以 https:// 开头'));
            cb();
          },
          trigger: 'blur',
        },
      ]
    : [],
}));

const formatTime = (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '--';

const copyText = (text: string) => {
  navigator.clipboard.writeText(text).then(() => ElMessage.success('已复制到剪贴板'));
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res: any = await request.get('/api/v1/console/app/list', { params: { page: page.value, pageSize: pageSize.value } });
    tableData.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } catch { /* ignore */ } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  isEdit.value = false;
  Object.assign(form, defaultForm());
  iconError.value = '';
  showCreateDialog.value = true;
};

const openEditDialog = (row: any) => {
  isEdit.value = true;
  Object.assign(form, defaultForm(), {
    app_key: row.app_key,
    app_name: row.app_name,
    package_name: row.package_name,
    platform: row.platform,
    category: row.category || '',
    timeout_ms: row.timeout_ms ?? 1000,
    store_url: row.store_url || '',
    wechat_app_id: row.wechat_app_id || '',
    wechat_universal_link: row.wechat_universal_link || '',
    iconKey: row.icon_url || '',
    iconUrl: row.iconUrlResolved || row.icon_url || '',
    iconSize: '',
  });
  iconError.value = '';
  showCreateDialog.value = true;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (!isEdit.value && !form.iconKey) {
    ElMessage.error('请先上传应用图标');
    return;
  }
  submitting.value = true;
  try {
    if (isEdit.value) {
      await request.put('/api/v1/console/app/update', {
        appKey: form.app_key,
        appName: form.app_name,
        packageName: form.package_name,
        platform: form.platform,
        category: form.category,
        timeoutMs: form.timeout_ms,
        storeUrl: form.store_url,
        wechatAppId: userAccessType.value === 1 ? form.wechat_app_id : undefined,
        wechatUniversalLink: userAccessType.value === 1 && form.platform === 2 ? form.wechat_universal_link : undefined,
        iconUrl: form.iconKey || undefined,
      });
      ElMessage.success('更新成功');
    } else {
      await request.post('/api/v1/console/app/create', {
        appName: form.app_name,
        packageName: form.package_name,
        platform: form.platform,
        category: form.category,
        timeoutMs: form.timeout_ms,
        storeUrl: form.store_url,
        wechatAppId: form.wechat_app_id,
        wechatUniversalLink: form.wechat_universal_link,
        iconUrl: form.iconKey,
      });
      ElMessage.success('创建成功');
    }
    showCreateDialog.value = false;
    fetchList();
  } catch { /* ignore */ } finally {
    submitting.value = false;
  }
};

const handleToggleStatus = async (row: any) => {
  const newStatus = row.status === 1 ? 2 : 1;
  const action = newStatus === 2 ? '禁用' : '启用';
  await ElMessageBox.confirm(`确定${action}应用"${row.app_name}"吗？`, '提示', { type: 'warning' });
  try {
    await request.put('/api/v1/console/app/toggle-status', { appKey: row.app_key, status: newStatus });
    ElMessage.success(`${action}成功`);
    fetchList();
  } catch { /* ignore */ }
};

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定删除应用"${row.app_name}"吗？此操作不可恢复。`, '警告', { type: 'error' });
  try {
    await request.delete('/api/v1/console/app/delete', { params: { appKey: row.app_key } });
    ElMessage.success('删除成功');
    fetchList();
  } catch { /* ignore */ }
};

// ========== 应用图标：自定义上传交互（完全绕开 el-upload 内部状态） ==========

const triggerFileInput = () => {
  if (iconUploading.value) return;
  fileInputRef.value?.click();
};

const onFileInputChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  // 重要：清空 input.value，否则重复选同一文件不触发 change
  input.value = '';
  if (!file) return;
  await uploadIcon(file);
};

const clearIconError = () => {
  iconError.value = '';
};

const validateIconClient = (file: File): Promise<{ ok: boolean; width: number; height: number; dataUrl: string }> => {
  return new Promise((resolve) => {
    clearIconError();
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const validExts = ['jpg', 'jpeg', 'png'];
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      const msg = '仅支持 jpg / jpeg / png 格式';
      iconError.value = msg;
      ElMessage.error(msg);
      resolve({ ok: false, width: 0, height: 0, dataUrl: '' });
      return;
    }
    if (file.size / 1024 > 200) {
      const msg = `图标大小需 ≤ 200KB（当前 ${(file.size / 1024).toFixed(1)}KB）`;
      iconError.value = msg;
      ElMessage.error(msg);
      resolve({ ok: false, width: 0, height: 0, dataUrl: '' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        if (img.width !== img.height) {
          const msg = `图标必须为 1:1 比例，当前为 ${img.width}×${img.height}`;
          iconError.value = msg;
          ElMessage.error(msg);
          resolve({ ok: false, width: img.width, height: img.height, dataUrl });
          return;
        }
        resolve({ ok: true, width: img.width, height: img.height, dataUrl });
      };
      img.onerror = () => {
        const msg = '图标解析失败，请检查文件是否损坏';
        iconError.value = msg;
        ElMessage.error(msg);
        resolve({ ok: false, width: 0, height: 0, dataUrl });
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      const msg = '文件读取失败';
      iconError.value = msg;
      ElMessage.error(msg);
      resolve({ ok: false, width: 0, height: 0, dataUrl: '' });
    };
    reader.readAsDataURL(file);
  });
};

const uploadIcon = async (file: File) => {
  const v = await validateIconClient(file);
  if (!v.ok) return;

  // 先本地预览（不等服务端），提升 UX
  form.iconUrl = v.dataUrl;
  form.iconSize = `${(file.size / 1024).toFixed(1)}KB · ${v.width}×${v.height}`;
  iconUploading.value = true;

  try {
    const resp: any = await request.post('/api/v1/console/app/upload-icon', {
      dataUrl: v.dataUrl,
      width: v.width,
      height: v.height,
    });
    if (!resp.data?.key) throw new Error('上传失败');
    form.iconKey = resp.data.key;
    // 用服务端签名 URL 替换本地预览（避免 base64 长期占用内存）
    if (resp.data.iconUrl) {
      form.iconUrl = resp.data.iconUrl;
    }
    ElMessage.success('图标上传成功');
  } catch (e) {
    iconError.value = '图标上传失败，请重试';
    // 失败时保留本地预览，让用户看到选了什么图
  } finally {
    iconUploading.value = false;
  }
};

onMounted(() => {
  fetchList();
});
</script>
