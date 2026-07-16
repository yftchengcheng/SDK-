<template>
  <div class="page-shell funnel-page">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><Filter /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">漏斗分析</h1>
          <p class="page-header-subtitle">11 步用户行为漏斗，10 个核心转化率，支持自定义公式</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </div>
    </div>

    <div class="page-card funnel-filter-card">
      <el-form inline :model="filter" class="funnel-filter" @submit.prevent>
        <el-form-item label="日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :clearable="false"
            :unlink-panels="true"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="应用">
          <el-select v-model="filter.appId" placeholder="请选择" clearable filterable style="width: 200px">
            <el-option v-for="a in apps" :key="a.value" :label="a.label" :value="a.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="广告位">
          <el-select v-model="filter.placementId" placeholder="请选择" clearable filterable style="width: 200px">
            <el-option v-for="p in placements" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="广告场景">
          <el-select v-model="filter.adScene" placeholder="请选择" clearable style="width: 180px">
            <el-option v-for="s in adScenes" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="filter.channel" placeholder="请选择" clearable style="width: 160px">
            <el-option v-for="c in channels" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!collapsed" label="地区">
          <el-select v-model="filter.region" placeholder="请选择" clearable style="width: 160px">
            <el-option v-for="r in regions" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!collapsed" label="SDK版本">
          <el-select v-model="filter.sdkVersion" placeholder="请选择" clearable style="width: 160px">
            <el-option v-for="v in sdkVersions" :key="v" :label="v" :value="v" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!collapsed" label="应用版本">
          <el-select v-model="filter.appVersion" placeholder="请选择" clearable style="width: 160px">
            <el-option v-for="v in appVersions" :key="v" :label="v" :value="v" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!collapsed" label="设备类型">
          <el-select v-model="filter.deviceType" placeholder="请选择" clearable style="width: 160px">
            <el-option v-for="d in deviceTypes" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button text type="primary" @click="collapsed = !collapsed">
            {{ collapsed ? '展开' : '收起' }}
            <el-icon style="margin-left: 4px; vertical-align: -1px">
              <component :is="collapsed ? ArrowDown : ArrowUp" />
            </el-icon>
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="funnel-warning" v-if="missingScene">
      <el-icon class="funnel-warning-icon"><Warning /></el-icon>
      <span>
        当前漏斗缺少到达广告场景数据，为更好地分析并优化漏斗数据，提升收益，可按照文档补充广告场景数据。详情请查看
        <el-link type="primary" :underline="false">广告场景接入指导</el-link>
        或
        <el-button text type="primary" :underline="false">立即配置广告场景</el-button>
      </span>
    </div>

    <div class="page-card funnel-body">
      <!-- 左右分栏: 左 funnel 漏斗, 右 数据表 -->
      <div class="funnel-split">
        <!-- 左栏: funnel 漏斗图 -->
        <div class="funnel-split-left">
          <div class="funnel-split-toolbar">
            <span class="funnel-help">如何使用漏斗分析报表？</span>
            <span class="funnel-legend-inline">
              <span class="funnel-legend-item"><span class="funnel-legend-dot" style="background: #3b82f6"></span>次数</span>
            </span>
          </div>
          <div class="funnel-layout">
            <div class="funnel-chart-wrap">
              <svg class="funnel-link-svg" :viewBox="linkViewBox" preserveAspectRatio="none">
                <!-- 折线 (细实线) -->
                <path
                  v-for="(l, i) in linkPaths"
                  :key="i"
                  :d="l.d"
                  :stroke="l.color"
                  stroke-width="1.4"
                  fill="none"
                  stroke-dasharray="5 3"
                  opacity="0.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <!-- 箭头 (三角形, 接在 step 边缘) -->
                <polygon
                  v-for="(d, i) in linkDots"
                  :key="'arr-'+i"
                  :points="d.side === 'L' ? (d.cx - 8) + ',' + (d.cy - 5) + ' ' + d.cx + ',' + d.cy + ' ' + (d.cx - 8) + ',' + (d.cy + 5) : (d.cx + 8) + ',' + (d.cy - 5) + ' ' + d.cx + ',' + d.cy + ' ' + (d.cx + 8) + ',' + (d.cy + 5)"
                  :fill="d.color"
                  opacity="0.85"
                />
              </svg>
            <div class="funnel-grid" ref="funnelGridRef">

              <!-- 左指标 -->
              <div
                v-for="m in LEFT_METRICS"
                :key="m.code"
                :ref="el => setMetricRef(el, 'L', m.code)"
                class="funnel-metric funnel-metric-left"
                :style="{ gridRow: m.alignIndex + 1 }"
              >
                <span class="funnel-metric-mark" />
                <span class="funnel-metric-name">{{ m.name }}</span>
                <span class="funnel-metric-input">{{ metricValues[m.code] || '-' }}</span>
                <el-tooltip :content="m.tip" placement="top" :show-after="300">
                  <el-icon class="funnel-metric-tip"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>

              <!-- 中央 11 步漏斗 -->
              <div class="funnel-chart" style="grid-column: 2; grid-row: 1 / 12">
                <div
                  v-for="(step, idx) in FUNNEL_STEPS"
                  :key="step.code"
                  :ref="el => setStepRef(el, idx)"
                  :class="['funnel-block', `funnel-block-${idx}`]"
                  :title="step.name"
                >
                  <span class="funnel-block-text">{{ step.name }}</span>
                </div>
              </div>

              <!-- 右指标 -->
              <div
                v-for="m in RIGHT_METRICS"
                :key="m.code"
                :ref="el => setMetricRef(el, 'R', m.code)"
                class="funnel-metric funnel-metric-right"
                :style="{ gridRow: m.alignIndex + 1 }"
              >
                <span class="funnel-metric-mark" />
                <span class="funnel-metric-name">{{ m.name }}</span>
                <span class="funnel-metric-input">{{ metricValues[m.code] || '-' }}</span>
                <el-tooltip :content="m.tip" placement="top" :show-after="300">
                  <el-icon class="funnel-metric-tip"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </div>
            </div>
          </div>
        </div>

        <!-- 右栏: 数据表 -->
        <div class="funnel-split-right">
          <div class="funnel-split-toolbar funnel-split-toolbar-right">
            <span class="funnel-help">分阶段数据</span>
            <div class="funnel-split-toolbar-actions">
              <span class="funnel-body-toolbar-label">人均基数</span>
              <el-radio-group v-model="perCapitaMode" size="default" style="margin-left: 8px">
                <el-radio-button label="device">设备数</el-radio-button>
                <el-radio-button label="dau">DAU</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="funnel-table-wrap">
            <el-table :data="stageTableData" border stripe size="default">
              <el-table-column prop="stage" label="阶段" width="100" align="center" fixed />
              <el-table-column prop="flow" label="流程" min-width="120" fixed />
              <el-table-column :label="`次数(${perCapitaMode === 'device' ? '设备数' : 'DAU'})`" align="right" min-width="120">
                <template #default="{ row }">{{ row.count }}</template>
              </el-table-column>
              <el-table-column label="上一阶段转化率" align="right" min-width="130">
                <template #default="{ row }">{{ row.prevRate }}</template>
              </el-table-column>
              <el-table-column label="流失数" align="right" min-width="100">
                <template #default="{ row }">{{ row.lost }}</template>
              </el-table-column>
              <el-table-column label="流失率" align="right" min-width="100">
                <template #default="{ row }">{{ row.lostRate }}</template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <div class="page-card funnel-bottom-card">
      <div class="funnel-bottom-toolbar">
        <el-radio-group v-model="bottomTab" size="default">
          <el-radio-button label="daily">分天</el-radio-button>
          <el-radio-button label="trend">趋势</el-radio-button>
        </el-radio-group>
        <div class="funnel-bottom-actions">
          <el-button :icon="EditPen" plain @click="metricPickerOpen = true">指标选择</el-button>
          <el-button :icon="Download" plain>导出报表</el-button>
        </div>
      </div>

      <!-- 分天: 表格 + 柱图 -->
      <div v-if="bottomTab === 'daily'" class="funnel-bottom-daily">
        <div class="funnel-bottom-summary">
          <span class="funnel-bottom-summary-item">
            <span class="funnel-bottom-summary-label">统计周期</span>
            <span class="funnel-bottom-summary-value">{{ dailyRangeLabel }}</span>
          </span>
          <span class="funnel-bottom-summary-item">
            <span class="funnel-bottom-summary-label">总启动数</span>
            <span class="funnel-bottom-summary-value">{{ dailySummary.totalStart.toLocaleString() }}</span>
          </span>
          <span class="funnel-bottom-summary-item">
            <span class="funnel-bottom-summary-label">总展示数</span>
            <span class="funnel-bottom-summary-value">{{ dailySummary.totalShow.toLocaleString() }}</span>
          </span>
          <span class="funnel-bottom-summary-item">
            <span class="funnel-bottom-summary-label">总点击数</span>
            <span class="funnel-bottom-summary-value">{{ dailySummary.totalClick.toLocaleString() }}</span>
          </span>
          <span class="funnel-bottom-summary-item">
            <span class="funnel-bottom-summary-label">平均点击率</span>
            <span class="funnel-bottom-summary-value">{{ dailySummary.avgClickRate }}%</span>
          </span>
        </div>

        <div class="funnel-bottom-chart">
          <v-chart :option="dailyChartOption" autoresize style="height: 280px" />
        </div>

        <div class="funnel-bottom-table">
          <el-table :data="dailyTableData" border stripe size="small">
            <el-table-column prop="date" label="日期" width="110" align="center" fixed />
            <el-table-column prop="appStart" label="应用启动" align="right" min-width="90" />
            <el-table-column prop="configGet" label="获取配置" align="right" min-width="90" />
            <el-table-column prop="flowRequest" label="流量请求" align="right" min-width="90" />
            <el-table-column prop="flowFill" label="流量填充" align="right" min-width="90" />
            <el-table-column prop="sceneArrive" label="到达广告场景" align="right" min-width="110" />
            <el-table-column prop="isreadyQuery" label="查询isReady" align="right" min-width="100" />
            <el-table-column prop="showTrigger" label="触发展示" align="right" min-width="90" />
            <el-table-column prop="showSuccess" label="触发展示成功" align="right" min-width="110" />
            <el-table-column prop="show" label="展示" align="right" min-width="80" />
            <el-table-column prop="showApi" label="展示API" align="right" min-width="90" />
            <el-table-column prop="click" label="点击" align="right" min-width="80" />
            <el-table-column label="填充率" align="right" min-width="80">
              <template #default="{ row }">{{ row.fillRate }}%</template>
            </el-table-column>
            <el-table-column label="展示成功率" align="right" min-width="100">
              <template #default="{ row }">{{ row.showRate }}%</template>
            </el-table-column>
            <el-table-column label="点击率" align="right" min-width="80">
              <template #default="{ row }">{{ row.clickRate }}%</template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 趋势: 折线图 (ECharts) -->
      <div v-else class="funnel-bottom-trend">
        <div class="funnel-bottom-trend-toolbar">
          <span class="funnel-bottom-trend-label">显示指标：</span>
          <el-checkbox-group v-model="trendPicked" size="default" class="funnel-bottom-trend-checks">
            <el-checkbox
              v-for="m in trendMetrics"
              :key="m.code"
              :label="m.code"
              :value="m.code"
            >
              <span class="funnel-bottom-trend-chip" :style="{ background: m.color + '20', color: m.color, borderColor: m.color + '40' }">
                {{ m.name }}
              </span>
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <div class="funnel-bottom-chart">
          <v-chart :option="trendChartOption" autoresize style="height: 420px" />
        </div>
      </div>
    </div>

    <MetricPickerDialog
      v-model:visible="metricPickerOpen"
      :value="pickedMetrics"
      :definitions="METRIC_DEFINITIONS"
      @confirm="onMetricPickerConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import { Refresh, EditPen, Download, Warning, QuestionFilled, Filter, ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent, DataZoomComponent, MarkLineComponent, ToolboxComponent } from 'echarts/components';
