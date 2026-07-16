<template>
  <div class="page-shell page-dashboard">
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

    <!-- Page Header（DESIGN.md 数据看板规范） -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <el-icon><DataAnalysis /></el-icon>
        </div>
        <div class="page-header-titles">
          <h1 class="page-header-title">数据看板</h1>
          <p class="page-header-subtitle">实时收入 / 趋势 / 多维排行</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button size="small" :icon="Refresh" :loading="overviewLoading" @click="reload">
          刷新
        </el-button>
      </div>
    </div>

    <!-- ═══ 上：收入详情（4 个 stat-card） ═══ -->
    <div v-loading="overviewLoading" class="stat-grid stat-grid--income">
      <div v-for="card in overviewCards" :key="card.key" class="stat-card stat-card--income">
        <div class="stat-card__head">
          <div class="stat-card__label">{{ card.label }}</div>
          <div v-if="card.period" class="stat-card__period">{{ card.period }}</div>
        </div>

        <div class="stat-card__main">
          <span class="stat-card__currency">¥</span>
          <span class="stat-card__value">{{ card.revenueDisplay }}</span>
        </div>
      </div>
    </div>

    <!-- ═══ 中：数据趋势（filter + ECharts） ═══ -->
    <div class="page-card page-section">
      <div class="page-section__head">
        <div class="page-section__title">数据趋势</div>
        <div class="page-section__filters">
          <span class="filter-label">维度</span>
          <el-select v-model="trendDimension" size="small" class="filter-select" @change="onTrendFilterChange">
            <el-option v-for="d in dimensionOptions" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
          <span class="filter-label">指标</span>
          <el-select v-model="trendMetric" size="small" class="filter-select" @change="onTrendFilterChange">
            <el-option v-for="m in metricOptions" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
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
            :shortcuts="dateShortcuts"
            @change="onTrendFilterChange"
            class="filter-date"
          >
            <template #prefix>
              <span class="filter-date__prefix">
                <el-icon><Calendar /></el-icon>
              </span>
            </template>
          </el-date-picker>
        </div>
      </div>

      <div v-loading="trendLoading" class="chart-wrapper">
        <VChart
          :key="trendKey"
          :option="trendOption"
          :init-options="{ renderer: 'svg' }"
          :update-options="{ notMerge: true, lazyUpdate: false }"
          class="chart-canvas"
          autoresize
        />
      </div>

      <div class="page-section__foot">
        <div class="period-pill">
          <div class="period-pill__icon">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="period-pill__body">
            <div class="period-pill__head">
              <span class="period-pill__label">{{ rangeMeta.label }}</span>
              <span class="period-pill__days">
                <span class="period-pill__num">{{ rangeMeta.days }}</span>
                <span class="period-pill__unit">天</span>
              </span>
            </div>
            <div class="period-pill__range">
              <span class="period-pill__date">{{ rangeMeta.start }}</span>
              <span class="period-pill__arrow">→</span>
              <span class="period-pill__date">{{ rangeMeta.end }}</span>
            </div>
          </div>
        </div>
        <div class="page-section__note">注：DAU = 展示 ÷ 100、预估收益 = 收益 × 1.0（仅占位估算，真实接入后会替换）</div>
      </div>
    </div>

    <!-- ═══ 下：6 个排行卡片（2×3 grid） ═══ -->
    <div class="ranking-grid">
      <div
        v-for="card in rankingConfigs"
        :key="card.dimension"
        v-loading="rankingLoadingMap[card.dimension]"
        class="page-card page-rank-card"
      >
        <div class="page-rank-card__head">
          <div class="page-rank-card__title">
            <el-icon><Trophy /></el-icon>
            <span>TOP {{ card.label }}</span>
          </div>
          <el-select
            v-model="rankingMetricMap[card.dimension]"
            size="small"
            class="rank-card__metric"
            @change="loadRanking(card.dimension)"
          >
            <el-option v-for="m in metricOptions" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </div>

        <div class="page-rank-card__body">
          <template v-if="rankingRowsMap[card.dimension] && rankingRowsMap[card.dimension].length">
            <div
              v-for="(row, idx) in rankingRowsMap[card.dimension]"
              :key="row.entity"
              class="rank-row"
            >
              <div :class="['rank-row__rank', idx < 3 ? `top-${idx + 1}` : '']">{{ idx + 1 }}</div>
              <div class="rank-row__name" :title="row.name">{{ row.name }}</div>
              <div class="rank-row__bar-track">
                <div class="rank-row__bar-fill" :style="{ width: row.barPct + '%' }" />
              </div>
              <div class="rank-row__value">{{ formatRankingValue(row.value, rankingMetricMap[card.dimension]) }}</div>
            </div>
          </template>
          <el-empty v-else description="暂无数据" :image-size="50" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, reactive } from 'vue'
