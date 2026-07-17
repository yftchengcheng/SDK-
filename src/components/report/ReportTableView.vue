<!--
  ReportTableView - 表格视图
  Props: board, data
  列头：维度用 DIM_LABELS 翻译；指标用共享 metric dict 翻译（与 MetricPicker / 看版卡 完全一致）
  交互：
    - 表头 th 支持拖拽（SortableJS），调整列顺序
    - 指标列支持点击表头升/降序（el-table sortable='custom'）
-->
<template>
  <div class="page-card">
    <div class="page-table-wrap" ref="tableWrapRef">
      <el-table
        :data="sortedData"
        v-loading="loading"
        stripe
        :fit="true"
        :max-height="tableMaxHeight"
        style="width: 100%; min-width: 100%"
        @sort-change="onSortChange"
      >
        <el-table-column
          v-for="col in columns"
          :key="col.key"
          :prop="col.key"
          :label="col.label"
          :min-width="col.minWidth"
          :width="col.width"
          :align="col.align || 'left'"
          :header-align="col.align || 'left'"
          :fixed="col.fixed"
          :sortable="col.sortable"
          :header-cell-style="headerCellStyle"
      :cell-style="cellStyle"
      :show-overflow-tooltip="true"
        >
          <template #default="{ row }">
            <span :class="['cell-num', col.align === 'right' ? 'cell-num--right' : '']">
              {{ formatCell(row[col.key], col.format, col.key) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import type { PropType } from 'vue';
import dayjs from 'dayjs';
import Sortable from 'sortablejs';
import { loadMetricDict, metricNameOf, metricFormatOf, metricDict } from '@/utils/report-metric-dict';

interface BoardConfig {
  dimensions: string[];
  metrics: string[];
}

interface ReportBoard {
  id: number;
  config: BoardConfig;
}

interface Column {
  key: string;
  label: string;
  width: number;
  minWidth: number;
  align?: 'left' | 'right' | 'center';
  format?: string;
  fixed?: 'left' | 'right';
  sortable?: boolean | 'custom';
  kind: 'dim' | 'metric';
}

const DIM_LABELS: Record<string, string> = {
  date: '日期',
  hour: '小时',
  week: '周',
  month: '月',
  scene: '场景',
  app: '应用',
  placement: '广告位',
  format: '广告类型',
  platform: '广告平台',
  ad_source: '广告源',
  bid_type: '竞价类型',
  channel: '渠道',
  sdk_version: 'SDK 版本',
  ab_test: 'A-B 测试',
  idfa: 'IDFA 状态',
  country: '地区',
  os: '系统平台',
  traffic_group: '流量分组',
  scene_name: '广告场景',
};

const props = defineProps({
  board: { type: Object as PropType<ReportBoard>, required: true },
  data: { type: Array as PropType<Array<Record<string, string | number>>>, required: true },
  loading: { type: Boolean, default: false },
  maxHeight: { type: [Number, String] as PropType<number | string>, default: undefined },
});

const emit = defineEmits<{
  (e: 'column-reorder', payload: { dimensions: string[]; metrics: string[] }): void;
}>();

onMounted(() => {
  loadMetricDict();
  injectCellAlignmentFix();
  // 等到 table 渲染后再初始化 Sortable + scroll 同步
  requestAnimationFrame(() => {
    initSortable();
    initScrollSync();
  });
});

onBeforeUnmount(() => {
  destroySortable();
  destroyScrollSync();
  removeCellAlignmentFix();
});

// ---- 横向滚动同步（防止表头与数据错位） ----

let scrollHandler: ((e: Event) => void) | null = null;
let headerWrapper: HTMLElement | null = null;
let bodyWrapper: HTMLElement | null = null;
let headerSyncing = false;
let bodySyncing = false;

const initScrollSync = () => {
  destroyScrollSync();
  if (!tableWrapRef.value) return;
  headerWrapper = tableWrapRef.value.querySelector('.el-table__header-wrapper');
  bodyWrapper = tableWrapRef.value.querySelector('.el-table__body-wrapper');
  if (!headerWrapper || !bodyWrapper) return;
  // EP 默认会同步，但 table-layout:fixed 切换 fit:true 后某些时机会失效；这里加一道兜底
  scrollHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    const left = target.scrollLeft;
    if (target === bodyWrapper && !headerSyncing) {
      headerSyncing = true;
      if (headerWrapper) headerWrapper.scrollLeft = left;
      requestAnimationFrame(() => { headerSyncing = false; });
    } else if (target === headerWrapper && !bodySyncing) {
      bodySyncing = true;
      if (bodyWrapper) bodyWrapper.scrollLeft = left;
      requestAnimationFrame(() => { bodySyncing = false; });
    }
  };
  bodyWrapper.addEventListener('scroll', scrollHandler);
  headerWrapper.addEventListener('scroll', scrollHandler);
};

const destroyScrollSync = () => {
  if (scrollHandler) {
    if (bodyWrapper) bodyWrapper.removeEventListener('scroll', scrollHandler);
    if (headerWrapper) headerWrapper.removeEventListener('scroll', scrollHandler);
    scrollHandler = null;
  }
  headerWrapper = null;
  bodyWrapper = null;
};

watch(
  () => [props.board.config?.dimensions?.join(','), props.board.config?.metrics?.join(',')].join('|'),
  () => {
    // 看版 config 变了，重排 columns
    rebuildColumns();
    // 重置排序状态
    sortState.value = { prop: '', order: null };
    // 等下个 tick 重新挂载 sortable
    requestAnimationFrame(() => initSortable());
  },
);

const tableMaxHeight = computed(() => props.maxHeight);
const tableWrapRef = ref<HTMLElement | null>(null);
let sortableInstance: Sortable | null = null;

// 强制表头与 body 单元格的 .cell 等宽，避免错位（EP 默认给 td.cell 内联 width 但 th.cell 没有）
const headerCellStyle = (): Record<string, string> => ({
  padding: '0 !important',
});
const cellStyle = (): Record<string, string> => ({
  padding: '0 !important',
});

// 注入全局样式，强制 header 的 .cell 与 body 的 .cell 宽度一致
let injectedStyle: HTMLStyleElement | null = null;
const injectCellAlignmentFix = (): void => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('report-table-cell-fix')) return;
  const style = document.createElement('style');
  style.id = 'report-table-cell-fix';
  style.textContent = `
    .el-table .el-table__cell > .cell {
      box-sizing: border-box;
      width: 100% !important;
    }
  `;
  document.head.appendChild(style);
  injectedStyle = style;
};
const removeCellAlignmentFix = (): void => {
  if (injectedStyle) {
    injectedStyle.remove();
    injectedStyle = null;
  }
};

