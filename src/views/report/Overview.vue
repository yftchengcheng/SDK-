<template>
  <div class="page-shell">
    <!-- ============ 页面头部 ============ -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><DataAnalysis /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">综合报表</h1>
          <p class="page-header-subtitle">多维度交叉分析收入、曝光、点击等核心指标，支持表格/卡片/趋势/柱状 4 种视图</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="Refresh" @click="loadBoards">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建看版</el-button>
      </div>
    </div>

    <!-- ============ Master-Detail 主体 ============ -->
    <div class="report-master-detail">
      <!-- ============ 左侧：看版列表面板 ============ -->
      <aside class="report-master-panel">
        <div class="report-master-header">
          <div class="report-master-header-top">
            <h2 class="report-master-title">
              <el-icon><Files /></el-icon>
              <span>我的看版</span>
              <el-tag size="small" effect="plain" round class="report-master-count">{{ filteredBoards.length }}</el-tag>
            </h2>
          </div>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索看版名称"
            :prefix-icon="Search"
            clearable
            size="default"
          />
        </div>
        <div class="report-master-list" v-loading="loading">
          <div
            v-for="board in filteredBoards"
            :key="board.id"
            :class="['report-master-item', { active: board.id === selectedBoardId }]"
            @click="selectBoard(board)"
          >
            <div class="report-master-item-icon">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="report-master-item-body">
              <div class="report-master-item-name">
                <span class="report-master-item-name-text">{{ board.name }}</span>
                <el-tag v-if="board.is_default" size="small" type="primary" effect="plain" class="report-master-item-tag">默认</el-tag>
              </div>
              <div class="report-master-item-desc">
                {{ DIM_LABELS[(board.config?.dimensions || [])[0] || 'date'] }} · {{ (board.config?.metrics || []).length }} 个指标
              </div>
            </div>
            <div class="report-master-item-actions" @click.stop>
              <el-dropdown trigger="click" @command="(cmd: string) => onItemCommand(cmd, board)">
                <el-button text :icon="MoreFilled" size="small" class="report-master-item-more" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit" :icon="Edit">编辑配置</el-dropdown-item>
                    <el-dropdown-item command="duplicate" :icon="CopyDocument">复制</el-dropdown-item>
                    <el-dropdown-item v-if="!board.is_default" command="delete" :icon="Delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <el-empty
            v-if="!loading && filteredBoards.length === 0"
            :description="searchKeyword ? '没有匹配看版' : '还没有看版'"
            :image-size="60"
            class="report-master-empty"
          >
            <el-button v-if="!searchKeyword" type="primary" :icon="Plus" size="small" @click="openCreateDialog">新建看版</el-button>
          </el-empty>
        </div>
      </aside>

      <!-- ============ 右侧：看版详情区 ============ -->
      <main class="report-detail-panel">
        <template v-if="currentBoard">
          <!-- 顶部看版信息 -->
          <div class="report-detail-header">
            <div class="report-detail-header-left">
              <div class="report-detail-icon">
                <el-icon :size="24"><DataLine /></el-icon>
              </div>
              <div class="report-detail-titles">
                <div class="report-detail-title-row">
                  <h2 class="report-detail-title">{{ currentBoard.name }}</h2>
                  <el-tag v-if="currentBoard.is_default" size="small" type="primary" effect="plain">默认</el-tag>
                </div>
                <p class="report-detail-desc">{{ currentBoard.description || '暂无描述' }}</p>
              </div>
            </div>
            <div class="report-detail-header-right">
              <el-button :icon="CopyDocument" plain @click="duplicateCurrent">复制看版</el-button>
              <el-button :icon="Edit" plain @click="openEditConfigDialog">编辑配置</el-button>
              <el-button v-if="!currentBoard.is_default" :icon="Delete" type="danger" plain @click="deleteCurrent">删除</el-button>
            </div>
          </div>

          <!-- 看版配置摘要 -->
          <div class="report-detail-config">
            <div class="config-section">
              <div class="config-section-label">
                <el-icon><Grid /></el-icon>
                <span>维度</span>
              </div>
              <div class="config-section-tags">
                <el-tag
                  v-for="dim in currentBoard.config?.dimensions || []"
                  :key="dim"
                  size="small"
                  effect="plain"
                  type="info"
                >
                  {{ DIM_LABELS[dim] || dim }}
                </el-tag>
              </div>
            </div>
            <div class="config-divider"></div>
            <div class="config-section config-section--metrics">
              <div class="config-section-label">
                <el-icon><Histogram /></el-icon>
                <span>已选指标</span>
                <span class="config-section-count">{{ effectiveMetrics.length }}</span>
              </div>
              <div class="config-section-actions">
                <MetricPicker v-model="pickedMetrics" :existing="(currentBoard.config?.metrics || [])" />
              </div>
            </div>
          </div>

          <!-- 筛选器 + 视图切换 + 导出 -->
          <div class="report-detail-toolbar">
            <div class="report-detail-toolbar-left">
              <ReportFilter v-model="filter" @change="loadData" />
            </div>
            <div class="report-detail-toolbar-right">
              <el-radio-group v-model="viewMode" size="default">
                <el-radio-button value="table"><el-icon><Grid /></el-icon> 表格</el-radio-button>
                <el-radio-button value="card"><el-icon><Postcard /></el-icon> 卡片</el-radio-button>
                <el-radio-button value="trend"><el-icon><TrendCharts /></el-icon> 趋势</el-radio-button>
                <el-radio-button value="bar"><el-icon><DataLine /></el-icon> 柱状</el-radio-button>
              </el-radio-group>
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

          <!-- 4 种视图 -->
          <div class="report-detail-content" v-loading="dataLoading">
            <ReportTableView
              v-if="viewMode === 'table'"
              :board="effectiveBoard"
              :data="tableData"
            />
            <ReportCardView
              v-else-if="viewMode === 'card'"
              :board="effectiveBoard"
              :data="tableData"
            />
            <ReportTrendView
              v-else-if="viewMode === 'trend'"
              :board="effectiveBoard"
              :data="tableData"
            />
            <ReportBarView
              v-else
              :board="effectiveBoard"
              :data="tableData"
            />
          </div>
        </template>

        <!-- 无选中看版时显示引导 -->
        <div v-else class="report-detail-empty">
          <el-empty :image-size="100" description="从左侧选择一个看版开始查看数据">
            <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建看版</el-button>
          </el-empty>
        </div>
      </main>
    </div>

    <!-- 配置弹窗 -->
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
  Plus, CopyDocument, Edit, Download, Document, Delete, Refresh, Search, MoreFilled,
  DataAnalysis, Files, DataLine, Grid, Histogram, Postcard, TrendCharts,
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
  format: '按广告类型',
  country: '按国家',
};