import dayjs from 'dayjs'
import { dateShortcuts as sharedDateShortcuts } from '@/utils/date-shortcuts'
import { use } from 'echarts/core'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  DataAnalysis,
  ArrowUp,
  ArrowDown,
  Refresh,
  Calendar,
  Trophy,
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

use([
  SVGRenderer,
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
])

// ─── 维度和指标选项 ───────────────────────────────────────────
const dimensionOptions = [
  { value: 'summary', label: '汇总' },
  { value: 'app', label: 'TOP应用' },
  { value: 'placement', label: 'TOP广告位' },
  { value: 'adType', label: 'TOP广告类型' },
  { value: 'region', label: 'TOP地区' },
  { value: 'network', label: 'TOP广告平台' },
  { value: 'os', label: 'TOP系统' },
]
const metricOptions = [
  { value: 'revenue', label: '收益' },
  { value: 'impressions', label: '展示' },
  { value: 'dau', label: 'DAU' },
  { value: 'estimatedRevenue', label: '预估收益' },
]
const rankingConfigs = [
  { dimension: 'app', label: '应用' },
  { dimension: 'placement', label: '广告位' },
  { dimension: 'adType', label: '广告类型' },
  { dimension: 'region', label: '地区' },
  { dimension: 'network', label: '广告平台' },
  { dimension: 'os', label: '系统' },
]

// ─── 状态 ───────────────────────────────────────────
const loading = ref(false)
const overviewLoading = ref(false)
const trendLoading = ref(false)
const loadError = ref('')

const overviewCards = ref<
  Array<{
    key: string
    label: string
    period: string
    compareWith: string
    revenueDisplay: string
    impressionsDisplay: string
    dauDisplay: string
    estimatedDisplay: string
    trend: number
  }>
>([])

const trendDimension = ref<string>('summary')
const trendMetric = ref<string>('revenue')
const dateRange = ref<[string, string]>([
  dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD'),
])
// 空态 option: 后端无数据时也展示坐标轴, 避免空白
const emptyTrendOption = (): Record<string, unknown> => ({
  grid: { left: 56, right: 24, top: 36, bottom: 36 },
  xAxis: {
    type: 'category',
    data: [],
    axisLine: { lineStyle: { color: '#CBD5E1' } },
    axisLabel: { color: '#64748B', fontSize: 12 },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#E2E8F0', type: 'dashed' } },
    axisLabel: { color: '#64748B', fontSize: 12 },
  },
  series: [{ type: 'line', data: [], smooth: true, symbolSize: 6, lineStyle: { width: 2, color: '#1E40AF' }, itemStyle: { color: '#1E40AF' } }],
})
const trendOption = ref<Record<string, unknown>>(emptyTrendOption())
const trendKey = ref(0)

// 6 个 ranking 卡片：每个 dimension 独立 metric + 数据
const rankingMetricMap = reactive<Record<string, string>>({
  app: 'revenue',
  placement: 'revenue',
  adType: 'revenue',
  region: 'revenue',
  network: 'revenue',
  os: 'revenue',
})
const rankingLoadingMap = reactive<Record<string, boolean>>({
  app: false,
  placement: false,
  adType: false,
  region: false,
  network: false,
  os: false,
})
const rankingRowsMap = reactive<Record<string, Array<{ entity: string; name: string; value: number; barPct: number }>>>({
  app: [],
  placement: [],
  adType: [],
  region: [],
  network: [],
  os: [],
})

// 日期快捷选项复用 @/utils/date-shortcuts
const dateShortcuts = sharedDateShortcuts


// ─── 计算属性 ─────────────────────────────────────
const rangeLabel = computed(() => {
  const r = dateRange.value
  if (!r || r.length !== 2) return '—'
  const start = dayjs(r[0])
  const end = dayjs(r[1])
  if (!start.isValid() || !end.isValid()) return '—'
  const days = end.diff(start, 'day') + 1
  if (days === 1) {
    return `${r[0]} · 按小时`
  }
  return `${r[0]} 至 ${r[1]} · 共 ${days} 天`
})

// 供底部「period-pill」使用：拆出 days / 起始 / 结束 / 标签
const rangeMeta = computed<{ label: string; days: number | string; start: string; end: string }>(() => {
  const r = dateRange.value
  if (!r || r.length !== 2) return { label: '统计周期', days: '—', start: '—', end: '—' }
  const start = dayjs(r[0])
  const end = dayjs(r[1])
  if (!start.isValid() || !end.isValid()) return { label: '统计周期', days: '—', start: '—', end: '—' }
  const days = end.diff(start, 'day') + 1
  return {
    label: days === 1 ? '单日粒度' : '统计周期',
    days,
    start: r[0],
    end: r[1],
  }
})

