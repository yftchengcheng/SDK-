<!--
  DimensionPicker - 维度选择器（弹窗 Dialog）
  按产品截图：5 分组 + 多选 + 搜索
-->
<template>
  <el-dialog
    v-model="visible"
    title="维度设置"
    width="640"
    :close-on-click-modal="false"
    class="dimension-picker-dialog"
    @close="onClose"
  >
    <div class="dp-search-row">
      <el-input v-model="searchText" :prefix-icon="Search" placeholder="搜索维度" clearable class="dp-search" />
    </div>

    <div class="dp-main">
      <div
        v-for="group in filteredGroups"
        :key="group.label"
        class="dp-group"
      >
        <div class="dp-group-header">
          <el-checkbox
            :model-value="isGroupAllSelected(group)"
            :indeterminate="isGroupIndeterminate(group)"
            @change="(v: boolean | string | number) => toggleGroup(group, !!v)"
          >
            {{ group.label }}
          </el-checkbox>
        </div>
        <div class="dp-group-items">
          <el-checkbox
            v-for="opt in group.options"
            :key="opt.value"
            :model-value="selected.includes(opt.value)"
            class="dp-option"
            @change="(v: boolean | string | number) => toggleOne(opt.value, !!v)"
          >
            <span class="dp-option-name">{{ opt.label }}</span>
            <span class="dp-option-code">{{ opt.value }}</span>
          </el-checkbox>
        </div>
      </div>
    </div>

    <div class="dp-footer">
      <span class="dp-footer-hint">已选 {{ selected.length }} / {{ totalOptions }} 个维度</span>
      <div class="dp-footer-actions">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="confirm">确定</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';

interface DimOption { value: string; label: string }
interface DimGroup { label: string; options: DimOption[] }

const props = defineProps<{
  modelValue: string[];
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', val: string[]): void;
  (e: 'change', val: string[]): void;
}>();

const visible = ref(false);
const selected = ref<string[]>([...(props.modelValue || [])]);
const searchText = ref('');

const groups: DimGroup[] = [
  {
    label: '时间维度',
    options: [
      { value: 'date', label: '按日' },
      { value: 'hour', label: '按小时' },
      { value: 'week', label: '按周' },
      { value: 'month', label: '按月' }
    ]
  },
  {
    label: '场景维度',
    options: [
      { value: 'scene', label: '广告场景' },
      { value: 'app', label: '应用' },
      { value: 'placement', label: '广告位' },
      { value: 'format', label: '广告类型' }
    ]
  },
  {
    label: '广告维度',
    options: [
      { value: 'platform', label: '广告平台' },
      { value: 'ad_source', label: '广告源' },
      { value: 'bid_type', label: '竞价类型' },
      { value: 'channel', label: '渠道' },
      { value: 'sdk_version', label: 'SDK 版本' }
    ]
  },
  {
    label: '用户维度',
    options: [
      { value: 'ab_test', label: 'A-B 测试' },
      { value: 'idfa', label: 'IDFA 状态' },
      { value: 'country', label: '地区' },
      { value: 'os', label: '系统平台' },
      { value: 'traffic_group', label: '流量分组' },
      { value: 'scene_name', label: '广告场景名称' }
    ]
  }
];

const filteredGroups = computed<DimGroup[]>(() => {
  const kw = searchText.value.trim().toLowerCase();
  if (!kw) return groups;
  return groups
    .map((g) => ({
      ...g,
      options: g.options.filter(
        (o) => o.label.toLowerCase().includes(kw) || o.value.toLowerCase().includes(kw)
      )
    }))
    .filter((g) => g.options.length > 0);
});

const totalOptions = computed(() => groups.reduce((acc, g) => acc + g.options.length, 0));

watch(
  () => props.modelValue,
  (v) => {
    selected.value = Array.isArray(v) ? [...v] : [];
  },
  { deep: true }
);

const isGroupAllSelected = (group: DimGroup) => group.options.every((o) => selected.value.includes(o.value));
const isGroupIndeterminate = (group: DimGroup) => {
  const sel = group.options.filter((o) => selected.value.includes(o.value)).length;
  return sel > 0 && sel < group.options.length;
};

const toggleGroup = (group: DimGroup, checked: boolean) => {
  const codes = group.options.map((o) => o.value);
  if (checked) {
    const set = new Set([...selected.value, ...codes]);
    selected.value = [...set];
  } else {
    const set = new Set(selected.value);
    codes.forEach((c) => set.delete(c));
    selected.value = [...set];
  }
};

const toggleOne = (code: string, checked: boolean) => {
  if (checked) {
    if (!selected.value.includes(code)) selected.value = [...selected.value, code];
  } else {
    selected.value = selected.value.filter((c) => c !== code);
  }
};

const confirm = () => {
  emit('update:modelValue', [...selected.value]);
  emit('change', [...selected.value]);
  visible.value = false;
};

const onClose = () => {
  // 还原为 props 当前值
  selected.value = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
};

const open = (seed?: string[]) => {
  selected.value = Array.isArray(seed) && seed.length > 0
    ? [...seed]
    : (Array.isArray(props.modelValue) ? [...props.modelValue] : []);
  visible.value = true;
};

defineExpose({ open });
</script>