import dayjs from 'dayjs';
import MetricPickerDialog from '@/components/report/MetricPickerDialog.vue';

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, DataZoomComponent, MarkLineComponent, ToolboxComponent]);

const FUNNEL_STEPS = [
  { code: 'app_start', name: '应用启动' },
  { code: 'config_get', name: '获取配置' },
  { code: 'flow_request', name: '流量请求' },
  { code: 'flow_fill', name: '流量填充' },
  { code: 'scene_arrive', name: '到达广告场景' },
  { code: 'isready_query', name: '查询isReady' },
  { code: 'show_trigger', name: '触发展示' },
  { code: 'show_success', name: '触发展示成功' },
  { code: 'show', name: '展示' },
  { code: 'show_api', name: '展示API' },
  { code: 'click', name: '点击' },
];

const LEFT_METRICS = [
  { code: 'arrive_rate', name: '广告场景到达率', tip: '应用启动 / 到达广告场景 × 100%', alignIndex: 4, linkIndices: [0, 4] },
  { code: 'trigger_rate', name: '广告触发率', tip: '到达广告场景 / 触发展示 × 100%', alignIndex: 6, linkIndices: [4, 6] },
  { code: 'show_success_rate', name: '触发展示成功率', tip: '触发展示 / 触发展示成功 × 100%', alignIndex: 7, linkIndices: [6, 7] },
  { code: 'show_rate', name: '展示成功率', tip: '触发展示成功 / 展示 × 100%', alignIndex: 8, linkIndices: [7, 8] },
  { code: 'click_rate', name: '点击率', tip: '展示 / 点击 × 100%', alignIndex: 10, linkIndices: [8, 10] },
];

