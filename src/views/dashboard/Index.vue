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

    <!-- 异常提醒 -->
    <div v-if="anomalies.length" class="chart-card anomaly-card">
      <div class="card-header">
        <span class="card-title">异常检测</span>
        <span class="anomaly-tag">共 {{ anomalies.length }} 条</span>
      </div>
      <div class="anomaly-list">
        <div v-for="(item, idx) in anomalies" :key="idx" class="anomaly-item">
          <span class="anomaly-name">{{ getPlacementName(item.placementId) }}</span>
          <span class="anomaly-type">{{ item.type }}</span>
          <span class="anomaly-change">{{ item.change }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Refresh, Top, Bottom } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import request from '@/utils/request'

interface DashboardTrendItem { date: string; revenue: number; impressions: number; fillRate: number; eCPM: number; clicks: number }
interface SourceCompareItem { sourceId: string; name: string; revenue: number; impressions: number; clicks: number; ctr: number; fillRate: number; eCPM: number }
interface AppItem { id: string; appKey: string; appName: string }
interface PlacementItem { id: string; appKey: string; placementName: string }
interface PlacementRankingItem { placementId: string; revenue: number; impressions: number }
interface AnomalyItem { placementId: string; type: string; change: number; recent: number; baseline: number }

const activeTab = ref('7天')
const dateRange = ref<[Date, Date]>([
  new Date(Date.now() - 7 * 86400000),
  new Date()
])

// 优先用 dateRange 自定义范围；空时回退到 activeTab 的 days 数（向后兼容）
function buildDateParams(): Record<string, string> {
  const [start, end] = dateRange.value || []
  if (start && end) {
    return {
      startDate: dayjs(start).format('YYYY-MM-DD'),
      endDate: dayjs(end).format('YYYY-MM-DD'),
    }
  }
  const days = activeTab.value === '7天' ? 7 : activeTab.value === '14天' ? 14 : 30
  return { days: String(days) }
}
const loading = ref(false)
const metrics = ref<{ key: string; label: string; value: number; trend: number }[]>([
  { key: 'revenue', label: '总收益', value: 0, trend: 0 },
  { key: 'ecpm', label: 'eCPM', value: 0, trend: 0 },
  { key: 'impressions', label: '展示量', value: 0, trend: 0 },
  { key: 'clicks', label: '点击量', value: 0, trend: 0 },
  { key: 'ctr', label: '点击率', value: 0, trend: 0 },
  { key: 'fillRate', label: '填充率', value: 0, trend: 0 }
])
const trendData = ref<DashboardTrendItem[]>([])
const sourceCompare = ref<SourceCompareItem[]>([])
const placementRanking = ref<PlacementRankingItem[]>([])
const anomalies = ref<AnomalyItem[]>([])
const apps = ref<AppItem[]>([])
const placements = ref<PlacementItem[]>([])

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
    const dates = trendData.value.map((t) => t.date.slice(5))
    const revenues = trendData.value.map((t) => Number(t.revenue || 0))
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#E2E8F0', textStyle: { color: '#0F172A', fontSize: 13 } },
      grid: { left: 48, right: 16, top: 16, bottom: 32 },
      xAxis: { type: 'category', data: dates.length ? dates : [''], axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#64748B', fontSize: 12 }, axisTick: { show: false } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#64748B', fontSize: 12, formatter: (v: number) => '¥' + (v / 1).toFixed(0) } },
      series: [{
        type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { color: '#1E40AF', width: 2.5 },
        itemStyle: { color: '#1E40AF', borderWidth: 2, borderColor: '#fff' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(30,64,175,0.12)' }, { offset: 1, color: 'rgba(30,64,175,0.01)' }]) },
        data: revenues.length ? revenues : [0]
      }]
    })
  }

  // 广告源占比
  if (sourceChartRef.value) {
    const chart = echarts.init(sourceChartRef.value)
    charts.push(chart)
    const sourceData = sourceCompare.value.map((s) => ({ value: Number(s.revenue || 0), name: s.name }))
    chart.setOption({
      tooltip: { trigger: 'item', backgroundColor: '#fff', borderColor: '#E2E8F0', textStyle: { color: '#0F172A', fontSize: 13 } },
      legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: '#64748B', fontSize: 12 } },
      series: [{
        type: 'pie', radius: ['48%', '72%'], center: ['50%', '42%'],
        padAngle: 2, itemStyle: { borderRadius: 4 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 13, fontWeight: 600, color: '#0F172A' } },
        data: sourceData.length ? sourceData : [{ value: 0, name: '暂无数据' }],
        color: ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE']
      }]
    })
  }

  // 展示与点击
  if (impressionChartRef.value) {
    const chart = echarts.init(impressionChartRef.value)
    charts.push(chart)
    const dates = trendData.value.map((t) => t.date.slice(5))
    const imps = trendData.value.map((t) => Number(t.impressions || 0))
    const clks = trendData.value.map((t) => Number(t.clicks || 0))
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#E2E8F0', textStyle: { color: '#0F172A', fontSize: 13 } },
      legend: { top: 0, right: 0, itemWidth: 12, itemHeight: 8, textStyle: { color: '#64748B', fontSize: 12 } },
      grid: { left: 48, right: 48, top: 32, bottom: 32 },
      xAxis: { type: 'category', data: dates.length ? dates : [''], axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#64748B', fontSize: 12 }, axisTick: { show: false } },
      yAxis: [
        { type: 'value', splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#64748B', fontSize: 12 } },
        { type: 'value', splitLine: { show: false }, axisLabel: { color: '#64748B', fontSize: 12 } }
      ],
      series: [
        {
          name: '展示量', type: 'bar', barWidth: 16, yAxisIndex: 0,
          itemStyle: { color: '#3B82F6', borderRadius: [3, 3, 0, 0] },
          data: imps.length ? imps : [0]
        },
        {
          name: '点击量', type: 'line', smooth: true, yAxisIndex: 1,
          symbol: 'circle', symbolSize: 5,
          lineStyle: { color: '#059669', width: 2 },
          itemStyle: { color: '#059669', borderWidth: 2, borderColor: '#fff' },
          data: clks.length ? clks : [0]
        }
      ]
    })
  }

  // 应用收益排行
  if (rankChartRef.value) {
    const chart = echarts.init(rankChartRef.value)
    charts.push(chart)
    const names = placementRanking.value.map((r) => r.placementId || '匿名')
    const revs = placementRanking.value.map((r) => Number(r.revenue || 0))
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#fff', borderColor: '#E2E8F0', textStyle: { color: '#0F172A', fontSize: 13 } },
      grid: { left: 72, right: 16, top: 8, bottom: 8 },
      xAxis: { type: 'value', splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#64748B', fontSize: 12, formatter: (v: number) => '¥' + v.toFixed(0) } },
      yAxis: { type: 'category', data: names.length ? names : ['暂无数据'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#334155', fontSize: 13 } },
      series: [{
        type: 'bar', barWidth: 14,
        itemStyle: {
          borderRadius: [0, 3, 3, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#1E40AF' },
            { offset: 1, color: '#60A5FA' }
          ])
        },
        data: revs.length ? revs : [0]
      }]
    })
  }
}

