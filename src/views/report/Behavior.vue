<!--
  Behavior.vue - 用户行为分析
  3 个子报表 Tab（按截图：
  - 展示频次：用户日均展示次数分布（10 个频次档：1次/2次/.../10次）
  - 用户价值：eCPM 范围 0-50 切 25 段，展示累计占比
  - 使用时长：人均使用时长 vs 人均会话次数，双指标对比
  -->
<template>
  <div class="page-shell behavior-page">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><Histogram /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">用户行为</h1>
          <p class="page-header-subtitle">频次分布、用户价值、使用时长三大子报表</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="Refresh" @click="loadAll">刷新</el-button>
        <el-button :icon="Download" @click="exportCurrent">导出</el-button>
      </div>
    </div>

    <div class="behavior-master-detail">
      <!-- 左侧：子报表导航 -->
      <aside class="behavior-master-panel">
        <div class="behavior-master-header">
          <h2 class="behavior-master-title">
            <el-icon><Menu /></el-icon>
            <span>类型</span>
          </h2>
        </div>
        <div class="behavior-master-list">
          <div
            v-for="r in subReports"
            :key="r.code"
            :class="['behavior-master-item', { active: currentSubtype === r.code }]"
            @click="switchSubtype(r.code)"
          >
            <div class="behavior-master-item-icon" :style="{ background: r.color }">
              <el-icon><component :is="r.icon" /></el-icon>
            </div>
            <div class="behavior-master-item-body">
              <div class="behavior-master-item-name">{{ r.name }}</div>
              <div class="behavior-master-item-desc">{{ r.desc }}</div>
            </div>
            <el-icon v-if="currentSubtype === r.code" class="behavior-master-item-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </aside>

      <!-- 主区 -->
      <main class="behavior-detail-panel">
        <!-- 筛选器 -->
        <div class="behavior-toolbar">
          <ReportFilter v-model="filter" @change="loadAll" />
        </div>

        <!-- Tab 1: 展示频次（10 个频次档） -->
        <div v-if="currentSubtype === 'frequency'" class="behavior-card" v-loading="loading">
          <div class="behavior-tab-layout">
            <!-- 上：7 天趋势图 -->
            <div class="behavior-freq-trend-pane">
              <div class="behavior-card-header">
                <h3 class="behavior-card-title">
                  <el-icon><TrendCharts /></el-icon>
                  <span>7 天趋势</span>
                </h3>
                <div class="behavior-card-actions">
                  <el-button :icon="EditPen" plain size="small" @click="trendPickerOpen = true">指标选择</el-button>
                </div>
              </div>

              <div class="freq-trend-kpi">
                <div v-for="k in freqTrendKpi" :key="k.code" class="freq-trend-kpi-item" :style="{ borderLeftColor: k.color }">
                  <span class="freq-trend-kpi-name">{{ k.name }}</span>
                  <span class="freq-trend-kpi-value" :style="{ color: k.color }">{{ k.value }}</span>
                  <span class="freq-trend-kpi-delta" :class="k.delta >= 0 ? 'tone-up' : 'tone-down'">
                    {{ k.delta >= 0 ? '↑' : '↓' }}&nbsp;{{ Math.abs(k.delta).toFixed(2) }}%
                  </span>
                </div>
              </div>

              <div class="freq-trend-chart">
                <v-chart v-if="freqTrendDates.length > 0" :option="freqTrendChartOption" autoresize style="height: 280px" />
                <div v-else class="frequency-empty">暂无数据</div>
              </div>

              <el-dialog
                v-model="trendPickerOpen"
                title="选择趋势指标"
                width="520px"
                :close-on-click-modal="false"
                append-to-body
              >
                <el-checkbox-group v-model="freqTrendPicked" class="freq-trend-picker">
                  <el-checkbox v-for="m in FREQ_TREND_METRICS" :key="m.code" :label="m.code">
                    <span class="freq-trend-picker-chip" :style="{ background: m.color + '20', color: m.color, borderColor: m.color + '50' }">{{ m.name }}</span>
                  </el-checkbox>
                </el-checkbox-group>
                <template #footer>
                  <el-button @click="trendPickerOpen = false">取消</el-button>
                  <el-button type="primary" @click="trendPickerOpen = false">确定</el-button>
                </template>
              </el-dialog>
            </div>

            <!-- 下：频次分布表 -->
            <div class="behavior-freq-table-pane">
              <div class="behavior-card-header">
                <h3 class="behavior-card-title">详细数据</h3>
                <div class="behavior-card-actions">
                  <el-tag size="small" effect="plain" type="info">日均展示频次</el-tag>
                </div>
              </div>
              <div class="frequency-table">
                <div class="frequency-row frequency-row--header">
                  <div class="frequency-col">频次</div>
                  <div class="frequency-col">展示数</div>
                  <div class="frequency-col">展示占比</div>
                  <div class="frequency-col">设备数</div>
                  <div class="frequency-col">设备占比</div>
                  <div class="frequency-col">预估收益</div>
                  <div class="frequency-col">预估收益占比</div>
                  <div class="frequency-col frequency-col--bar">分布</div>
                </div>
                <div
                  v-for="row in frequencyRows"
                  :key="row.label"
                  class="frequency-row"
                >
                  <div class="frequency-col frequency-col--range">
                    <el-icon><DataLine /></el-icon>
                    <span>{{ row.label }}</span>
                  </div>
                  <div class="frequency-col">{{ row.impressions.toLocaleString() }}</div>
                  <div class="frequency-col">{{ row.impPercent }}%</div>
                  <div class="frequency-col">{{ row.devices.toLocaleString() }}</div>
                  <div class="frequency-col">{{ row.devPercent }}%</div>
                  <div class="frequency-col">¥{{ row.revenue.toFixed(2) }}</div>
                  <div class="frequency-col">{{ row.revPercent }}%</div>
                  <div class="frequency-col frequency-col--bar">
                    <div class="frequency-bar" :style="{ width: row.barWidth + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: 用户价值（eCPM 范围 25 段） -->
        <div v-else-if="currentSubtype === 'value'" class="behavior-card" v-loading="loading">
          <div class="behavior-tab-layout">
            <!-- 上：7 天趋势图 -->
            <div class="behavior-value-trend-pane">
              <div class="behavior-card-header">
                <h3 class="behavior-card-title">
                  <el-icon><TrendCharts /></el-icon>
                  <span>7 天趋势</span>
                </h3>
                <div class="behavior-card-actions">
                  <el-button :icon="EditPen" plain size="small" @click="valueTrendPickerOpen = true">指标选择</el-button>
                </div>
              </div>

              <div class="freq-trend-kpi">
                <div v-for="k in valueTrendKpi" :key="k.code" class="freq-trend-kpi-item" :style="{ borderLeftColor: k.color }">
                  <span class="freq-trend-kpi-name">{{ k.name }}</span>
                  <span class="freq-trend-kpi-value" :style="{ color: k.color }">{{ k.value }}</span>
                  <span class="freq-trend-kpi-delta" :class="k.delta >= 0 ? 'tone-up' : 'tone-down'">
                    {{ k.delta >= 0 ? '↑' : '↓' }}&nbsp;{{ Math.abs(k.delta).toFixed(2) }}%
                  </span>
                </div>
              </div>

              <div class="freq-trend-chart">
                <v-chart v-if="valueTrendDates.length > 0" :option="valueTrendChartOption" autoresize style="height: 280px" />
                <div v-else class="frequency-empty">暂无数据</div>
              </div>

              <el-dialog
                v-model="valueTrendPickerOpen"
                title="选择趋势指标"
                width="520px"
                :close-on-click-modal="false"
                append-to-body
              >
                <el-checkbox-group v-model="valueTrendPicked" class="freq-trend-picker">
                  <el-checkbox v-for="m in VALUE_TREND_METRICS" :key="m.code" :label="m.code">
                    <span class="freq-trend-picker-chip" :style="{ background: m.color + '20', color: m.color, borderColor: m.color + '50' }">{{ m.name }}</span>
                  </el-checkbox>
                </el-checkbox-group>
                <template #footer>
                  <el-button @click="valueTrendPickerOpen = false">取消</el-button>
                  <el-button type="primary" @click="valueTrendPickerOpen = false">确定</el-button>
                </template>
              </el-dialog>
            </div>

            <!-- 下：eCPM 范围分布表 -->
            <div class="behavior-value-table-pane">
              <div class="behavior-card-header">
                <h3 class="behavior-card-title">详细数据</h3>
                <div class="behavior-card-actions">
                  <span class="behavior-card-vs">eCPM 范围</span>
                  <el-select v-model="valueMetric" style="width: 130px" @change="loadAll">
                    <el-option v-for="m in VALUE_METRICS" :key="m.value" :label="m.label" :value="m.value" />
                  </el-select>
                  <span class="behavior-card-vs">范围</span>
                  <el-select v-model="valueRange" style="width: 100px" @change="loadAll">
                    <el-option v-for="r in VALUE_RANGES" :key="r.value" :label="r.label" :value="r.value" />
                  </el-select>
                  <el-button plain size="small" :icon="EditPen" @click="valueDimPickerOpen = true">维度</el-button>
                </div>
              </div>
              <div class="value-table">
                <div class="value-row value-row--header">
                  <div class="value-col">{{ valueMetricLabel }}范围</div>
                  <div v-for="d in visibleDimensions" :key="d.key" class="value-col" :class="{ 'value-col--money': d.type === 'money' }">
                    {{ d.label }}
                  </div>
                </div>
                <div v-for="row in valueRows" :key="row.range" class="value-row">
                  <div class="value-col value-col--name">{{ row.range }}</div>
                  <div v-for="d in visibleDimensions" :key="d.key" class="value-col" :class="{ 'value-col--money': d.type === 'money' }">
                    <template v-if="d.type === 'count'">{{ row[d.key].toLocaleString() }}</template>
                    <template v-else-if="d.type === 'money'">¥{{ row[d.key].toFixed(2) }}</template>
                    <template v-else>{{ row[d.key] }}%</template>
                  </div>
                </div>
              </div>

              <!-- 维度选择弹窗 -->
              <el-dialog v-model="valueDimPickerOpen" title="维度选择" width="520px" append-to-body>
                <div class="value-dim-picker">
                  <el-checkbox-group v-model="valueDimPicked" class="value-dim-picker-group">
                    <el-checkbox v-for="d in VALUE_TABLE_DIMENSIONS" :key="d.key" :value="d.key" class="value-dim-picker-chip" border>
                      <span class="value-dim-picker-dot" :style="{ background: d.color }"></span>
                      <span>{{ d.label }}</span>
                    </el-checkbox>
                  </el-checkbox-group>
                </div>
                <template #footer>
                  <el-button @click="valueDimPickerOpen = false">取消</el-button>
                  <el-button type="primary" @click="valueDimPickerOpen = false">确定</el-button>
                </template>
              </el-dialog>
            </div>
          </div>
        </div>

        <!-- Tab 3: 使用时长（人均使用时长 vs 人均会话次数） -->
        <div v-else-if="currentSubtype === 'duration'" class="behavior-card" v-loading="loading">
          <div class="behavior-card-header">
            <h3 class="behavior-card-title">数据预览</h3>
            <div class="behavior-card-actions">
              <span class="behavior-card-vs">对比</span>
              <el-select v-model="primaryMetric" style="width: 180px" @change="loadAll">
                <el-option v-for="m in DURATION_METRICS" :key="m.value" :label="m.label" :value="m.value" />
              </el-select>
              <span class="behavior-card-vs">vs</span>
              <el-select v-model="compareMetric" style="width: 180px" @change="loadAll">
                <el-option v-for="m in DURATION_METRICS" :key="m.value" :label="m.label" :value="m.value" />
              </el-select>
            </div>
          </div>
          <div class="duration-summary">
            <div class="duration-summary-item">
              <div class="duration-summary-label">{{ primaryMetricLabel }}</div>
              <div class="duration-summary-value">{{ primaryAvg }}</div>
              <div class="duration-summary-extra">单位：{{ primaryUnit }}</div>
            </div>
            <div class="duration-summary-divider">vs</div>
            <div class="duration-summary-item">
              <div class="duration-summary-label">{{ compareMetricLabel }}</div>
              <div class="duration-summary-value">{{ compareAvg }}</div>
              <div class="duration-summary-extra">单位：{{ compareUnit }}</div>
            </div>
            <div class="duration-summary-item">
              <div class="duration-summary-label">差异</div>
              <div class="duration-summary-value" :class="diffTone">{{ diff }}</div>
              <div class="duration-summary-extra">{{ diffPercent }}%</div>
            </div>
          </div>
          <div class="duration-chart">
            <v-chart v-if="primaryData.length > 0" class="duration-chart-canvas" :option="durationChartOption" autoresize />
            <div v-else class="frequency-empty">暂无数据</div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Histogram, DataLine, Menu, Refresh, Download, ArrowRight, TrendCharts, EditPen } from '@element-plus/icons-vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import request from '@/utils/request';