const RIGHT_METRICS = [
  { code: 'per_start', name: '人均启动', tip: '应用启动 / 设备数', alignIndex: 0, linkIndices: [0] },
  { code: 'fill_rate', name: '流量填充率', tip: '流量请求 / 流量填充 × 100%', alignIndex: 3, linkIndices: [2, 3] },
  { code: 'ready_rate', name: '广告Ready率', tip: '广告ready / 到达广告场景 × 100%', alignIndex: 4, linkIndices: [4] },
  { code: 'isready_rate', name: 'isReady成功率', tip: 'isReady返回True / 调用isReady次数 × 100%', alignIndex: 5, linkIndices: [5] },
  { code: 'show_gap', name: '展示Gap', tip: '展示 / 展示API × 100%', alignIndex: 9, linkIndices: [8, 9] },
];

const STAGE_ROWS = [
  { stage: '广告请求', flow: '应用启动', count: 12580 },
  { stage: '广告请求', flow: '获取配置', count: 12340 },
  { stage: '广告请求', flow: '流量请求', count: 11980 },
  { stage: '广告请求', flow: '流量填充', count: 11250 },
  { stage: '广告缓存', flow: '到达广告场景', count: 10800 },
  { stage: '广告缓存', flow: '查询isReady', count: 10350 },
  { stage: '广告展示', flow: '触发展示', count: 9800 },
  { stage: '广告展示', flow: '触发展示成功', count: 8650 },
  { stage: '广告展示', flow: '展示', count: 7820 },
  { stage: '广告展示', flow: '展示API', count: 7500 },
  { stage: '广告点击', flow: '点击', count: 320 },
];

