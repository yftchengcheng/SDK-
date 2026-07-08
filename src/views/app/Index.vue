<template>
  <div class="page-container">
    <div class="page-header">
      <h1>应用管理</h1>
      <el-button type="primary" @click="openCreateDialog">创建应用</el-button>
    </div>
    <!-- Table -->
    <div class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column label="图标" width="72" align="center">
          <template #default="{ row }">
            <div class="app-icon-cell">
              <img
                v-if="row.iconUrlResolved"
                :src="row.iconUrlResolved"
                :alt="row.app_name"
                class="app-icon-thumb"
                @error="onIconThumbError"
              />
              <div
                v-else
                class="app-icon-default"
                :class="{ 'app-icon-default-placeholder': !row.iconUrlResolved }"
              >
                <el-icon :size="18"><Picture /></el-icon>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="app_name" label="应用名称" min-width="140" />
        <el-table-column prop="app_key" label="应用TOKEN" min-width="200">
          <template #default="{ row }">
            <span class="text-primary">{{ row.app_key }}</span>
            <el-icon class="copy-btn" @click="copyText(row.app_key)"><CopyDocument /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="platform" label="系统" width="80">
          <template #default="{ row }">{{ row.platform === 1 ? 'Android' : 'iOS' }}</template>
        </el-table-column>
        <el-table-column label="对接方式" width="100">
          <template #default="{ row }">
            <el-tag :type="row.access_type === 1 ? 'primary' : 'success'" size="small">
              {{ row.access_type === 1 ? 'SDK' : 'API' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="package_name" label="包名" min-width="160" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="timeout_ms" label="超时(ms)" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
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
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next" @change="fetchList" />
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="isEdit ? '编辑应用' : '创建应用'"
      width="640px"
      destroy-on-close
      :close-on-click-modal="false"
      class="app-form-dialog"
      align-center
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" class="app-form">
        <!-- 区块：基础信息 -->
        <div class="form-section">
          <div class="form-section-title">基础信息</div>

          <el-form-item label="应用图标" prop="icon" class="app-form-item-icon">
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
              <div class="app-icon-tip">
                支持 JPG / PNG 格式，建议 1:1 比例，单张 ≤ 200KB
              </div>
              <div v-if="iconError" class="app-icon-error">
                <el-icon :size="12"><WarningFilled /></el-icon>
                <span style="margin-left:4px">{{ iconError }}</span>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="应用名称" prop="app_name" class="app-form-item">
            <el-input v-model="form.app_name" placeholder="请输入应用名称（最多 50 字）" maxlength="50" show-word-limit clearable />
          </el-form-item>

          <el-form-item label="应用包名" prop="package_name" class="app-form-item">
            <el-input v-model="form.package_name" placeholder="Android：com.xxx.app / iOS：Bundle ID" clearable />
          </el-form-item>
        </div>

        <!-- 区块：平台与对接 -->
        <div class="form-section">
          <div class="form-section-title">平台与对接</div>

          <div class="form-row">
            <el-form-item label="系统平台" prop="platform" class="form-row-half app-form-item">
              <el-radio-group v-model="form.platform" class="platform-radio">
                <el-radio-button :value="1">Android</el-radio-button>
                <el-radio-button :value="2">iOS</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="对接方式" class="form-row-half app-form-item">
              <div class="locked-access-type">
                <el-tag :type="userAccessType === 1 ? 'primary' : 'success'" size="default" effect="light">
                  {{ userAccessType === 1 ? 'SDK 对接' : 'API 对接' }}
                </el-tag>
                <span class="locked-tip">注册时已锁定</span>
              </div>
            </el-form-item>
          </div>
        </div>

        <!-- 区块：分类与超时 -->
        <div class="form-section">
          <div class="form-section-title">分类与超时</div>

          <div class="form-row">
            <el-form-item label="应用分类" prop="category" class="form-row-half app-form-item">
              <el-select v-model="form.category" placeholder="请选择分类" clearable style="width: 100%">
                <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item label="请求超时（ms）" prop="timeout_ms" class="form-row-half app-form-item">
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

          <el-form-item label="应用商店地址" prop="store_url" class="app-form-item">
            <el-input v-model="form.store_url" placeholder="如：https://apps.apple.com/cn/app/xxx 或应用宝/华为市场等" clearable />
          </el-form-item>
        </div>

        <!-- 区块：微信配置（仅 SDK 接入时显示） -->
        <div v-if="userAccessType === 1" class="form-section">
          <div class="form-section-title">微信分享配置</div>

          <el-form-item label="微信 APP ID" prop="wechat_app_id" class="app-form-item">
            <el-input v-model="form.wechat_app_id" placeholder="请输入微信开放平台申请的 APP ID" maxlength="32" show-word-limit clearable />
          </el-form-item>

          <el-form-item v-if="form.platform === 2" label="微信 Universal Link" prop="wechat_universal_link" class="app-form-item">
            <el-input v-model="form.wechat_universal_link" placeholder="https://yourdomain.com/uni-link/" clearable />
            <div class="form-item-hint">iOS 微信分享必填，需以 https:// 开头</div>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">{{ isEdit ? '保存' : '创建' }}</el-button>
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
import { CopyDocument, Plus, Picture, Delete, Refresh, Loading } from '@element-plus/icons-vue';
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
  iconUploading: boolean;
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
  iconUploading: false,
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

const formatTime = (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '--';

const copyText = (text: string) => {
  navigator.clipboard.writeText(text).then(() => ElMessage.success('已复制'));
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
    // 关键：iconUrlResolved 是后端生成的 7 天预签名 URL；icon_url 是 S3 key（不是 URL，不能直接当 src）
    iconUrl: row.iconUrlResolved || '',
  });
  showCreateDialog.value = true;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
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
        iconUrl: form.iconKey || undefined,
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

// 客户端预检：1:1 比例 + 大小 + 格式
const validateIconClient = (file: File): Promise<{ ok: boolean; width: number; height: number; dataUrl: string }> => {
  return new Promise((resolve) => {
    iconError.value = '';
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const validExts = ['jpg', 'jpeg', 'png'];
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      iconError.value = '仅支持 jpg / jpeg / png 格式';
      ElMessage.error(iconError.value);
      resolve({ ok: false, width: 0, height: 0, dataUrl: '' });
      return;
    }
    if (file.size / 1024 > 200) {
      iconError.value = `图标大小需 ≤ 200KB（当前 ${(file.size / 1024).toFixed(1)}KB）`;
      ElMessage.error(iconError.value);
      resolve({ ok: false, width: 0, height: 0, dataUrl: '' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        if (img.width !== img.height) {
          iconError.value = `图标必须为 1:1 比例，当前为 ${img.width}×${img.height}`;
          ElMessage.error(iconError.value);
          resolve({ ok: false, width: img.width, height: img.height, dataUrl });
          return;
        }
        resolve({ ok: true, width: img.width, height: img.height, dataUrl });
      };
      img.onerror = () => {
        iconError.value = '图标解析失败';
        ElMessage.error(iconError.value);
        resolve({ ok: false, width: 0, height: 0, dataUrl });
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      iconError.value = '文件读取失败';
      ElMessage.error(iconError.value);
      resolve({ ok: false, width: 0, height: 0, dataUrl: '' });
    };
    reader.readAsDataURL(file);
  });
};

// 触发隐藏的 file input
const fileInputRef = ref<HTMLInputElement | null>(null);
function triggerFilePicker() {
  fileInputRef.value?.click();
}

// 处理 file input change
async function onFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  // 立即清空 value，允许选同一文件再次触发 change
  input.value = '';
  if (!file) return;
  await uploadIconFile(file);
}

// 核心：上传图标文件（本地校验 + 调用后端 upload-icon 接口）
async function uploadIconFile(file: File) {
  const v = await validateIconClient(file);
  if (!v.ok) return;
  form.iconUploading = true;
  try {
    const resp = await request.post<{ code: number; data?: { key?: string; iconUrl?: string }; message?: string }>(
      '/api/v1/console/app/upload-icon',
      { dataUrl: v.dataUrl, width: v.width, height: v.height }
    );
    const key = resp.data?.key;
    if (!key) throw new Error('后端未返回 key');
    form.iconKey = key;
    form.iconUrl = resp.data?.iconUrl || v.dataUrl;
    iconError.value = '';
    ElMessage.success('图标上传成功');
  } catch (e) {
    iconError.value = e instanceof Error ? e.message : '图标上传失败';
    ElMessage.error(iconError.value);
  } finally {
    form.iconUploading = false;
  }
}

// 兼容旧 el-upload 钩子（虽然不再使用，但保留签名便于将来切换）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleIconChange(uploadFile: { raw?: File }) {
  if (uploadFile?.raw) {
    void uploadIconFile(uploadFile.raw);
  }
}

const clearIcon = () => {
  form.iconKey = '';
  form.iconUrl = '';
  iconError.value = '';
};

// 图片加载失败处理（预签名 URL 过期 / TOS 404）：用 fallback 占位
function onIconPreviewError(event: Event) {
  const img = event.target as HTMLImageElement;
  iconError.value = '图标链接已过期，请重新上传';
  form.iconUrl = '';
  img.src = '';
}

function onIconThumbError(event: Event) {
  const img = event.target as HTMLImageElement;
  // 列表缩略图：隐藏 img 节点，让 .app-icon-default 占位浮现
  img.style.display = 'none';
  const placeholder = img.parentElement?.querySelector('.app-icon-default-placeholder') as HTMLElement | null;
  if (placeholder) placeholder.style.display = 'flex';
}

onMounted(fetchList);

</script>