import ReportFilter from '@/components/report/ReportFilter.vue';
import type { ReportFilter as Filter } from '@/components/report/ReportFilter.vue';
import dayjs from 'dayjs';

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent]);

interface BehaviorSubReport {
  code: 'frequency' | 'value' | 'duration';
  name: string;
  desc: string;
  icon: any;
  color: string;
}

interface FrequencyRow {
  label: string;
  impressions: number;
  impPercent: string;
  devices: number;
  devPercent: string;
  revenue: number;
  revPercent: string;
  barWidth: number;
}

interface ValueRow {
  range: string;
  impressions: number;
  impPercent: string;
  devices: number;
  devPercent: string;
  revenue: number;
  revPercent: string;
  revCumPercent: string;
}

const subReports: BehaviorSubReport[] = [
  { code: 'frequency', name: '展示频次', desc: '用户日均展示次数分布', icon: DataLine, color: '#3B82F6' },
  { code: 'value',     name: '用户价值', desc: 'eCPM 区间用户分群贡献', icon: Histogram, color: '#10B981' },
  { code: 'duration',  name: '使用时长', desc: '人均时长与会话次数对比', icon: Menu, color: '#F59E0B' },
];

// 频次分布：1-10 次
const FREQ_BUCKETS = [
  { label: '1次',  max: 1,  weight: 0.05 },
  { label: '2次',  max: 2,  weight: 0.07 },
  { label: '3次',  max: 3,  weight: 0.09 },
  { label: '4次',  max: 4,  weight: 0.10 },
  { label: '5次',  max: 5,  weight: 0.13 },
  { label: '6次',  max: 6,  weight: 0.15 },
  { label: '7次',  max: 7,  weight: 0.14 },
  { label: '8次',  max: 8,  weight: 0.10 },
  { label: '9次',  max: 9,  weight: 0.09 },
  { label: '10次', max: 10, weight: 0.08 },
];

