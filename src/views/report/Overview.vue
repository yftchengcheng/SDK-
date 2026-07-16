<template>
  <div class="page-shell">
    <!-- ============ 页面头部 ============ -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><DataAnalysis /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">综合报表</h1>
          <p class="page-header-subtitle">在默认看版上调整筛选/维度/指标，再「保存为看版」即可生成自己的看版</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="Refresh" @click="loadBoards">刷新</el-button>
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
                <span>{{ DIM_LABELS[(board.config?.dimensions || [])[0] || 'date'] }} · </span>
                <span v-if="(board.config?.metrics || []).length === 0">未选指标</span>
                <template v-else>
                  <el-tag
                    v-for="(m, idx) in (board.config?.metrics || []).slice(0, 3)"
                    :key="m + idx"
                    size="small"
                    type="info"
                    effect="plain"
                    class="report-master-item-metric-tag"
                  >{{ metricNameOf(m) }}</el-tag>
                  <span v-if="(board.config?.metrics || []).length > 3" class="report-master-item-metric-more">+{{ (board.config?.metrics || []).length - 3 }}</span>
                </template>
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
            :description="searchKeyword ? '没有匹配看版' : '还没有看版（系统会预置一个默认看版）'"
            :image-size="60"
            class="report-master-empty"
          />
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
              <el-button type="primary" :icon="FolderAdd" @click="openSaveAsDialog">保存为看版</el-button>
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
                <span class="config-section-count">{{ effectiveDimensions.length }}</span>
              </div>
              <div class="config-section-tags">
                <el-tag
                  v-for="dim in effectiveDimensions"
                  :key="dim"
                  size="small"
                  effect="plain"
                  type="info"
                  class="config-section-tag"
                >
                  {{ DIM_LABELS[dim] || dim }}
                </el-tag>
                <el-button
                  v-if="effectiveDimensions.length === 0"
                  :icon="Plus"
                  size="small"
                  text
                  type="primary"
                  @click="openDimensionPicker"
                >选择维度</el-button>
              </div>
              <div class="config-section-actions">
                <el-button :icon="Edit" size="small" text type="primary" @click="openDimensionPicker">编辑维度</el-button>
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
                <el-button :icon="Setting" size="small" @click="openMetricPicker">设置指标</el-button>
              </div>
            </div>
            <div v-if="effectiveMetrics.length > 0" class="config-metric-tags">
              <el-tag
                v-for="(m, idx) in effectiveMetrics"
                :key="m + idx"
                size="default"
                type="info"
                effect="plain"
                class="config-metric-tag"
                :title="metricNameOf(m)"
              >{{ metricNameOf(m) }}</el-tag>
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

          <!-- 表格视图 -->
          <div class="report-detail-content" v-loading="dataLoading">
            <ReportTableView
              :board="effectiveBoard"
              :data="tableData"
            />
          </div>
        </template>

        <!-- 无选中看版时显示引导 -->
        <div v-else class="report-detail-empty">
          <el-empty :image-size="100" description="从左侧选择一个看版开始查看数据" />
        </div>
      </main>
    </div>

    <!-- 配置弹窗 -->
    <BoardConfigDialog
      v-model:visible="dialogVisible"
      :board="(editingBoard as any)"
      @saved="onSaved"
    />

    <!-- 「保存为看版」弹窗（默认看版不可删除/被覆盖，只能另存为新看版） -->
    <SaveAsBoardDialog
      v-if="currentBoard"
      v-model:visible="saveAsDialogVisible"
      :config="saveAsConfig"
      :report-type="'overview'"
      :dim-labels="DIM_LABELS"
      :metric-labels="liveMetricLabels"
      @saved="onSavedAs"
    />

    <!-- 维度 / 指标 弹窗（始终挂载，由 ref 触发） -->
    <DimensionPicker
      v-if="currentBoard"
      ref="dimPickerRef"
      v-model="pickedDimensions"
      @change="onDimensionsApply"
    />
    <MetricPicker
      v-if="currentBoard"
      ref="metricPickerRef"
      v-model="pickedMetrics"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus, CopyDocument, Edit, Download, Document, Delete, Refresh, Search, MoreFilled,
  DataAnalysis, Files, DataLine, Histogram, Setting, FolderAdd,
} from '@element-plus/icons-vue';
import request from '@/utils/request';
import DimensionPicker from '@/components/report/DimensionPicker.vue';
import MetricPicker from '@/components/report/MetricPicker.vue';
import ReportTableView from '@/components/report/ReportTableView.vue';
import BoardConfigDialog from '@/components/report/BoardConfigDialog.vue';
import SaveAsBoardDialog from '@/components/report/SaveAsBoardDialog.vue';
import ReportFilter, { type ReportFilter as Filter } from '@/components/report/ReportFilter.vue';

interface BoardConfig {
  dimensions: string[];
  metrics: string[];
  filters: { dateRange?: string };
  layout: { view: 'table' };
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
  hour: '按小时',
  week: '按周',
  month: '按月',
  app: '按应用',
  placement: '按广告位',
  ad_source: '按广告源',
  format: '按广告类型',
  platform: '按广告平台',
  bid_type: '按竞价类型',
  channel: '按渠道',
  sdk_version: '按 SDK 版本',
  country: '按地区',
  os: '按系统',
  region: '按国家',
  traffic_group: '按流量分组',
  scene: '按场景',
  scene_name: '按场景名称',
  ab_test: '按 A-B',
  idfa: '按 IDFA',
};

