<template>
  <div class="page-shell">
    <!-- ============ 页面头部 ============ -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><User /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">用户行为</h1>
          <p class="page-header-subtitle">分析用户活跃度、使用频次、价值分布等行为指标</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="Refresh" @click="loadMetrics">刷新</el-button>
      </div>
    </div>

    <!-- ============ Master-Detail 主体 ============ -->
    <div class="report-master-detail">
      <!-- ============ 左侧：行为指标列表面板 ============ -->
      <aside class="report-master-panel">
        <div class="report-master-header">
          <div class="report-master-header-top">
            <h2 class="report-master-title">
              <el-icon><User /></el-icon>
              <span>行为指标</span>
              <el-tag size="small" effect="plain" round class="report-master-count">{{ behaviorMetrics.length }}</el-tag>
            </h2>
          </div>
        </div>
        <div class="report-master-list" v-loading="loading">
          <div
            v-for="metric in behaviorMetrics"
            :key="metric.code"
            :class="['report-master-item', { active: metric.code === selectedMetricCode }]"
            @click="selectMetric(metric)"
          >
            <div class="report-master-item-icon">
              <el-icon><component :is="metric.icon" /></el-icon>
            </div>
            <div class="report-master-item-body">
              <div class="report-master-item-name">
                <span class="report-master-item-name-text">{{ metric.name }}</span>
                <el-tag v-if="metric.required" size="small" type="primary" effect="plain" class="report-master-item-tag">核心</el-tag>
              </div>
              <div class="report-master-item-desc">{{ metric.description }}</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- ============ 右侧：行为指标详情区 ============ -->
      <main class="report-detail-panel">
        <template v-if="currentMetric">
          <!-- 顶部指标信息 -->
          <div class="report-detail-header">
            <div class="report-detail-header-left">
              <div class="report-detail-icon">
                <el-icon :size="24"><component :is="currentMetric.icon" /></el-icon>
              </div>
              <div class="report-detail-titles">
                <div class="report-detail-title-row">
                  <h2 class="report-detail-title">{{ currentMetric.name }}</h2>
                  <el-tag v-if="currentMetric.required" size="small" type="primary" effect="plain">核心</el-tag>
                </div>
                <p class="report-detail-desc">{{ currentMetric.description }}</p>
              </div>
            </div>
            <div class="report-detail-header-right">
              <el-button-group class="report-detail-export">
                <el-tooltip content="导出 CSV" placement="top">
                  <el-button :icon="Download" @click="exportCsv">CSV</el-button>
                </el-tooltip>
                <el-tooltip content="导出 PDF" placement="top">
                  <el-button :icon="Document" @click="exportPdf">PDF</el-button>
                </el-tooltip>
              </el-button-group>
            </div>
          </div>

          <!-- 指标配置摘要 -->
          <div class="report-detail-config">
            <div class="config-section config-section--full">
              <div class="config-section-label">
                <el-icon><DataAnalysis /></el-icon>
                <span>分析维度</span>
                <span class="config-section-count">{{ currentMetric.dimensions.length }}</span>
              </div>
              <div class="config-section-tags">
                <el-tag
                  v-for="dim in currentMetric.dimensions"
                  :key="dim.code"
                  size="small"
                  effect="plain"
                  type="info"
                >
                  {{ dim.name }}
                </el-tag>
              </div>
            </div>
            <div class="config-divider"></div>
            <div class="config-section config-section--full">
              <div class="config-section-label">
                <el-icon><Histogram /></el-icon>
                <span>分析指标</span>
                <span class="config-section-count">{{ currentMetric.metrics.length }}</span>
              </div>
              <div class="config-section-tags">
                <el-tag
                  v-for="m in currentMetric.metrics"
                  :key="m.code"
                  size="small"
                  effect="plain"
                  :type="m.required ? 'primary' : 'success'"
                >
                  {{ m.name }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 筛选器 + 视图切换 -->
          <div class="report-detail-toolbar">
            <div class="report-detail-toolbar-left">
              <ReportFilter v-model="filter" @change="loadData" />
            </div>
            <div class="report-detail-toolbar-right">
              <el-radio-group v-model="viewMode" size="default">
                <el-radio-button value="trend"><el-icon><TrendCharts /></el-icon> 趋势</el-radio-button>
                <el-radio-button value="bar"><el-icon><DataLine /></el-icon> 柱状</el-radio-button>
                <el-radio-button value="table"><el-icon><Grid /></el-icon> 表格</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <!-- 视图区域 -->
          <div class="report-detail-content" v-loading="dataLoading">
            <ReportTrendView
              v-if="viewMode === 'trend'"
              :board="trendBoard"
              :data="tableData"
            />
            <ReportBarView
              v-else-if="viewMode === 'bar'"
              :board="trendBoard"
              :data="tableData"
            />
            <ReportTableView
              v-else
              :board="trendBoard"
              :data="tableData"
            />
          </div>
        </template>

        <div v-else class="report-detail-empty">
          <el-empty :image-size="100" description="从左侧选择一个行为指标查看数据" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Download, Document, Refresh,
  User, DataAnalysis, Histogram, DataLine, TrendCharts, Grid,
  Clock, Money, View,
} from '@element-plus/icons-vue';
import request from '@/utils/request';
import ReportFilter, { type ReportFilter as FilterType } from '@/components/report/ReportFilter.vue';
import ReportTableView from '@/components/report/ReportTableView.vue';
import ReportTrendView from '@/components/report/ReportTrendView.vue';
import ReportBarView from '@/components/report/ReportBarView.vue';