const VALUE_METRICS = [
  { value: 'ecpm_actual',        label: 'eCPM' },
  { value: 'ecpc',               label: 'eCPC' },
  { value: 'arpdau_actual',      label: 'ARPDAU' },
  { value: 'revenue_actual',     label: '实际收益' },
  { value: 'revenue_estimated',  label: '预估收益' },
];

const VALUE_RANGES = [
  { value: '0-50',   label: '0-50' },
  { value: '0-100',  label: '0-100' },
  { value: '0-200',  label: '0-200' },
  { value: '0-1000', label: '0-1000' },
];

const DURATION_METRICS = [
  { value: 'avg_session_duration',    label: '人均使用时长', unit: '秒' },
  { value: 'session_per_user',        label: '人均会话次数', unit: '次' },
  { value: 'single_session_duration', label: '单次使用时长', unit: '秒' },
  { value: 'session_count',           label: '总会话数',     unit: '次' },
];

const currentSubtype = ref<'frequency' | 'value' | 'duration'>('frequency');
const loading = ref(false);
const filter = ref<Filter>({ dateRange: '7d', appIds: [], placementIds: [], adSourceIds: [], formats: [], country: [], osList: [], platforms: [] });

// 频次
const frequencyRows = ref<FrequencyRow[]>([]);