// 表格数据：按 perCapitaMode 联动基数（设备数/DAU）
const stageTableData = computed(() => {
  const divisor = perCapitaMode.value === 'dau' ? 1.6 : 1; // 模拟 DAU 比设备数大 1.6 倍
  return STAGE_ROWS.map((row, idx) => {
    const count = Math.round(row.count / divisor);
    const prevCount = idx === 0 ? count : Math.round(STAGE_ROWS[idx - 1].count / divisor);
    const prevRate = idx === 0 ? '-' : (count / prevCount * 100).toFixed(2) + '%';
    const lost = prevCount - count;
    const lostRate = idx === 0 ? '-' : (lost / prevCount * 100).toFixed(2) + '%';
    return { ...row, count, prevRate, lost, lostRate };
  });
});

const METRIC_DEFINITIONS = [
  {
    key: 'ad_request',
    label: '广告请求',
    items: [
      { code: 'app_start', name: '应用启动' },
      { code: 'config_get', name: '获取配置' },
      { code: 'flow_request', name: '流量请求' },
      { code: 'flow_fill', name: '流量填充' },
      { code: 'flow_fill_rate', name: '流量填充率' },
    ],
  },
  {
    key: 'ad_cache',
    label: '广告缓存',
    items: [
      { code: 'scene_arrive', name: '到达广告场景' },
      { code: 'scene_arrive_rate', name: '广告场景到达率' },
      { code: 'ad_ready_rate', name: '广告Ready率' },
      { code: 'isready_query', name: '查询isReady' },
      { code: 'isready_rate', name: 'isReady成功率' },
    ],
  },
  {
    key: 'ad_show',
    label: '广告展示',
    items: [
      { code: 'show_trigger', name: '触发展示' },
      { code: 'trigger_rate', name: '广告触发率' },
      { code: 'show_success', name: '触发展示成功' },
      { code: 'show_success_rate', name: '触发展示成功率' },
      { code: 'show', name: '展示' },
      { code: 'show_rate', name: '展示成功率' },
      { code: 'show_api', name: '展示API' },
      { code: 'show_gap', name: '展示Gap' },
    ],
  },
  {
    key: 'ad_click',
    label: '广告点击',
    items: [
      { code: 'click', name: '点击' },
      { code: 'click_rate', name: '点击率' },
    ],
  },
];

