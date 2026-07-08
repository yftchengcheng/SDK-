<template>
  <div class="page-container page-dashboard">
    <!-- 加载错误兜底 -->
    <el-alert
      v-if="loadError"
      :title="loadError"
      type="error"
      show-icon
      :closable="false"
      class="page-load-error"
    >
      <template #default>
        <div class="alert-content">
          <span>{{ loadError }}</span>
          <el-button size="small" type="primary" @click="reload">重新加载</el-button>
        </div>
      </template>
    </el-alert>

    <!-- 顶部筛选 -->
    <div class="page-header">
      <div class="page-title">数据看板</div>
      <div class="filter-bar">
        <el-radio-group v-model="activeTab" size="small" @change="onTabChange">
          <el-radio-button label="7">7 天</el-radio-button>
          <el-radio-button label="14">14 天</el-radio-button>
          <el-radio-button label="30">30 天</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始"
          end-placeholder="结束"
          size="small"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :clearable="false"
          @change="onDateChange"
        />
        <el-button size="small" :loading="loading" @click="reload">刷新</el-button>
      </div>
    </div>

    <!-- 统计卡片（纯数字 + 简单 HTML 趋势条，无 ECharts） -->
    <div v-loading="loading" class="stat-grid">
      <div v-for="m in metrics" :key="m.key" class="stat-card">
        <div class="stat-label">{{ m.label }}</div>
        <div class="stat-value">{{ m.display }}</div>
        <div v-if="m.trend != null" class="stat-trend">
          <span :class="['trend-arrow', m.trend > 0 ? 'up' : m.trend < 0 ? 'down' : 'flat']">
            {{ m.trend > 0 ? '↑' : m.trend < 0 ? '↓' : '·' }}
          </span>
          <span :class="['trend-text', m.trend > 0 ? 'up' : m.trend < 0 ? 'down' : 'flat']">
            {{ Math.abs(m.trend).toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>

    <!-- 趋势图（仅保留 1 个 ECharts，组件方式加载 + 自动 dispose） -->
    <div v-loading="trendLoading" class="chart-card">
      <div class="chart-title">收益趋势（{{ rangeLabel }}）</div>
      <VChart
        v-if="trendOption && trendOption.series && trendOption.series.length"
        :key="trendKey"
        :option="trendOption"
        :init-options="{ renderer: 'svg' }"
        :update-options="{ notMerge: true, lazyUpdate: false }"
        class="chart-canvas"
        autoresize
      />
      <el-empty v-else description="暂无趋势数据" :image-size="60" />
    </div>

    <!-- 数据列表（无 ECharts，纯 HTML） -->
    <div class="list-grid">
      <div v-loading="loading" class="list-card">
        <div class="list-title">广告源对比</div>
        <div v-if="sourceRows.length" class="list-body">
          <div v-for="(row, idx) in sourceRows" :key="row.sourceId" class="list-row">
            <div class="row-rank">{{ idx + 1 }}</div>
            <div class="row-name">{{ row.name || row.sourceId }}</div>
            <div class="row-bar-track">
              <div class="row-bar-fill" :style="{ width: row.barPct + '%' }" />
            </div>
            <div class="row-value">¥{{ row.revenue.toFixed(2) }}</div>
          </div>
        </div>
        <el-empty v-else description="暂无数据" :image-size="50" />
      </div>

      <div v-loading="loading" class="list-card">
        <div class="list-title">广告位收益排行</div>
        <div v-if="placementRows.length" class="list-body">
          <div v-for="(row, idx) in placementRows" :key="row.placementId" class="list-row">
            <div class="row-rank">{{ idx + 1 }}</div>
            <div class="row-name">{{ row.placementId }}</div>
            <div class="row-bar-track">
              <div class="row-bar-fill" :style="{ width: row.barPct + '%' }" />
            </div>
            <div class="row-value">¥{{ row.revenue.toFixed(2) }}</div>
          </div>
        </div>
        <el-empty v-else description="暂无数据" :image-size="50" />
      </div>

      <div v-loading="loading" class="list-card">
        <div class="list-title">异常告警</div>
        <div v-if="anomalyRows.length" class="list-body">
          <div v-for="row in anomalyRows" :key="row.placementId + row.type" class="list-row">
            <div class="row-rank warn">!</div>
            <div class="row-name">
              {{ row.placementId }}
              <div class="row-sub">{{ row.type === 'revenue_drop' ? '收益下降' : row.type }}</div>
            </div>
            <div class="row-value warn">
              <div>{{ row.change > 0 ? '+' : '' }}{{ row.change.toFixed(1) }}%</div>
              <div class="row-sub">¥{{ row.recent.toFixed(2) }} / ¥{{ row.baseline.toFixed(2) }}</div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无异常" :image-size="50" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import dayjs from 'dayjs'
import { use } from 'echarts/core'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

use([SVGRenderer, CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

interface TrendPoint { date: string; revenue: number; impressions: number }
interface SourceRow { sourceId: string; name: string; revenue: number; impressions: number }
interface PlacementRow { placementId: string; revenue: number }
interface AnomalyRow { placementId: string; type: string; change: number; recent: number; baseline: number }

const loading = ref(false)
const trendLoading = ref(false)
const loadError = ref('')

const activeTab = ref<'7' | '14' | '30'>('7')
const dateRange = ref<[string, string]>([
  dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD'),
])
const trendKey = ref(0)  // 强制 VChart 重建计数器：vue-echarts 浅监听 prop 不更新时使用

// 趋势图标题：直接基于 dateRange 算起始/结束日期 + 天数，不依赖 reload 时的瞬时计算
const rangeLabel = computed(() => {
  const r = dateRange.value
  if (!r || r.length !== 2) return '—'
  const start = dayjs(r[0])
  const end = dayjs(r[1])
  if (!start.isValid() || !end.isValid()) return '—'
  const days = end.diff(start, 'day') + 1
  return `${r[0]} 至 ${r[1]} · 共 ${days} 天`
})

// 请求序号：用于在快速切换 tab 时丢弃过期响应，防止旧数据覆盖新数据
let requestSeq = 0
const isCurrent = (seq: number) => seq === requestSeq

const metrics = ref<Array<{ key: string; label: string; display: string; trend: number | null }>>([
  { key: 'revenue', label: '今日收益', display: '—', trend: null },
  { key: 'impressions', label: '今日展示', display: '—', trend: null },
  { key: 'fillRate', label: '填充率', display: '—', trend: null },
  { key: 'eCPM', label: 'eCPM', display: '—', trend: null },
])
const trendOption = ref<Record<string, unknown> | null>(null)
const sourceRows = ref<SourceRow[]>([])
const placementRows = ref<PlacementRow[]>([])
const anomalyRows = ref<AnomalyRow[]>([])

let reloadTimer: number | null = null

function formatNumber(value: unknown, key: string): string {
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  if (key === 'revenue' || key === 'eCPM') return `¥${num.toFixed(2)}`
  if (key === 'fillRate') return `${num.toFixed(2)}%`
  return num.toLocaleString('en-US')
}

function resolveDateRange(): { start: string; end: string } {
  if (dateRange.value && dateRange.value.length === 2) {
    return { start: dateRange.value[0], end: dateRange.value[1] }
  }
  const days = Number(activeTab.value)
  return {
    start: dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD'),
  }
}

function buildParams(): { startDate: string; endDate: string } {
  const r = resolveDateRange()
  return { startDate: r.start, endDate: r.end }
}

function showError(msg: string) {
  loadError.value = msg
  ElMessage.error(msg)
}

async function loadDashboardData() {
  const seq = ++requestSeq
  loading.value = true
  loadError.value = ''

  try {
    const params = buildParams()
    const [overviewRes, trendRes, sourceRes, placementRes, anomalyRes] = await Promise.all([
      request.get<{ code: number; data: Record<string, unknown> }>('/api/v1/console/dashboard/overview', { params }),
      request.get<{ code: number; data: TrendPoint[] }>('/api/v1/console/dashboard/trend', { params }),
      request.get<{ code: number; data: SourceRow[] }>('/api/v1/console/dashboard/source-comparison', { params }),
      request.get<{ code: number; data: PlacementRow[] }>('/api/v1/console/dashboard/placement-ranking', { params }),
      request.get<{ code: number; data: AnomalyRow[] }>('/api/v1/console/dashboard/anomalies', { params }),
    ])

    // 任何后续 setState 之前先检查 seq（防止过期响应覆盖新请求）
    if (seq !== requestSeq) return

    const ov = overviewRes.data || {}
    metrics.value = [
      { key: 'revenue', label: '今日收益', display: formatNumber(ov.todayRevenue, 'revenue'), trend: Number(ov.revenueTrend ?? 0) },
      { key: 'impressions', label: '今日展示', display: formatNumber(ov.todayImpressions, 'impressions'), trend: Number(ov.impressionsTrend ?? 0) },
      { key: 'fillRate', label: '填充率', display: formatNumber(ov.fillRate, 'fillRate'), trend: Number(ov.fillRateTrend ?? 0) },
      { key: 'eCPM', label: 'eCPM', display: formatNumber(ov.eCPM, 'eCPM'), trend: Number(ov.eCPMTrend ?? 0) },
    ]

    const trendData = Array.isArray(trendRes.data) ? trendRes.data : []
    trendOption.value = {
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: trendData.map(p => p.date),
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: { color: '#64748B', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
        axisLabel: { color: '#64748B', fontSize: 11, formatter: '¥{value}' },
      },
      series: [{
        name: '收益',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: trendData.map(p => p.revenue),
        lineStyle: { color: '#2563EB', width: 2 },
        itemStyle: { color: '#2563EB' },
        areaStyle: { color: 'rgba(37, 99, 235, 0.1)' },
      }],
    }
    // 递增重建 key + notMerge + lazyUpdate=false 强制 VChart 完全重绘（防 vue-echarts 8.x 浅监听 + merge 模式 bug）
    trendKey.value++

    const sources = Array.isArray(sourceRes.data) ? sourceRes.data : []
    const maxRevenue = Math.max(...sources.map(s => Number(s.revenue) || 0), 1)
    sourceRows.value = sources.map(s => ({
      ...s,
      revenue: Number(s.revenue) || 0,
      impressions: Number(s.impressions) || 0,
      barPct: Math.round((Number(s.revenue) || 0) / maxRevenue * 100),
    }))

    const placements = Array.isArray(placementRes.data) ? placementRes.data : []
    const maxPlacementRev = Math.max(...placements.map(p => Number(p.revenue) || 0), 1)
    placementRows.value = placements.map(p => ({
      ...p,
      revenue: Number(p.revenue) || 0,
      barPct: Math.round((Number(p.revenue) || 0) / maxPlacementRev * 100),
    }))

    if (seq !== requestSeq) return
    anomalyRows.value = Array.isArray(anomalyRes.data) ? anomalyRes.data : []
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '加载看板数据失败'
    showError(msg)
  } finally {
    loading.value = false
  }
}

function reload() {
  loadDashboardData()
}

function onTabChange() {
  dateRange.value = [
    dayjs().subtract(Number(activeTab.value) - 1, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]
  reload()
}

function onDateChange() {
  if (reloadTimer) {
    window.clearTimeout(reloadTimer)
  }
  reloadTimer = window.setTimeout(() => {
    reload()
  }, 200)
}

watch(
  dateRange,
  () => {
    if (reloadTimer) window.clearTimeout(reloadTimer)
    reloadTimer = window.setTimeout(() => {
      reload()
    }, 200)
  },
  { deep: true },
)

onMounted(() => {
  reload()
})

onBeforeUnmount(() => {
  if (reloadTimer) {
    window.clearTimeout(reloadTimer)
    reloadTimer = null
  }
})
</script>
