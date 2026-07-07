<template>
  <div class="account-manager">
    <!-- Toolbar -->
    <div class="account-toolbar">
      <el-input
        v-model="filterKeyword"
        placeholder="搜索账号名 / 账号 ID"
        clearable
        size="default"
        class="account-search"
        @input="onSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="filterNetworkId" placeholder="全部广告网络" clearable size="default" class="account-filter" @change="onSearch">
        <el-option v-for="n in networks" :key="n.id" :label="n.name" :value="n.id" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" clearable size="default" class="account-status" @change="onSearch">
        <el-option label="启用" :value="1" />
        <el-option label="停用" :value="2" />
      </el-select>
      <el-button type="primary" size="default" @click="openCreate">
        <el-icon class="mr-1"><Plus /></el-icon>
        新建账号
      </el-button>
    </div>

    <!-- Table -->
    <el-table :data="pagedList" v-loading="loading" stripe class="account-table" :empty-text="'暂无账号数据'">
      <el-table-column label="账号名称" min-width="160">
        <template #default="{ row }">
          <div class="account-name-cell">
            <span class="account-name">{{ row.account_name }}</span>
            <el-tag v-if="row.status === 2" size="small" type="info">停用</el-tag>
          </div>
          <div class="account-remark">{{ row.remark || '—' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="广告网络" min-width="140">
        <template #default="{ row }">
          <span class="account-net">{{ row.network_name || `网络 #${row.network_def_id}` }}</span>
        </template>
      </el-table-column>
      <el-table-column label="账号 ID" min-width="160" prop="account_id" show-overflow-tooltip />
      <el-table-column label="凭证字段" min-width="120" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="viewCredentials(row)">
            <el-icon class="mr-1"><View /></el-icon>
            查看 ({{ getFieldCount(row) }})
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" min-width="160">
        <template #default="{ row }">
          <span class="account-time">{{ formatTime(row.updated_at) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link :type="row.status === 1 ? 'warning' : 'success'" size="small" @click="toggleStatus(row)">
            {{ row.status === 1 ? '停用' : '启用' }}
          </el-button>
          <el-button link type="danger" size="small" @click="confirmDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div v-if="filteredList.length > pageSize" class="account-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredList.length"
        layout="prev, pager, next, total"
        background
        small
      />
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editing ? '编辑账号' : '新建账号'"
      width="640px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" label-position="right">
        <el-form-item label="账号名称" prop="account_name">
          <el-input v-model="form.account_name" placeholder="用户自定义的账号名称（如：穿山甲-激励视频-生产）" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="广告网络" prop="network_def_id">
          <el-select v-model="form.network_def_id" placeholder="选择广告网络" style="width: 100%" :disabled="editing">
            <el-option v-for="n in networks" :key="n.id" :label="`${n.name}${n.type ? ' (' + n.type + ')' : ''}`" :value="n.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号 ID" prop="account_id">
          <el-input v-model="form.account_id" placeholder="广告网络侧的账号 ID（可选）" maxlength="200" />
        </el-form-item>
        <el-form-item label="凭证" prop="credentials">
          <KVEditor v-model="form.credentials" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.statusActive" :active-value="1" :inactive-value="2" active-text="启用" inactive-text="停用" inline-prompt />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">确定</el-button>
      </template>
    </el-dialog>

    <!-- Credentials Viewer -->
    <el-dialog v-model="credDialogVisible" title="凭证详情" width="520px" destroy-on-close>
      <el-descriptions :column="1" border size="default">
        <el-descriptions-item v-for="(val, key) in viewingCredentials" :key="key" :label="key">
          <span class="cred-value">{{ maskValue(val) }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="credDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { Plus, Search, View } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus';
import KVEditor, { KVItem } from './KVEditor.vue';
import request from '@/utils/request';
import dayjs from 'dayjs';

interface NetworkOption {
  id: number;
  name: string;
  type?: string;
}

interface AccountRow {
  id: number;
  developer_id: string;
  network_def_id: number;
  network_name?: string;
  app_id: number | null;
  account_name: string;
  account_id: string | null;
  credentials: Record<string, string> | null;
  status: number;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

const loading = ref(false);
const saving = ref(false);
const list = ref<AccountRow[]>([]);
const networks = ref<NetworkOption[]>([]);

const filterKeyword = ref('');
const filterNetworkId = ref<number | null>(null);
const filterStatus = ref<number | null>(null);
const currentPage = ref(1);
const pageSize = 10;

const dialogVisible = ref(false);
const editing = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const form = reactive<{
  account_name: string;
  network_def_id: number | null;
  account_id: string;
  credentials: KVItem[];
  statusActive: number;
  remark: string;
}>({
  account_name: '',
  network_def_id: null,
  account_id: '',
  credentials: [],
  statusActive: 1,
  remark: '',
});

const credDialogVisible = ref(false);
const viewingCredentials = ref<Record<string, string>>({});

const rules = reactive<FormRules>({
  account_name: [{ required: true, message: '请输入账号名称', trigger: 'blur' }],
  network_def_id: [{ required: true, message: '请选择广告网络', trigger: 'change' }],
});

const filteredList = computed(() => {
  let result = list.value;
  if (filterNetworkId.value) result = result.filter((a) => a.network_def_id === filterNetworkId.value);
  if (filterStatus.value !== null) result = result.filter((a) => a.status === filterStatus.value);
  if (filterKeyword.value) {
    const kw = filterKeyword.value.toLowerCase();
    result = result.filter(
      (a) => a.account_name.toLowerCase().includes(kw) || (a.account_id || '').toLowerCase().includes(kw),
    );
  }
  return result;
});

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredList.value.slice(start, start + pageSize);
});

function onSearch() {
  currentPage.value = 1;
}

function getFieldCount(row: AccountRow): number {
  return row.credentials ? Object.keys(row.credentials).length : 0;
}

function formatTime(t: string | null | undefined): string {
  if (!t) return '—';
  return dayjs(t).format('YYYY-MM-DD HH:mm');
}

function maskValue(v: string): string {
  if (!v) return '—';
  if (v.length <= 4) return '*'.repeat(v.length);
  return v.slice(0, 2) + '*'.repeat(Math.max(4, v.length - 4)) + v.slice(-2);
}

async function loadList() {
  loading.value = true;
  try {
    const res = await request.get<{ list: AccountRow[]; total: number }>('/api/v1/console/network/account/list', {
      params: { pageSize: 50 },
    });
    list.value = res.data.list || [];
  } catch (e) {
    console.error('Load account list failed', e);
  } finally {
    loading.value = false;
  }
}

async function loadNetworks() {
  try {
    const res = await request.get<{ list: NetworkOption[] }>('/api/v1/console/network/custom/list');
    networks.value = res.data.list || [];
  } catch (e) {
    console.error('Load network list failed', e);
  }
}

function openCreate() {
  editing.value = false;
  editingId.value = null;
  form.account_name = '';
  form.network_def_id = networks.value[0]?.id ?? null;
  form.account_id = '';
  form.credentials = [];
  form.statusActive = 1;
  form.remark = '';
  dialogVisible.value = true;
}

function openEdit(row: AccountRow) {
  editing.value = true;
  editingId.value = row.id;
  form.account_name = row.account_name;
  form.network_def_id = row.network_def_id;
  form.account_id = row.account_id || '';
  form.credentials = Object.entries(row.credentials || {}).map(([key, value]) => ({
    key,
    value: String(value),
    secret: true,
    showValue: false,
    locked: false,
  }));
  form.statusActive = row.status;
  form.remark = row.remark || '';
  dialogVisible.value = true;
}

async function save() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  const credentialsObj: Record<string, string> = {};
  form.credentials.forEach((item) => {
    if (item.key.trim()) credentialsObj[item.key.trim()] = item.value;
  });

  const payload = {
    networkDefId: form.network_def_id,
    accountName: form.account_name,
    accountId: form.account_id || null,
    credentials: credentialsObj,
    status: form.statusActive,
    remark: form.remark || null,
  };

  saving.value = true;
  try {
    if (editing.value && editingId.value) {
      await request.patch(`/api/v1/console/network/account/${editingId.value}`, payload);
      ElMessage.success('更新成功');
    } else {
      await request.post('/api/v1/console/network/account/create', payload);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await loadList();
  } catch (e) {
    console.error('Save account failed', e);
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: AccountRow) {
  const newStatus = row.status === 1 ? 2 : 1;
  try {
    await request.patch(`/api/v1/console/network/account/${row.id}`, { status: newStatus });
    ElMessage.success(newStatus === 1 ? '已启用' : '已停用');
    await loadList();
  } catch (e) {
    console.error('Toggle status failed', e);
  }
}

async function confirmDelete(row: AccountRow) {
  try {
    await ElMessageBox.confirm(`确定删除账号「${row.account_name}」？该操作不可恢复。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  try {
    await request.delete(`/api/v1/console/network/account/${row.id}`);
    ElMessage.success('已删除');
    await loadList();
  } catch (e) {
    console.error('Delete account failed', e);
  }
}

function viewCredentials(row: AccountRow) {
  viewingCredentials.value = row.credentials || {};
  credDialogVisible.value = true;
}

watch(filteredList, () => {
  if ((currentPage.value - 1) * pageSize >= filteredList.value.length) {
    currentPage.value = 1;
  }
});

onMounted(async () => {
  await loadNetworks();
  await loadList();
});
</script>

<style scoped>
.account-manager {
  width: 100%;
}
.account-toolbar {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  align-items: center;
}
.account-search {
  width: 240px;
}
.account-filter {
  width: 200px;
}
.account-status {
  width: 120px;
}
.account-table {
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.account-name-cell {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.account-name {
  font-weight: 500;
  color: var(--color-slate-900);
}
.account-remark {
  font-size: var(--text-xs);
  color: var(--color-slate-400);
  margin-top: 2px;
}
.account-net {
  color: var(--color-slate-700);
}
.account-time {
  color: var(--color-slate-500);
  font-size: var(--text-sm);
}
.account-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-lg);
}
.mr-1 {
  margin-right: 4px;
}
.cred-value {
  font-family: 'SF Mono', Consolas, monospace;
  color: var(--color-slate-700);
  font-size: var(--text-sm);
}
</style>
