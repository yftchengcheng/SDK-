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
