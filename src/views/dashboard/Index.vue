<template>
  <div class="page-container">
    <!-- 页头 -->
    <div class="page-header">
      <div>
        <h1>数据看板</h1>
        <p class="page-desc">实时监控广告收益与流量表现</p>
      </div>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="default"
          style="width: 260px"
          :clearable="false"
        />
        <el-button type="primary" :icon="Refresh" @click="refreshData" :loading="loading">刷新</el-button>
      </div>
    </div>

    <!-- 指标卡片 -->
    <div class="metrics-grid">
      <div v-for="metric in metrics" :key="metric.key" class="metric-card">
        <div class="metric-top">
          <span class="metric-label">{{ metric.label }}</span>
          <span :class="['metric-trend', metric.trend >= 0 ? 'trend-up' : 'trend-down']">
            <el-icon v-if="metric.trend >= 0" :size="12"><Top /></el-icon>
            <el-icon v-else :size="12"><Bottom /></el-icon>
            {{ Math.abs(metric.trend) }}%
          </span>
        </div>
        <div class="metric-value">{{ formatNumber(metric.value, metric.key) }}</div>
        <div class="metric-sub">较昨日 {{ metric.trend >= 0 ? '+' : '' }}{{ metric.trend }}%</div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="charts-row">
      <div class="chart-card chart-wide">
        <div class="card-header">
          <span class="card-title">收益趋势</span>
          <div class="chart-tabs">
            <span
              v-for="tab in ['7天', '14天', '30天']"
              :key="tab"
              :class="['chart-tab', activeTab === tab && 'active']"
              @click="activeTab = tab"
            >{{ tab }}</span>
          </div>
        </div>
        <div ref="revenueChartRef" class="chart-body"></div>
      </div>
      <div class="chart-card chart-narrow">
        <div class="card-header">
          <span class="card-title">广告源占比</span>
        </div>
        <div ref="sourceChartRef" class="chart-body"></div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card chart-wide">
        <div class="card-header">
          <span class="card-title">展示与点击</span>
        </div>
        <div ref="impressionChartRef" class="chart-body"></div>
      </div>
      <div class="chart-card chart-narrow">
        <div class="card-header">
          <span class="card-title">应用收益排行</span>
        </div>
        <div ref="rankChartRef" class="chart-body"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Refresh, Top, Bottom } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const dateRange = ref<[Date, Date]>([
  new Date(Date.now() - 7 * 86400000),
  new Date()
])
const activeTab = ref('7天')
const loading = ref(false)

const metrics = ref([
  { key: 'revenue', label: '总收益', value: 128450.32, trend: 12.5 },
  { key: 'ecpm', label: 'eCPM', value: 38.6, trend: -2.1 },
  { key: 'impressions', label: '展示量', value: 3327800, trend: 8.3 },
  { key: 'clicks', label: '点击量', value: 165200, trend: 5.7 },
  { key: 'ctr', label: '点击率', value: 4.96, trend: -0.8 },
  { key: 'fillRate', label: '填充率', value: 96.2, trend: 1.2 }
])

const revenueChartRef = ref<HTMLElement>()
const sourceChartRef = ref<HTMLElement>()
const impressionChartRef = ref<HTMLElement>()
const rankChartRef = ref<HTMLElement>()

let charts: echarts.ECharts[] = []

function formatNumber(val: number, key: string): string {
  if (key === 'revenue') return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (key === 'impressions' || key === 'clicks') {
    if (val >= 10000) return (val / 10000).toFixed(1) + '万'
    return val.toLocaleString()
  }
  if (key === 'ecpm') return '¥' + val.toFixed(2)
  if (key === 'ctr' || key === 'fillRate') return val.toFixed(1) + '%'
  return val.toString()
}