const today = dayjs().format('YYYY-MM-DD');
const dateRange = ref<[string, string]>([today, today]);
const filter = ref<{
  appId: string | undefined;
  placementId: string | undefined;
  adScene: string | undefined;
  channel: string | undefined;
  region: string | undefined;
  sdkVersion: string | undefined;
  appVersion: string | undefined;
  deviceType: string | undefined;
}>({
  appId: undefined,
  placementId: undefined,
  adScene: undefined,
  channel: undefined,
  region: undefined,
  sdkVersion: undefined,
  appVersion: undefined,
  deviceType: undefined,
});
const collapsed = ref(false);
const missingScene = ref(true);
const perCapitaMode = ref<'device' | 'dau'>('device');
const bottomTab = ref<'daily' | 'trend'>('daily');
const metricPickerOpen = ref(false);

const metricValues = ref<Record<string, string>>({});
for (const m of [...LEFT_METRICS, ...RIGHT_METRICS]) {
  metricValues.value[m.code] = '';
}

const pickedMetrics = ref<string[]>(METRIC_DEFINITIONS.flatMap((c) => c.items.map((i) => i.code)));

const apps = ref<{ value: string; label: string }[]>([]);
const placements = ref<{ value: string; label: string }[]>([]);
const adScenes = ref<string[]>(['开屏', '信息流', '激励视频', '插屏', 'Banner']);
const channels = ref<string[]>(['AppStore', 'GooglePlay', '华为', '小米', 'OPPO']);
const regions = ref<string[]>(['中国', '美国', '日本', '韩国', '印度']);
const sdkVersions = ref<string[]>(['1.0.0', '1.1.0', '1.2.0', '1.3.0']);
const appVersions = ref<string[]>(['1.0', '1.1', '1.2', '1.3']);
const deviceTypes = ref<{ value: string; label: string }[]>([
  { value: 'phone', label: '手机' },
  { value: 'tablet', label: '平板' },
  { value: 'tv', label: '电视' },
]);

// ====== 连接线 ======
const funnelGridRef = ref<HTMLElement | null>(null);
const metricRefs = ref<Record<string, HTMLElement>>({});
const stepRefs = ref<HTMLElement[]>([]);
const linkPaths = ref<{ d: string; color: string }[]>([]);
const linkDots = ref<{ cx: number; cy: number; color: string; side: 'L' | 'R' }[]>([]);
const linkViewBox = ref('0 0 1000 480');

