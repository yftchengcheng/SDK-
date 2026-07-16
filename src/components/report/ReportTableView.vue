<!--
  ReportTableView - 表格视图
  Props: board, data
  列头：维度用 DIM_LABELS 翻译；指标用共享 metric dict 翻译（与 MetricPicker / 看版卡 完全一致）
-->
<template>
  <div class="page-card">
    <div class="page-table-wrap">
      <el-table :data="data" v-loading="loading" stripe :fit="false" :max-height="tableMaxHeight" style="width: 100%">
        <el-table-column
          v-for="col in columns"
          :key="col.key"
          :prop="col.key"
          :label="col.label"
          :width="col.width"
          :min-width="col.width"
          :align="col.align || 'left'"
          :fixed="col.fixed"
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
import { computed, onMounted } from 'vue';
import type { PropType } from 'vue';
import dayjs from 'dayjs';
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

onMounted(() => {
  loadMetricDict();
});

const tableMaxHeight = computed(() => props.maxHeight);

const columns = computed<Column[]>(() => {
  const cols: Column[] = [];
  // 维度列：每个 dimension 渲染一列（支持多维度组合：按日 + 按应用 → 表格有「日期」「应用」两列）
  // 维度列固定在左侧（fixed='left'），指标列在右侧可横向滑动
  const dimensions = props.board.config?.dimensions || [];
  for (const d of dimensions) {
    cols.push({ key: d, label: DIM_LABELS[d] || d, minWidth: 140, width: 140, fixed: 'left' });
  }
  // 指标列：用共享 dict 翻译中文名 + 取 format（指标列随表格横向滚动）
  const metrics = props.board.config?.metrics || [];
  for (const m of metrics) {
    const name = metricNameOf(m);
    if (name === m) console.warn('[ReportTableView] metricNameOf fallback to code for:', m, 'dict keys sample:', Object.keys(metricDict.value).slice(0,3));
    cols.push({
      key: m,
      label: name,
      minWidth: 140, width: 140,
      align: 'right',
      format: metricFormatOf(m) || 'number',
    });
  }
  return cols;
});

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