// ─── 工具方法 ─────────────────────────────────────
function formatNumber(value: unknown, key: 'revenue' | 'impressions' | 'dau' | 'estimatedRevenue'): string {
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  if (key === 'revenue' || key === 'estimatedRevenue') return `${num.toFixed(2)}`
  if (key === 'dau') return num.toLocaleString('en-US')
  return num.toLocaleString('en-US')
}

function formatRankingValue(value: number, metric: string): string {
  if (metric === 'revenue' || metric === 'estimatedRevenue') return `¥${value.toFixed(2)}`
  return value.toLocaleString('en-US')
}

function showError(msg: string) {
  loadError.value = msg
  ElMessage.error(msg)
}

// 请求序号：用于快速切换筛选时丢弃过期响应
// HMR 时 module 重新 evaluate 会让 module 级 let 重置导致闭包引用错位
// 改用 inflight flag：已有进行中请求时直接 return（最简实现）
let inflightOverview = false
let inflightTrend = false
let inflightRanking = false

// ─── 数据加载 ─────────────────────────────────────
async function loadOverview() {
  if (inflightOverview) return
  inflightOverview = true
  overviewLoading.value = true
  loadError.value = ''
  try {
    const res = await request.get<unknown>('/api/v1/console/dashboard/overview')
    const inner = (res as { data?: unknown })?.data
    const stats: Array<{ key: string; label: string; period: string; revenue: number }> = Array.isArray(inner)
      ? (inner as never)
      : (inner && typeof inner === 'object' && Array.isArray((inner as { stats?: unknown[] }).stats))
        ? ((inner as { stats: never[] }).stats)
        : []
    overviewCards.value = stats.map((s) => ({
      key: s.key,
      label: s.label,
      period: s.period,
      revenueDisplay: formatNumber(s.revenue, 'revenue'),
    }))
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '加载收入详情失败'
    showError(msg)
  } finally {
    inflightOverview = false
    overviewLoading.value = false
  }
}