// ====== 分天 / 趋势 mock 数据 ======
// 11 步基础值（用作"今日"基线）
const BASE_VALUES = {
  appStart: 12580,
  configGet: 12340,
  flowRequest: 11980,
  flowFill: 11250,
  sceneArrive: 10800,
  isreadyQuery: 10350,
  showTrigger: 9800,
  showSuccess: 8650,
  show: 7820,
  showApi: 7500,
  click: 320,
};

// 基于 seed 的伪随机，相同日期 = 相同数据
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function genDailyRow(date: string) {
  // 用日期 yyyymmddd 作为 seed
  const seed = Number(date.replace(/-/g, '')) || 1;
  const rand = seededRandom(seed);
  // 每日在 -15% ~ +15% 间波动
  const wave = () => 0.85 + rand() * 0.3;
  // 11 步对应的漏斗转化率（baseline 各步相对上一步的实际通过率）
  const STEP_RATIO = [
    1.00,  // appStart -> configGet
    0.97,  // configGet -> flowRequest
    0.94,  // flowRequest -> flowFill
    0.96,  // flowFill -> sceneArrive
    0.96,  // sceneArrive -> isreadyQuery
    0.95,  // isreadyQuery -> showTrigger
    0.88,  // showTrigger -> showSuccess
    0.90,  // showSuccess -> show
    0.96,  // show -> showApi
    0.04,  // showApi -> click (CTR 4%)
  ];
  const row: Record<string, number> = {};
  const keys = Object.keys(BASE_VALUES) as (keyof typeof BASE_VALUES)[];
  // 第一步按 base 波动
  let prev = Math.round(BASE_VALUES[keys[0]] * wave());
  row[keys[0]] = prev;
  // 后续每步 = prev * (stepRatio * 0.92~1.02)
  for (let i = 1; i < keys.length; i++) {
    const jitter = 0.92 + rand() * 0.1;
    const v = Math.round(prev * STEP_RATIO[i - 1] * jitter);
    row[keys[i]] = v;
    prev = v;
  }
  return row as { [K in keyof typeof BASE_VALUES]: number };
}

const DAILY_DAYS = 7;

const dailyDates = computed<string[]>(() => {
  // 以 dateRange 结束日往前 7 天
  const end = dateRange.value[1] || dayjs().format('YYYY-MM-DD');
  const arr: string[] = [];
  for (let i = DAILY_DAYS - 1; i >= 0; i--) {
    arr.push(dayjs(end).subtract(i, 'day').format('YYYY-MM-DD'));
  }
  return arr;
});

const dailyRows = computed(() => dailyDates.value.map((d) => ({ date: d, ...genDailyRow(d) })));

const dailyTableData = computed(() =>
  dailyRows.value.map((r) => {
    const fillRate = r.flowRequest > 0 ? ((r.flowFill / r.flowRequest) * 100).toFixed(2) : '0.00';
    const showRate = r.showSuccess > 0 ? ((r.show / r.showSuccess) * 100).toFixed(2) : '0.00';
    const clickRate = r.show > 0 ? ((r.click / r.show) * 100).toFixed(2) : '0.00';
    return { ...r, fillRate, showRate, clickRate };
  })
);

const dailySummary = computed(() => {
  const rows = dailyRows.value;
  const totalStart = rows.reduce((s, r) => s + r.appStart, 0);
  const totalShow = rows.reduce((s, r) => s + r.show, 0);
  const totalClick = rows.reduce((s, r) => s + r.click, 0);
  const avgClickRate = totalShow > 0 ? ((totalClick / totalShow) * 100).toFixed(2) : '0.00';
  return { totalStart, totalShow, totalClick, avgClickRate };
});

const dailyRangeLabel = computed(() => {
  const a = dailyDates.value[0];
  const b = dailyDates.value[dailyDates.value.length - 1];
  return `${a} ~ ${b}`;
});