function loadDashboardData() {
  const params = buildDateParams()
  loading.value = true
  return Promise.all([
    request.get<any>('/api/v1/console/dashboard/overview', { params }),
    request.get<any>('/api/v1/console/dashboard/trend', { params }),
    request.get<any>('/api/v1/console/dashboard/source-comparison', { params }),
    request.get<any>('/api/v1/console/dashboard/placement-ranking', { params }),
    request.get<any>('/api/v1/console/dashboard/anomalies', { params }),
    request.get<any>('/api/v1/console/app/list', { params: { pageSize: 200 } }),
    request.get<any>('/api/v1/console/placement/list', { params: { pageSize: 500 } })
  ])
    .then(([overviewRes, trendRes, sourceRes, rankingRes, anomalyRes, appsRes, placementsRes]) => {
      const ov = overviewRes.data || {}
      const periodRevenue = Number(ov.todayRevenue ?? ov.periodRevenue ?? ov.totalRevenue ?? 0)
      const periodImpressions = Number(ov.todayImpressions ?? ov.periodImpressions ?? ov.totalImpressions ?? 0)
      const fillRate = Number(ov.fillRate ?? 0)
      const eCPM = Number(ov.eCPM ?? 0)
      const clicks = trendRes.data?.reduce((s: number, t: DashboardTrendItem) => s + Number(t.clicks || 0), 0) || 0
      const ctr = periodImpressions > 0 ? (clicks / periodImpressions) * 100 : 0
      metrics.value = [
        { key: 'revenue', label: '总收益', value: periodRevenue, trend: 0 },
        { key: 'ecpm', label: 'eCPM', value: eCPM, trend: 0 },
        { key: 'impressions', label: '展示量', value: periodImpressions, trend: 0 },
        { key: 'clicks', label: '点击量', value: clicks, trend: 0 },
        { key: 'ctr', label: '点击率', value: Number(ctr.toFixed(2)), trend: 0 },
        { key: 'fillRate', label: '填充率', value: fillRate, trend: 0 }
      ]
      trendData.value = trendRes.data || []
      sourceCompare.value = sourceRes.data || []
      placementRanking.value = rankingRes.data || []
      anomalies.value = anomalyRes.data || []
      apps.value = appsRes.data?.list || []
      placements.value = placementsRes.data?.list || []
      nextTick(() => initCharts())
    })
    .catch(() => { /* ignore */ })
    .finally(() => { loading.value = false })
}

function refreshData() {
  loadDashboardData()
}

function getPlacementName(placementId: string): string {
  const p = placements.value.find((x) => x.id === placementId)
  return p ? p.placementName : placementId
}

function getAppName(placementId: string): string {
  const p = placements.value.find((x) => x.id === placementId)
  if (!p) return ''
  const app = apps.value.find((a) => a.appKey === p.appKey)
  return app ? app.appName : p.appKey
}

watch(activeTab, () => loadDashboardData())
watch(dateRange, () => loadDashboardData(), { deep: true })

function handleResize() {
  charts.forEach(c => c.resize())
}

onMounted(async () => {
  // 关键：先等数据回来再初始化图表，避免先画空数据造成的"白板→突然出现"闪屏
  await loadDashboardData()
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
