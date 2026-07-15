<!--
  ReportFilter - 综合报表筛选器
  包含时间范围、应用、广告位、广告源 4 个级联
-->
<template>
  <div class="report-filter">
    <el-form inline :model="local" @submit.prevent>
      <el-form-item label="时间">
        <el-select v-model="local.dateRange" style="width: 140px" @change="emitChange">
          <el-option label="今天" value="today" />
          <el-option label="昨天" value="yesterday" />
          <el-option label="近 7 天" value="7d" />
          <el-option label="近 30 天" value="30d" />
          <el-option label="本月" value="month" />
          <el-option label="上月" value="lastMonth" />
        </el-select>
      </el-form-item>
      <el-form-item label="应用">
        <el-select v-model="local.appIds" multiple collapse-tags collapse-tags-tooltip placeholder="全部" clearable style="width: 180px" @change="emitChange">
          <el-option v-for="a in apps" :key="a.id" :label="a.app_name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="广告位">
        <el-select v-model="local.placementIds" multiple collapse-tags collapse-tags-tooltip placeholder="全部" clearable style="width: 180px" @change="emitChange">
          <el-option v-for="p in filteredPlacements" :key="p.id" :label="p.placement_name" :value="p.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="广告源">
        <el-select v-model="local.adSourceIds" multiple collapse-tags collapse-tags-tooltip placeholder="全部" clearable style="width: 180px" @change="emitChange">
          <el-option v-for="s in adSources" :key="s.id" :label="s.source_name" :value="s.id" />
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
}

const props = defineProps<{ modelValue: ReportFilter }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: ReportFilter): void; (e: 'change'): void }>();

const local = ref<ReportFilter>({ ...props.modelValue, appIds: [...(props.modelValue.appIds || [])], placementIds: [...(props.modelValue.placementIds || [])], adSourceIds: [...(props.modelValue.adSourceIds || [])] });

const apps = ref<Array<{ id: string; app_name: string }>>([]);
const placements = ref<Array<{ id: string; placement_name: string; app_id: string }>>([]);
const adSources = ref<Array<{ id: string; source_name: string }>>([]);

const filteredPlacements = computed(() => {
  if (!local.value.appIds?.length) return placements.value;
  return placements.value.filter((p) => local.value.appIds.includes(p.app_id));
});

const fetchApps = async () => {
  try {
    const res: any = await request.get('/api/v1/console/app/list', { params: { page: 1, page_size: 100 } });
    if (res.code === 0) apps.value = res.data?.list || [];
  } catch (e) { /* noop */ }
};

const fetchPlacements = async () => {
  try {
    const res: any = await request.get('/api/v1/console/placement/list', { params: { page: 1, page_size: 200 } });
    if (res.code === 0) placements.value = res.data?.list || [];
  } catch (e) { /* noop */ }
};

const fetchAdSources = async () => {
  try {
    const res: any = await request.get('/api/v1/console/ad-source/list', { params: { page: 1, page_size: 200 } });
    if (res.code === 0) adSources.value = res.data?.list || [];
  } catch (e) { /* noop */ }
};

const emitChange = () => {
  emit('update:modelValue', { ...local.value });
  emit('change');
};

const reset = () => {
  local.value = { dateRange: '7d', appIds: [], placementIds: [], adSourceIds: [] };
  emitChange();
};

onMounted(() => {
  fetchApps();
  fetchPlacements();
  fetchAdSources();
});

watch(() => props.modelValue, (v) => {
  local.value = { ...v, appIds: [...(v.appIds || [])], placementIds: [...(v.placementIds || [])], adSourceIds: [...(v.adSourceIds || [])] };
}, { deep: true });
</script>