// 11 步 4 类核心指标（柱图分组）
const dailyChartOption = computed(() => {
  const dates = dailyDates.value;
  return {
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    grid: { left: 60, right: 30, top: 50, bottom: 60 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (v: number) => v.toLocaleString(),
    },
    legend: { top: 8, data: ['应用启动', '流量填充', '展示', '点击'] },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { rotate: 0, fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v) },
    },
    series: [
      {
        name: '应用启动',
        type: 'bar',
        data: dailyRows.value.map((r) => r.appStart),
        barMaxWidth: 28,
        itemStyle: { borderRadius: [3, 3, 0, 0] },
      },
      {
        name: '流量填充',
        type: 'bar',
        data: dailyRows.value.map((r) => r.flowFill),
        barMaxWidth: 28,
        itemStyle: { borderRadius: [3, 3, 0, 0] },
      },
      {
        name: '展示',
        type: 'bar',
        data: dailyRows.value.map((r) => r.show),
        barMaxWidth: 28,
        itemStyle: { borderRadius: [3, 3, 0, 0] },
      },
      {
        name: '点击',
        type: 'bar',
        data: dailyRows.value.map((r) => r.click),
        barMaxWidth: 28,
        itemStyle: { borderRadius: [3, 3, 0, 0] },
      },
    ],
  };
});

// ====== 趋势数据 (30天 × N 指标) ======
const TREND_DAYS = 30;

const TREND_METRICS_DEF = [
  { code: 'arrive_rate', name: '广告场景到达率', color: '#f97316', baseRate: 0.86 },
  { code: 'fill_rate', name: '流量填充率', color: '#06b6d4', baseRate: 0.94 },
  { code: 'trigger_rate', name: '广告触发率', color: '#3b82f6', baseRate: 0.91 },
  { code: 'show_rate', name: '展示成功率', color: '#10b981', baseRate: 0.90 },
  { code: 'click_rate', name: '点击率', color: '#ef4444', baseRate: 0.041 },
  { code: 'isready_rate', name: 'isReady成功率', color: '#a855f7', baseRate: 0.96 },
  { code: 'show_gap', name: '展示Gap', color: '#f59e0b', baseRate: 0.96 },
];

const trendMetrics = computed(() => TREND_METRICS_DEF);

const trendPicked = ref<string[]>(['arrive_rate', 'fill_rate', 'show_rate', 'click_rate']);

const trendDates = computed<string[]>(() => {
  const end = dateRange.value[1] || dayjs().format('YYYY-MM-DD');
  const arr: string[] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    arr.push(dayjs(end).subtract(i, 'day').format('MM-DD'));
  }
  return arr;
});

// 生成 30 天数据（按指标）
const trendSeriesMap = computed<Record<string, number[]>>(() => {
  const map: Record<string, number[]> = {};
  for (const m of TREND_METRICS_DEF) {
    const arr: number[] = [];
    // 整体趋势：温和上升 + 周末小幅下降 + 随机扰动
    for (let i = 0; i < TREND_DAYS; i++) {
      const seed = i * 13 + m.code.length * 7;
      const rand = seededRandom(seed);
      const date = dayjs(dateRange.value[1] || dayjs().format('YYYY-MM-DD')).subtract(TREND_DAYS - 1 - i, 'day');
      const dow = date.day(); // 0=Sun
      const weekly = dow === 0 || dow === 6 ? 0.96 : 1.0; // 周末 -4%
      const trendUp = 1 + (i / TREND_DAYS) * 0.06; // +6% 一个月
      const jitter = 0.94 + rand() * 0.12; // ±6%
      const v = m.baseRate * trendUp * weekly * jitter;
      arr.push(+(v * 100).toFixed(2));
    }
    map[m.code] = arr;
  }
  return map;
});