interface BehaviorMetric {
  code: string;
  name: string;
  description: string;
  icon: any;
  required: boolean;
  dimensions: Array<{ code: string; name: string }>;
  metrics: Array<{ code: string; name: string; required: boolean }>;
}

const behaviorMetrics = ref<BehaviorMetric[]>([
  {
    code: 'frequency',
    name: '展示频次',
    description: '用户平均每日展示广告次数、分布、衰减',
    icon: View,
    required: true,
    dimensions: [
      { code: 'date', name: '按日' },
      { code: 'frequency_bucket', name: '按频次分段' },
    ],
    metrics: [
      { code: 'avg_impressions_per_user', name: '人均展示次数', required: true },
      { code: 'user_count', name: '覆盖用户数', required: true },
    ],
  },
  {
    code: 'value',
    name: '用户价值',
    description: '用户贡献收入分布，含预估与实际',
    icon: Money,
    required: true,
    dimensions: [
      { code: 'date', name: '按日' },
      { code: 'value_bucket', name: '按价值分段' },
    ],
    metrics: [
      { code: 'revenue_actual', name: '实际收入', required: true },
      { code: 'revenue_estimated', name: '预估收入', required: false },
      { code: 'high_value_users', name: '高价值用户数', required: false },
    ],
  },
  {
    code: 'duration',
    name: '使用时长',
    description: '人均使用时长、会话次数、单次时长',
    icon: Clock,
    required: true,
    dimensions: [
      { code: 'date', name: '按日' },
    ],
    metrics: [
      { code: 'avg_duration_per_user', name: '人均使用时长', required: true },
      { code: 'avg_session_count', name: '人均会话次数', required: true },
      { code: 'avg_session_duration', name: '单次使用时长', required: true },
    ],
  },
]);

const selectedMetricCode = ref<string>('frequency');
const loading = ref(false);
const dataLoading = ref(false);
const viewMode = ref<'trend' | 'bar' | 'table'>('trend');

const filter = ref<FilterType>({ dateRange: '7d', appIds: [], placementIds: [], adSourceIds: [], formats: [], country: [] });
const tableData = ref<Array<Record<string, string | number>>>([]);

const currentMetric = computed<BehaviorMetric | null>(
  () => behaviorMetrics.value.find((m) => m.code === selectedMetricCode.value) || null,
);

const trendBoard = computed(() => ({
  id: 0,
  config: {
    dimensions: ['date'],
    metrics: currentMetric.value?.metrics.map((m) => m.code) || [],
    filters: {},
    layout: { view: viewMode.value as any },
  },
  name: currentMetric.value?.name || '',
}));

const loadMetrics = async () => {
  loading.value = true;
  await new Promise((r) => setTimeout(r, 200));
  loading.value = false;
  if (currentMetric.value) loadData();
};

const selectMetric = (metric: BehaviorMetric) => {
  selectedMetricCode.value = metric.code;
  viewMode.value = 'trend';
  loadData();
};

const loadData = async () => {
  if (!currentMetric.value) {
    tableData.value = [];
    return;
  }
  dataLoading.value = true;
  try {
    const res: any = await request.post('/api/v1/console/report/aggregate', {
      dimensions: ['date'],
      metrics: currentMetric.value.metrics.map((m) => m.code),
      filters: filter.value,
      report_type: 'behavior',
    });
    if (res.code === 0) {
      tableData.value = res.data?.rows || [];
    } else {
      tableData.value = generateMock();
    }
  } catch (e: any) {
    console.error('behavior load failed:', e);
    tableData.value = generateMock();
  } finally {
    dataLoading.value = false;
  }
};

const generateMock = (): Array<Record<string, string | number>> => {
  const days = 7;
  const result: Array<Record<string, string | number>> = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const row: Record<string, string | number> = { date: d.toISOString().slice(0, 10) };
    if (!currentMetric.value) continue;
    for (const m of currentMetric.value.metrics) {
      row[m.code] = Math.round(Math.random() * 10000 * 100) / 100;
    }
    result.push(row);
  }
  return result;
};

const exportCsv = () => doExport('csv');
const exportPdf = () => doExport('pdf');

const doExport = async (format: 'csv' | 'pdf') => {
  if (!currentMetric.value) {
    ElMessage.warning('请先选择行为指标');
    return;
  }
  try {
    const res: any = await request.post(`/api/v1/console/report/export/${format}`, {
      board_id: 0,
      dimensions: ['date'],
      metrics: currentMetric.value.metrics.map((m) => m.code),
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
        a.download = `behavior_${currentMetric.value.code}_${Date.now()}.${format}`;
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