// ---- 列定义 ----

const buildColumnsFromBoard = (): Column[] => {
  const cols: Column[] = [];
  const dimensions = props.board.config?.dimensions || [];
  for (const d of dimensions) {
    cols.push({ key: d, label: DIM_LABELS[d] || d, minWidth: 140, width: 140, fixed: 'left', kind: 'dim' });
  }
  const metrics = props.board.config?.metrics || [];
  for (const m of metrics) {
    const name = metricNameOf(m);
    cols.push({
      key: m,
      label: name,
      minWidth: 140, width: 140,
      align: 'right',
      format: metricFormatOf(m) || 'number',
      sortable: 'custom',
      kind: 'metric',
    });
  }
  return cols;
};

const columns = ref<Column[]>(buildColumnsFromBoard());
const rebuildColumns = () => { columns.value = buildColumnsFromBoard(); };

// ---- 拖拽排序（SortableJS） ----

const initSortable = () => {
  destroySortable();
  if (!tableWrapRef.value) return;
  // 只挂表头行：所有 th 都在 .el-table__header-wrapper tr 下
  const tr = tableWrapRef.value.querySelector('.el-table__header-wrapper tr');
  if (!tr) return;
  sortableInstance = Sortable.create(tr as HTMLElement, {
    animation: 150,
    handle: 'th',           // 整个 th 都可以拖
    ghostClass: 'col-ghost',
    chosenClass: 'col-chosen',
    dragClass: 'col-drag',
    // 不允许跨 fixed 区域拖拽：固定列永远在最左
    onMove: (evt: Sortable.MoveEvent) => {
      const fromIndex = evt.oldIndex ?? 0;
      const toIndex = evt.newIndex ?? 0;
      const movedCol = columns.value[fromIndex];
      // 维度列（fixed）只能和维度列交换；指标列（不固定）只能和指标列交换
      const targetCol = columns.value[toIndex];
      if (!movedCol || !targetCol) return false;
      if (movedCol.kind !== targetCol.kind) return false;
      return true;
    },
    onEnd: (evt: Sortable.SortableEvent) => {
      const fromIndex = evt.oldIndex ?? 0;
      const toIndex = evt.newIndex ?? 0;
      if (fromIndex === toIndex) return;
      // 1. 重排 columns
      const next = columns.value.slice();
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      columns.value = next;
      // 2. 拆出 dimensions / metrics 顺序
      const dimensions = next.filter(c => c.kind === 'dim').map(c => c.key);
      const metrics = next.filter(c => c.kind === 'metric').map(c => c.key);
      emit('column-reorder', { dimensions, metrics });
    },
  });
};

const destroySortable = () => {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
};

// ---- 指标列正排 / 倒排 ----

interface SortState { prop: string; order: 'ascending' | 'descending' | null; }
const sortState = ref<SortState>({ prop: '', order: null });

const onSortChange = ({ prop, order }: { prop: string | null; order: 'ascending' | 'descending' | null }) => {
  sortState.value = { prop: prop || '', order };
};

// 按当前排序状态对 data 重排（不可变更新）
const sortedData = computed(() => {
  const list = props.data.slice();
  if (!sortState.value.prop || !sortState.value.order) return list;
  const { prop, order } = sortState.value;
  const col = columns.value.find(c => c.key === prop);
  const isNum = col?.format === 'number' || col?.format === 'currency' || col?.format === 'percent';
  return list.sort((a, b) => {
    let av = a[prop];
    let bv = b[prop];
    if (isNum) {
      av = Number(av) || 0;
      bv = Number(bv) || 0;
    } else {
      av = String(av ?? '');
      bv = String(bv ?? '');
    }
    if (av < bv) return order === 'ascending' ? -1 : 1;
    if (av > bv) return order === 'ascending' ? 1 : -1;
    return 0;
  });
});

// ---- 单元格格式化 ----

const formatCell = (val: string | number | undefined, format?: string, colKey?: string): string => {
  if (val === null || val === undefined || val === '') return '--';
  // 日期维度：后端返回 ISO 字符串如 '2026-07-10'，用 dayjs 格式化（不要走 Number()）
  if (colKey === 'date' || format === 'date') {
    const d = dayjs(val as string);
    return d.isValid() ? d.format('YYYY-MM-DD') : String(val);
  }
  if (format === 'currency') return '¥' + Number(val).toFixed(2);
  if (format === 'percent') return Number(val).toFixed(1) + '%';
  // 数值或数字字符串：toLocaleString
  if (typeof val === 'number' || (typeof val === 'string' && /^-?\d+(\.\d+)?$/.test(val))) {
    return Number(val).toLocaleString('zh-CN');
  }
  // 其他维度（country / os / app_name / region 等）原样返回字符串
  return String(val);
};
</script>