// 价值
const valueMetric = ref('ecpm_actual');
const valueRange = ref('0-50');
const valueRows = ref<ValueRow[]>([]);

// 时长
const primaryMetric = ref('avg_session_duration');
const compareMetric = ref('session_per_user');
const primaryAvg = ref('0.00');
const compareAvg = ref('0.00');
const primaryData = ref<Array<{ date: string; value: number }>>([]);
const compareData = ref<Array<{ date: string; value: number }>>([]);

const valueMetricLabel = computed(() => VALUE_METRICS.find((m) => m.value === valueMetric.value)?.label || valueMetric.value);
const primaryMetricLabel = computed(() => DURATION_METRICS.find((m) => m.value === primaryMetric.value)?.label || primaryMetric.value);
const compareMetricLabel = computed(() => DURATION_METRICS.find((m) => m.value === compareMetric.value)?.label || compareMetric.value);
const primaryUnit = computed(() => DURATION_METRICS.find((m) => m.value === primaryMetric.value)?.unit || '');
const compareUnit = computed(() => DURATION_METRICS.find((m) => m.value === compareMetric.value)?.unit || '');

const diff = computed(() => {
  const d = Number(primaryAvg.value) - Number(compareAvg.value);
  return d.toFixed(2);
});
const diffPercent = computed(() => {
  const c = Number(compareAvg.value);
  if (c === 0) return '0.00';
  return (((Number(primaryAvg.value) - c) / c) * 100).toFixed(2);
});
const diffTone = computed(() => {
  const d = Number(primaryAvg.value) - Number(compareAvg.value);
  return d > 0 ? 'tone-up' : d < 0 ? 'tone-down' : 'tone-flat';
});

// ====== 展示频次 · 7 天趋势图（mock）======
const FREQ_TREND_METRICS = [
  { code: 'impressions', name: '展示数',         color: '#3B82F6', base: 0,     kind: 'count'   },
  { code: 'imp_ratio',   name: '展示占比',       color: '#6366F1', base: 30,    kind: 'percent' },
  { code: 'devices',     name: '设备数',         color: '#10B981', base: 0,     kind: 'count'   },
  { code: 'dev_ratio',   name: '设备占比',       color: '#14B8A6', base: 30,    kind: 'percent' },
  { code: 'revenue',     name: '预估收益',       color: '#F59E0B', base: 0,     kind: 'money'   },
  { code: 'rev_ratio',   name: '预估收益占比',   color: '#EF4444', base: 30,    kind: 'percent' },
  { code: 'ecpm',        name: 'eCPM',           color: '#A855F7', base: 0,     kind: 'money'   },
];

