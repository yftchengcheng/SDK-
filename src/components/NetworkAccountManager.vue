<template>
  <div class="network-account-manager">
    <!-- Toolbar -->
    <div class="nam-toolbar page-filter">
      <div class="page-filter-search">
        <el-input
          v-model="filterKeyword"
          placeholder="搜索账号名 / 账号 ID"
          clearable
          size="default"
          @input="onSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="page-filter-fields">
        <el-select v-model="filterNetworkId" placeholder="全部广告平台" clearable size="default" @change="onSearch">
          <el-option v-for="n in networks" :key="n.id" :label="n.name" :value="n.id" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态" clearable size="default" @change="onSearch">
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="2" />
        </el-select>
      </div>
      <div class="page-filter-actions">
        <el-button type="primary" :icon="Plus" @click="openCreate">新建账号</el-button>
      </div>
    </div>

    <!-- Table -->
    <el-table
      :data="pagedList"
      v-loading="loading"
      stripe
      class="nam-table"
      :empty-text="'暂无账号数据'"
    >
      <el-table-column label="账号名称" min-width="160">
        <template #default="{ row }">
          <div class="nam-name-cell">
            <span class="nam-name">{{ row.account_name }}</span>
            <el-tag v-if="row.status === 2" size="small" type="info">停用</el-tag>
          </div>
          <div class="nam-remark">{{ row.remark || '—' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="广告平台" min-width="140">
        <template #default="{ row }">
          <div class="nam-net-cell">
            <span class="nam-net-avatar" :class="`nam-avatar--${networkColorClass(row.network_code)}`">
              {{ networkInitial(row.network_code) }}
            </span>
            <span class="nam-net-name">{{ row.network_name || `平台 #${row.network_def_id}` }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="账号 ID" min-width="160" prop="account_id" show-overflow-tooltip />
      <el-table-column label="凭证字段" min-width="100" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="viewCredentials(row)">
            <el-icon class="mr-1"><View /></el-icon>
            查看
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="100" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status === 1"
            @change="(v: boolean) => toggleStatus(row, v)"
            :loading="statusLoading[row.id]"
          />
        </template>
      </el-table-column>
      <el-table-column label="更新时间" min-width="160">
        <template #default="{ row }">
          <span class="nam-time">{{ formatTime(row.updated_at) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="confirmDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="nam-pagination">
      <span class="nam-total">共 {{ filteredList.length }} 条</span>
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredList.length"
        layout="prev, pager, next, jumper"
        background
      />
    </div>

    <!-- Create / Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editing ? '编辑广告平台账号' : '新建广告平台账号'"
      width="640px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="120px" label-position="right">
        <el-form-item label="账号名称" prop="account_name">
          <el-input v-model="form.account_name" placeholder="例如：穿山甲默认账号" maxlength="30" show-word-limit />
        </el-form-item>

        <el-form-item label="广告平台" prop="network_def_id">
          <el-select
            v-model="form.network_def_id"
            placeholder="请选择广告平台"
            :disabled="editing"
            filterable
            class="nam-platform-select"
            @change="onPlatformChange"
          >
            <el-option
              v-for="n in availableNetworks"
              :key="n.id"
              :label="`${n.name}${n.is_preset ? '' : ' (自定义)'}`"
              :value="n.id"
            >
              <span class="nam-option">
                <span class="nam-net-avatar nam-net-avatar--sm" :class="`nam-avatar--${networkColorClass(n.code)}`">
                  {{ networkInitial(n.code) }}
                </span>
                <span class="nam-option-name">{{ n.name }}</span>
                <el-tag v-if="!n.is_preset" size="small" type="success" effect="plain">自定义</el-tag>
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- Schema-driven dynamic credential fields -->
        <template v-if="form.network_def_id && schemaFields.length">
          <el-divider class="nam-divider">凭证字段</el-divider>
          <el-form-item
            v-for="field in schemaFields"
            :key="field.key"
            :label="field.label"
            :prop="`credentials.${field.key}`"
            :rules="getFieldRules(field)"
            :required="field.required"
          >
            <!-- text -->
            <el-input
              v-if="field.type === 'text'"
              v-model="form.credentials[field.key]"
              :placeholder="field.placeholder || `请输入${field.label}`"
              :maxlength="field.maxlength"
              clearable
            />
            <!-- password -->
            <el-input
              v-else-if="field.type === 'password'"
              v-model="form.credentials[field.key]"
              type="password"
              show-password
              :placeholder="field.placeholder || `请输入${field.label}`"
              :maxlength="field.maxlength"
              clearable
            />
            <!-- switch -->
            <el-switch
              v-else-if="field.type === 'switch'"
              v-model="form.credentials[field.key]"
            />
            <!-- currency -->
            <el-input-number
              v-else-if="field.type === 'currency'"
              v-model="form.credentials[field.key]"
              :min="0"
              :precision="2"
              :step="0.01"
              :placeholder="field.placeholder || '请输入金额'"
            />
            <!-- select -->
            <el-select
              v-else-if="field.type === 'select'"
              v-model="form.credentials[field.key]"
              :placeholder="field.placeholder || '请选择'"
              clearable
            >
              <el-option
                v-for="opt in (field.options || [])"
                :key="String(opt.value)"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <!-- key-value -->
            <el-input
              v-else-if="field.type === 'key-value'"
              type="textarea"
              :rows="4"
              v-model="form.credentials[field.key]"
              :placeholder="field.placeholder || '每行一个 key:value'"
            />
            <!-- pub-key -->
            <el-input
              v-else-if="field.type === 'pub-key'"
              type="textarea"
              :rows="6"
              v-model="form.credentials[field.key]"
              :placeholder="field.placeholder || '-----BEGIN PUBLIC KEY-----' "
            />
          </el-form-item>
        </template>

        <el-form-item label="账号 ID">
          <el-input v-model="form.account_id" placeholder="可选，平台侧账号 ID" clearable />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="2">停用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">提交</el-button>
      </template>
    </el-dialog>

    <!-- View Credentials Drawer -->
    <el-drawer
      v-if="viewingAccount"
      v-model="viewDrawerVisible"
      :title="`凭证详情 - ${viewingAccount.account_name}`"
      size="540px"
      direction="rtl"
    >
      <div class="nam-view">
        <div class="nam-view-card">
          <h4 class="nam-view-title">基本信息</h4>
          <el-descriptions :column="1" border size="default">
            <el-descriptions-item label="账号名称">{{ viewingAccount.account_name }}</el-descriptions-item>
            <el-descriptions-item label="广告平台">
              {{ viewingAccount.network_name || `平台 #${viewingAccount.network_def_id}` }}
            </el-descriptions-item>
            <el-descriptions-item label="账号 ID">{{ viewingAccount.account_id || '—' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="viewingAccount.status === 1 ? 'success' : 'info'" size="small">
                {{ viewingAccount.status === 1 ? '启用' : '停用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="备注">{{ viewingAccount.remark || '—' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(viewingAccount.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatTime(viewingAccount.updated_at) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="nam-view-card">
          <h4 class="nam-view-title">凭证字段</h4>
          <el-descriptions :column="1" border size="default" v-if="Object.keys(viewingAccount.credentials || {}).length">
            <el-descriptions-item v-for="(v, k) in viewingAccount.credentials" :key="k" :label="k">
              <span class="nam-view-cred">{{ maskValue(String(v)) }}</span>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="无凭证字段" :image-size="80" />
        </div>

        <div class="nam-view-card">
          <h4 class="nam-view-title">原始 JSON</h4>
          <pre class="nam-view-json">{{ JSON.stringify(viewingAccount.credentials || {}, null, 2) }}</pre>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { Plus, Search, View } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus';
import request from '@/utils/request';
import dayjs from 'dayjs';
import { getSchemaByNetwork, makeInitialData, type FieldDef } from '@/shared/network-schemas';

interface NetworkOption {
  id: number;
  name: string;
  code?: string;
  is_preset?: boolean;
}

interface AccountRow {
  id: number;
  developer_id: string;
  network_def_id: number;
  network_name?: string;
  network_code?: string;
  app_id: number | null;
  account_name: string;
  account_id: string | null;
  credentials: Record<string, any> | null;
  status: number;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

const props = defineProps<{
  prefillNetworkDefId?: number | null;
}>();

defineExpose({
  openCreate,
});

const loading = ref(false);
const saving = ref(false);
const list = ref<AccountRow[]>([]);
const networks = ref<NetworkOption[]>([]);
const statusLoading = reactive<Record<number, boolean>>({});

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
  credentials: Record<string, any>;
  status: number;
  remark: string;
}>({
  account_name: '',
  network_def_id: null,
  account_id: '',
  credentials: {},
  status: 1,
  remark: '',
});

const baseFormRules: FormRules = {
  account_name: [{ required: true, message: '请输入账号名称', trigger: 'blur' }],
  network_def_id: [{ required: true, message: '请选择广告平台', trigger: 'change' }],
};

// 动态生成 schema 字段的验证规则（与 baseFormRules 合并）
const formRules = computed<FormRules>(() => {
  const rules: FormRules = { ...baseFormRules };
  for (const f of schemaFields.value) {
    if (f.required) {
      // 字段在表单模型中以 `credentials.<key>` 形式存在
      rules[`credentials.${f.key}`] = [{
        validator: (_r: unknown, value: unknown, cb: (e?: Error) => void) => {
          if (value === undefined || value === null || value === '') {
            return cb(new Error(`请填写${f.label}`));
          }
          cb();
        },
        trigger: 'blur',
      }];
    }
  }
  return rules;
});

const viewDrawerVisible = ref(false);
const viewingAccount = ref<AccountRow | null>(null);

// ===== Computed =====
const availableNetworks = computed(() => networks.value);

const schemaFields = computed<FieldDef[]>(() => {
  if (!form.network_def_id) return [];
  const net = networks.value.find(n => n.id === form.network_def_id);
  if (!net) return [];
  return getSchemaByNetwork({
    network_code: net.code,
    is_preset: net.is_preset,
  });
});

const filteredList = computed(() => {
  return list.value.filter(row => {
    if (filterNetworkId.value && row.network_def_id !== filterNetworkId.value) return false;
    if (filterStatus.value && row.status !== filterStatus.value) return false;
    if (filterKeyword.value) {
      const kw = filterKeyword.value.toLowerCase();
      const hitName = row.account_name?.toLowerCase().includes(kw);
      const hitId = row.account_id?.toLowerCase().includes(kw);
      if (!hitName && !hitId) return false;
    }
    return true;
  });
});

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredList.value.slice(start, start + pageSize);
});

// ===== Watch =====
watch(() => props.prefillNetworkDefId, (v) => {
  if (v) {
    openCreate();
    form.network_def_id = v;
    onPlatformChange();
  }
});

watch(filteredList, () => { currentPage.value = 1; });

// ===== Lifecycle =====
onMounted(async () => {
  await Promise.all([fetchList(), fetchNetworks()]);
});

// ===== Network helpers =====
function networkInitial(code?: string) {
  return (code || '?').slice(0, 1).toUpperCase();
}

function networkColorClass(code?: string) {
  if (!code) return 'slate';
  const c = code.toLowerCase();
  if (c.includes('csj') || c.includes('pangle')) return 'blue';
  if (c.includes('gdt') || c.includes('tencent')) return 'green';
  if (c.includes('bd') || c.includes('baidu')) return 'orange';
  if (c.includes('ks') || c.includes('kuaishou')) return 'red';
  if (c.includes('sig') || c.includes('sigmob')) return 'slate';
  if (c.includes('mi') || c.includes('xiaomi')) return 'orange';
  return 'slate';
}

function formatTime(t?: string) {
  if (!t) return '—';
  return dayjs(t).format('YYYY-MM-DD HH:mm');
}

function maskValue(v: string) {
  if (!v) return '—';
  if (v.length <= 4) return '••••';
  return v.slice(0, 2) + '••••' + v.slice(-2);
}

// ===== Data fetching =====
async function fetchList() {
  loading.value = true;
  try {
    const res = await request.get('/api/v1/console/network/account/list', { params: { pageSize: 1000 } });
    const items = res.data?.list || res.data || [];
    list.value = items.map((it: any) => ({
      id: it.id,
      developer_id: it.developer_id,
      network_def_id: it.network_def_id,
      network_name: it.network_name,
      network_code: it.network_code,
      app_id: it.app_id ?? null,
      account_name: it.account_name,
      account_id: it.account_id,
      credentials: it.credentials || {},
      status: it.status ?? 1,
      remark: it.remark,
      created_at: it.created_at,
      updated_at: it.updated_at,
    }));
  } catch (e) {
    console.error('[nam] fetch list error', e);
  } finally {
    loading.value = false;
  }
}

async function fetchNetworks() {
  try {
    const res = await request.get('/api/v1/console/network/list');
    const items = res.data?.list || [];
    networks.value = items.map((n: any) => ({
      id: n.id,
      name: n.network_name,
      code: n.network_code,
      is_preset: n.is_preset,
    }));
  } catch (e) {
    console.error('[nam] fetch networks error', e);
  }
}

// ===== Filter =====
function onSearch() {
  currentPage.value = 1;
}

// ===== Dialog =====
function resetForm() {
  form.account_name = '';
  form.network_def_id = null;
  form.account_id = '';
  form.credentials = {};
  form.status = 1;
  form.remark = '';
  editingId.value = null;
  editing.value = false;
}

function openCreate() {
  resetForm();
  // 默认选中第一个平台（让 schema 字段立即可见）
  const first = networks.value[0];
  if (first) {
    form.network_def_id = first.id;
    onPlatformChange();
  }
  dialogVisible.value = true;
  editing.value = false;
}

function openEdit(row: AccountRow) {
  resetForm();
  form.account_name = row.account_name;
  form.network_def_id = row.network_def_id;
  form.account_id = row.account_id || '';
  form.credentials = { ...(row.credentials || {}) };
  form.status = row.status;
  form.remark = row.remark || '';
  editingId.value = row.id;
  editing.value = true;
  dialogVisible.value = true;
}

function getFieldRules(field: FieldDef) {
  const rules: any[] = []
  if (field.required) {
    rules.push({ required: true, message: `请填写${field.label}`, trigger: ['blur', 'change'] })
  }
  if (field.type === 'password' && field.minLength !== undefined) {
    rules.push({ min: field.minLength, message: `至少${field.minLength}位`, trigger: 'blur' })
  }
  if (field.validator) {
    rules.push({ validator: field.validator, trigger: 'blur' })
  }
  return rules
}


function onPlatformChange() {
  if (!form.network_def_id) return;
  const net = networks.value.find(n => n.id === form.network_def_id);
  if (!net) return;
  const schema = getSchemaByNetwork({ network_code: net.code, is_preset: net.is_preset });
  const initData = makeInitialData(schema);
  // 编辑时保留已有凭证
  if (editing.value) {
    const merged: Record<string, any> = { ...initData };
    for (const k of Object.keys(form.credentials)) {
      merged[k] = form.credentials[k];
    }
    form.credentials = merged;
  } else {
    form.credentials = initData;
  }
}

async function submit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const payload = {
      account_name: form.account_name.trim(),
      network_def_id: form.network_def_id,
      account_id: form.account_id.trim() || null,
      credentials: form.credentials,
      status: form.status,
      remark: form.remark.trim() || null,
    };
    if (editing.value && editingId.value) {
      await request.put(`/api/v1/console/network/account/${editingId.value}`, payload);
      ElMessage.success('已更新');
    } else {
      await request.post('/api/v1/console/network/account/create', payload);
      ElMessage.success('已创建');
    }
    dialogVisible.value = false;
    await fetchList();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

// ===== View =====
function viewCredentials(row: AccountRow) {
  viewingAccount.value = row;
  viewDrawerVisible.value = true;
}

// ===== Status toggle =====
async function toggleStatus(row: AccountRow, v: boolean) {
  statusLoading[row.id] = true;
  try {
    await request.put(`/api/v1/console/network/account/${row.id}`, {
      account_name: row.account_name,
      network_def_id: row.network_def_id,
      account_id: row.account_id,
      credentials: row.credentials,
      status: v ? 1 : 2,
      remark: row.remark,
    });
    row.status = v ? 1 : 2;
    ElMessage.success('已更新状态');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '更新失败');
  } finally {
    statusLoading[row.id] = false;
  }
}

// ===== Delete =====
async function confirmDelete(row: AccountRow) {
  try {
    await ElMessageBox.confirm(`确定删除账号「${row.account_name}」？此操作不可恢复。`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
  } catch { return; }
  try {
    await request.delete(`/api/v1/console/network/account/${row.id}`);
    ElMessage.success('已删除');
    await fetchList();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '删除失败');
  }
}
</script>

