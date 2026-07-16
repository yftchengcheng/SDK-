<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(v) => emit('update:visible', v)"
    title="指标"
    width="800px"
    :close-on-click-modal="false"
    align-center
    class="metric-picker-dialog"
  >
    <div class="metric-picker">
      <div
        v-for="cat in definitions"
        :key="cat.key"
        class="metric-picker-col"
      >
        <div class="metric-picker-col-header">
          <el-checkbox
            :model-value="isCatAllChecked(cat)"
            :indeterminate="isCatIndeterminate(cat)"
            @change="(v) => onCatToggle(cat, !!v)"
          >
            <span class="metric-picker-cat-label">{{ cat.label }}</span>
          </el-checkbox>
        </div>
        <div class="metric-picker-col-body">
          <div
            v-for="item in cat.items"
            :key="item.code"
            class="metric-picker-item"
          >
            <el-checkbox
              :model-value="local.includes(item.code)"
              @change="(v) => onItemToggle(item.code, !!v)"
            >
              <span class="metric-picker-item-label">{{ item.name }}</span>
            </el-checkbox>
            <el-tooltip :content="item.name + ' 说明'" placement="top" :show-after="300">
              <el-icon class="metric-picker-item-tip"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="onCancel">取消</el-button>
      <el-button type="primary" @click="onConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { QuestionFilled } from '@element-plus/icons-vue';

export interface MetricItem {
  code: string;
  name: string;
}
export interface MetricCategory {
  key: string;
  label: string;
  items: MetricItem[];
}

const props = defineProps<{
  visible: boolean;
  value: string[];
  definitions: MetricCategory[];
}>();

const emit = defineEmits<{
  'update:visible': [v: boolean];
  confirm: [picked: string[]];
}>();

const local = ref<string[]>([]);

watch(
  () => props.visible,
  (v) => {
    if (v) local.value = [...(props.value || [])];
  },
  { immediate: true },
);

watch(
  () => props.value,
  (v) => {
    if (props.visible) local.value = [...(v || [])];
  },
);

function isCatAllChecked(cat: MetricCategory): boolean {
  return cat.items.every((i) => local.value.includes(i.code));
}

function isCatIndeterminate(cat: MetricCategory): boolean {
  const cnt = cat.items.filter((i) => local.value.includes(i.code)).length;
  return cnt > 0 && cnt < cat.items.length;
}

function onCatToggle(cat: MetricCategory, v: boolean) {
  const codes = cat.items.map((i) => i.code);
  if (v) {
    const set = new Set([...local.value, ...codes]);
    local.value = Array.from(set);
  } else {
    const set = new Set(local.value);
    codes.forEach((c) => set.delete(c));
    local.value = Array.from(set);
  }
}

function onItemToggle(code: string, v: boolean) {
  const set = new Set(local.value);
  if (v) set.add(code);
  else set.delete(code);
  local.value = Array.from(set);
}

function onCancel() {
  emit('update:visible', false);
}

function onConfirm() {
  emit('confirm', [...local.value]);
  emit('update:visible', false);
}
</script>

<style scoped>
.metric-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 4px 0;
}
.metric-picker-col {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 10px 12px;
}
.metric-picker-col-header {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}
.metric-picker-cat-label {
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
}
.metric-picker-col-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.metric-picker-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}
.metric-picker-item-label {
  color: #4e5969;
}
.metric-picker-item-tip {
  color: #c9cdd4;
  cursor: help;
  font-size: 14px;
  margin-left: 2px;
}
</style>