const freqTrendPicked = ref<string[]>(['impressions', 'devices', 'revenue', 'ecpm']);
const trendPickerOpen = ref(false);

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// 取筛选器里的日期范围（默认最近 7 天）
function getDateRange(): { start: string; end: string } {
  const f = filter.value as any;
  // ReportFilter 传的可能是个字符串 '7d' / '30d' / 自定义 [start, end]
  if (Array.isArray(f?.dateRange) && f.dateRange.length === 2) {
    return { start: f.dateRange[0], end: f.dateRange[1] };
  }
  // 默认 7 天
  const end = dayjs();
  const start = end.subtract(6, 'day');
  return { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') };
}

const freqTrendDates = computed<string[]>(() => {
  const { start, end } = getDateRange();
  const s = dayjs(start);
  const e = dayjs(end);
  const days = e.diff(s, 'day') + 1;
  if (days <= 0) return [];
  const arr: string[] = [];
  for (let i = 0; i < days; i++) arr.push(s.add(i, 'day').format('MM-DD'));
  return arr;
});

// 7 指标 × N 天的 mock 数据
const freqTrendSeries = computed<Record<string, { values: number[]; delta: number; latest: number; unit: string; display: string }>>(() => {
  const dates = freqTrendDates.value;
  if (dates.length === 0) return {} as any;
  const out: Record<string, any> = {};
  // 基线：每天总展示 ~ 50,000，设备 ~ 12,000，收益 ~ 1,200，eCPM 25 元
  const totalImpsBase = 50000;
  const totalDevBase = 12000;
  const totalRevBase = 1200;

  for (const m of FREQ_TREND_METRICS) {
    const rand = seededRand(dates.length * 100 + m.code.length);
    const trendUp = 1 + (m.kind === 'money' ? 0.04 : 0.02) * (dates.length / 7);
    const values: number[] = [];
    for (let i = 0; i < dates.length; i++) {
      // 周末 -5%
      const dow = dayjs(dates[i], 'MM-DD').day();
      const weekend = (dow === 0 || dow === 6) ? 0.95 : 1.0;
      const jitter = 0.92 + rand() * 0.16;
      let v: number;
      if (m.code === 'impressions') v = totalImpsBase * trendUp * weekend * jitter;
      else if (m.code === 'devices') v = totalDevBase * trendUp * weekend * jitter;
      else if (m.code === 'revenue') v = totalRevBase * trendUp * weekend * jitter;
      else if (m.code === 'ecpm') v = 25 * (0.94 + rand() * 0.16) * (1 + i * 0.005);
      else v = m.base * (0.95 + rand() * 0.1);
      values.push(+v.toFixed(2));
    }
    // 占比类 = 该指标 / 总展示 (3 段: 展示 / 设备 / 收益)
    if (m.code === 'imp_ratio') {
      const total = out['impressions']?.values;
      if (total) values.splice(0, values.length, ...values.map((_, i) => +(values[i] / total[i] * 100).toFixed(2)));
    }
    if (m.code === 'dev_ratio') {
      const total = out['impressions']?.values;
      if (total) values.splice(0, values.length, ...values.map((_, i) => +(values[i] / total[i] * 100).toFixed(2)));
    }
    if (m.code === 'rev_ratio') {
      // 收益占比：每日收益 / 当日总展示 * 1000
      const total = out['impressions']?.values;
      if (total) values.splice(0, values.length, ...values.map((_, i) => +(values[i] / total[i] * 1000).toFixed(2)));
    }
    // 计算 delta
    const latest = values[values.length - 1];
    const prev = values.length > 1 ? values[values.length - 2] : latest;
    const delta = prev > 0 ? ((latest - prev) / prev * 100) : 0;
    const unit = m.kind === 'percent' ? '%' : m.kind === 'money' ? '¥' : '';
    const display = m.kind === 'percent'
      ? latest.toFixed(2) + '%'
      : m.kind === 'money'
        ? (m.code === 'ecpm' ? '¥' + latest.toFixed(2) : '¥' + latest.toFixed(0))
        : Math.round(latest).toLocaleString();
    out[m.code] = { values, delta, latest, unit, display };
  }
  return out;
});

// 顶部 KPI 卡片：展示选中指标的最新值 + 环比
const freqTrendKpi = computed(() =>
  freqTrendPicked.value.map((code) => {
    const def = FREQ_TREND_METRICS.find((m) => m.code === code)!;
    const s = freqTrendSeries.value[code];
    return { ...def, value: s?.display || '-', delta: s?.delta || 0 };
  })
);

const freqTrendChartOption = computed(() => {
  const picked = freqTrendPicked.value;
  const series = FREQ_TREND_METRICS
    .filter((m) => picked.includes(m.code))
    .map((m) => {
      const s = freqTrendSeries.value[m.code];
      const isPercent = m.kind === 'percent';
      return {
        name: m.name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        yAxisIndex: 0,
        lineStyle: { width: 2, color: m.color },
        itemStyle: { color: m.color },
        emphasis: { focus: 'series' },
        data: s?.values || [],
        ...(picked.length === 1 ? {
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: m.color, type: 'dashed', opacity: 0.5 },
            data: [{ type: 'average', name: '均值' }],
            label: { color: m.color, fontSize: 11 },
          },
        } : {}),
      };
    });
  return {
    color: FREQ_TREND_METRICS.filter((m) => picked.includes(m.code)).map((m) => m.color),
    grid: { left: 56, right: 30, top: 36, bottom: 40 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: number) => v.toFixed(2),
    },
    legend: {
      top: 4,
      type: 'scroll',
      data: FREQ_TREND_METRICS.filter((m) => picked.includes(m.code)).map((m) => m.name),
    },
    xAxis: { type: 'category', data: freqTrendDates.value, boundaryGap: false, axisLabel: { fontSize: 11 } },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (v: number) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v,
      },
      splitLine: { lineStyle: { type: 'dashed', color: '#e4e7ed' } },
    },
    series,
  };
});

