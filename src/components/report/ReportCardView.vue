<!--
  ReportCardView - 卡片视图（KPI 卡）
  每个指标一张卡，显示最新值 + 对比期
-->
<template>
  <div class="card-view">
    <div v-for="m in metricDefs" :key="m.key" class="kpi-card">
      <div class="kpi-card-label">{{ m.label }}</div>
      <div class="kpi-card-value">{{ formatCell(latest(m.key), m.format) }}</div>
      <div class="kpi-card-trend" :class="trendClass(m.key)">
        <el-icon>
          <component :is="trend(m.key) >= 0 ? 'CaretTop' : 'CaretBottom'" />
        </el-icon>
        <span>{{ Math.abs(trend(m.key)).toFixed(1) }}%</span>
        <span class="kpi-card-trend-period">vs 上一周期</span>
      </div>
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

const METRIC_LABELS: Record<string, { label: string; format: 'number' | 'percent' | 'currency' }> = {
  revenue_actual: { label: '实际收益', format: 'currency' },
  revenue_estimated: { label: '预估收益', format: 'currency' },
  impressions: { label: '展示数', format: 'number' },
  requests: { label: '请求数', format: 'number' },
  clicks: { label: '点击数', format: 'number' },
  fill_rate: { label: '填充率', format: 'percent' },
  ecpm: { label: 'eCPM', format: 'currency' },
};

const props = defineProps({
  board: { type: Object as PropType<ReportBoard>, required: true },
  data: { type: Array as PropType<Array<Record<string, string | number>>>, required: true },
});

const metricDefs = computed(() => {
  const metrics = props.board.config?.metrics || [];
  return metrics.map((m) => ({
    key: m,
    label: METRIC_LABELS[m]?.label || m,
    format: METRIC_LABELS[m]?.format || 'number',
  }));
});

const latest = (key: string): number => {
  const arr = props.data;
  if (!arr.length) return 0;
  const last = arr[arr.length - 1] as Record<string, string | number>;
  return Number(last[key] || 0);
};

const previous = (key: string): number => {
  const arr = props.data;
  if (arr.length < 2) return 0;
  const prev = arr[arr.length - 2] as Record<string, string | number>;
  return Number(prev[key] || 0);
};

const trend = (key: string): number => {
  const cur = latest(key);
  const prev = previous(key);
  if (prev === 0) return 0;
  return ((cur - prev) / prev) * 100;
};

const trendClass = (key: string): string => {
  const t = trend(key);
  if (t > 0) return 'kpi-card-trend--up';
  if (t < 0) return 'kpi-card-trend--down';
  return 'kpi-card-trend--flat';
};

const formatCell = (val: number, format?: string): string => {
  if (format === 'currency') return '¥' + val.toFixed(2);
  if (format === 'percent') return val.toFixed(1) + '%';
  return val.toLocaleString('zh-CN');
};
</script>

<style scoped>
.card-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.kpi-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kpi-card-label {
  font-size: 13px;
  color: #64748B;
}
.kpi-card-value {
  font-size: 28px;
  font-weight: 700;
  color: #1E3A8A;
  font-feature-settings: 'tnum';
}
.kpi-card-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}
.kpi-card-trend--up {
  color: #10B981;
}
.kpi-card-trend--down {
  color: #EF4444;
}
.kpi-card-trend--flat {
  color: #94A3B8;
}
.kpi-card-trend-period {
  color: #94A3B8;
  margin-left: 4px;
}
</style>
