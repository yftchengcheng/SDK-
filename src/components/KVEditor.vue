<template>
  <div class="kv-editor">
    <div v-if="modelValue.length === 0" class="kv-empty">
      <el-text type="info" size="small">暂无字段，点击下方添加</el-text>
    </div>
    <div v-for="(item, index) in modelValue" :key="index" class="kv-row">
      <el-input
        v-model="item.key"
        placeholder="字段名（如 app_id）"
        size="default"
        class="kv-key"
        :disabled="item.locked"
        @input="emitChange"
      />
      <el-input
        v-model="item.value"
        placeholder="字段值"
        size="default"
        class="kv-value"
        :type="item.secret && !item.showValue ? 'password' : 'text'"
        :disabled="item.locked"
        @input="emitChange"
      >
        <template #suffix>
          <el-icon
            v-if="item.secret"
            class="kv-icon-btn"
            @click="item.showValue = !item.showValue"
          >
            <component :is="item.showValue ? View : Hide" />
          </el-icon>
        </template>
      </el-input>
      <el-button
        link
        :type="item.secret ? 'primary' : 'default'"
        size="small"
        class="kv-icon-btn"
        :title="item.secret ? '已标记为敏感字段' : '标记为敏感字段（点击隐藏）'"
        @click="item.secret = !item.secret"
      >
        <el-icon><component :is="item.secret ? Lock : Unlock" /></el-icon>
      </el-button>
      <el-button
        link
        type="danger"
        size="small"
        class="kv-icon-btn"
        :disabled="item.locked"
        @click="removeRow(index)"
      >
        <el-icon><Delete /></el-icon>
      </el-button>
    </div>
    <div class="kv-footer">
      <el-button link type="primary" size="small" @click="addRow">
        <el-icon class="mr-1"><Plus /></el-icon>
        添加字段
      </el-button>
      <el-text v-if="modelValue.length > 0" type="info" size="small">
        共 {{ modelValue.length }} 个字段
        <span v-if="secretCount > 0">，{{ secretCount }} 个敏感</span>
      </el-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Plus, Delete, Lock, Unlock, View, Hide } from '@element-plus/icons-vue';

export interface KVItem {
  key: string;
  value: string;
  secret: boolean;
  showValue: boolean;
  locked: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue: KVItem[];
    placeholder?: string;
  }>(),
  {
    modelValue: () => [],
    placeholder: '',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: KVItem[]): void;
  (e: 'change', value: Record<string, string>): void;
}>();

const secretCount = computed(() => props.modelValue.filter((i) => i.secret).length);

function emitChange() {
  emit('update:modelValue', props.modelValue);
  const obj: Record<string, string> = {};
  props.modelValue.forEach((item) => {
    if (item.key.trim()) obj[item.key.trim()] = item.value;
  });
  emit('change', obj);
}

function addRow() {
  const next = [...props.modelValue, { key: '', value: '', secret: false, showValue: false, locked: false }];
  emit('update:modelValue', next);
}

function removeRow(index: number) {
  const next = props.modelValue.filter((_, i) => i !== index);
  emit('update:modelValue', next);
  emitChange();
}
</script>

<style scoped>
.kv-editor {
  width: 100%;
}
.kv-empty {
  padding: var(--space-lg) 0;
  text-align: center;
  border: 1px dashed var(--color-slate-200);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);
  background: var(--color-slate-50);
}
.kv-row {
  display: grid;
  grid-template-columns: 1.2fr 2fr auto auto;
  gap: var(--space-sm);
  align-items: center;
  margin-bottom: var(--space-sm);
}
.kv-key,
.kv-value {
  width: 100%;
}
.kv-icon-btn {
  padding: 0 6px;
}
.kv-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-slate-100);
}
.mr-1 {
  margin-right: 4px;
}
</style>