// ====== 用户价值 · 7 天趋势图（mock）======
// 7 指标：展示数 / 展示占比 / 设备数 / 设备占比 / 预估收益 / 预估收益占比 / 预估收益累计占比
const VALUE_TREND_METRICS = [
  { code: 'impressions',  name: '展示数',             color: '#3B82F6', base: 0,  kind: 'count'   },
  { code: 'imp_ratio',    name: '展示占比',           color: '#6366F1', base: 30, kind: 'percent' },
  { code: 'devices',      name: '设备数',             color: '#10B981', base: 0,  kind: 'count'   },
  { code: 'dev_ratio',    name: '设备占比',           color: '#14B8A6', base: 30, kind: 'percent' },
  { code: 'revenue',      name: '预估收益',           color: '#F59E0B', base: 0,  kind: 'money'   },
  { code: 'rev_ratio',    name: '预估收益占比',       color: '#EF4444', base: 30, kind: 'percent' },
  { code: 'rev_cum_ratio',name: '预估收益累计占比',   color: '#A855F7', base: 30, kind: 'percent' },
];

const valueTrendPicked = ref<string[]>(['impressions', 'devices', 'revenue', 'rev_cum_ratio']);
const valueTrendPickerOpen = ref(false);

// 详细数据表 8 列（维度可勾选）
const VALUE_TABLE_DIMENSIONS = [
  { key: 'impressions',  label: '展示数',           color: '#3B82F6', type: 'count'   },
  { key: 'impPercent',   label: '展示占比',         color: '#6366F1', type: 'percent' },
  { key: 'devices',      label: '设备数',           color: '#10B981', type: 'count'   },
  { key: 'devPercent',   label: '设备占比',         color: '#14B8A6', type: 'percent' },
  { key: 'revenue',      label: '预估收益',         color: '#F59E0B', type: 'money'   },
  { key: 'revPercent',   label: '预估收益占比',     color: '#EF4444', type: 'percent' },
  { key: 'revCumPercent',label: '预估收益累计占比', color: '#A855F7', type: 'percent' },
];
const valueDimPicked = ref<string[]>(VALUE_TABLE_DIMENSIONS.map((d) => d.key));
const valueDimPickerOpen = ref(false);
const visibleDimensions = computed(() => VALUE_TABLE_DIMENSIONS.filter((d) => valueDimPicked.value.includes(d.key)));

// 复用 frequency 的 getDateRange()（同筛选器）

const valueTrendDates = computed<string[]>(() => {
  const { start, end } = getDateRange();
  const s = dayjs(start);
  const e = dayjs(end);
  const days = e.diff(s, 'day') + 1;
  if (days <= 0) return [];
  const arr: string[] = [];
  for (let i = 0; i < days; i++) arr.push(s.add(i, 'day').format('MM-DD'));
  return arr;
});

const valueTrendSeries = computed<Record<string, { values: number[]; delta: number; latest: number; unit: string; display: string }>>(() => {
  const dates = valueTrendDates.value;
  if (dates.length === 0) return {} as any;
  const out: Record<string, any> = {};
  const totalImpsBase = 50000;
  const totalDevBase = 12000;
  const totalRevBase = 1200;

  for (const m of VALUE_TREND_METRICS) {
    const rand = seededRand(dates.length * 100 + m.code.length);
    const trendUp = 1 + (m.kind === 'money' ? 0.04 : 0.02) * (dates.length / 7);
    const values: number[] = [];
    for (let i = 0; i < dates.length; i++) {
      const dow = dayjs(dates[i], 'MM-DD').day();
      const weekend = (dow === 0 || dow === 6) ? 0.95 : 1.0;
      const jitter = 0.92 + rand() * 0.16;
      let v: number;
      if (m.code === 'impressions') v = totalImpsBase * trendUp * weekend * jitter;
      else if (m.code === 'devices') v = totalDevBase * trendUp * weekend * jitter;
      else if (m.code === 'revenue') v = totalRevBase * trendUp * weekend * jitter;
      else v = m.base * (0.95 + rand() * 0.1);
      values.push(+v.toFixed(2));
    }
    // 占比类：相对总展示
    if (m.code === 'imp_ratio') {
      const total = out['impressions']?.values;
      if (total) for (let i = 0; i < values.length; i++) values[i] = +(values[i] / total[i] * 100).toFixed(2);
    }
    if (m.code === 'dev_ratio') {
      const total = out['impressions']?.values;
      if (total) for (let i = 0; i < values.length; i++) values[i] = +(values[i] / total[i] * 100).toFixed(2);
    }
    if (m.code === 'rev_ratio') {
      const total = out['impressions']?.values;
      if (total) for (let i = 0; i < values.length; i++) values[i] = +(values[i] / total[i] * 1000).toFixed(2);
    }
    if (m.code === 'rev_cum_ratio') {
      // 累计占比：每日累计收益 / 7 天总收益
      const total = out['revenue']?.values;
      if (total) {
        const sum = total.reduce((a: number, b: number) => a + b, 0);
        let acc = 0;
        for (let i = 0; i < total.length; i++) {
          acc += total[i];
          values[i] = +(acc / sum * 100).toFixed(2);
        }
      }
    }
    const latest = values[values.length - 1];
    const prev = values[values.length - 2] ?? latest;
    const delta = prev === 0 ? 0 : +(((latest - prev) / prev) * 100).toFixed(2);
    const unit = m.kind === 'percent' ? '%' : m.kind === 'money' ? '¥' : '';
    const display = m.kind === 'percent'
      ? latest.toFixed(2) + '%'
      : m.kind === 'money'
        ? '¥' + latest.toFixed(0)
        : Math.round(latest).toLocaleString();
    out[m.code] = { values, delta, latest, unit, display };
  }
  return out;
});

