<template>
  <div class="page-container">
    <div class="page-header">
      <h1>应用管理</h1>
      <el-button type="primary" @click="openCreateDialog">创建应用</el-button>
    </div>
    <!-- Table -->
    <div class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="app_name" label="应用名称" min-width="140" />
        <el-table-column prop="app_key" label="App Key" min-width="200">
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
      width="560px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top">
        <el-form-item label="应用名称" prop="app_name">
          <el-input v-model="form.app_name" placeholder="请输入应用名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="应用包名" prop="package_name">
          <el-input v-model="form.package_name" placeholder="Android 包名 (com.xxx.app) 或 iOS Bundle ID" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="系统" prop="platform" class="form-row-half">
            <el-radio-group v-model="form.platform">
              <el-radio-button :value="1">Android</el-radio-button>
              <el-radio-button :value="2">iOS</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="对接方式" class="form-row-half">
            <div class="locked-access-type">
              <el-tag :type="userAccessType === 1 ? 'primary' : 'success'" size="default">
                {{ userAccessType === 1 ? 'SDK' : 'API' }}
              </el-tag>
              <span class="locked-tip">注册时已锁定，不可修改</span>
            </div>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="分类" prop="category" class="form-row-half">
            <el-select v-model="form.category" placeholder="请选择分类" clearable style="width: 100%">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="超时时间（ms）" prop="timeout_ms" class="form-row-half">
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
        <el-form-item label="应用商店地址" prop="store_url">
          <el-input v-model="form.store_url" placeholder="如：https://apps.apple.com/cn/app/xxx 或应用宝/华为市场等" clearable />
        </el-form-item>

        <!-- 微信字段：仅 SDK 接入时显示 -->
        <template v-if="userAccessType === 1">
          <el-form-item label="微信 APP ID" prop="wechat_app_id">
            <el-input v-model="form.wechat_app_id" placeholder="请输入微信开放平台申请的 APP ID" maxlength="32" show-word-limit />
          </el-form-item>
          <!-- 微信 Universal Link：仅 iOS + SDK 时显示 -->
          <el-form-item v-if="form.platform === 2" label="微信 Universal Link" prop="wechat_universal_link">
            <el-input v-model="form.wechat_universal_link" placeholder="https://yourdomain.com/uni-link/" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import request from '../../utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { CopyDocument } from '@element-plus/icons-vue';
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
});

const form = reactive(defaultForm());

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

onMounted(fetchList);

</script>
