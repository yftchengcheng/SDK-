<template>
  <div class="page-container">
    <div class="page-header">
      <h1>数据看板</h1>
    </div>
    <!-- Filter -->
    <div class="filter-card">
      <el-form :inline="true" :model="filter">
        <el-form-item label="时间范围">
          <el-date-picker v-model="filter.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 260px" />
        </el-form-item>
        <el-form-item label="应用">
          <el-select v-model="filter.appKeys" multiple collapse-tags placeholder="全部应用" style="width: 200px">
            <el-option v-for="a in appList" :key="a.app_key" :label="a.app_name" :value="a.app_key" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <!-- Metric Cards -->
    <el-row :gutter="16" class="mb-base">
      <el-col :span="4" v-for="m in metrics" :key="m.key">
        <div class="metric-card">
          <div class="metric-label">{{ m.label }}</div>
          <div class="metric-value">{{ m.value }}</div>
        </div>
      </el-col>
    </el-row>
    <!-- Charts -->
    <el-row :gutter="16">
      <el-col :span="12">
        <div class="table-card mb-base">
          <div class="card-title">收益趋势</div>
          <v-chart :option="revenueOption" autoresize style="height: 300px" />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="table-card mb-base">
          <div class="card-title">展示量与填充率</div>
          <v-chart :option="impressionOption" autoresize style="height: 300px" />
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :span="12">
        <div class="table-card mb-base">
          <div class="card-title">eCPM趋势</div>
          <v-chart :option="ecpmOption" autoresize style="height: 300px" />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="table-card mb-base">
          <div class="card-title">广告位收益排行</div>
          <v-chart :option="rankOption" autoresize style="height: 300px" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import request from '../../utils/request';

use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const filter = reactive({
  dateRange: [] as string[],
  appKeys: [] as string[],
});

const appList = ref<any[]>([]);
const dashboardData = ref<any>({});

const metrics = computed(() => {
  const d = dashboardData.value;
  return [
    { key: 'revenue', label: '今日预估收益(元)', value: d.revenue ?? '--' },
    { key: 'impressions', label: '今日展示量', value: d.impressions ?? '--' },
    { key: 'fillRate', label: '今日填充率', value: d.fillRate != null ? d.fillRate + '%' : '--' },
    { key: 'ecpm', label: '今日eCPM', value: d.ecpm ?? '--' },
    { key: 'activePlacements', label: '活跃广告位', value: d.activePlacements ?? '--' },
    { key: 'roi7d', label: '7日ROI', value: d.roi7d ?? '--' },
  ];
});

const revenueOption = computed(() => {
  const chart = dashboardData.value.revenueChart || { dates: [], values: [] };
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: chart.dates },
    yAxis: { type: 'value' },
    series: [{
      type: 'line', data: chart.values, smooth: true,
      areaStyle: { color: 'rgba(37,99,235,0.1)' },
      lineStyle: { color: '#2563EB' },
      itemStyle: { color: '#2563EB' },
    }],
  };
});

const impressionOption = computed(() => {
  const chart = dashboardData.value.impressionChart || { dates: [], impressions: [], fillRates: [] };
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['展示量', '填充率'] },
    grid: { left: 60, right: 60, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: chart.dates },
    yAxis: [
      { type: 'value', name: '展示量' },
      { type: 'value', name: '填充率(%)', max: 100 },
    ],
    series: [
      { name: '展示量', type: 'bar', data: chart.impressions, itemStyle: { color: '#3B82F6' } },
      { name: '填充率', type: 'line', yAxisIndex: 1, data: chart.fillRates, itemStyle: { color: '#F59E0B' } },
    ],
  };
});

const ecpmOption = computed(() => {
  const chart = dashboardData.value.ecpmChart || { dates: [], values: [] };
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: chart.dates },
    yAxis: { type: 'value', name: 'eCPM' },
    series: [{
      type: 'line', data: chart.values, smooth: true,
      lineStyle: { color: '#2563EB' }, itemStyle: { color: '#2563EB' },
    }],
  };
});

const rankOption = computed(() => {
  const chart = dashboardData.value.rankChart || { names: [], values: [] };
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 120, right: 40, top: 10, bottom: 20 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: chart.names },
    series: [{
      type: 'bar', data: chart.values,
      itemStyle: {
        color: (params: any) => {
          const colors = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#1D4ED8', '#1E40AF', '#2563EB', '#3B82F6', '#60A5FA'];
          return colors[params.dataIndex % colors.length];
        },
      },
    }],
  };
});

const fetchApps = async () => {
  try {
    const res: any = await request.get('/api/v1/console/app/list');
    appList.value = res.data?.list || [];
  } catch { /* ignore */ }
};

const fetchData = async () => {
  try {
    const params: any = {};
    if (filter.dateRange?.length === 2) {
      params.startDate = filter.dateRange[0];
      params.endDate = filter.dateRange[1];
    }
    if (filter.appKeys.length) params.appKeys = filter.appKeys.join(',');
    const res: any = await request.get('/api/v1/console/dashboard', { params });
    dashboardData.value = res.data || {};
  } catch { /* ignore */ }
};

const resetFilter = () => {
  filter.dateRange = [];
  filter.appKeys = [];
  fetchData();
};

onMounted(() => {
  fetchApps();
  fetchData();
});
</script>

<style scoped>
.metric-card {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--el-border-color-light);
}
.metric-label {
  font: var(--fs-small);
  color: #6B7280;
  margin-bottom: 8px;
}
.metric-value {
  font: var(--fs-number);
  color: #111827;
}
.card-title {
  font: var(--fs-section-title);
  color: #111827;
  margin-bottom: 12px;
}
</style>
