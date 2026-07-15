<!--
  MetricPicker - 指标选择器（弹窗 / Popover）
  用于在综合报表中选择展示哪些指标
-->
<template>
  <el-popover
    :visible="visible"
    placement="bottom-start"
    :width="420"
    trigger="manual"
    @show="onShow"
    @hide="onHide"
  >
    <template #reference>
      <el-button :icon="Plus" @click="visible = !visible">
        选择指标 ({{ selected.length }})
      </el-button>
    </template>

    <div class="metric-picker">
      <el-input v-model="searchText" :prefix-icon="Search" placeholder="搜索指标" clearable class="metric-picker-search" />

      <div class="metric-picker-categories">
        <div
          v-for="cat in categories"
          :key="cat.key"
          class="metric-picker-cat"
          :class="{ 'metric-picker-cat--active': activeCat === cat.key }"
          @click="activeCat = cat.key"
        >
          {{ cat.label }} ({{ countSelected(cat.key) }}/{{ countTotal(cat.key) }})
        </div>
      </div>

      <div class="metric-picker-list">
        <el-checkbox-group v-model="selected">
          <el-checkbox
            v-for="m in filteredMetrics"
            :key="m.code"
            :value="m.code"
            :label="m.code"
            class="metric-picker-item"
          >
            <div class="metric-picker-item-row">
              <span class="metric-picker-item-name">{{ m.name }}</span>
              <span class="metric-picker-item-code">{{ m.code }}</span>
            </div>
            <div class="metric-picker-item-meta">
              <el-tag v-if="m.value_type" size="small" :type="m.value_type === 'actual' ? 'success' : 'warning'">
                {{ m.value_type === 'actual' ? '实际' : '预估' }}
              </el-tag>
              <span class="metric-picker-item-format">{{ m.format }}</span>
            </div>
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <div class="metric-picker-footer">
        <el-button size="small" @click="reset">清空</el-button>
        <el-button size="small" type="primary" @click="confirm">确定</el-button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Plus, Search } from '@element-plus/icons-vue';
import request from '@/utils/request';

interface ReportMetric {
  id: number;
  code: string;
  name: string;
  category: string;
  format: string;
  value_type: 'actual' | 'estimated';
}

const props = defineProps<{ modelValue: string[] }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void }>();

const visible = ref(false);
const searchText = ref('');
const activeCat = ref('all');
const selected = ref<string[]>([...props.modelValue]);
const metrics = ref<ReportMetric[]>([]);

const CATEGORY_LABELS: Record<string, string> = {
  taku_revenue: '收入',
  taku_user: '用户',
  taku_request: '请求',
  taku_eCPM: 'eCPM',
  taku_fillrate: '填充率',
  taku_arpdau: 'ARPDAU',
  other: '其他',
};

const categories = computed(() => {
  const set = new Set(metrics.value.map((m) => m.category));
  const list = Array.from(set).map((k) => ({ key: k, label: CATEGORY_LABELS[k] || k }));
  return [{ key: 'all', label: '全部' }, ...list];
});

const filteredMetrics = computed(() => {
  let arr = metrics.value;
  if (activeCat.value !== 'all') arr = arr.filter((m) => m.category === activeCat.value);
  const q = searchText.value.trim().toLowerCase();
  if (q) arr = arr.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  return arr;
});

const countSelected = (cat: string): number => {
  const inCat = cat === 'all' ? metrics.value : metrics.value.filter((m) => m.category === cat);
  return inCat.filter((m) => selected.value.includes(m.code)).length;
};

const countTotal = (cat: string): number => {
  if (cat === 'all') return metrics.value.length;
  return metrics.value.filter((m) => m.category === cat).length;
};

const fetchMetrics = async () => {
  try {
    const res: any = await request.get('/api/v1/console/report-metric/list');
    if (res.code === 0) metrics.value = res.data || [];
  } catch (e) {
    console.error('failed to fetch metrics', e);
  }
};

const onShow = () => {
  if (!metrics.value.length) fetchMetrics();
};

const onHide = () => {
  visible.value = false;
};

const reset = () => {
  selected.value = [];
};

const confirm = () => {
  emit('update:modelValue', [...selected.value]);
  visible.value = false;
};

watch(() => props.modelValue, (v) => { selected.value = [...v]; }, { deep: true });
</script>

<style scoped>
.metric-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.metric-picker-search {
  flex: 0 0 auto;
}
.metric-picker-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.metric-picker-cat {
  padding: 4px 10px;
  border-radius: 4px;
  background: #F1F5F9;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}
.metric-picker-cat:hover {
  background: #E2E8F0;
}
.metric-picker-cat--active {
  background: #1E3A8A;
  color: #FFFFFF;
}
.metric-picker-list {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  padding: 8px;
}
.metric-picker-item {
  display: flex !important;
  width: 100%;
  margin-right: 0 !important;
  margin-bottom: 6px;
  padding: 6px;
  border-radius: 4px;
  transition: background 0.15s;
}
.metric-picker-item:hover {
  background: #F8FAFC;
}
.metric-picker-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.metric-picker-item-name {
  font-size: 13px;
  color: #1E293B;
  font-weight: 500;
}
.metric-picker-item-code {
  font-size: 11px;
  color: #94A3B8;
  font-family: monospace;
}
.metric-picker-item-meta {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: 2px;
}
.metric-picker-item-format {
  font-size: 11px;
  color: #64748B;
}
.metric-picker-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
