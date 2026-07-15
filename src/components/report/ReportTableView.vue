<!--
  ReportTableView - 表格视图
  Props: board, data
-->
<template>
  <div class="page-card">
    <div class="page-table-wrap">
      <el-table :data="data" v-loading="loading" stripe style="width: 100%">
        <el-table-column
          v-for="col in columns"
          :key="col.key"
          :prop="col.key"
          :label="col.label"
          :min-width="col.minWidth"
          :align="col.align || 'left'"
        >
          <template #default="{ row }">
            <span :class="['cell-num', col.align === 'right' ? 'cell-num--right' : '']">
              {{ formatCell(row[col.key], col.format) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';

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
  minWidth: number;
  align?: 'left' | 'right' | 'center';
  format?: 'number' | 'percent' | 'currency';
}

const METRIC_LABELS: Record<string, { label: string; format: 'number' | 'percent' | 'currency' }> = {
  revenue_actual: { label: '实际收益', format: 'currency' },
  revenue_estimated: { label: '预估收益', format: 'currency' },
  impressions: { label: '展示数', format: 'number' },
  requests: { label: '请求数', format: 'number' },
  clicks: { label: '点击数', format: 'number' },
  fill_rate: { label: '填充率', format: 'percent' },
  ecpm: { label: 'eCPM', format: 'currency' },
};
const DIM_LABELS: Record<string, string> = {
  date: '日期',
  app: '应用',
  placement: '广告位',
  platform: '广告平台',
  country: '国家',
};

const props = defineProps({
  board: { type: Object as PropType<ReportBoard>, required: true },
  data: { type: Array as PropType<Array<Record<string, string | number>>>, required: true },
  loading: { type: Boolean, default: false },
});

const columns = computed<Column[]>(() => {
  const cols: Column[] = [];
  // 第一列：维度
  const dim = props.board.config?.dimensions?.[0] || 'date';
  cols.push({ key: dim, label: DIM_LABELS[dim] || dim, minWidth: 140 });
  // 后续列：指标
  const metrics = props.board.config?.metrics || [];
  for (const m of metrics) {
    const def = METRIC_LABELS[m] || { label: m, format: 'number' as const };
    cols.push({ key: m, label: def.label, minWidth: 120, align: 'right', format: def.format });
  }
  return cols;
});

const formatCell = (val: string | number | undefined, format?: string): string => {
  if (val === null || val === undefined) return '--';
  if (format === 'currency') return '¥' + Number(val).toFixed(2);
  if (format === 'percent') return Number(val).toFixed(1) + '%';
  return Number(val).toLocaleString('zh-CN');
};
</script>