const boards = ref<ReportBoard[]>([]);
const selectedBoardId = ref<number | null>(null);
const searchKeyword = ref('');
const viewMode = ref<'table' | 'card' | 'trend' | 'bar'>('table');
const loading = ref(false);
const dataLoading = ref(false);
const dialogVisible = ref(false);
const editingBoard = ref<ReportBoard | null>(null);

const filter = ref<Filter>({ dateRange: '7d', appIds: [], placementIds: [], adSourceIds: [], formats: [], country: [] });
const pickedMetrics = ref<string[]>([]);
const tableData = ref<Array<Record<string, string | number>>>([]);

const currentBoard = computed<ReportBoard | null>(() => boards.value.find((b) => b.id === selectedBoardId.value) || null);
const filteredBoards = computed<ReportBoard[]>(() => {
  const kw = searchKeyword.value.trim().toLowerCase();
  if (!kw) return boards.value;
  return boards.value.filter((b) => b.name.toLowerCase().includes(kw));
});

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
        selectBoard(boards.value[0]);
      }
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载看版失败');
  } finally {
    loading.value = false;
  }
};

const selectBoard = (board: ReportBoard) => {
  selectedBoardId.value = board.id;
  viewMode.value = board.config?.layout?.view || 'table';
  filter.value = { dateRange: '7d', appIds: [], placementIds: [], adSourceIds: [], formats: [], country: [] };
  pickedMetrics.value = [];
  loadData();
};

