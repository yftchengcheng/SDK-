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
              <FunnelProcessBox
                :steps="funnelSteps"
                :left-metrics="processLeftMetrics"
                :right-metrics="processRightMetrics"
              />
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
      <div class="funnel-bottom-empty">
        <el-empty description="暂无数据" />
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
import { ref, computed } from 'vue';
import { Refresh, EditPen, Download, Warning, Filter, ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import MetricPickerDialog from '@/components/report/MetricPickerDialog.vue';
import FunnelProcessBox, { type FunnelStep, type FunnelMetric } from '@/components/FunnelProcessBox.vue';

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

// ====== FunnelProcessBox 数据准备 ======
// step 颜色梯度（与示例图完全一致：4 段蓝色由深到浅）
const STEP_COLOR_TIERS = [
  'rgb(21, 79, 240)',   // step 0-3: 深蓝
  'rgb(21, 79, 240)',
  'rgb(21, 79, 240)',
  'rgb(21, 79, 240)',
  'rgb(34, 122, 255)',   // step 4-5: 中蓝
  'rgb(34, 122, 255)',
  'rgb(34, 162, 255)',   // step 6-9: 浅蓝
  'rgb(34, 162, 255)',
  'rgb(34, 162, 255)',
  'rgb(34, 162, 255)',
  'rgb(100, 208, 255)',  // step 10: 最浅
];

const funnelSteps = computed<FunnelStep[]>(() =>
  FUNNEL_STEPS.map((s, idx) => ({
    code: s.code,
    name: s.name,
    color: STEP_COLOR_TIERS[idx] || STEP_COLOR_TIERS[0],
  })),
);

// 左侧 5 个指标：全部 withArrow
// 颜色：仅 arrive_rate 是 primary (蓝)，其余 4 个 warning (橙)
const processLeftMetrics = computed<FunnelMetric[]>(() =>
  LEFT_METRICS.map((m) => ({
    code: m.code,
    name: m.name,
    value: metricValues.value[m.code] || '-',
    tip: m.tip,
    color: m.code === 'arrive_rate' ? 'primary' : 'warning',
    withArrow: true,
    alignIndex: m.alignIndex,
    linkIndices: m.linkIndices,
  })),
);

// 右侧 5 个指标：仅 fill_rate / show_gap 有 arrow
// 颜色：仅 per_start 是 nope (灰)，其余 4 个 warning (橙)
const processRightMetrics = computed<FunnelMetric[]>(() =>
  RIGHT_METRICS.map((m) => ({
    code: m.code,
    name: m.name,
    value: metricValues.value[m.code] || '-',
    tip: m.tip,
    color: m.code === 'per_start' ? 'nope' : 'warning',
    withArrow: m.code === 'fill_rate' || m.code === 'show_gap',
    alignIndex: m.alignIndex,
    linkIndices: m.linkIndices,
  })),
);

function loadData() {
  console.log('[funnel] loadData', { dateRange: dateRange.value, filter: filter.value, perCapita: perCapitaMode.value });
}

function onMetricPickerConfirm(picked: string[]) {
  pickedMetrics.value = picked;
  console.log('[funnel] picked metrics', picked);
}
</script>

