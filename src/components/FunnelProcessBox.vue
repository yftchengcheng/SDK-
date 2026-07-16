<template>
  <div class="chart-panel-container">
    <!-- 顶部图例 -->
    <div class="header">
      <div class="panel mr20">
        <div class="square warning" />
        <div>次数</div>
      </div>
      <div class="panel">
        <div class="square" />
        <div>设备数</div>
      </div>
    </div>

    <!-- 主体三栏 -->
    <div class="body">
      <!-- 左侧 5 个 process-box -->
      <div class="left-box">
        <div
          v-for="(m, idx) in leftList"
          :key="`L-${idx}`"
          class="process-box"
          :class="`process-box__${idx + 1}`"
          :style="{ gridRow: (m.alignIndex ?? idx) + 1 }"
        >
          <div
            class="process-box__content"
            :class="`process-box__content--${m.color}`"
          >
            <div class="label">{{ m.name }}: </div>
            <div class="value">
              <el-tooltip v-if="m.tip" :content="m.tip" placement="top" :show-after="300">
                <span class="process-box-value-text">{{ m.value }}</span>
              </el-tooltip>
              <span v-else class="process-box-value-text">{{ m.value }}</span>
            </div>
            <div class="tips">
              <i
                v-if="m.tip"
                class="iconfont icon-help--o icon-size--l"
                style="color: rgba(0, 0, 0, 0.25);"
              />
            </div>
          </div>
          <div class="process-box--line" />
          <div v-if="m.withArrow" class="process-box--arrow" />
        </div>
      </div>

      <!-- 中间 11 个 step -->
      <div class="main">
        <div
          v-for="(step, idx) in stepsList"
          :key="`M-${idx}`"
          class="main-item need-cursor"
          :style="{ backgroundColor: step.color }"
        >
          <div class="main-item__label">{{ step.name }}</div>
        </div>
      </div>

      <!-- 右侧 5 个 process-box -->
      <div class="right-box">
        <div
          v-for="(m, idx) in rightList"
          :key="`R-${idx}`"
          class="process-box"
          :class="`process-box__${idx + 1}`"
          :style="{ gridRow: (m.alignIndex ?? idx) + 1 }"
        >
          <div v-if="m.withArrow" class="process-box--arrow" />
          <div
            class="process-box--line"
            :class="{ 'process-box--line__single': !m.withArrow }"
          />
          <div
            class="process-box__content"
            :class="`process-box__content--${m.color}`"
          >
            <div class="label">{{ m.name }}: </div>
            <div class="value">
              <el-tooltip v-if="m.tip" :content="m.tip" placement="top" :show-after="300">
                <span class="process-box-value-text">{{ m.value }}</span>
              </el-tooltip>
              <span v-else class="process-box-value-text">{{ m.value }}</span>
            </div>
            <div class="tips">
              <i
                v-if="m.tip"
                class="iconfont icon-help--o icon-size--l"
                style="color: rgba(0, 0, 0, 0.25);"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * FunnelProcessBox — 1:1 复刻示例图（process-box / main-item 三栏布局）
 *
 * 与 Funnel.vue 集成说明：
 *  - 父组件传入 11 个 step + 5+5 个 metric
 *  - withArrow=true: 画 line + arrow（事件-指标强配对）
 *  - withArrow=false: 只画 line（单线，无 arrow，弱化视觉）
 *  - color: primary(蓝) / warning(橙) / nope(灰)
 */

export interface FunnelStep {
  code: string;
  name: string;
  color: string; // 主色背景
}

export interface FunnelMetric {
  code: string;
  name: string;
  value: string;
  tip?: string;
  color: 'primary' | 'warning' | 'nope';
  withArrow: boolean;
  /** 对应的 step 索引列表（用于上层联动/数据查询） */
  linkIndices?: number[];
}

interface Props {
  steps?: FunnelStep[];
  leftMetrics?: FunnelMetric[];
  rightMetrics?: FunnelMetric[];
}

const props = withDefaults(defineProps<Props>(), {
  steps: () => [],
  leftMetrics: () => [],
  rightMetrics: () => [],
});

// ===== 默认数据（与示例图完全一致，props 为空时兜底）=====
const STEP_BLUE_DARK = 'rgb(21, 79, 240)';   // step 0-3
const STEP_BLUE_MID = 'rgb(34, 122, 255)';   // step 4-5
const STEP_BLUE_LIGHT = 'rgb(34, 162, 255)'; // step 6-9
const STEP_BLUE_LIGHTER = 'rgb(100, 208, 255)'; // step 10