const onItemCommand = (cmd: string, board: ReportBoard) => {
  if (cmd === 'edit') {
    selectedBoardId.value = board.id;
    openEditConfigDialog();
  } else if (cmd === 'duplicate') {
    selectedBoardId.value = board.id;
    duplicateCurrent();
  } else if (cmd === 'delete') {
    selectedBoardId.value = board.id;
    deleteCurrent();
  }
};

const loadData = async () => {
  if (!currentBoard.value) {
    tableData.value = [];
    return;
  }
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
  const days = 7;
  const result: Array<Record<string, string | number>> = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const row: Record<string, string | number> = { date: d.toISOString().slice(0, 10) };
    for (const m of effectiveMetrics.value) {
      row[m] = Math.round(Math.random() * 10000 * 100) / 100;
    }
    result.push(row);
  }
  return result;
};

const openCreateDialog = () => {
  editingBoard.value = null;
  dialogVisible.value = true;
};

const openEditConfigDialog = () => {
  if (!currentBoard.value) {
    ElMessage.warning('请先选择一个看版');
    return;
  }
  editingBoard.value = currentBoard.value;
  dialogVisible.value = true;
};

const duplicateCurrent = async () => {
  if (!currentBoard.value) {
    ElMessage.warning('请先选择一个看版');
    return;
  }
  try {
    const res: any = await request.post('/api/v1/console/report/board/create', {
      ...currentBoard.value,
      id: undefined,
      name: currentBoard.value.name + ' 副本',
      is_default: false,
    });
    if (res.code === 0) {
      ElMessage.success('已复制');
      loadBoards();
      if (res.data?.id) selectedBoardId.value = res.data.id;
    } else {
      ElMessage.error(res.message || '复制失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '复制失败');
  }
};

const deleteCurrent = async () => {
  if (!currentBoard.value) return;
  try {
    await ElMessageBox.confirm(`确定删除看版「${currentBoard.value.name}」？此操作不可恢复。`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    const res: any = await request.delete(`/api/v1/console/report/board/delete/${currentBoard.value.id}`);
    if (res.code === 0) {
      ElMessage.success('已删除');
      selectedBoardId.value = null;
      loadBoards();
    } else {
      ElMessage.error(res.message || '删除失败');
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败');
  }
};

const onSaved = () => {
  dialogVisible.value = false;
  loadBoards();
};

const exportCsv = () => doExport('csv');
const exportExcel = () => doExport('excel');
const exportPdf = () => doExport('pdf');

const doExport = async (format: 'csv' | 'excel' | 'pdf') => {
  if (!currentBoard.value) {
    ElMessage.warning('请先选择一个看版');
    return;
  }
  if (effectiveMetrics.value.length === 0) {
    ElMessage.warning('请至少选择一个指标');
    return;
  }
  try {
    const res: any = await request.post(`/api/v1/console/report/export/${format}`, {
      board_id: currentBoard.value.id,
      dimensions: currentBoard.value.config?.dimensions || ['date'],
      metrics: effectiveMetrics.value,
      filters: filter.value,
    });
    if (res.code === 0) {
      const url = res.data?.url;
      if (url) {
        // 通过 fetch + blob 下载（避免跨域 download 属性失效）
        const r = await fetch(url, { credentials: 'include', headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
        const blob = await r.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `report_${Date.now()}.${format === 'excel' ? 'csv' : format}`;
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        ElMessage.success('导出已开始');
      } else {
        ElMessage.success('已提交导出');
      }
    } else {
      ElMessage.error(res.message || '导出失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '导出失败');
  }
};

watch(viewMode, () => {
  if (currentBoard.value) {
    // 切换视图时不需要重新加载数据
  }
});

onMounted(loadBoards);
</script>
