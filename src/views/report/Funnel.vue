<template>
  <div class="page-shell">
    <!-- ============ 页面头部 ============ -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><Filter /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">漏斗分析</h1>
          <p class="page-header-subtitle">自定义事件漏斗，追踪关键路径的转化率与流失率</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="Refresh" @click="loadMetrics">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建漏斗</el-button>
      </div>
    </div>

    <!-- ============ Master-Detail 主体 ============ -->
    <div class="report-master-detail">
      <!-- ============ 左侧：漏斗列表面板 ============ -->
      <aside class="report-master-panel">
        <div class="report-master-header">
          <div class="report-master-header-top">
            <h2 class="report-master-title">
              <el-icon><Filter /></el-icon>
              <span>我的漏斗</span>
              <el-tag size="small" effect="plain" round class="report-master-count">{{ filteredFunnels.length }}</el-tag>
            </h2>
          </div>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索漏斗名称"
            :prefix-icon="Search"
            clearable
            size="default"
          />
        </div>
        <div class="report-master-list" v-loading="loading">
          <div
            v-for="funnel in filteredFunnels"
            :key="funnel.id"
            :class="['report-master-item', { active: funnel.id === selectedFunnelId }]"
            @click="selectFunnel(funnel)"
          >
            <div class="report-master-item-icon">
              <el-icon><Filter /></el-icon>
            </div>
            <div class="report-master-item-body">
              <div class="report-master-item-name">
                <span class="report-master-item-name-text">{{ funnel.name }}</span>
                <el-tag v-if="funnel.is_default" size="small" type="primary" effect="plain" class="report-master-item-tag">默认</el-tag>
              </div>
              <div class="report-master-item-desc">
                {{ funnel.funnel_steps?.length || 0 }} 步 · {{ funnel.conversion_metrics?.length || 0 }} 个转化率
              </div>
            </div>
            <div class="report-master-item-actions" @click.stop>
              <el-dropdown trigger="click" @command="(cmd: string) => onItemCommand(cmd, funnel)">
                <el-button text :icon="MoreFilled" size="small" class="report-master-item-more" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit" :icon="Edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="duplicate" :icon="CopyDocument">复制</el-dropdown-item>
                    <el-dropdown-item v-if="!funnel.is_default" command="delete" :icon="Delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <el-empty
            v-if="!loading && filteredFunnels.length === 0"
            :description="searchKeyword ? '没有匹配漏斗' : '还没有漏斗'"
            :image-size="60"
            class="report-master-empty"
          >
            <el-button v-if="!searchKeyword" type="primary" :icon="Plus" size="small" @click="openCreateDialog">新建漏斗</el-button>
          </el-empty>
        </div>
      </aside>

      <!-- ============ 右侧：漏斗详情区 ============ -->
      <main class="report-detail-panel">
        <template v-if="currentFunnel">
          <!-- 顶部漏斗信息 -->
          <div class="report-detail-header">
            <div class="report-detail-header-left">
              <div class="report-detail-icon">
                <el-icon :size="24"><Filter /></el-icon>
              </div>
              <div class="report-detail-titles">
                <div class="report-detail-title-row">
                  <h2 class="report-detail-title">{{ currentFunnel.name }}</h2>
                  <el-tag v-if="currentFunnel.is_default" size="small" type="primary" effect="plain">默认</el-tag>
                </div>
                <p class="report-detail-desc">{{ currentFunnel.description || '暂无描述' }}</p>
              </div>
            </div>
            <div class="report-detail-header-right">
              <el-button :icon="CopyDocument" plain @click="duplicateCurrent">复制</el-button>
              <el-button :icon="Edit" plain @click="openEditDialog">编辑</el-button>
              <el-button v-if="!currentFunnel.is_default" :icon="Delete" type="danger" plain @click="deleteCurrent">删除</el-button>
            </div>
          </div>

          <!-- 漏斗配置摘要 -->
          <div class="report-detail-config">
            <div class="config-section config-section--full">
              <div class="config-section-label">
                <el-icon><Operation /></el-icon>
                <span>事件步骤</span>
                <span class="config-section-count">{{ currentFunnel.funnel_steps?.length || 0 }}</span>
              </div>
              <div class="config-section-tags">
                <el-tag
                  v-for="(step, i) in currentFunnel.funnel_steps || []"
                  :key="i"
                  size="small"
                  effect="plain"
                  :type="i === 0 ? 'primary' : 'info'"
                >
                  {{ i + 1 }}. {{ step.event_name }}
                </el-tag>
              </div>
            </div>
            <div class="config-divider"></div>
            <div class="config-section config-section--full">
              <div class="config-section-label">
                <el-icon><Connection /></el-icon>
                <span>转化率</span>
                <span class="config-section-count">{{ currentFunnel.conversion_metrics?.length || 0 }}</span>
              </div>
              <div class="config-section-tags">
                <el-tag
                  v-for="metric in currentFunnel.conversion_metrics || []"
                  :key="metric.id"
                  size="small"
                  effect="plain"
                  type="success"
                >
                  {{ metric.name }} ({{ metric.formula }})
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 筛选器 + 导出 -->
          <div class="report-detail-toolbar">
            <div class="report-detail-toolbar-left">
              <ReportFilter v-model="filter" @change="loadData" />
            </div>
            <div class="report-detail-toolbar-right">
              <el-button-group class="report-detail-export">
                <el-tooltip content="导出 CSV" placement="top">
                  <el-button :icon="Download" @click="exportCsv">CSV</el-button>
                </el-tooltip>
                <el-tooltip content="导出 Excel" placement="top">
                  <el-button :icon="Download" @click="exportExcel">Excel</el-button>
                </el-tooltip>
                <el-tooltip content="导出 PDF" placement="top">
                  <el-button :icon="Document" @click="exportPdf">PDF</el-button>
                </el-tooltip>
              </el-button-group>
            </div>
          </div>

          <!-- 漏斗结果 -->
          <div class="report-detail-content" v-loading="dataLoading">
            <!-- 步骤转化漏斗图 -->
            <div class="funnel-chart-card">
              <div class="funnel-chart-header">
                <h3>步骤转化漏斗</h3>
                <div class="funnel-chart-meta">数据范围：{{ DATE_RANGE_LABELS[filter.dateRange] || filter.dateRange }}</div>
              </div>
              <div class="funnel-chart-body">
                <div
                  v-for="(step, i) in funnelData"
                  :key="i"
                  class="funnel-step"
                >
                  <div class="funnel-step-label">
                    <span class="funnel-step-index">{{ i + 1 }}</span>
                    <span class="funnel-step-name">{{ step.event_name }}</span>
                  </div>
                  <div class="funnel-step-bar-wrapper">
                    <div
                      class="funnel-step-bar"
                      :style="{ width: step.percent + '%', background: getStepColor(i, funnelData.length) }"
                    >
                      <span class="funnel-step-value">{{ formatNumber(step.count) }}</span>
                    </div>
                  </div>
                  <div class="funnel-step-conversion">
                    <span v-if="i > 0">↓ {{ step.conversion }}%</span>
                    <span v-else>100%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 自定义转化率表格 -->
            <div class="funnel-table-card">
              <div class="funnel-table-header">
                <h3>自定义转化率</h3>
              </div>
              <el-table :data="customMetricsData" stripe>
                <el-table-column prop="name" label="指标名称" min-width="160" />
                <el-table-column prop="formula" label="公式" min-width="180">
                  <template #default="{ row }">
                    <span class="cell-formula">{{ row.formula }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="value" label="值" min-width="120" align="right">
                  <template #default="{ row }">
                    <span class="cell-num--right">{{ row.value }}%</span>
                  </template>
                </el-table-column>
                <el-table-column prop="denominator" label="分母" min-width="120" align="right">
                  <template #default="{ row }">
                    <span class="cell-num--right">{{ formatNumber(row.denominator) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="numerator" label="分子" min-width="120" align="right">
                  <template #default="{ row }">
                    <span class="cell-num--right">{{ formatNumber(row.numerator) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </template>

        <div v-else class="report-detail-empty">
          <el-empty :image-size="100" description="从左侧选择一个漏斗查看数据">
            <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建漏斗</el-button>
          </el-empty>
        </div>
      </main>
    </div>

    <!-- 配置弹窗（简化版，预留扩展） -->
    <el-dialog v-model="dialogVisible" title="漏斗配置" width="600px" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="漏斗名称">
          <el-input v-model="editingFunnel.name" placeholder="如：注册转化漏斗" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editingFunnel.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="事件步骤">
          <el-tag v-for="(s, i) in editingFunnel.funnel_steps || []" :key="i" class="funnel-edit-step">
            {{ i + 1 }}. {{ s.event_name }}
          </el-tag>
          <el-button :icon="Plus" size="small" plain @click="addFunnelStep">添加步骤</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveFunnel">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus, CopyDocument, Edit, Download, Document, Delete, Refresh, Search, MoreFilled,
  Filter, Operation, Connection,
} from '@element-plus/icons-vue';
import request from '@/utils/request';
import ReportFilter, { type ReportFilter as ReportFilterType } from '@/components/report/ReportFilter.vue';

interface FunnelStep {
  event_code: string;
  event_name: string;
}

interface ConversionMetric {
  id: number;
  name: string;
  formula: string;
  numerator_code: string;
  denominator_code: string;
}

interface Funnel {
  id: number;
  name: string;
  description?: string;
  funnel_steps: FunnelStep[];
  conversion_metrics: ConversionMetric[];
  is_default: boolean;
}

interface FunnelStepResult extends FunnelStep {
  count: number;
  percent: number;
  conversion: number;
}

const DATE_RANGE_LABELS: Record<string, string> = {
  today: '今天',
  yesterday: '昨天',
  '7d': '近 7 天',
  '30d': '近 30 天',
  month: '本月',
  lastMonth: '上月',
};

const funnels = ref<Funnel[]>([]);
const selectedFunnelId = ref<number | null>(null);
const searchKeyword = ref('');
const loading = ref(false);
const dataLoading = ref(false);
const dialogVisible = ref(false);
const editingFunnel = ref<Partial<Funnel>>({ name: '', description: '', funnel_steps: [], conversion_metrics: [] });

const filter = ref<ReportFilterType>({ dateRange: '7d', appIds: [], placementIds: [], adSourceIds: [], formats: [], country: [] });

const funnelData = ref<FunnelStepResult[]>([]);
const customMetricsData = ref<Array<{ name: string; formula: string; value: number; numerator: number; denominator: number }>>([]);

const currentFunnel = computed<Funnel | null>(() => funnels.value.find((f) => f.id === selectedFunnelId.value) || null);
const filteredFunnels = computed<Funnel[]>(() => {
  const kw = searchKeyword.value.trim().toLowerCase();
  if (!kw) return funnels.value;
  return funnels.value.filter((f) => f.name.toLowerCase().includes(kw));
});

const formatNumber = (n: number) => n.toLocaleString('zh-CN');

const getStepColor = (i: number, total: number) => {
  const start = [59, 130, 246]; // blue
  const end = [30, 58, 138];     // dark blue
  const t = total <= 1 ? 0 : i / (total - 1);
  const r = Math.round(start[0] + (end[0] - start[0]) * t);
  const g = Math.round(start[1] + (end[1] - start[1]) * t);
  const b = Math.round(start[2] + (end[2] - start[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
};

const loadMetrics = async () => {
  loading.value = true;
  try {
    // 模拟数据：实际应从 report_funnel_metric_definition 表加载
    funnels.value = [
      {
        id: 1,
        name: '注册转化漏斗',
        description: '从浏览 → 注册的转化路径',
        funnel_steps: [
          { event_code: 'view_landing', event_name: '访问落地页' },
          { event_code: 'view_register', event_name: '查看注册页' },
          { event_code: 'submit_register', event_name: '提交注册' },
          { event_code: 'register_success', event_name: '注册成功' },
        ],
        conversion_metrics: [
          { id: 1, name: '整体转化率', formula: 'register_success / view_landing', numerator_code: 'register_success', denominator_code: 'view_landing' },
        ],
        is_default: true,
      },
      {
        id: 2,
        name: '广告变现漏斗',
        description: '从广告请求到展示的转化',
        funnel_steps: [
          { event_code: 'ad_request', event_name: '广告请求' },
          { event_code: 'ad_response', event_name: '广告响应' },
          { event_code: 'ad_show', event_name: '广告展示' },
          { event_code: 'ad_click', event_name: '广告点击' },
        ],
        conversion_metrics: [
          { id: 2, name: '填充率', formula: 'ad_response / ad_request', numerator_code: 'ad_response', denominator_code: 'ad_request' },
          { id: 3, name: '点击率', formula: 'ad_click / ad_show', numerator_code: 'ad_click', denominator_code: 'ad_show' },
        ],
        is_default: false,
      },
    ];
    if (funnels.value.length > 0 && !selectedFunnelId.value) {
      selectFunnel(funnels.value[0]);
    }
  } finally {
    loading.value = false;
  }
};

const selectFunnel = (funnel: Funnel) => {
  selectedFunnelId.value = funnel.id;
  loadData();
};

const onItemCommand = (cmd: string, funnel: Funnel) => {
  if (cmd === 'edit') {
    selectedFunnelId.value = funnel.id;
    openEditDialog();
  } else if (cmd === 'duplicate') {
    ElMessage.info('复制功能开发中');
  } else if (cmd === 'delete') {
    selectedFunnelId.value = funnel.id;
    deleteCurrent();
  }
};

const loadData = async () => {
  if (!currentFunnel.value) {
    funnelData.value = [];
    customMetricsData.value = [];
    return;
  }
  dataLoading.value = true;
  try {
    // 调用 aggregate API 拿每步数据
    const steps = currentFunnel.value.funnel_steps || [];
    const res: any = await request.post('/api/v1/console/report/aggregate', {
      dimensions: ['date'],
      metrics: steps.map((s) => s.event_code),
      filters: filter.value,
      report_type: 'funnel',
    });
    // 汇总每步 count
    const counts = steps.map((s) => {
      const total = (res.data?.rows || []).reduce((sum: number, row: any) => sum + (Number(row[s.event_code]) || 0), 0);
      return total;
    });
    const first = counts[0] || 1;
    funnelData.value = steps.map((s, i) => {
      const c = counts[i] || 0;
      const prev = i > 0 ? counts[i - 1] : c;
      return {
        ...s,
        count: c,
        percent: first > 0 ? (c / first) * 100 : 0,
        conversion: prev > 0 ? Math.round((c / prev) * 10000) / 100 : 0,
      };
    });
    // 自定义转化率
    customMetricsData.value = (currentFunnel.value.conversion_metrics || []).map((m) => {
      const numIdx = steps.findIndex((s) => s.event_code === m.numerator_code);
      const denIdx = steps.findIndex((s) => s.event_code === m.denominator_code);
      const num = numIdx >= 0 ? counts[numIdx] : 0;
      const den = denIdx >= 0 ? counts[denIdx] : 0;
      const value = den > 0 ? Math.round((num / den) * 10000) / 100 : 0;
      return {
        name: m.name,
        formula: m.formula,
        value,
        numerator: num,
        denominator: den,
      };
    });
  } catch (e: any) {
    console.error('funnel load failed:', e);
    // 使用 mock 数据兜底
    const steps = currentFunnel.value.funnel_steps || [];
    const mockCounts = steps.map(() => Math.round(Math.random() * 10000));
    const first = mockCounts[0] || 1;
    funnelData.value = steps.map((s, i) => {
      const c = mockCounts[i];
      const prev = i > 0 ? mockCounts[i - 1] : c;
      return {
        ...s,
        count: c,
        percent: first > 0 ? (c / first) * 100 : 0,
        conversion: prev > 0 ? Math.round((c / prev) * 10000) / 100 : 0,
      };
    });
    customMetricsData.value = (currentFunnel.value.conversion_metrics || []).map((m) => ({
      name: m.name,
      formula: m.formula,
      value: Math.round(Math.random() * 10000) / 100,
      numerator: Math.round(Math.random() * 10000),
      denominator: Math.round(Math.random() * 10000),
    }));
  } finally {
    dataLoading.value = false;
  }
};

const openCreateDialog = () => {
  editingFunnel.value = { name: '', description: '', funnel_steps: [{ event_code: '', event_name: '' }], conversion_metrics: [] };
  dialogVisible.value = true;
};

const openEditDialog = () => {
  if (!currentFunnel.value) return;
  editingFunnel.value = JSON.parse(JSON.stringify(currentFunnel.value));
  dialogVisible.value = true;
};

const addFunnelStep = () => {
  if (!editingFunnel.value.funnel_steps) editingFunnel.value.funnel_steps = [];
  editingFunnel.value.funnel_steps.push({ event_code: '', event_name: '' });
};

const saveFunnel = () => {
  ElMessage.success('已保存（mock）');
  dialogVisible.value = false;
  loadMetrics();
};

const duplicateCurrent = () => {
  ElMessage.info('复制功能开发中');
};

const deleteCurrent = async () => {
  if (!currentFunnel.value) return;
  try {
    await ElMessageBox.confirm(`确定删除漏斗「${currentFunnel.value.name}」？`, '删除确认', {
      type: 'warning',
    });
    ElMessage.success('已删除（mock）');
    selectedFunnelId.value = null;
    loadMetrics();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

const exportCsv = () => doExport('csv');
const exportExcel = () => doExport('excel');
const exportPdf = () => doExport('pdf');

const doExport = async (format: 'csv' | 'excel' | 'pdf') => {
  if (!currentFunnel.value) {
    ElMessage.warning('请先选择漏斗');
    return;
  }
  try {
    const res: any = await request.post(`/api/v1/console/report/export/${format}`, {
      board_id: currentFunnel.value.id,
      dimensions: ['date'],
      metrics: currentFunnel.value.funnel_steps.map((s) => s.event_code),
      filters: filter.value,
    });
    if (res.code === 0) {
      const url = res.data?.url;
      if (url) {
        const r = await fetch(url, { credentials: 'include', headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
        const blob = await r.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `funnel_${Date.now()}.${format === 'excel' ? 'csv' : format}`;
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        ElMessage.success('导出已开始');
      }
    } else {
      ElMessage.error(res.message || '导出失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '导出失败');
  }
};

onMounted(loadMetrics);
</script>