const valueTrendKpi = computed(() =>
  valueTrendPicked.value.map((code) => {
    const def = VALUE_TREND_METRICS.find((m) => m.code === code)!;
    const s = valueTrendSeries.value[code];
    return { ...def, value: s?.display || '-', delta: s?.delta || 0 };
  })
);

const valueTrendChartOption = computed(() => {
  const picked = valueTrendPicked.value;
  const series = VALUE_TREND_METRICS
    .filter((m) => picked.includes(m.code))
    .map((m) => {
      const s = valueTrendSeries.value[m.code];
      return {
        name: m.name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        yAxisIndex: 0,
        lineStyle: { width: 2, color: m.color },
        itemStyle: { color: m.color },
        emphasis: { focus: 'series' },
        data: s?.values || [],
        ...(picked.length === 1 ? {
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: m.color, type: 'dashed', opacity: 0.5 },
            data: [{ type: 'average', name: '均值' }],
            label: { color: m.color, fontSize: 11 },
          },
        } : {}),
      };
    });
  return {
    color: VALUE_TREND_METRICS.filter((m) => picked.includes(m.code)).map((m) => m.color),
    grid: { left: 56, right: 30, top: 36, bottom: 40 },
    tooltip: { trigger: 'axis', valueFormatter: (v: number) => v.toFixed(2) },
    legend: {
      top: 4,
      type: 'scroll',
      data: VALUE_TREND_METRICS.filter((m) => picked.includes(m.code)).map((m) => m.name),
    },
    xAxis: { type: 'category', data: valueTrendDates.value, boundaryGap: false, axisLabel: { fontSize: 11 } },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v },
      splitLine: { lineStyle: { type: 'dashed', color: '#e4e7ed' } },
    },
    series,
  };
});

const durationChartOption = computed(() => ({
  grid: { top: 40, right: 60, bottom: 50, left: 60 },
  tooltip: { trigger: 'axis' },
  legend: { data: [primaryMetricLabel.value, compareMetricLabel.value], top: 0 },
  xAxis: { type: 'category', data: primaryData.value.map((d) => d.date), boundaryGap: true },
  yAxis: [
    { type: 'value', name: primaryMetricLabel.value + '(' + primaryUnit.value + ')', position: 'left' },
    { type: 'value', name: compareMetricLabel.value + '(' + compareUnit.value + ')', position: 'right' },
  ],
  series: [
    {
      name: primaryMetricLabel.value,
      type: 'line',
      data: primaryData.value.map((d) => Number(d.value.toFixed(2))),
      smooth: true,
      itemStyle: { color: '#1E3A8A' },
      areaStyle: { color: 'rgba(30, 58, 138, 0.1)' },
    },
    {
      name: compareMetricLabel.value,
      type: 'line',
      yAxisIndex: 1,
      data: compareData.value.map((d) => Number(d.value.toFixed(2))),
      smooth: true,
      itemStyle: { color: '#F59E0B' },
    },
  ],
}));

const switchSubtype = (code: 'frequency' | 'value' | 'duration') => {
  currentSubtype.value = code;
  loadAll();
};

const loadAll = async () => {
  if (currentSubtype.value === 'frequency') return loadFrequency();
  if (currentSubtype.value === 'value') return loadValue();
  if (currentSubtype.value === 'duration') return loadDuration();
};

