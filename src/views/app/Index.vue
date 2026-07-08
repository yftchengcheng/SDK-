<template>
  <div class="page-shell">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <el-icon :size="18"><Cellphone /></el-icon>
        </div>
        <div class="page-header-titles">
          <h1 class="page-header-title">应用管理</h1>
          <p class="page-header-subtitle">管理你的 SDK 接入应用，应用创建后用于广告位与数据上报的关联</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button type="primary" :icon="Plus" @click="openCreate">创建应用</el-button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="page-filter">
      <el-form :inline="true" class="page-filter-form" @submit.prevent>
        <el-form-item label="应用名称">
          <el-input v-model="filters.keyword" placeholder="搜索应用名称 / 包名 / AppKey" clearable @keyup.enter="onSearch" />
        </el-form-item>
        <el-form-item label="系统">
          <el-select v-model="filters.platform" placeholder="全部" clearable>
            <el-option label="Android" :value="1" />
            <el-option label="iOS" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
          <el-button :icon="RefreshLeft" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- Table Card -->
    <div class="page-card">
      <el-table v-loading="loading" :data="pagedData" border stripe row-key="appKey">
        <el-table-column prop="appName" label="应用名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="app-cell">
              <img v-if="row.iconUrlResolved || row.icon_url" :src="row.iconUrlResolved || row.icon_url" class="app-cell-icon" alt="" @error="($event.target as HTMLImageElement).style.display='none'" />
              <div v-else class="app-cell-icon-fallback">
                <el-icon :size="16"><Cellphone /></el-icon>
              </div>
              <div class="app-cell-text">
                <div class="app-cell-name">{{ row.appName || row.app_name }}</div>
                <div class="app-cell-key">{{ row.appKey || row.app_key }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="platform" label="平台" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="(row.platform === 1) ? 'primary' : 'success'" effect="light" size="small">
              {{ (row.platform === 1) ? 'Android' : 'iOS' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="packageName" label="包名" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="font-family: 'Fira Code', monospace; font-size: 12px;">{{ row.packageName || row.package_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="(row.status === 1) ? 'success' : 'info'" effect="light" size="small">
              {{ (row.status === 1) ? '已启用' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170" align="center">
          <template #default="{ row }">
            <span class="text-muted">{{ formatTime(row.createdAt || row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="onCopy(row.appKey || row.app_key)">复制 AppKey</el-button>
            <el-button :type="(row.status === 1) ? 'danger' : 'success'" link size="small" @click="onToggleStatus(row)">
              {{ (row.status === 1) ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无应用数据，点击右上角“创建应用”开始接入" />
        </template>
      </el-table>

      <div class="page-pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <!-- Drawer: Create / Edit App（侧边抽屉，保留列表上下文） -->
    <el-drawer
      v-model="drawerVisible"
      :direction="direction"
      :size="drawerSize"
      :with-header="false"
      :destroy-on-close="false"
      :append-to-body="true"
      :modal="true"
      :modal-class="'app-form-drawer-mask'"
      class="app-form-drawer"
    >
      <div class="page-form-shell page-form-drawer-shell">
        <!-- Drawer Header（sticky 顶部） -->
        <header class="page-form-header">
          <div class="page-form-header-titles">
            <h1 class="page-form-header-title">
              <el-icon :size="20" style="color: var(--color-primary-500, #2563EB);">
                <component :is="isEdit ? Edit : Plus" />
              </el-icon>
              <span>{{ isEdit ? '编辑应用' : '创建应用' }}</span>
              <el-tag v-if="isEdit" type="warning" effect="light" size="small">编辑模式</el-tag>
            </h1>
            <p class="page-form-header-subtitle">
              {{ isEdit ? '修改应用信息，保存后立即生效' : '填写以下信息以创建一个新应用' }}
            </p>
          </div>
          <div class="page-form-header-actions">
            <el-button :icon="RefreshLeft" @click="onFormReset">重置</el-button>
            <el-button :icon="Close" circle plain @click="closeDrawer" />
          </div>
        </header>

        <!-- Drawer Body -->
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
                <el-form-item label="应用图标" class="span-2">
                  <div class="app-icon-uploader">
                    <div class="app-icon-box" :class="{ 'has-icon': !!form.iconUrl, 'is-error': !!iconError }">
                      <img v-if="form.iconUrl" :src="form.iconUrl" alt="icon" class="app-icon-image" @error="onIconPreviewError" />
                      <div v-else class="app-icon-empty">
                        <el-icon :size="24"><Picture /></el-icon>
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
                      <el-button type="primary" plain @click="triggerFilePicker">
                        <el-icon :size="14"><Upload /></el-icon>
                        <span style="margin-left:4px">{{ form.iconUrl ? '更换图标' : '上传图标' }}</span>
                      </el-button>
                      <el-button v-if="form.iconUrl" link type="danger" @click="clearIcon">
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

                <el-form-item label="应用名称" prop="appName">
                  <template #label>
                    <span class="required-mark">*</span>
                    <span>应用名称</span>
                  </template>
                  <el-input v-model="form.appName" placeholder="请输入应用名称（最多 50 字）" maxlength="50" show-word-limit clearable />
                </el-form-item>

                <el-form-item label="应用包名" prop="packageName">
                  <template #label>
                    <span class="required-mark">*</span>
                    <span>应用包名</span>
                  </template>
                  <el-input v-model="form.packageName" placeholder="Android：com.xxx.app / iOS：Bundle ID" clearable />
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
                    <el-tag :type="accessType === 1 ? 'primary' : 'success'" size="default" effect="light">
                      {{ accessType === 1 ? 'SDK 对接' : 'API 对接' }}
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
                  <template #label>
                    <span class="required-mark">*</span>
                    <span>应用分类</span>
                  </template>
                  <el-select v-model="form.category" placeholder="请选择分类" clearable style="width: 100%">
                    <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
                  </el-select>
                </el-form-item>
                <el-form-item label="请求超时（ms）" prop="timeoutMs">
                  <el-input-number v-model="form.timeoutMs" :min="100" :max="60000" :step="100" style="width: 100%" controls-position="right" />
                </el-form-item>
                <el-form-item label="应用商店地址" prop="storeUrl" class="span-2">
                  <el-input v-model="form.storeUrl" placeholder="如：https://apps.apple.com/cn/app/xxx 或应用宝/华为市场等" clearable />
                </el-form-item>
              </div>
            </section>

            <!-- 区块 4：微信配置（仅 SDK 接入） -->
            <section v-if="accessType === 1" class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>微信分享配置</span>
                </h2>
                <span class="page-form-section-tag">仅 SDK 对接时显示</span>
              </div>

              <div class="page-form-grid">
                <el-form-item label="微信 APP ID" prop="wechatAppId">
                  <el-input v-model="form.wechatAppId" placeholder="请输入微信开放平台申请的 APP ID" maxlength="32" show-word-limit clearable />
                </el-form-item>
                <el-form-item v-if="form.platform === 2" label="微信 Universal Link" prop="wechatUniversalLink">
                  <el-input v-model="form.wechatUniversalLink" placeholder="https://yourdomain.com/uni-link/" clearable />
                  <div class="form-help">iOS 微信分享必填，需以 https:// 开头</div>
                </el-form-item>
              </div>
            </section>
          </el-form>
        </div>

        <!-- Drawer Footer（sticky 底部） -->
        <footer class="page-form-footer">
          <div class="page-form-footer-left">
            <el-icon><InfoFilled /></el-icon>
            <span>带 * 为必填项</span>
          </div>
          <div class="page-form-footer-right">
            <el-button :icon="Close" @click="closeDrawer">取消</el-button>
            <el-button type="primary" :loading="submitting" :icon="Check" @click="handleSubmit">
              {{ isEdit ? '保存修改' : '创建应用' }}
            </el-button>
          </div>
        </footer>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import request from '../../utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  Cellphone, CopyDocument, Plus, Search, RefreshLeft,
  Edit, InfoFilled, Setting, ChatDotRound, Picture, Delete,
  Upload, WarningFilled, Close, Check
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const loading = ref(false);
const tableData = ref<any[]>([]);
const pagedData = computed(() => tableData.value);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const filters = reactive<{ keyword: string; platform: number | null }>({ keyword: '', platform: null });

const categories = ['工具', '社交', '娱乐', '教育', '游戏', '新闻', '生活', '其他'];
const accessType = 1; // 默认 SDK 对接（实际从 userStore 取）

// ========== 抽屉 + 表单状态 ==========
const drawerVisible = ref(false);
const direction = 'rtl';
const drawerSize = '720px';
const isEdit = ref(false);
const submitting = ref(false);
const iconError = ref('');
const formRef = ref<FormInstance | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const form = reactive({
  appName: '',
  packageName: '',
  platform: 1 as number,
  category: '',
  timeoutMs: 5000,
  storeUrl: '',
  iconUrl: '',
  wechatAppId: '',
  wechatUniversalLink: '',
  appKey: '',
});

const formRules: FormRules = {
  appName: [
    { required: true, message: '请输入应用名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度 2-50 字符', trigger: 'blur' },
  ],
  packageName: [
    { required: true, message: '请输入应用包名', trigger: 'blur' },
  ],
  platform: [
    { required: true, message: '请选择系统平台', trigger: 'change' },
  ],
  category: [
    { required: true, message: '请选择应用分类', trigger: 'change' },
  ],
};

// ========== 列表加载 ==========
const fetchList = async (): Promise<void> => {
  loading.value = true;
  try {
    const res: any = await request.get('/api/v1/console/app/list', {
      params: { page: page.value, pageSize: pageSize.value, ...filters },
    });
    if (res.code === 0) {
      tableData.value = res.data?.list || [];
      total.value = res.data?.total || 0;
    } else {
      ElMessage.error(res.message || '加载失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败');
  } finally {
    loading.value = false;
  }
};

const onSearch = (): void => {
  page.value = 1;
  fetchList();
};

const onReset = (): void => {
  filters.keyword = '';
  filters.platform = null;
  page.value = 1;
  fetchList();
};

const onCopy = async (key: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(key);
    ElMessage.success('AppKey 已复制');
  } catch {
    ElMessage.warning('复制失败，请手动复制');
  }
};

const onToggleStatus = async (row: any): Promise<void> => {
  const newStatus = row.status === 1 ? 0 : 1;
  try {
    await ElMessageBox.confirm(
      `确定要${newStatus === 1 ? '启用' : '禁用'}应用「${row.appName || row.app_name}」吗？`,
      '提示',
      { type: 'warning' }
    );
    const res: any = await request.put('/api/v1/console/app/update', { appKey: row.appKey || row.app_key, status: newStatus });
    if (res.code === 0) {
      ElMessage.success('操作成功');
      fetchList();
    } else {
      ElMessage.error(res.message || '操作失败');
    }
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) ElMessage.error(e.message);
  }
};

const formatTime = (ts: number | string | undefined | null): string => {
  if (!ts) return '-';
  const d = new Date(typeof ts === 'number' ? ts * (ts.toString().length <= 10 ? 1000 : 1) : ts);
  if (isNaN(d.getTime())) return '-';
  return dayjs(d).format('YYYY-MM-DD HH:mm');
};

// ========== 抽屉操作 ==========
const openCreate = (): void => {
  isEdit.value = false;
  resetForm();
  drawerVisible.value = true;
};

const openEdit = async (row: any): Promise<void> => {
  isEdit.value = true;
  resetForm();
  drawerVisible.value = true;
  // 加载详情
  try {
    const res: any = await request.get('/api/v1/console/app/detail', { params: { appKey: row.appKey || row.app_key } });
    if (res.code === 0) {
      const d = res.data;
      form.appName = d.app_name || d.appName || '';
      form.packageName = d.package_name || d.packageName || '';
      form.platform = d.platform ?? 1;
      form.category = d.category || '';
      form.timeoutMs = d.timeout_ms ?? d.timeoutMs ?? 5000;
      form.storeUrl = d.store_url || d.storeUrl || '';
      form.iconUrl = d.iconUrlResolved || d.icon_url || '';
      form.wechatAppId = d.wechat_app_id || d.wechatAppId || '';
      form.wechatUniversalLink = d.wechat_universal_link || d.wechatUniversalLink || '';
      form.appKey = d.app_key || d.appKey || '';
      await nextTick();
      formRef.value?.clearValidate();
    } else {
      ElMessage.error(res.message || '加载详情失败');
      drawerVisible.value = false;
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载详情失败');
    drawerVisible.value = false;
  }
};

const closeDrawer = (): void => {
  drawerVisible.value = false;
};

const resetForm = (): void => {
  form.appName = '';
  form.packageName = '';
  form.platform = 1;
  form.category = '';
  form.timeoutMs = 5000;
  form.storeUrl = '';
  form.iconUrl = '';
  form.wechatAppId = '';
  form.wechatUniversalLink = '';
  form.appKey = '';
  iconError.value = '';
  nextTick(() => formRef.value?.clearValidate());
};

const onFormReset = (): void => {
  if (isEdit.value) {
    // 重新加载当前编辑的应用
    const row = tableData.value.find(r => (r.appKey || r.app_key) === form.appKey);
    if (row) openEdit(row);
  } else {
    resetForm();
  }
};

// ========== 图标上传 ==========
const triggerFilePicker = (): void => fileInputRef.value?.click();
const onFileInputChange = (e: Event): void => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  if (file.size > 200 * 1024) {
    iconError.value = '图标大小不能超过 200KB';
    target.value = '';
    return;
  }
  iconError.value = '';
  const reader = new FileReader();
  reader.onload = () => { form.iconUrl = reader.result as string; };
  reader.readAsDataURL(file);
  target.value = '';
};
const clearIcon = (): void => { form.iconUrl = ''; };
const onIconPreviewError = (): void => { iconError.value = '图标预览失败'; };

// ========== 提交 ==========
const handleSubmit = async (): Promise<void> => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    const payload: any = {
      appName: form.appName,
      packageName: form.packageName,
      platform: form.platform,
      category: form.category,
      timeoutMs: form.timeoutMs,
      storeUrl: form.storeUrl,
      iconUrl: form.iconUrl,
      wechatAppId: form.wechatAppId,
      wechatUniversalLink: form.wechatUniversalLink,
    };
    let res: any;
    if (isEdit.value) {
      payload.appKey = form.appKey;
      res = await request.put('/api/v1/console/app/update', payload);
    } else {
      res = await request.post('/api/v1/console/app/create', payload);
    }
    if (res.code === 0) {
      ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
      drawerVisible.value = false;
      fetchList();
    } else {
      ElMessage.error(res.message || '操作失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

onMounted(fetchList);
</script>
