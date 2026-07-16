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
      <div class="funnel-body-toolbar">
        <span class="funnel-help">如何使用漏斗分析报表？</span>
        <div class="funnel-body-toolbar-right">
          <span class="funnel-body-toolbar-label">人均次数计算方式</span>
          <el-tooltip content="切换" placement="top" :show-after="300">
            <el-icon style="color: #909399; cursor: help"><QuestionFilled /></el-icon>
          </el-tooltip>
          <el-radio-group v-model="perCapitaMode" size="default" style="margin-left: 12px">
            <el-radio-button label="device">设备数</el-radio-button>
            <el-radio-button label="dau">DAU</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div class="funnel-layout">
        <div class="funnel-legend">
          <span class="funnel-legend-item"><span class="funnel-legend-dot" style="background: #fe9c2c"></span>次数</span>
          <span class="funnel-legend-item"><span class="funnel-legend-dot" style="background: #3b82f6"></span>设备数</span>
        </div>
        <div class="funnel-grid">
          <!-- 左指标 -->
          <div
            v-for="m in LEFT_METRICS"
            :key="m.code"
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

          <!-- 中央 11 步漏斗 (row 1-11 col 2) -->
          <div class="funnel-chart" style="grid-column: 2; grid-row: 1 / 12">
            <div
              v-for="(step, idx) in FUNNEL_STEPS"
              :key="step.code"
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

      <div class="funnel-table-wrap">
        <el-table :data="STAGE_ROWS" border stripe>
          <el-table-column prop="stage" label="阶段" width="120" align="center" />
          <el-table-column prop="flow" label="流程" min-width="200" />
          <el-table-column label="次数" align="right" min-width="120">
            <template #default>-</template>
          </el-table-column>
          <el-table-column label="设备数" align="right" min-width="120">
            <template #default>-</template>
          </el-table-column>
          <el-table-column label="人均次数" align="right" min-width="120">
            <template #default>-</template>
          </el-table-column>
        </el-table>
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
import { ref, onMounted, watch } from 'vue';
import { Refresh, EditPen, Download, Warning, QuestionFilled, Filter, ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import MetricPickerDialog from '@/components/report/MetricPickerDialog.vue';

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
  { code: 'arrive_rate', name: '广告场景到达率', tip: '到达广告场景 / 流量填充', alignIndex: 3 },
  { code: 'trigger_rate', name: '广告触发率', tip: '触发展示 / 到达广告场景', alignIndex: 5 },
  { code: 'show_success_rate', name: '触发展示成功率', tip: '触发展示成功 / 触发展示', alignIndex: 6 },
  { code: 'show_rate', name: '展示成功率', tip: '展示 / 触发展示成功', alignIndex: 7 },
  { code: 'click_rate', name: '点击率', tip: '点击 / 展示', alignIndex: 9 },
];

const RIGHT_METRICS = [
  { code: 'per_start', name: '人均启动', tip: '应用启动 / 设备数', alignIndex: 0 },
  { code: 'fill_rate', name: '流量填充率', tip: '流量填充 / 流量请求', alignIndex: 3 },
  { code: 'ready_rate', name: '广告Ready率', tip: '到达广告场景 / 流量填充', alignIndex: 4 },
  { code: 'isready_rate', name: 'isReady成功率', tip: '查询isReady / 到达广告场景', alignIndex: 5 },
  { code: 'show_gap', name: '展示Gap', tip: '展示API - 展示 差值', alignIndex: 8 },
];

const STAGE_ROWS = [
  { stage: '广告请求', flow: '应用启动' },
  { stage: '广告请求', flow: '获取配置' },
  { stage: '广告请求', flow: '流量请求' },
  { stage: '广告请求', flow: '流量填充' },
  { stage: '广告缓存', flow: '到达广告场景' },
  { stage: '广告缓存', flow: '查询isReady' },
  { stage: '广告展示', flow: '触发展示' },
  { stage: '广告展示', flow: '触发展示成功' },
  { stage: '广告展示', flow: '展示' },
  { stage: '广告展示', flow: '展示API' },
  { stage: '广告点击', flow: '点击' },
];

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

function loadData() {
  console.log('[funnel] loadData', { dateRange: dateRange.value, filter: filter.value, perCapita: perCapitaMode.value });
}

function onMetricPickerConfirm(picked: string[]) {
  pickedMetrics.value = picked;
  console.log('[funnel] picked metrics', picked);
}

onMounted(() => {});

watch([perCapitaMode, bottomTab], () => {
  loadData();
});
</script>

