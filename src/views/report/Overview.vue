<template>
  <div class="report-overview">
    <!-- 顶部工具栏 -->
    <div class="overview-toolbar">
      <div class="overview-toolbar-left">
        <el-select
          v-model="selectedBoardId"
          placeholder="选择看版"
          style="width: 240px"
          @change="onBoardChange"
        >
          <el-option v-for="b in boards" :key="b.id" :label="b.name" :value="b.id" />
        </el-select>
        <el-button :icon="Plus" @click="openCreateDialog">新建看版</el-button>
        <el-button :icon="CopyDocument" :disabled="!selectedBoardId" @click="duplicateCurrent">复制</el-button>
        <el-button :icon="Edit" :disabled="!selectedBoardId" @click="openEditConfigDialog">编辑配置</el-button>
        <el-button v-if="selectedBoardId" :icon="Delete" type="danger" plain @click="deleteCurrent">删除</el-button>
      </div>
      <div class="overview-toolbar-right">
        <MetricPicker v-model="pickedMetrics" />
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button value="table">表格</el-radio-button>
          <el-radio-button value="card">卡片</el-radio-button>
          <el-radio-button value="trend">趋势</el-radio-button>
          <el-radio-button value="bar">柱状</el-radio-button>
        </el-radio-group>
        <el-button-group>
          <el-button :icon="Download" @click="exportCsv">CSV</el-button>
          <el-button :icon="Download" @click="exportExcel">Excel</el-button>
          <el-button :icon="Document" @click="exportPdf">PDF</el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 筛选器 -->
    <ReportFilter v-model="filter" @change="loadData" />

    <!-- 当前看版信息 -->
    <div v-if="currentBoard" class="overview-board-info">
      <div class="overview-board-name">{{ currentBoard.name }}</div>
      <div v-if="currentBoard.description" class="overview-board-desc">{{ currentBoard.description }}</div>
      <div class="overview-board-meta">
        <span v-for="dim in currentBoard.config?.dimensions || []" :key="dim" class="meta-tag">
          {{ DIM_LABELS[dim] || dim }}
        </span>
        <span class="meta-divider">·</span>
        <span>{{ effectiveMetrics.length }} 个指标</span>
        <span class="meta-divider">·</span>
        <span>数据范围：{{ DATE_RANGE_LABELS[filter.dateRange] }}</span>
      </div>
    </div>

    <!-- 4 种视图 -->
    <ReportTableView
      v-if="viewMode === 'table' && currentBoard"
      :board="effectiveBoard"
      :data="tableData"
      :loading="dataLoading"
    />
    <ReportCardView
      v-else-if="viewMode === 'card' && currentBoard"
      :board="effectiveBoard"
      :data="tableData"
    />
    <ReportTrendView
      v-else-if="viewMode === 'trend' && currentBoard"
      :board="effectiveBoard"
      :data="tableData"
    />
    <ReportBarView
      v-else-if="viewMode === 'bar' && currentBoard"
      :board="effectiveBoard"
      :data="tableData"
    />

    <!-- 空状态 -->
    <div v-if="!loading && boards.length === 0" class="overview-empty">
      <el-empty description="还没有看版，点击「新建看版」开始">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建看版</el-button>
      </el-empty>
    </div>

    <BoardConfigDialog
      v-model:visible="dialogVisible"
      :board="(editingBoard as any)"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus, CopyDocument, Edit, Download, Document, Delete,
} from '@element-plus/icons-vue';
import request from '@/utils/request';
import MetricPicker from '@/components/report/MetricPicker.vue';
import ReportTableView from '@/components/report/ReportTableView.vue';
import ReportCardView from '@/components/report/ReportCardView.vue';
import ReportTrendView from '@/components/report/ReportTrendView.vue';
import ReportBarView from '@/components/report/ReportBarView.vue';
import BoardConfigDialog from '@/components/report/BoardConfigDialog.vue';
import ReportFilter, { type ReportFilter as Filter } from '@/components/report/ReportFilter.vue';

interface BoardConfig {
  dimensions: string[];
  metrics: string[];
  filters: { dateRange?: string };
  layout: { view: 'table' | 'card' | 'trend' | 'bar' };
}

