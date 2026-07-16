<!--
  DateRangePicker - 自定义日期范围选择器
  - 左侧：6 个快速选择按钮（今天/昨天/近7天/近30天/本月/上月）
  - 右侧：双日历（起始/结束）+ 自定义范围
  - 触发器：button，显示当前选中的范围文本
  - v-model: 传入 ReportFilter
-->
<template>
  <el-popover
    v-model:visible="visible"
    :width="552"
    placement="bottom-start"
    trigger="click"
    popper-class="date-range-popover"
    :show-arrow="false"
  >
    <template #reference>
      <button
        type="button"
        class="date-range-trigger"
        :class="{ 'is-active': isCustom }"
      >
        <el-icon class="date-range-trigger-icon"><Calendar /></el-icon>
        <span class="date-range-trigger-text">{{ displayText }}</span>
        <el-icon class="date-range-trigger-arrow" :class="{ 'is-open': visible }"><ArrowDown /></el-icon>
      </button>
    </template>

    <div class="date-range-panel">
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
          @change="onCustomChange"
        />
        <div v-if="isCustom && customRange" class="date-range-calendar-preview">
          <el-icon><InfoFilled /></el-icon>
          <span>{{ customRange[0] }} ~ {{ customRange[1] }}（{{ daysDiff }} 天）</span>
        </div>
      </div>
    </div>

    <div class="date-range-footer">
      <el-button size="small" @click="visible = false">取消</el-button>
      <el-button size="small" type="primary" :disabled="!customRange" @click="confirmCustom">应用自定义</el-button>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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

const emit = defineEmits<{
  (e: 'update:modelValue', v: typeof props.modelValue): void;
  (e: 'change', v: typeof props.modelValue): void;
}>();

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

// 当前选中的快速模式（custom 时为 null）
const currentQuick = computed<DateRangePreset>(() => {
  const v = props.modelValue.dateRange;
  if (v === 'custom') return 'custom' as DateRangePreset;
  return (v as DateRangePreset) || '7d';
});

const isCustom = computed(() => props.modelValue.dateRange === 'custom');

// 自定义范围 [start, end]
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
    } else if (dr !== 'custom') {
      // 切到预设时清空 calendar 选择（但保留最近一次以备用户手动调整）
      // 这里不清空，避免打开 popover 后 calendar 显示空白
    }
  },
);

// 显示文本
const displayText = computed(() => {
  if (isCustom.value && props.modelValue.customStart && props.modelValue.customEnd) {
    return `${props.modelValue.customStart} ~ ${props.modelValue.customEnd}`;
  }
  const opt = quickOptions.find((o) => o.value === currentQuick.value);
  return opt?.label || '近 7 天';
});

// 天数差（自定义时显示）
const daysDiff = computed(() => {
  if (!customRange.value) return 0;
  return dayjs(customRange.value[1]).diff(dayjs(customRange.value[0]), 'day') + 1;
});

function applyQuick(value: DateRangePreset) {
  if (value === 'custom') {
    // 让用户去右侧 calendar 选
    return;
  }
  const next = { dateRange: value };
  emit('update:modelValue', next);
  emit('change', next);
  visible.value = false;
}

function onCustomChange(val: [string, string] | null) {
  if (!val || !val[0] || !val[1]) return;
  // 不立即 emit，等用户点「应用自定义」按钮，避免误触
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

<style>
.date-range-popover {
  padding: 0 !important;
  border-radius: 10px !important;
  border: 1px solid #E2E8F0 !important;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12) !important;
  overflow: hidden;
}
</style>