const trendChartOption = computed(() => {
  const picked = trendPicked.value.length > 0 ? trendPicked.value : trendMetrics.value.map((m) => m.code);
  const series = trendMetrics.value
    .filter((m) => picked.includes(m.code))
    .map((m) => ({
      name: m.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      lineStyle: { width: 2, color: m.color },
      itemStyle: { color: m.color },
      emphasis: { focus: 'series' },
      data: trendSeriesMap.value[m.code] || [],
      markLine: picked.length === 1 ? {
        silent: true,
        symbol: 'none',
        lineStyle: { color: m.color, type: 'dashed', opacity: 0.5 },
        data: [{ type: 'average', name: '均值' }],
        label: { color: m.color, fontSize: 11 },
      } : undefined,
    }));
  return {
    color: trendMetrics.value.map((m) => m.color),
    grid: { left: 50, right: 30, top: 60, bottom: 70 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: number) => v.toFixed(2) + '%',
    },
    legend: {
      top: 10,
      data: trendMetrics.value.filter((m) => picked.includes(m.code)).map((m) => m.name),
    },
    toolbox: {
      right: 10,
      top: 10,
      feature: {
        dataZoom: { yAxisIndex: 'none' },
        restore: {},
      },
    },
    xAxis: {
      type: 'category',
      data: trendDates.value,
      boundaryGap: false,
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}%' },
      splitLine: { lineStyle: { type: 'dashed', color: '#e4e7ed' } },
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', start: 0, end: 100, height: 18, bottom: 16 },
    ],
    series,
  };
});

// 标记色: 左指标橙红, 右指标青蓝
const LEFT_COLOR = '#f97316';
const RIGHT_COLOR = '#06b6d4';

function setMetricRef(el: Element | null, side: 'L' | 'R', code: string) {
  if (el) metricRefs.value[side + ':' + code] = el as HTMLElement;
}
function setStepRef(el: Element | null, idx: number) {
  if (el) stepRefs.value[idx] = el as HTMLElement;
}

function recomputeLinks() {
  const grid = funnelGridRef.value;
  if (!grid) return;
  const gridRect = grid.getBoundingClientRect();
  const w = gridRect.width;
  const h = gridRect.height;
  linkViewBox.value = `0 0 ${w} ${h}`;

  const newPaths: { d: string; color: string }[] = [];
  const newDots: { cx: number; cy: number; color: string }[] = [];

  // 所有 step 中点
  const stepCenters = stepRefs.value.map((el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left - gridRect.left + r.width / 2, y: r.top - gridRect.top + r.height / 2 };
  });

  function drawMetric(side: 'L' | 'R', code: string, linkIndices: number[], color: string) {
    const mel = metricRefs.value[side + ':' + code];
    if (!mel) return;
    const mr = mel.getBoundingClientRect();
    const startX = side === 'L' ? mr.right - gridRect.left : mr.left - gridRect.left;
    const startY = mr.top - gridRect.top + mr.height / 2;

    // 每个对应项画 1 根折线 + 1 个箭头
    for (let li = 0; li < linkIndices.length; li++) {
      const step = stepCenters[linkIndices[li]];
      if (!step) continue;
      // 箭头尖端接在 step 边缘 (色块边内 6px), line 终止在箭头底边 (距尖端 8px)
      const tipX = side === 'L' ? step.x + 6 : step.x - 6;
      const lineEndX = side === 'L' ? tipX - 8 : tipX + 8;
      const endY = step.y;
      // 折线: metric 边 → step 列中点 → line 终点 (箭头底边)
      const midX = (startX + lineEndX) / 2;
      const d = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${lineEndX} ${endY}`;
      newPaths.push({ d, color });
      newDots.push({ cx: tipX, cy: endY, color, side });
    }
  }

  for (const m of LEFT_METRICS) drawMetric('L', m.code, m.linkIndices, LEFT_COLOR);
  for (const m of RIGHT_METRICS) drawMetric('R', m.code, m.linkIndices, RIGHT_COLOR);

  linkPaths.value = newPaths;
  linkDots.value = newDots;
}

let resizeObserver: ResizeObserver | null = null;

function loadData() {
  console.log('[funnel] loadData', { dateRange: dateRange.value, filter: filter.value, perCapita: perCapitaMode.value });
}

function onMetricPickerConfirm(picked: string[]) {
  pickedMetrics.value = picked;
  console.log('[funnel] picked metrics', picked);
}

onMounted(() => {
  nextTick(() => {
    recomputeLinks();
    if (funnelGridRef.value) {
      resizeObserver = new ResizeObserver(() => recomputeLinks());
      resizeObserver.observe(funnelGridRef.value);
    }
  });
  window.addEventListener('resize', recomputeLinks);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener('resize', recomputeLinks);
});

watch([perCapitaMode, bottomTab], () => {
  loadData();
});
</script>

