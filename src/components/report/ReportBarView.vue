<!--
  ReportBarView - 柱状图
-->
<template>
  <div class="page-card">
    <div ref="chartRef" class="bar-chart"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import * as echarts from 'echarts';

interface BoardConfig {
  dimensions: string[];
  metrics: string[];
}

interface ReportBoard {
  id: number;
  config: BoardConfig;
}

const METRIC_LABELS: Record<string, string> = {
  revenue_actual: '实际收益',
  revenue_estimated: '预估收益',
  impressions: '展示数',
  requests: '请求数',
  clicks: '点击数',
  fill_rate: '填充率',
  ecpm: 'eCPM',
};

const props = defineProps({
  board: { type: Object as PropType<ReportBoard>, required: true },
  data: { type: Array as PropType<Array<Record<string, string | number>>>, required: true },
});

const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const getDim = (): string => props.board.config?.dimensions?.[0] || 'date';

const buildOption = () => {
  const dim = getDim();
  const xData = props.data.map((row) => String(row[dim] || ''));
  const metrics = props.board.config?.metrics || [];
  const series = metrics.map((m, idx) => ({
    name: METRIC_LABELS[m] || m,
    type: 'bar' as const,
    data: props.data.map((row) => Number(row[m] || 0)),
    itemStyle: { color: ['#1E3A8A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'][idx % 5] },
  }));
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, left: 0 },
    grid: { top: 40, left: 50, right: 30, bottom: 40 },
    xAxis: { type: 'category', data: xData },
    yAxis: { type: 'value' },
    series,
  };
};

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value);
  chart.setOption(buildOption(), true);
};

onMounted(async () => {
  await nextTick();
  renderChart();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (chart) {
    chart.dispose();
    chart = null;
  }
});

const handleResize = () => chart?.resize();

watch(() => [props.data, props.board], () => renderChart(), { deep: true });
</script>