async function loadTrend() {
  if (inflightTrend) return
  inflightTrend = true
  trendLoading.value = true
  try {
    const params = {
      dimension: trendDimension.value,
      metric: trendMetric.value,
      startDate: dateRange.value[0],
      endDate: dateRange.value[1],
    }
    const res = await request.get<{ code: number; data: {
      dimension: string
      metric: string
      granularity?: 'day' | 'hour'
      startDate?: string
      endDate?: string
      points?: Array<{ date: string; hour?: number; value: number }>
      dates?: string[]
      hours?: number[]
      series?: Array<{ name: string; data: number[] }>
      xAxis?: Array<string | number>
    } }>('/api/v1/console/dashboard/trend', { params })

    const d = res.data
    if (!d) {
      trendOption.value = emptyTrendOption()
      return
    }

    const metric = d.metric
    const isRevenue = metric === 'revenue' || metric === 'estimatedRevenue'
    const yFormatter = isRevenue ? '¥{value}' : '{value}'
    const isHourly = d.granularity === 'hour'

    // x 轴标签
    const buildXAxisData = (): string[] => {
      if (d.points) return d.points.map((p) => isHourly ? `${String(p.hour ?? 0).padStart(2, '0')}:00` : p.date)
      if (d.hours) return d.hours.map((h) => `${String(h).padStart(2, '0')}:00`)
      if (d.xAxis) return d.xAxis.map((x) => isHourly ? `${String(x).padStart(2, '0')}:00` : String(x))
      return d.dates || []
    }

    // summary：单 series
    if (d.dimension === 'summary' && d.points) {
      const xData = buildXAxisData()
      trendOption.value = {
        grid: { left: 56, right: 24, top: 36, bottom: isHourly ? 40 : 36 },
        tooltip: {
          trigger: 'axis',
          formatter: (params: unknown) => {
            const arr = Array.isArray(params) ? params : [params]
            const p = arr[0] as { dataIndex: number }
            const idx = p.dataIndex
            const point = d.points![idx]
            const label = isHourly ? `${point.date} ${String(point.hour ?? 0).padStart(2, '0')}:00` : point.date
            const v = point.value
            return `<div style="font-size:12px;color:#475569">${label}</div><div style="font-weight:600;color:#1E293B;margin-top:2px">${isRevenue ? `¥${Number(v).toFixed(2)}` : Number(v).toLocaleString('en-US')}</div>`
          },
        },
        xAxis: {
          type: 'category',
          data: xData,
          axisLine: { lineStyle: { color: '#CBD5E1' } },
          axisLabel: { color: '#64748B', fontSize: 11, interval: isHourly ? 'auto' : 0, rotate: isHourly ? 0 : 0 },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
          axisLabel: { color: '#64748B', fontSize: 11, formatter: yFormatter },
        },
        series: [{
          name: getMetricLabel(metric),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: d.points.map((p) => p.value),
          lineStyle: { color: '#2563EB', width: 2 },
          itemStyle: { color: '#2563EB' },
          areaStyle: { color: 'rgba(37, 99, 235, 0.10)' },
        }],
      }
    } else if (d.series) {
      // 多 series（API 返回 xAxis + series，summary 维度无 dates 但 series 字段也不存在）
      const colors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
      const xData = buildXAxisData()
      trendOption.value = {
        grid: { left: 56, right: 24, top: 50, bottom: isHourly ? 40 : 36 },
        tooltip: {
          trigger: 'axis',
          formatter: (params: unknown) => {
            const arr = Array.isArray(params) ? params : [params]
            const p = arr[0] as { dataIndex: number; seriesName: string; value: number }
            const idx = p.dataIndex
            const label = isHourly
              ? `${dateRange.value[0]} ${String(d.xAxis?.[idx] ?? idx).padStart(2, '0')}:00`
              : String(d.xAxis?.[idx] ?? d.dates?.[idx] ?? '')
            const lines = arr.map((x) => {
              const xi = x as { seriesName: string; value: number }
              return `<div style="display:flex;align-items:center;gap:6px;margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors[arr.indexOf(x) % colors.length] ?? '#2563EB'}"></span><span style="flex:1;color:#475569">${xi.seriesName}</span><span style="font-weight:600;color:#1E293B">${isRevenue ? `¥${Number(xi.value).toFixed(2)}` : Number(xi.value).toLocaleString('en-US')}</span></div>`
            }).join('')
            return `<div style="font-size:12px;color:#475569;margin-bottom:4px">${label}</div>${lines}`
          },
        },
        legend: { top: 6, textStyle: { color: '#475569', fontSize: 12 } },
        xAxis: {
          type: 'category',
          data: xData,
          axisLine: { lineStyle: { color: '#CBD5E1' } },
          axisLabel: { color: '#64748B', fontSize: 11, interval: isHourly ? 'auto' : 0 },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
          axisLabel: { color: '#64748B', fontSize: 11, formatter: yFormatter },
        },
        series: d.series.map((s, i) => ({
          name: s.name,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          data: s.data,
          lineStyle: { color: colors[i % colors.length], width: 2 },
          itemStyle: { color: colors[i % colors.length] },
        })),
      }
    } else {
      trendOption.value = null
    }
    trendKey.value++
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '加载趋势数据失败'
    showError(msg)
  } finally {
    inflightTrend = false
    trendLoading.value = false
  }
}

async function loadRanking(dimension: string) {
  rankingLoadingMap[dimension] = true
  try {
    const params = {
      metric: rankingMetricMap[dimension],
      startDate: dateRange.value[0],
      endDate: dateRange.value[1],
      limit: 10,
    }
    const res = await request.get<{ code: number; data: {
      dimension: string; metric: string;
      ranking: Array<{ entity: string; name: string; value: number }>
    } }>(`/api/v1/console/dashboard/ranking/${dimension}`, { params })

    const rows = res.data?.ranking || []
    const max = Math.max(...rows.map((r) => Number(r.value) || 0), 1)
    rankingRowsMap[dimension] = rows.map((r) => ({
      entity: r.entity,
      name: r.name,
      value: Number(r.value) || 0,
      barPct: Math.round((Number(r.value) || 0) / max * 100),
    }))
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : `加载 ${dimension} 排行失败`
    showError(msg)
    rankingRowsMap[dimension] = []
  } finally {
    rankingLoadingMap[dimension] = false
  }
}

function loadAllRankings() {
  return Promise.all(rankingConfigs.map((c) => loadRanking(c.dimension)))
}

function getMetricLabel(m: string): string {
  const found = metricOptions.find((opt) => opt.value === m)
  return found?.label || m
}

// ─── 事件 ────────────────────────────────────────
function onTrendFilterChange() {
  loadTrend()
  loadAllRankings()
}

function reload() {
  loadOverview()
  loadTrend()
  loadAllRankings()
}

// 监听 dateRange 变化（避免 dateRange 改但 trend 旧）
watch(
  dateRange,
  () => {
    onTrendFilterChange()
  },
  { deep: true },
)

onMounted(() => {
  loadOverview()
  loadTrend()
  loadAllRankings()
})

onBeforeUnmount(() => {
  // 清空
})
</script>