const defaultSteps: FunnelStep[] = [
  { code: 'app_start', name: '应用启动', color: STEP_BLUE_DARK },
  { code: 'fetch_config', name: '获取配置', color: STEP_BLUE_DARK },
  { code: 'traffic_req', name: '流量请求', color: STEP_BLUE_DARK },
  { code: 'traffic_fill', name: '流量填充', color: STEP_BLUE_DARK },
  { code: 'scene_arrive', name: '到达广告场景', color: STEP_BLUE_MID },
  { code: 'isready_query', name: '查询isReady', color: STEP_BLUE_MID },
  { code: 'trigger_show', name: '触发展示', color: STEP_BLUE_LIGHT },
  { code: 'trigger_success', name: '触发展示成功', color: STEP_BLUE_LIGHT },
  { code: 'show', name: '展示', color: STEP_BLUE_LIGHT },
  { code: 'show_api', name: '展示API', color: STEP_BLUE_LIGHT },
  { code: 'click', name: '点击', color: STEP_BLUE_LIGHTER },
];

const defaultLeftMetrics: FunnelMetric[] = [
  {
    code: 'arrive_rate',
    name: '广告场景到达率',
    value: '-',
    tip: '应用启动 / 到达广告场景 × 100%',
    color: 'primary',
    withArrow: true,
    linkIndices: [0, 4],
    alignIndex: 4,
  },
  {
    code: 'trigger_rate',
    name: '广告触发率',
    value: '-',
    tip: '到达广告场景 / 触发展示 × 100%',
    color: 'warning',
    withArrow: true,
    linkIndices: [4, 6],
    alignIndex: 6,
  },
  {
    code: 'trigger_show_rate',
    name: '触发展示成功率',
    value: '-',
    tip: '触发展示 / 触发展示成功 × 100%',
    color: 'warning',
    withArrow: true,
    linkIndices: [6, 7],
    alignIndex: 7,
  },
  {
    code: 'show_rate',
    name: '展示成功率',
    value: '-',
    tip: '展示 / 展示API × 100%',
    color: 'warning',
    withArrow: true,
    linkIndices: [8, 9],
    alignIndex: 8,
  },
  {
    code: 'click_rate',
    name: '点击率',
    value: '-',
    tip: '展示 / 点击 × 100%',
    color: 'warning',
    withArrow: true,
    linkIndices: [9, 10],
    alignIndex: 10,
  },
];

const defaultRightMetrics: FunnelMetric[] = [
  {
    code: 'per_start',
    name: '人均启动',
    value: '-',
    tip: '',
    color: 'nope',
    withArrow: false,
    linkIndices: [],
    alignIndex: 0,
  },
  {
    code: 'traffic_fill_rate',
    name: '流量填充率',
    value: '-',
    tip: '流量请求 / 流量填充 × 100%',
    color: 'warning',
    withArrow: true,
    linkIndices: [2, 3],
    alignIndex: 3,
  },
  {
    code: 'ad_ready_rate',
    name: '广告Ready率',
    value: '-',
    tip: '到达广告场景 / isReady × 100%',
    color: 'warning',
    withArrow: false,
    linkIndices: [4, 5],
    alignIndex: 4,
  },
  {
    code: 'isready_success_rate',
    name: 'isReady成功率',
    value: '-',
    tip: 'isReady / isReady成功 × 100%',
    color: 'warning',
    withArrow: false,
    linkIndices: [5],
    alignIndex: 5,
  },
  {
    code: 'show_gap',
    name: '展示gap',
    value: '-',
    tip: '展示API - 展示 / 时间',
    color: 'warning',
    withArrow: true,
    linkIndices: [8, 9],
    alignIndex: 9,
  },
];

// props 为空时用默认值（不修改 props，保证单向数据流）
const stepsList = computed(() => (props.steps && props.steps.length ? props.steps : defaultSteps));
const leftList = computed(() => (props.leftMetrics && props.leftMetrics.length ? props.leftMetrics : defaultLeftMetrics));
const rightList = computed(() => (props.rightMetrics && props.rightMetrics.length ? props.rightMetrics : defaultRightMetrics));
</script>
