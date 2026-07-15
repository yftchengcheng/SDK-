<template>
  <div class="page-shell">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <el-icon><DataLine /></el-icon>
        </div>
        <div class="page-header-titles">
          <h1 class="page-header-title">报表指标字典</h1>
          <p class="page-header-subtitle">超级管理员视图 · 管理综合报表、漏斗分析、用户行为指标定义（系统指标不可删除）</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="Refresh" @click="loadList">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建指标</el-button>
      </div>
    </div>

    <div class="page-filter">
      <el-form :inline="true" class="page-filter-form" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="query.q"
            placeholder="指标名称 / code"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="query.category" placeholder="全部分类" clearable style="width: 200px" @change="handleSearch">
            <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="数值类型">
          <el-select v-model="query.valueType" placeholder="全部" clearable style="width: 140px" @change="handleSearch">
            <el-option label="实际值" value="actual" />
            <el-option label="预估" value="estimated" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="query.isSystem" placeholder="全部" clearable style="width: 120px" @change="handleSearch">
            <el-option label="系统内置" :value="true" />
            <el-option label="自定义" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用">
          <el-select v-model="query.isActive" placeholder="全部" clearable style="width: 120px" @change="handleSearch">
            <el-option label="启用" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-filter-actions">
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
      </div>
    </div>

    <div class="page-card">
      <div class="page-table-wrap">
        <el-table :data="filteredList" v-loading="loading" stripe row-key="id">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="code" label="Code" min-width="160">
            <template #default="{ row }">
              <code class="cell-code">{{ row.code }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名称" min-width="140" />
          <el-table-column label="分类" min-width="160">
            <template #default="{ row }">
              <span class="cell-secondary">{{ categoryLabel(row.category) }}</span>
              <span v-if="row.sub_category" class="cell-empty"> / {{ row.sub_category }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数值类型" width="100">
            <template #default="{ row }">
              <span class="status-tag" :class="row.value_type === 'actual' ? 'status-tag--active' : 'status-tag--warning'">
                {{ row.value_type === 'actual' ? '实际' : '预估' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="格式" min-width="180">
            <template #default="{ row }">
              <span class="cell-secondary">{{ row.format || '-' }}</span>
              <span v-if="row.unit" class="cell-empty"> · {{ row.unit }}</span>
            </template>
          </el-table-column>
          <el-table-column label="公式" min-width="200">
            <template #default="{ row }">
              <code v-if="row.formula" class="cell-formula">{{ row.formula }}</code>
              <span v-else class="cell-empty">-</span>
            </template>
          </el-table-column>
          <el-table-column label="属性" width="120">
            <template #default="{ row }">
              <span v-if="row.is_system" class="status-tag status-tag--neutral">系统</span>
              <span v-if="!row.is_active" class="status-tag status-tag--paused">停用</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="cell-actions">
                <el-button link type="primary" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
                <el-button
                  link
                  :type="row.is_active ? 'warning' : 'success'"
                  :icon="row.is_active ? 'CircleClose' : 'CircleCheck'"
                  @click="toggleActive(row)"
                >
                  {{ row.is_active ? '停用' : '启用' }}
                </el-button>
                <el-button
                  link
                  type="danger"
                  :icon="Delete"
                  :disabled="row.is_system"
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="filteredList.length === 0 && !loading" class="table-empty">
          <el-empty description="暂无指标" />
        </div>
      </div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑指标' : '新建指标'"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="Code" prop="code">
          <el-input v-model="form.code" placeholder="英文字母 / 下划线 / 数字（不可重复）" :disabled="!!editingId" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="中文名称（前端展示）" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="选择一级分类" style="width: 100%">
            <el-option v-for="c in CATEGORY_OPTIONS" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="子分类">
          <el-input v-model="form.sub_category" placeholder="可选，如：API / Ready / 收益数据" />
        </el-form-item>
        <el-form-item label="数值类型" prop="value_type">
          <el-radio-group v-model="form.value_type">
            <el-radio value="actual">实际值</el-radio>
            <el-radio value="estimated">预估</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="form.unit" placeholder="如：% / ¥ / count（可空）" />
        </el-form-item>
        <el-form-item label="数据格式" prop="format">
          <el-select v-model="form.format" placeholder="前端渲染格式" style="width: 100%">
            <el-option v-for="f in FORMAT_OPTIONS" :key="f" :label="f" :value="f" />
          </el-select>
        </el-form-item>
        <el-form-item label="公式">
          <el-input
            v-model="form.formula"
            type="textarea"
            :rows="2"
            placeholder="如：ready / ready_scene_count（可空）"
          />
        </el-form-item>
        <el-form-item label="必填字段">
          <el-input
            v-model="form.required_fields_text"
            placeholder="逗号分隔，如：ready, ready_scene_count"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="指标的业务含义"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import {
  Search, Refresh, RefreshLeft, Plus, Edit, Delete,
  DataLine, CircleClose, CircleCheck,
} from '@element-plus/icons-vue';
import request from '@/utils/request';

interface ReportMetric {
  id: number;
  code: string;
  name: string;
  category: string;
  sub_category: string | null;
  value_type: 'actual' | 'estimated';
  unit: string | null;
  format: string;
  formula: string | null;
  required_fields: string[] | null;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORY_OPTIONS = [
  { value: 'taku_revenue', label: '收益数据' },
  { value: 'taku_user', label: '用户数据' },
  { value: 'taku_bidding', label: '竞价数据' },
  { value: 'ad_request', label: '请求展示' },
  { value: 'ad_ready', label: '广告 Ready' },
  { value: 'api', label: 'API' },
  { value: 'other', label: '其他' },
];

const FORMAT_OPTIONS = ['number', 'percent', 'currency', 'decimal', 'duration', 'integer'];

const query = reactive({
  q: '',
  category: '' as string,
  valueType: '' as '' | 'actual' | 'estimated',
  isSystem: undefined as boolean | undefined,
  isActive: undefined as boolean | undefined,
});

const loading = ref(false);
const list = ref<ReportMetric[]>([]);
const categoryOptions = ref<{ value: string; label: string }[]>([]);

const filteredList = computed(() => {
  let arr = list.value;
  if (query.q) {
    const q = query.q.toLowerCase();
    arr = arr.filter(
      (m) => m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
    );
  }
  if (query.valueType) arr = arr.filter((m) => m.value_type === query.valueType);
  if (query.isSystem !== undefined) arr = arr.filter((m) => m.is_system === query.isSystem);
  if (query.isActive !== undefined) arr = arr.filter((m) => m.is_active === query.isActive);
  return arr;
});

const categoryLabel = (code: string): string => {
  return CATEGORY_OPTIONS.find((c) => c.value === code)?.label ?? code;
};

const loadList = async () => {
  loading.value = true;
  try {
    const params: Record<string, string> = {};
    if (query.category) params.category = query.category;
    const res = await request.get<{ code: number; data: ReportMetric[] }>(
      '/api/v1/console/report-metric/list',
      { params },
    );
    list.value = (res as unknown as { data: ReportMetric[] }).data ?? [];
  } catch (e) {
    ElMessage.error((e as Error).message || '加载失败');
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const res = await request.get<{
      code: number;
      data: { category: string; subCategories: { name: string }[] }[];
    }>('/api/v1/console/report-metric/categories');
    const data = (res as unknown as { data: { category: string }[] }).data ?? [];
    categoryOptions.value = data.map((c) => ({
      value: c.category,
      label: `${categoryLabel(c.category)} (${c.category})`,
    }));
  } catch (e) {
    console.warn('loadCategories failed', e);
  }
};

const handleSearch = () => {
  // 过滤是纯前端，但分类变化时也重新请求后端
  if (query.category) {
    loadList();
  }
};

const handleReset = () => {
  query.q = '';
  query.category = '';
  query.valueType = '';
  query.isSystem = undefined;
  query.isActive = undefined;
  loadList();
};

// ---- 弹窗 ----
const dialogVisible = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const form = reactive<{
  code: string;
  name: string;
  category: string;
  sub_category: string;
  value_type: 'actual' | 'estimated';
  unit: string;
  format: string;
  formula: string;
  required_fields_text: string;
  description: string;
  sort_order: number;
}>({
  code: '',
  name: '',
  category: 'other',
  sub_category: '',
  value_type: 'actual',
  unit: '',
  format: 'number',
  formula: '',
  required_fields_text: '',
  description: '',
  sort_order: 500,
});

const formRules: FormRules = {
  code: [
    { required: true, message: '请输入 code', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_]{0,63}$/, message: '小写字母开头，仅含字母数字下划线', trigger: 'blur' },
  ],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  value_type: [{ required: true, message: '请选择数值类型', trigger: 'change' }],
  format: [{ required: true, message: '请选择数据格式', trigger: 'change' }],
};

const resetForm = () => {
  form.code = '';
  form.name = '';
  form.category = 'other';
  form.sub_category = '';
  form.value_type = 'actual';
  form.unit = '';
  form.format = 'number';
  form.formula = '';
  form.required_fields_text = '';
  form.description = '';
  form.sort_order = 500;
  editingId.value = null;
};

const openCreateDialog = () => {
  resetForm();
  dialogVisible.value = true;
};

const openEditDialog = (row: ReportMetric) => {
  resetForm();
  editingId.value = row.id;
  form.code = row.code;
  form.name = row.name;
  form.category = row.category;
  form.sub_category = row.sub_category || '';
  form.value_type = row.value_type;
  form.unit = row.unit || '';
  form.format = row.format;
  form.formula = row.formula || '';
  form.required_fields_text = (row.required_fields || []).join(', ');
  form.description = row.description || '';
  form.sort_order = row.sort_order;
  dialogVisible.value = true;
};

const buildPayload = () => {
  const required_fields = form.required_fields_text
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    code: form.code,
    name: form.name,
    category: form.category,
    sub_category: form.sub_category || null,
    value_type: form.value_type,
    unit: form.unit || null,
    format: form.format,
    formula: form.formula || null,
    required_fields: required_fields.length > 0 ? required_fields : null,
    description: form.description || null,
    sort_order: form.sort_order,
  };
};

const handleSave = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await request.patch(
        `/api/v1/console/report-metric/update/${editingId.value}`,
        buildPayload(),
      );
      ElMessage.success('已更新');
    } else {
      await request.post('/api/v1/console/report-metric/create', buildPayload());
      ElMessage.success('已创建');
    }
    dialogVisible.value = false;
    loadList();
  } catch (e) {
    ElMessage.error((e as Error).message || '保存失败');
  } finally {
    saving.value = false;
  }
};

const toggleActive = async (row: ReportMetric) => {
  try {
    await request.patch(`/api/v1/console/report-metric/update/${row.id}`, {
      is_active: !row.is_active,
    });
    ElMessage.success(row.is_active ? '已停用' : '已启用');
    loadList();
  } catch (e) {
    ElMessage.error((e as Error).message || '操作失败');
  }
};

const handleDelete = async (row: ReportMetric) => {
  try {
    await ElMessageBox.confirm(
      `确认删除指标「${row.name}」？此操作不可恢复。`,
      '删除确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await request.delete(`/api/v1/console/report-metric/delete/${row.id}`);
    ElMessage.success('已删除');
    loadList();
  } catch (e) {
    ElMessage.error((e as Error).message || '删除失败');
  }
};

onMounted(() => {
  loadCategories();
  loadList();
});
</script>
