<template>
  <div class="page-shell">
    <!-- ============ 页面头部 ============ -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><SetUp /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">报表指标字典</h1>
          <p class="page-header-subtitle">管理综合报表可选的指标项，包括基础指标、复合公式、实际/预估字段</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="Refresh" @click="loadMetrics">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建指标</el-button>
      </div>
    </div>

    <!-- ============ Master-Detail 主体 ============ -->
    <div class="report-master-detail">
      <!-- ============ 左侧：分类列表面板 ============ -->
      <aside class="report-master-panel">
        <div class="report-master-header">
          <div class="report-master-header-top">
            <h2 class="report-master-title">
              <el-icon><Collection /></el-icon>
              <span>指标分类</span>
              <el-tag size="small" effect="plain" round class="report-master-count">{{ categories.length }}</el-tag>
            </h2>
          </div>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索指标 / code"
            :prefix-icon="Search"
            clearable
            size="default"
          />
        </div>
        <div class="report-master-list" v-loading="loading">
          <div
            v-for="cat in filteredCategories"
            :key="cat.code"
            :class="['report-master-item', { active: cat.code === selectedCategory }]"
            @click="selectedCategory = cat.code"
          >
            <div class="report-master-item-icon">
              <el-icon><component :is="cat.icon" /></el-icon>
            </div>
            <div class="report-master-item-body">
              <div class="report-master-item-name">
                <span class="report-master-item-name-text">{{ cat.name }}</span>
              </div>
              <div class="report-master-item-desc">{{ cat.count }} 个指标</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- ============ 右侧：指标列表 ============ -->
      <main class="report-detail-panel">
        <div class="report-detail-header">
          <div class="report-detail-header-left">
            <div class="report-detail-icon">
              <el-icon :size="24"><DataLine /></el-icon>
            </div>
            <div class="report-detail-titles">
              <h2 class="report-detail-title">{{ currentCategoryName }}</h2>
              <p class="report-detail-desc">{{ currentCategoryDesc }}</p>
            </div>
          </div>
        </div>

        <div class="report-detail-toolbar">
          <div class="report-detail-toolbar-left">
            <span class="metric-count">共 {{ filteredMetrics.length }} 个指标</span>
          </div>
          <div class="report-detail-toolbar-right">
            <el-button-group>
              <el-tooltip content="导出字典" placement="top">
                <el-button :icon="Download" @click="exportDict">导出</el-button>
              </el-tooltip>
            </el-button-group>
          </div>
        </div>

        <div class="report-detail-content" v-loading="dataLoading">
          <el-table
            :data="filteredMetrics"
            stripe
            :default-sort="{ prop: 'sort_order', order: 'ascending' }"
            row-key="id"
            class="metric-table"
          >
            <el-table-column prop="name" label="指标名称" min-width="140">
              <template #default="{ row }">
                <span class="metric-name">{{ row.name }}</span>
                <el-tag v-if="row.is_system" size="small" type="info" effect="plain" class="metric-sys-tag">系统</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="code" label="标识 code" min-width="160">
              <template #default="{ row }">
                <span class="cell-code">{{ row.code }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" min-width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="getCategoryColor(row.category) as any" effect="plain">
                  {{ getCategoryLabel(row.category) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="value_type" label="类型" min-width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="row.value_type === 'actual' ? 'success' : 'warning'" effect="plain">
                  {{ row.value_type === 'actual' ? '实际' : '预估' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="format" label="格式" min-width="80">
              <template #default="{ row }">
                <span class="cell-secondary">{{ formatLabel(row.format) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="formula" label="公式" min-width="200">
              <template #default="{ row }">
                <span v-if="row.formula" class="cell-formula" :title="row.formula">{{ row.formula }}</span>
                <span v-else class="cell-empty">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.description" class="cell-secondary">{{ row.description }}</span>
                <span v-else class="cell-empty">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="sort_order" label="排序" width="80" sortable />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button text :icon="Edit" size="small" @click="openEditDialog(row)">编辑</el-button>
                <el-button text :icon="CopyDocument" size="small" @click="duplicateMetric(row)">复制</el-button>
                <el-button
                  v-if="!row.is_system"
                  text
                  :icon="Delete"
                  size="small"
                  type="danger"
                  @click="deleteMetric(row)"
                >删除</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <div class="table-empty">
                <el-empty :image-size="80" :description="searchKeyword ? '没有匹配指标' : '该分类下暂无指标'" />
              </div>
            </template>
          </el-table>
        </div>
      </main>
    </div>

    <!-- 配置弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingMetric.id ? '编辑指标' : '新建指标'"
      width="640px"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="editingMetric" :rules="formRules" label-width="100px">
        <el-form-item label="指标名称" prop="name">
          <el-input v-model="editingMetric.name" placeholder="如：实际收入" />
        </el-form-item>
        <el-form-item label="标识 code" prop="code">
          <el-input v-model="editingMetric.code" placeholder="如：revenue_actual（英文下划线）" :disabled="!!editingMetric.id" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="editingMetric.category" placeholder="选择分类" style="width: 100%">
            <el-option v-for="cat in CATEGORY_OPTIONS" :key="cat.code" :label="cat.name" :value="cat.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="value_type">
          <el-radio-group v-model="editingMetric.value_type">
            <el-radio-button value="actual">实际值</el-radio-button>
            <el-radio-button value="estimated">预估值</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="格式" prop="format">
          <el-select v-model="editingMetric.format" placeholder="选择格式" style="width: 100%">
            <el-option label="整数" value="number" />
            <el-option label="小数（2位）" value="decimal" />
            <el-option label="百分比" value="percent" />
            <el-option label="货币" value="currency" />
            <el-option label="时长" value="duration" />
          </el-select>
        </el-form-item>
        <el-form-item label="公式">
          <el-input
            v-model="editingMetric.formula"
            placeholder="如：revenue_actual / impressions * 1000（可选，复合指标）"
          />
          <div class="form-hint">复合指标支持 +、-、*、/ 运算，仅支持同分类内的 metric code</div>
        </el-form-item>
        <el-form-item label="说明">
          <el-input
            v-model="editingMetric.description"
            type="textarea"
            :rows="2"
            placeholder="指标的详细说明..."
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="editingMetric.sort_order" :min="0" :step="10" />
        </el-form-item>
        <el-form-item label="系统指标">
          <el-switch v-model="editingMetric.is_system" :disabled="!!editingMetric.id" />
          <span class="form-hint">系统指标不可删除，仅管理员可编辑</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveMetric">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import {
  Plus, Edit, Delete, Refresh, Search, Download, CopyDocument,
  SetUp, Collection, DataLine,
  Money, Picture, View, Aim, DataAnalysis, Filter, Coin, Histogram,
  Promotion, ChatLineRound, Star
} from '@element-plus/icons-vue';
import request from '@/utils/request';

interface Metric {
  id: number;
  code: string;
  name: string;
  category: string;
  value_type: 'actual' | 'estimated';
  format: 'number' | 'decimal' | 'percent' | 'currency' | 'duration';
  formula?: string;
  description?: string;
  sort_order: number;
  is_system: boolean;
}

const CATEGORY_OPTIONS = [
  { code: 'taku_revenue', name: '收入', icon: Money },
  { code: 'taku_impression', name: '展示', icon: View },
  { code: 'taku_click', name: '点击', icon: Aim },
  { code: 'taku_conversion', name: '转化', icon: Promotion },
  { code: 'taku_fillrate', name: '填充率', icon: Filter },
  { code: 'taku_request', name: '请求', icon: DataAnalysis },
  { code: 'taku_ecpm', name: 'eCPM', icon: Coin },
  { code: 'taku_arpdau', name: 'ARPDAU', icon: Money },
  { code: 'taku_user', name: '用户', icon: Star },
  { code: 'taku_engagement', name: '互动', icon: ChatLineRound },
  { code: 'taku_video', name: '视频', icon: Picture },
  { code: 'taku_performance', name: '性能', icon: Histogram },
  { code: 'other', name: '其他', icon: Collection },
];

const CATEGORY_COLOR: Record<string, string> = {
  taku_revenue: 'success',
  taku_impression: '',
  taku_click: 'warning',
  taku_conversion: 'success',
  taku_fillrate: 'info',
  taku_request: '',
  taku_ecpm: 'success',
  taku_arpdau: 'success',
  taku_user: 'primary',
  taku_engagement: 'info',
  taku_video: 'warning',
  taku_performance: 'danger',
  other: 'info',
};

const metrics = ref<Metric[]>([]);
const loading = ref(false);
const dataLoading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const searchKeyword = ref('');
const selectedCategory = ref<string>('taku_revenue');
const editingMetric = ref<Partial<Metric & { id?: number }>>({});
const formRef = ref<FormInstance>();

const formRules: FormRules = {
  name: [{ required: true, message: '请输入指标名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入 code', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_]*$/, message: 'code 必须以小写字母开头，只能包含小写字母、数字、下划线', trigger: 'blur' },
  ],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  value_type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  format: [{ required: true, message: '请选择格式', trigger: 'change' }],
};

const categories = computed<Array<{ code: string; name: string; icon: any; count: number }>>(() => {
  const groups: Record<string, number> = {};
  for (const m of metrics.value) {
    groups[m.category] = (groups[m.category] || 0) + 1;
  }
  return CATEGORY_OPTIONS.map((c) => ({
    code: c.code,
    name: c.name,
    icon: c.icon,
    count: groups[c.code] || 0,
  })).filter((c) => c.count > 0 || c.code === selectedCategory.value);
});

const filteredCategories = computed(() => categories.value);

const currentCategoryName = computed(() => {
  return CATEGORY_OPTIONS.find((c) => c.code === selectedCategory.value)?.name || '未知分类';
});

const currentCategoryDesc = computed(() => {
  const total = filteredMetrics.value.length;
  return `当前分类共 ${total} 个指标`;
});

const filteredMetrics = computed<Metric[]>(() => {
  let list = metrics.value.filter((m) => m.category === selectedCategory.value);
  const kw = searchKeyword.value.trim().toLowerCase();
  if (kw) {
    list = metrics.value.filter((m) =>
      m.name.toLowerCase().includes(kw) ||
      m.code.toLowerCase().includes(kw) ||
      (m.description || '').toLowerCase().includes(kw)
    );
  }
  return list.sort((a, b) => a.sort_order - b.sort_order);
});

const formatLabel = (f: string) => {
  const map: Record<string, string> = {
    number: '整数',
    decimal: '小数',
    percent: '%',
    currency: '¥',
    duration: '时长',
  };
  return map[f] || f;
};

const getCategoryLabel = (code: string) => {
  return CATEGORY_OPTIONS.find((c) => c.code === code)?.name || code;
};

const getCategoryColor = (code: string) => CATEGORY_COLOR[code] || 'info';

const loadMetrics = async () => {
  loading.value = true;
  dataLoading.value = true;
  try {
    const res: any = await request.get('/api/v1/console/report-metric/list');
    if (res.code === 0) {
      metrics.value = res.data || [];
    } else {
      ElMessage.error(res.message || '加载指标失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载指标失败');
  } finally {
    loading.value = false;
    dataLoading.value = false;
  }
};

const resetForm = () => {
  editingMetric.value = {
    code: '',
    name: '',
    category: selectedCategory.value,
    value_type: 'actual',
    format: 'number',
    sort_order: 100,
    is_system: false,
  };
  formRef.value?.clearValidate();
};

const openCreateDialog = () => {
  resetForm();
  dialogVisible.value = true;
};

const openEditDialog = (metric: Metric) => {
  editingMetric.value = { ...metric };
  dialogVisible.value = true;
};

const saveMetric = async () => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const isEdit = !!editingMetric.value.id;
    const url = isEdit
      ? `/api/v1/console/report-metric/update/${editingMetric.value.id}`
      : '/api/v1/console/report-metric/create';
    const res: any = await request.post(url, editingMetric.value);
    if (res.code === 0) {
      ElMessage.success(isEdit ? '已更新' : '已创建');
      dialogVisible.value = false;
      loadMetrics();
    } else {
      ElMessage.error(res.message || '保存失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

const duplicateMetric = (metric: Metric) => {
  editingMetric.value = {
    ...metric,
    id: undefined,
    code: metric.code + '_copy',
    name: metric.name + ' (副本)',
    is_system: false,
  };
  dialogVisible.value = true;
};

const deleteMetric = async (metric: Metric) => {
  try {
    await ElMessageBox.confirm(`确定删除指标「${metric.name}」？此操作不可恢复。`, '删除确认', {
      type: 'warning',
    });
    const res: any = await request.delete(`/api/v1/console/report-metric/delete/${metric.id}`);
    if (res.code === 0) {
      ElMessage.success('已删除');
      loadMetrics();
    } else {
      ElMessage.error(res.message || '删除失败');
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败');
  }
};

const exportDict = () => {
  const csv = [
    ['code', 'name', 'category', 'value_type', 'format', 'formula', 'description', 'sort_order', 'is_system'],
    ...metrics.value.map((m) => [m.code, m.name, m.category, m.value_type, m.format, m.formula || '', m.description || '', m.sort_order, m.is_system ? '1' : '0']),
  ].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `metric_dict_${Date.now()}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  ElMessage.success('已导出');
};

onMounted(loadMetrics);
</script>