const boards = ref<ReportBoard[]>([]);
const selectedBoardId = ref<number | null>(null);
const searchKeyword = ref('');
const loading = ref(false);
const saveAsDialogVisible = ref(false);
const saveAsConfig = ref<{
  dimensions: string[];
  metrics: string[];
  filters: Record<string, unknown>;
  layout: { view: string };
}>({ dimensions: [], metrics: [], filters: {}, layout: { view: 'table' } });

const METRIC_LABELS: Record<string, string> = {
  impressions: '展示数',
  clicks: '点击数',
  revenue_actual: '预估收益',
  ctr: '点击率',
  ecpm: 'eCPM',
  fill_rate: '填充率',
  show_rate: '展示率',
  click_rate: '点击率',
  impression_rate: '展示率',
  impression_ratio: '展示占比',
  start_dau: '启动 DAU',
  estimated_revenue_ratio: '预估收益占比',
  estimated_arpdeu: '预估 ARPDEU',
  dau: 'DAU',
  requests: '广告请求',
  fills: '广告填充',
  shows: '广告展示',
  scene_arrives: '广告场景到达',
  ready_queries: 'isReady 查询',
  try_shows: '广告触发',
  show_oks: '般发展示成功',
  show_apis: '展示 API',
  unique_users: '独立用户',
  session_count: '会话次数',
  duration_total: '总时长',
};
const dataLoading = ref(false);
const dialogVisible = ref(false);
const editingBoard = ref<ReportBoard | null>(null);

const filter = ref<Filter>({ dateRange: '7d', appIds: [], placementIds: [], adSourceIds: [], formats: [], country: [], osList: [], platform: '' });
const pickedMetrics = ref<string[]>([]);
const pickedDimensions = ref<string[]>([]);
const metricPickerRef = ref<{ open: () => void } | null>(null);
const dimPickerRef = ref<{ open: (codes: string[]) => void } | null>(null);
const tableData = ref<Array<Record<string, string | number>>>([]);

// 指标字典：用 src/utils/report-metric-dict 的共享缓存（跨组件复用）
// 用于把用户选中的 code 翻译成与选择弹窗一致的中文名
import {
  loadMetricDict,
  metricDict,
  metricNameOf as _metricNameOf,
  metricFormatOf,
  useMetricLabels,
} from '@/utils/report-metric-dict';
const metricNameOf = (code: string) => _metricNameOf(code, METRIC_LABELS);
const liveMetricLabels = useMetricLabels(METRIC_LABELS);

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

const effectiveDimensions = computed<string[]>(() => {
  if (!currentBoard.value) return pickedDimensions.value;
  const cfgDims = currentBoard.value.config?.dimensions || ['date'];
  const picked = pickedDimensions.value.filter((d) => !cfgDims.includes(d));
  return [...cfgDims, ...picked];
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
      dimensions: effectiveDimensions.value,
    },
  };
});

const openMetricPicker = () => {
  metricPickerRef.value?.open();
};
const onMetricsApply = (codes: string[]) => {
  pickedMetrics.value = [...codes];
  loadData();
};
const openDimensionPicker = () => {
  const seed = pickedDimensions.value.length > 0
    ? pickedDimensions.value
    : (currentBoard.value?.config?.dimensions || ['date']);
  dimPickerRef.value?.open(seed);
};
const onDimensionsApply = (codes: string[]) => {
  pickedDimensions.value = [...codes];
  loadData();
};
const onBoardChange = (board: ReportBoard) => {
  pickedMetrics.value = [];
  pickedDimensions.value = [];
  selectedBoardId.value = board.id;
  loadData();
};

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
  filter.value = { dateRange: '7d', appIds: [], placementIds: [], adSourceIds: [], formats: [], country: [], osList: [], platform: '' };
  pickedMetrics.value = [];
  pickedDimensions.value = [];
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
      dimensions: effectiveDimensions.value,
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

const openEditConfigDialog = () => {
  if (!currentBoard.value) {
    ElMessage.warning('请先选择一个看版');
    return;
  }
  editingBoard.value = currentBoard.value;
  dialogVisible.value = true;
};

const openSaveAsDialog = () => {
  if (!currentBoard.value) {
    ElMessage.warning('请先选择一个看版');
    return;
  }
  // 把当前 effective 配置（picked > board.config）打包给 dialog
  saveAsConfig.value = {
    dimensions: [...effectiveDimensions.value],
    metrics: [...effectiveMetrics.value],
    filters: { ...(filter.value || {}), dateRange: filter.value?.dateRange || '7d' },
    layout: { view: 'table' },
  };
  saveAsDialogVisible.value = true;
};

const onSavedAs = async () => {
  await loadBoards();
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
      dimensions: effectiveDimensions.value,
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

onMounted(() => {
  loadMetricDict();
  loadBoards();
});
</script>
