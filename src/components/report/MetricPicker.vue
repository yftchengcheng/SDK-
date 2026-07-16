<!--
  MetricPicker - 指标选择器（弹窗 Dialog）
  按产品截图：6 列分类 + 右侧已选列 + 搜索 + 隐藏的指标开关
-->
<template>
  <el-dialog
    v-model="visible"
    title="指标设置"
    width="900"
    :close-on-click-modal="false"
    class="metric-picker-dialog"
    @close="onClose"
  >
    <div class="mp-search-row">
      <el-input v-model="searchText" :prefix-icon="Search" placeholder="搜索指标" clearable class="mp-search" />
    </div>

    <div class="mp-main">
      <!-- 左：6 列分类 + 每列指标 -->
      <div class="mp-cats">
        <div
          v-for="cat in mainCategories"
          :key="cat.key"
          class="mp-cat-col"
        >
          <div class="mp-cat-title">
            <el-checkbox
              :model-value="isCatAllSelected(cat.key)"
              :indeterminate="isCatIndeterminate(cat.key)"
              @change="(v: boolean | string | number) => toggleCat(cat.key, !!v)"
            >
              {{ cat.label }}
            </el-checkbox>
          </div>
          <div class="mp-cat-list">
            <div v-for="m in filterByCat(cat.key)" :key="m.code" class="mp-cat-item">
              <el-checkbox
                :model-value="selected.includes(m.code)"
                @change="(v: boolean | string | number) => toggleOne(m.code, !!v)"
              >
                <span class="mp-cat-item-name">{{ m.name }}</span>
                <el-tooltip :content="m.description || m.code" placement="top">
                  <el-icon class="mp-cat-item-help"><QuestionFilled /></el-icon>
                </el-tooltip>
              </el-checkbox>
            </div>
          </div>
        </div>
      </div>

      <!-- 右：已选列 + 隐藏的指标 -->
      <div class="mp-side">
        <div class="mp-side-header">
          <span class="mp-side-title">已选{{ selected.length }}列</span>
          <el-button text type="primary" size="small" @click="reset">清空</el-button>
        </div>
        <div class="mp-side-list">
          <div v-for="(code, idx) in selected" :key="code" class="mp-side-row">
            <el-icon class="mp-side-handle"><Rank /></el-icon>
            <span class="mp-side-name">{{ getName(code) }}</span>
            <el-icon class="mp-side-close" @click="toggleOne(code, false)"><Close /></el-icon>
          </div>
        </div>
        <div class="mp-side-footer">
          <el-button text size="small" @click="showHidden = !showHidden">
            {{ showHidden ? '收起' : '展开' }}隐藏的指标
          </el-button>
        </div>
        <div v-if="showHidden" class="mp-side-hidden">
          <el-button text type="primary" size="small" @click="batchAdd">点击进行设置</el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Search, QuestionFilled, Rank, Close } from '@element-plus/icons-vue';
import request from '@/utils/request';

interface ReportMetric {
  id: number;
  code: string;
  name: string;
  category: string;
  format: string;
  value_type: 'actual' | 'estimated';
  description?: string;
}

const props = defineProps<{ modelValue: string[] }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void }>();

const visible = ref(false);
const searchText = ref('');
const selected = ref<string[]>([...props.modelValue]);
const metrics = ref<ReportMetric[]>([]);
const showHidden = ref(false);

// 按截图 6 个主分类（顺序固定）
const CATEGORY_ORDER = [
  { key: 'taku_user', label: '用户行为' },
  { key: 'taku_revenue', label: '收益数据' },
  { key: 'taku_bidding', label: '竞价数据' },
  { key: 'ad_request', label: '广告请求展示' },
  { key: 'ad_ready', label: '广告Ready数据' },
  { key: 'other', label: '其他' },
];

const mainCategories = computed(() => {
  return CATEGORY_ORDER.filter((c) => metrics.value.some((m) => m.category === c.key));
});

const filterByCat = (key: string) => {
  let arr = metrics.value.filter((m) => m.category === key);
  const q = searchText.value.trim().toLowerCase();
  if (q) arr = arr.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  return arr;
};

const toggleOne = (code: string, checked: boolean) => {
  if (checked && !selected.value.includes(code)) {
    selected.value = [...selected.value, code];
  } else if (!checked) {
    selected.value = selected.value.filter((c) => c !== code);
  }
};

const isCatAllSelected = (key: string) => {
  const inCat = filterByCat(key);
  if (!inCat.length) return false;
  return inCat.every((m) => selected.value.includes(m.code));
};

const isCatIndeterminate = (key: string) => {
  const inCat = filterByCat(key);
  const sel = inCat.filter((m) => selected.value.includes(m.code));
  return sel.length > 0 && sel.length < inCat.length;
};

const toggleCat = (key: string, checked: boolean) => {
  const inCat = filterByCat(key).map((m) => m.code);
  if (checked) {
    const set = new Set([...selected.value, ...inCat]);
    selected.value = Array.from(set);
  } else {
    selected.value = selected.value.filter((c) => !inCat.includes(c));
  }
};

const getName = (code: string): string => {
  return metrics.value.find((m) => m.code === code)?.name || code;
};

const fetchMetrics = async () => {
  try {
    const res: any = await request.get('/api/v1/console/report-metric/list');
    if (res.code === 0) metrics.value = res.data || [];
  } catch (e) {
    console.error('failed to fetch metrics', e);
  }
};

const open = async () => {
  visible.value = true;
  // 每次打开都从 v-model 同步 selected（保证回显看版当前 metrics）
  selected.value = [...(props.modelValue || [])];
  if (!metrics.value.length) await fetchMetrics();
};

const onClose = () => {};

const reset = () => {
  selected.value = [];
};

const batchAdd = () => {
  // 占位：实际可弹出二级弹窗
};

const confirm = () => {
  emit('update:modelValue', [...selected.value]);
  visible.value = false;
};

watch(() => props.modelValue, (v) => { selected.value = [...v]; }, { deep: true });

defineExpose({ open });
</script>
