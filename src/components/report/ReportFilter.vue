<!--
  ReportFilter - 综合报表筛选器
  包含时间范围 + App/Placement/AdSource/Platform/Format/Country/OS/Network 8 个级联
-->
<template>
  <div class="report-filter">
    <el-form inline :model="local" @submit.prevent>
      <el-form-item label="时间">
        <el-select v-model="local.dateRange" style="width: 130px" @change="emitChange">
          <el-option label="今天" value="today" />
          <el-option label="昨天" value="yesterday" />
          <el-option label="近 7 天" value="7d" />
          <el-option label="近 30 天" value="30d" />
          <el-option label="本月" value="month" />
          <el-option label="上月" value="lastMonth" />
        </el-select>
      </el-form-item>
      <el-form-item label="应用">
        <el-select
          v-model="local.appIds"
          multiple collapse-tags collapse-tags-tooltip placeholder="全部应用"
          clearable filterable style="width: 180px" @change="onAppChange"
        >
          <el-option v-for="a in apps" :key="a.value" :label="a.label" :value="a.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="广告位">
        <el-select
          v-model="local.placementIds" multiple collapse-tags collapse-tags-tooltip
          placeholder="全部广告位" clearable filterable style="width: 180px" @change="emitChange"
          :disabled="!local.appIds?.length"
        >
          <el-option v-for="p in filteredPlacements" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="平台">
        <el-select
          v-model="local.platform" placeholder="全部" clearable style="width: 120px" @change="onPlatformChange"
        >
          <el-option v-for="p in platforms" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型">
        <el-select
          v-model="local.formats" multiple collapse-tags collapse-tags-tooltip
          placeholder="全部类型" clearable style="width: 170px" @change="emitChange"
        >
          <el-option v-for="f in formats" :key="f.value" :label="f.label" :value="f.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="广告源">
        <el-select
          v-model="local.adSourceIds" multiple collapse-tags collapse-tags-tooltip
          placeholder="全部广告源" clearable filterable style="width: 180px" @change="emitChange"
        >
          <el-option v-for="s in adSources" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="地区">
        <el-select
          v-model="local.country" multiple collapse-tags collapse-tags-tooltip
          placeholder="全部地区" clearable style="width: 150px" @change="emitChange"
        >
          <el-option v-for="c in countries" :key="c.value" :label="c.label" :value="c.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="系统">
        <el-select
          v-model="local.osList" multiple collapse-tags collapse-tags-tooltip
          placeholder="全部系统" clearable style="width: 140px" @change="emitChange"
        >
          <el-option v-for="o in osList" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="emitChange">查询</el-button>
        <el-button :icon="RefreshLeft" @click="reset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Search, RefreshLeft } from '@element-plus/icons-vue';
import request from '@/utils/request';

export interface ReportFilter {
  dateRange: 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'lastMonth';
  appIds: string[];
  placementIds: string[];
  adSourceIds: string[];
  formats: ('banner' | 'interstitial' | 'native' | 'rewarded' | 'splash')[];
  country: string[];
  osList: string[];
  platform: string;
  networks?: string[];
}

const props = defineProps<{ modelValue: ReportFilter }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: ReportFilter): void; (e: 'change'): void }>();

const local = ref<ReportFilter>({
  dateRange: props.modelValue.dateRange || '7d',
  appIds: [...(props.modelValue.appIds || [])],
  placementIds: [...(props.modelValue.placementIds || [])],
  adSourceIds: [...(props.modelValue.adSourceIds || [])],
  formats: [...(props.modelValue.formats || [])],
  country: [...(props.modelValue.country || [])],
  osList: [...(props.modelValue.osList || [])],
  platform: props.modelValue.platform || '',
});

const apps = ref<Array<{ value: string; label: string }>>([]);
const placements = ref<Array<{ value: string; label: string; app_id: string }>>([]);
const adSources = ref<Array<{ value: string; label: string; platform: string; ad_type: string }>>([]);
const platforms = ref<Array<{ value: string; label: string }>>([]);
const formats = ref<Array<{ value: string; label: string }>>([]);
const countries = ref<Array<{ value: string; label: string }>>([]);
const osList = ref<Array<{ value: string; label: string }>>([]);

const filteredPlacements = computed(() => {
  if (!local.value.appIds?.length) return placements.value;
  return placements.value.filter((p) => local.value.appIds.includes(p.app_id));
});

const fetchOptions = async (type: string, extra: any = {}): Promise<any[]> => {
  try {
    const res: any = await request.post('/api/v1/console/report/aggregate/options', { type, ...extra });
    if (res.code === 0) return res.data?.options || [];
  } catch (e) { /* noop */ }
  return [];
};

const loadAllOptions = async () => {
  apps.value = await fetchOptions('app');
  placements.value = await fetchOptions('placement');
  adSources.value = await fetchOptions('ad_source');
  platforms.value = await fetchOptions('platform');
  formats.value = await fetchOptions('format');
  countries.value = await fetchOptions('country');
  osList.value = await fetchOptions('os');
};

const onAppChange = async () => {
  // 切换应用后，重拉对应的 placement（如果后端不支持级联刷新则前端过滤）
  // 已是 computed 过滤了，所以仅清理不存在的 placement
  if (local.value.placementIds.length > 0) {
    const validIds = filteredPlacements.value.map(p => p.value);
    local.value.placementIds = local.value.placementIds.filter(id => validIds.includes(id));
  }
  emitChange();
};

const onPlatformChange = async () => {
  emitChange();
};

const emitChange = () => {
  emit('update:modelValue', { ...local.value });
  emit('change');
};

const reset = () => {
  local.value = {
    dateRange: '7d', appIds: [], placementIds: [], adSourceIds: [],
    formats: [], country: [], osList: [], platform: '',
  };
  emitChange();
};

onMounted(() => {
  loadAllOptions();
});

watch(() => props.modelValue, (v) => {
  local.value = {
    dateRange: v.dateRange || '7d',
    appIds: [...(v.appIds || [])],
    placementIds: [...(v.placementIds || [])],
    adSourceIds: [...(v.adSourceIds || [])],
    formats: [...(v.formats || [])],
    country: [...(v.country || [])],
    osList: [...(v.osList || [])],
    platform: v.platform || '',
  };
}, { deep: true });
</script>