function initCharts() {
  // 收益趋势
  if (revenueChartRef.value) {
    const chart = echarts.init(revenueChartRef.value)
    charts.push(chart)
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#E5E7EB', textStyle: { color: '#111827', fontSize: 13 } },
      grid: { left: 48, right: 16, top: 16, bottom: 32 },
      xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: '#E5E7EB' } }, axisLabel: { color: '#6B7280', fontSize: 12 }, axisTick: { show: false } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F3F4F6' } }, axisLabel: { color: '#6B7280', fontSize: 12, formatter: (v: number) => '¥' + (v / 1000).toFixed(0) + 'k' } },
      series: [{
        type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { color: '#2563EB', width: 2.5 },
        itemStyle: { color: '#2563EB', borderWidth: 2, borderColor: '#fff' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(37,99,235,0.15)' }, { offset: 1, color: 'rgba(37,99,235,0.01)' }]) },
        data: [18200, 19500, 16800, 21400, 22300, 19800, 24500]
      }]
    })
  }

  // 广告源占比
  if (sourceChartRef.value) {
    const chart = echarts.init(sourceChartRef.value)
    charts.push(chart)
    chart.setOption({
      tooltip: { trigger: 'item', backgroundColor: '#fff', borderColor: '#E5E7EB', textStyle: { color: '#111827', fontSize: 13 } },
      legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: '#6B7280', fontSize: 12 } },
      series: [{
        type: 'pie', radius: ['48%', '72%'], center: ['50%', '42%'],
        padAngle: 2, itemStyle: { borderRadius: 4 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 13, fontWeight: 600, color: '#111827' } },
        data: [
          { value: 42, name: '穿山甲', itemStyle: { color: '#2563EB' } },
          { value: 28, name: '优量汇', itemStyle: { color: '#3B82F6' } },
          { value: 18, name: '百青藤', itemStyle: { color: '#60A5FA' } },
          { value: 12, name: '其他', itemStyle: { color: '#BFDBFE' } }
        ]
      }]
    })
  }

  // 展示与点击
  if (impressionChartRef.value) {
    const chart = echarts.init(impressionChartRef.value)
    charts.push(chart)
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#E5E7EB', textStyle: { color: '#111827', fontSize: 13 } },
      legend: { top: 0, right: 0, itemWidth: 12, itemHeight: 8, textStyle: { color: '#6B7280', fontSize: 12 } },
      grid: { left: 48, right: 16, top: 32, bottom: 32 },
      xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: '#E5E7EB' } }, axisLabel: { color: '#6B7280', fontSize: 12 }, axisTick: { show: false } },
      yAxis: [
        { type: 'value', splitLine: { lineStyle: { color: '#F3F4F6' } }, axisLabel: { color: '#6B7280', fontSize: 12, formatter: (v: number) => (v / 10000).toFixed(0) + '万' } },
        { type: 'value', splitLine: { show: false }, axisLabel: { color: '#6B7280', fontSize: 12 } }
      ],
      series: [
        {
          name: '展示量', type: 'bar', barWidth: 16, yAxisIndex: 0,
          itemStyle: { color: '#3B82F6', borderRadius: [3, 3, 0, 0] },
          data: [420, 380, 350, 460, 480, 410, 520]
        },
        {
          name: '点击量', type: 'line', smooth: true, yAxisIndex: 1,
          symbol: 'circle', symbolSize: 5,
          lineStyle: { color: '#F59E0B', width: 2 },
          itemStyle: { color: '#F59E0B', borderWidth: 2, borderColor: '#fff' },
          data: [2100, 1900, 1750, 2300, 2400, 2050, 2600]
        }
      ]
    })
  }

  // 应用收益排行
  if (rankChartRef.value) {
    const chart = echarts.init(rankChartRef.value)
    charts.push(chart)
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#fff', borderColor: '#E5E7EB', textStyle: { color: '#111827', fontSize: 13 } },
      grid: { left: 72, right: 16, top: 8, bottom: 8 },
      xAxis: { type: 'value', splitLine: { lineStyle: { color: '#F3F4F6' } }, axisLabel: { color: '#6B7280', fontSize: 12, formatter: (v: number) => '¥' + (v / 1000).toFixed(0) + 'k' } },
      yAxis: { type: 'category', data: ['游戏助手', '天气通', '记账本', '阅读器', '壁纸达人'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#374151', fontSize: 13 } },
      series: [{
        type: 'bar', barWidth: 14,
        itemStyle: {
          borderRadius: [0, 3, 3, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#2563EB' },
            { offset: 1, color: '#60A5FA' }
          ])
        },
        data: [42000, 35000, 28000, 21000, 15000]
      }]
    })
  }
}

function refreshData() {
  loading.value = true
  setTimeout(() => { loading.value = false }, 800)
}

function handleResize() {
  charts.forEach(c => c.resize())
}

onMounted(async () => {
  await nextTick()
  initCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(c => c.dispose())
  charts = []
})
</script>