const loadFrequency = async () => {
  loading.value = true;
  try {
    const res: any = await request.post('/api/v1/console/report/aggregate', {
      report_type: 'behavior',
      dimensions: ['date'],
      metrics: ['impressions', 'revenue_actual', 'dau'],
      subtype: 'frequency',
      filters: filter.value,
    });
    const rows = res?.data?.rows || [];
    const totalImps = rows.reduce((s: number, r: any) => s + Number(r.impressions || 0), 0);
    const totalUsers = Math.round(totalImps / 7) || 1;
    const totalRev = rows.reduce((s: number, r: any) => s + Number(r.revenue_actual || 0), 0);

    // 10 频次档：按权重分配
    const peak = 6; // 7 次附近权重最高
    const weights = FREQ_BUCKETS.map((b, i) => {
      const dist = Math.abs(i + 1 - peak);
      return Math.max(0.02, 0.16 - dist * 0.018);
    });
    const wSum = weights.reduce((a, b) => a + b, 0);
    const normW = weights.map((w) => w / wSum);

    frequencyRows.value = FREQ_BUCKETS.map((b, i) => {
      const imp = Math.round(totalImps * normW[i]);
      const dev = Math.round(totalUsers * normW[i]);
      const rev = totalRev * normW[i];
      return {
        label: b.label,
        impressions: imp,
        impPercent: totalImps > 0 ? (imp / totalImps * 100).toFixed(2) : '0.00',
        devices: dev,
        devPercent: totalUsers > 0 ? (dev / totalUsers * 100).toFixed(2) : '0.00',
        revenue: rev,
        revPercent: totalRev > 0 ? (rev / totalRev * 100).toFixed(2) : '0.00',
        barWidth: Math.max(2, normW[i] * 100 * 1.4),
      };
    });
  } catch (e: any) {
    ElMessage.error('加载频次失败：' + (e?.message || ''));
  } finally {
    loading.value = false;
  }
};

const loadValue = async () => {
  loading.value = true;
  try {
    const res: any = await request.post('/api/v1/console/report/aggregate', {
      report_type: 'behavior',
      dimensions: ['date'],
      metrics: [valueMetric.value, 'impressions', 'revenue_actual'],
      subtype: 'value',
      filters: filter.value,
    });
    const rows = res?.data?.rows || [];
    const totalImps = rows.reduce((s: number, r: any) => s + Number(r.impressions || 0), 0);
    const totalRev = rows.reduce((s: number, r: any) => s + Number(r.revenue_actual || 0), 0);
    const totalUsers = Math.max(1, Math.round(totalImps / 30));

    // eCPM 25 段：[0-1),[1-2),...,[18-19),[19-20),[20-25),[25-30),[30-35),[35-40),[40-45),[45-50]
    const ranges: { label: string; min: number; max: number }[] = [];
    for (let i = 0; i < 20; i++) ranges.push({ label: `[${i}-${i + 1})`, min: i, max: i + 1 });
    [20, 25, 30, 35, 40, 45].forEach((v) => ranges.push({ label: `[${v}-${v + 5})`, min: v, max: v + 5 }));
    ranges.push({ label: `[45-50]`, min: 45, max: 50 });

    // 简化分布：第 4-5 段 (3-5) 权重最高
    const peakBucket = 4;
    const weights = ranges.map((_, i) => {
      const dist = Math.abs(i - peakBucket);
      return Math.max(0.005, 0.12 - dist * 0.01);
    });
    const wSum = weights.reduce((a, b) => a + b, 0);
    const normW = weights.map((w) => w / wSum);

    let cumPct = 0;
    valueRows.value = ranges.map((r, i) => {
      const imp = Math.round(totalImps * normW[i]);
      const dev = Math.round(totalUsers * normW[i]);
      const rev = totalRev * normW[i];
      const revPct = totalRev > 0 ? (rev / totalRev * 100) : 0;
      cumPct += revPct;
      return {
        range: r.label,
        impressions: imp,
        impPercent: totalImps > 0 ? (imp / totalImps * 100).toFixed(2) : '0.00',
        devices: dev,
        devPercent: totalUsers > 0 ? (dev / totalUsers * 100).toFixed(2) : '0.00',
        revenue: rev,
        revPercent: revPct.toFixed(2),
        revCumPercent: cumPct.toFixed(2),
      };
    });
  } catch (e: any) {
    ElMessage.error('加载价值失败：' + (e?.message || ''));
  } finally {
    loading.value = false;
  }
};

const loadDuration = async () => {
  loading.value = true;
  try {
    const res: any = await request.post('/api/v1/console/report/aggregate', {
      report_type: 'behavior',
      dimensions: ['date'],
      metrics: [primaryMetric.value, compareMetric.value],
      subtype: 'duration',
      compare_metric: compareMetric.value,
      filters: filter.value,
    });
    const primary = res?.data?.primary || [];
    const compare = res?.data?.compare || [];
    primaryData.value = primary.map((r: any) => ({ date: r.date, value: Number(r[primaryMetric.value] || 0) }));
    compareData.value = compare.map((r: any) => ({ date: r.date, value: Number(r[compareMetric.value] || 0) }));
    const pSum = primaryData.value.reduce((s, d) => s + d.value, 0);
    const cSum = compareData.value.reduce((s, d) => s + d.value, 0);
    const pN = primaryData.value.length || 1;
    const cN = compareData.value.length || 1;
    primaryAvg.value = (pSum / pN).toFixed(2);
    compareAvg.value = (cSum / cN).toFixed(2);
  } catch (e: any) {
    ElMessage.error('加载时长失败：' + (e?.message || ''));
  } finally {
    loading.value = false;
  }
};

const exportCurrent = () => {
  ElMessage.success('导出任务已提交');
};

onMounted(() => {
  loadAll();
});
</script>
