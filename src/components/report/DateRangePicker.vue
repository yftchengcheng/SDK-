<!--
  DateRangePicker - 自定义日期范围选择器
  - 左侧：6 个快速选择按钮（今天/昨天/近7天/近30天/本月/上月）
  - 右侧：双日历（起始/结束）+ 自定义范围
  - 触发器：原生 button，显示当前选中的范围文本
  - v-model: 传入 ReportFilter
  - 实现：受控 v-if 面板 + 外部点击关闭（避开 el-popover 嵌套 popover 兼容问题）
-->
<template>
  <div class="date-range-picker" ref="rootRef">
    <button
      type="button"
      class="date-range-trigger"
      :class="{ 'is-active': isCustom }"
      @click="toggleOpen"
    >
      <el-icon class="date-range-trigger-icon"><Calendar /></el-icon>
      <span class="date-range-trigger-text">{{ displayText }}</span>
      <el-icon class="date-range-trigger-arrow" :class="{ 'is-open': visible }"><ArrowDown /></el-icon>
    </button>

    <Teleport to="body">
      <div
        v-if="visible"
        class="date-range-popover-floating"
        :style="floatingStyle"
        @mousedown.stop
      >
        <div class="date-range-panel" @mousedown.stop>
          <!-- 左侧：快速选择 -->
          <div class="date-range-quick">
            <div class="date-range-quick-label">快速选择</div>
            <button
              v-for="opt in quickOptions"
              :key="opt.value"
              type="button"
              class="date-range-quick-item"
              :class="{ 'is-active': currentQuick === opt.value }"
              @click="applyQuick(opt.value)"
            >
              <el-icon v-if="currentQuick === opt.value" class="date-range-quick-check"><Check /></el-icon>
              <span v-else class="date-range-quick-dot"></span>
              {{ opt.label }}
            </button>
          </div>

          <!-- 右侧：日历 -->
          <div class="date-range-calendar">
            <div class="date-range-calendar-header">
              <el-icon class="date-range-calendar-icon"><Calendar /></el-icon>
              <span class="date-range-calendar-title">自定义日期范围</span>
            </div>
            <el-date-picker
              v-model="customRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              unlink-panels
              :shortcuts="[]"
              class="date-range-calendar-input"
            />
            <div v-if="customRange" class="date-range-calendar-preview">
              <el-icon><InfoFilled /></el-icon>
              <span>{{ customRange[0] }} ~ {{ customRange[1] }}（{{ daysDiff }} 天）</span>
            </div>
          </div>
        </div>

        <div class="date-range-footer">
          <el-button size="small" @click="visible = false">取消</el-button>
          <el-button
            size="small"
            type="primary"
            :disabled="!customRange"
            @click="confirmCustom"
          >应用自定义</el-button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import { Calendar, ArrowDown, Check, InfoFilled } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

export type DateRangePreset = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'lastMonth' | 'custom';

const props = defineProps<{
  modelValue: {
    dateRange: string;
    customStart?: string;
    customEnd?: string;
  };
}>();

type DateRangeValue = {
  dateRange: string;
  customStart?: string;
  customEnd?: string;
};

const emit = defineEmits<{
  (e: 'update:modelValue', v: DateRangeValue): void;
  (e: 'change', v: DateRangeValue): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const visible = ref(false);

// 快速选项
const quickOptions: Array<{ value: DateRangePreset; label: string }> = [
  { value: 'today', label: '今天' },
  { value: 'yesterday', label: '昨天' },
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
  { value: 'month', label: '本月' },
  { value: 'lastMonth', label: '上月' },
];

const currentQuick = computed<DateRangePreset>(() => {
  const v = props.modelValue.dateRange;
  if (v === 'custom') return 'custom' as DateRangePreset;
  return (v as DateRangePreset) || '7d';
});

const isCustom = computed(() => props.modelValue.dateRange === 'custom');

const customRange = ref<[string, string] | null>(
  isCustom.value && props.modelValue.customStart && props.modelValue.customEnd
    ? [props.modelValue.customStart, props.modelValue.customEnd]
    : null,
);

watch(
  () => [props.modelValue.customStart, props.modelValue.customEnd, props.modelValue.dateRange] as const,
  ([s, e, dr]) => {
    if (dr === 'custom' && s && e) {
      customRange.value = [s, e];
    }
  },
);

const displayText = computed(() => {
  if (isCustom.value && props.modelValue.customStart && props.modelValue.customEnd) {
    return `${props.modelValue.customStart} ~ ${props.modelValue.customEnd}`;
  }
  const opt = quickOptions.find((o) => o.value === currentQuick.value);
  return opt?.label || '近 7 天';
});

const daysDiff = computed(() => {
  if (!customRange.value) return 0;
  return dayjs(customRange.value[1]).diff(dayjs(customRange.value[0]), 'day') + 1;
});

// 浮动面板位置（绝对定位，相对触发器）
const floatingStyle = ref<Record<string, string>>({});

function updatePosition() {
  if (!rootRef.value) return;
  const rect = rootRef.value.getBoundingClientRect();
  floatingStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 6}px`,
    left: `${rect.left}px`,
    zIndex: '3000',
  };
}

function toggleOpen() {
  if (visible.value) {
    visible.value = false;
  } else {
    visible.value = true;
    nextTick(updatePosition);
  }
}

// 外部点击关闭
function onDocPointerDown(ev: PointerEvent) {
  if (!visible.value) return;
  const target = ev.target as Node;
  if (rootRef.value && rootRef.value.contains(target)) return;
  const pop = document.querySelector('.date-range-popover-floating');
  if (pop && pop.contains(target)) return;
  visible.value = false;
}

// ESC 关闭
function onKeyDown(ev: KeyboardEvent) {
  if (ev.key === 'Escape' && visible.value) visible.value = false;
}

// 滚动 / 缩放时关闭（避免面板错位）
function onWinEvent() {
  if (visible.value) visible.value = false;
}

if (typeof window !== 'undefined') {
  document.addEventListener('pointerdown', onDocPointerDown, true);
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onWinEvent);
  window.addEventListener('scroll', onWinEvent, true);
}

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return;
  document.removeEventListener('pointerdown', onDocPointerDown, true);
  document.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('resize', onWinEvent);
  window.removeEventListener('scroll', onWinEvent, true);
});

function applyQuick(value: DateRangePreset) {
  if (value === 'custom') return;
  const next = { dateRange: value };
  emit('update:modelValue', next);
  emit('change', next);
  visible.value = false;
}

function confirmCustom() {
  if (!customRange.value) return;
  const [start, end] = customRange.value;
  const next = { dateRange: 'custom', customStart: start, customEnd: end };
  emit('update:modelValue', next);
  emit('change', next);
  visible.value = false;
}
</script>