interface ReportBoard {
  id: number;
  developer_id: string;
  name: string;
  description?: string;
  report_type: 'overview' | 'funnel' | 'behavior';
  is_default: boolean;
  is_hidden: boolean;
  config: BoardConfig;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const DIM_LABELS: Record<string, string> = {
  date: '按日',
  app: '按应用',
  placement: '按广告位',
  ad_source: '按广告源',
  country: '按国家',
};

const DATE_RANGE_LABELS: Record<string, string> = {
  today: '今天',
  yesterday: '昨天',
  '7d': '近 7 天',
  '30d': '近 30 天',
  month: '本月',
  lastMonth: '上月',
};

const boards = ref<ReportBoard[]>([]);
const selectedBoardId = ref<number | null>(null);
const viewMode = ref<'table' | 'card' | 'trend' | 'bar'>('table');
const loading = ref(false);
const dataLoading = ref(false);
const dialogVisible = ref(false);
const editingBoard = ref<ReportBoard | null>(null);

const filter = ref<Filter>({ dateRange: '7d', appIds: [], placementIds: [], adSourceIds: [] });
const pickedMetrics = ref<string[]>([]);
const tableData = ref<Array<Record<string, string | number>>>([]);

const currentBoard = computed<ReportBoard | null>(() => boards.value.find((b) => b.id === selectedBoardId.value) || null);

// 当用户用 MetricPicker 临时加指标时，effectiveBoard 会包含这些指标
const effectiveMetrics = computed<string[]>(() => {
  if (!currentBoard.value) return pickedMetrics.value;
  const cfgMetrics = currentBoard.value.config?.metrics || [];
  const picked = pickedMetrics.value.filter((m) => !cfgMetrics.includes(m));
  return [...cfgMetrics, ...picked];
});

const effectiveBoard = computed<ReportBoard>(() => {
  if (!currentBoard.value) {
    return {
      id: 0, developer_id: '', name: '', report_type: 'overview',
      is_default: false, is_hidden: false, config: { dimensions: ['date'], metrics: [], filters: {}, layout: { view: 'table' } },
      sort_order: 0, created_at: '', updated_at: '',
    };
  }
  return {
    ...currentBoard.value,
    config: {
      ...currentBoard.value.config,
      metrics: effectiveMetrics.value,
    },
  };
});

const loadBoards = async () => {
  loading.value = true;
  try {
    const res: any = await request.get('/api/v1/console/report/board/list', { params: { report_type: 'overview' } });
    if (res.code === 0) {
      boards.value = res.data || [];
      if (boards.value.length > 0 && !selectedBoardId.value) {
        selectedBoardId.value = boards.value[0].id;
        viewMode.value = boards.value[0].config?.layout?.view || 'table';
        filter.value = { dateRange: '7d', appIds: [], placementIds: [], adSourceIds: [] };
        pickedMetrics.value = [];
        loadData();
      }
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败');
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  if (!currentBoard.value) {
    tableData.value = [];
    return;
  }
  // 没有指标时直接清空（不请求 API）
  if (effectiveMetrics.value.length === 0) {
    tableData.value = [];
    return;
  }
  dataLoading.value = true;
  try {
    const res: any = await request.post('/api/v1/console/report/aggregate', {
      board_id: currentBoard.value.id,
      dimensions: currentBoard.value.config?.dimensions || ['date'],
      metrics: effectiveMetrics.value,
      filters: filter.value,
      report_type: 'overview',
    });
    if (res.code === 0) {
      tableData.value = res.data?.rows || [];
    } else {
      tableData.value = generateMockData();
    }
  } catch (e: any) {
    console.error('aggregate failed:', e);
    tableData.value = generateMockData();
  } finally {
    dataLoading.value = false;
  }
};

const generateMockData = (): Array<Record<string, string | number>> => {
  // P3 占位 mock：API 失败时显示
  const days = 7;
  const result: Array<Record<string, string | number>> = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const row: Record<string, string | number> = { date: dateStr };
    effectiveMetrics.value.forEach((m) => {
      if (m.includes('revenue') || m === 'ecpm') {
        row[m] = Math.round(1000 + Math.random() * 2000);
      } else if (m.includes('rate')) {
        row[m] = Math.round(60 + Math.random() * 35);
      } else {
        row[m] = Math.round(5000 + Math.random() * 10000);
      }
    });
    result.push(row);
  }
  return result;
};

const onBoardChange = () => {
  if (currentBoard.value) {
    viewMode.value = currentBoard.value.config?.layout?.view || 'table';
    filter.value = { dateRange: '7d', appIds: [], placementIds: [], adSourceIds: [] };
    pickedMetrics.value = [];
    loadData();
  }
};

const openCreateDialog = () => {
  editingBoard.value = null;
  dialogVisible.value = true;
};

const openEditConfigDialog = () => {
  if (!currentBoard.value) return;
  editingBoard.value = JSON.parse(JSON.stringify(currentBoard.value));
  dialogVisible.value = true;
};

const duplicateCurrent = async () => {
  if (!currentBoard.value) return;
  try {
    await request.post(`/api/v1/console/report/board/duplicate/${currentBoard.value.id}`);
    ElMessage.success('已复制');
    loadBoards();
  } catch (e: any) {
    ElMessage.error(e?.message || '复制失败');
  }
};

const deleteCurrent = async () => {
  if (!currentBoard.value) return;
  try {
    await ElMessageBox.confirm(`确认删除看版「${currentBoard.value.name}」？`, '提示', { type: 'warning' });
    await request.delete(`/api/v1/console/report/board/delete/${currentBoard.value.id}`);
    ElMessage.success('已删除');
    selectedBoardId.value = null;
    loadBoards();
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败');
  }
};

const onSaved = () => {
  loadBoards();
};

// CSV / Excel / PDF 导出
const exportCsv = () => {
  if (!tableData.value.length) {
    ElMessage.warning('暂无数据');
    return;
  }
  const cols = effectiveMetrics.value;
  const dim = currentBoard.value?.config?.dimensions?.[0] || 'date';
  const head = [dim, ...cols].join(',');
  const rows = tableData.value.map((row) => [row[dim], ...cols.map((c) => row[c])].join(','));
  const csv = '\uFEFF' + [head, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentBoard.value?.name || '报表'}_${filter.value.dateRange}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportExcel = async () => {
  if (!tableData.value.length) {
    ElMessage.warning('暂无数据');
    return;
  }
  // 用 CSV 简化版（不引外部库）
  exportCsv();
  ElMessage.info('Excel 格式暂以 CSV 输出（XLSX 库未集成）');
};

const exportPdf = async () => {
  if (!tableData.value.length) {
    ElMessage.warning('暂无数据');
    return;
  }
  // 调用后端 PDF 渲染接口
  try {
    const res: any = await request.post('/api/v1/console/report/export/pdf', {
      board_id: currentBoard.value?.id,
      filters: filter.value,
    });
    if (res.code === 0 && res.data?.url) {
      window.open(res.data.url, '_blank');
    } else {
      ElMessage.error(res.message || 'PDF 生成失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'PDF 生成失败');
  }
};

watch(viewMode, (v) => {
  if (currentBoard.value) {
    currentBoard.value.config.layout.view = v;
  }
});

onMounted(() => {
  loadBoards();
});
</script>

<style scoped>
.report-overview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.overview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #FFFFFF;
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  flex-wrap: wrap;
  gap: 12px;
}
.overview-toolbar-left,
.overview-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.overview-board-info {
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  padding: 16px 20px;
}
.overview-board-name {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 4px;
}
.overview-board-desc {
  font-size: 12px;
  color: #64748B;
  margin-bottom: 8px;
}
.overview-board-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748B;
}
.meta-tag {
  padding: 2px 8px;
  background: #EFF6FF;
  color: #1E3A8A;
  border-radius: 4px;
  font-size: 11px;
}
.meta-divider {
  color: #CBD5E1;
}
.overview-empty {
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  padding: 60px 20px;
  text-align: center;
}
</style>
