<template>
  <div class="page-shell">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><DataAnalysis /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">数据报表</h1>
          <p class="page-header-subtitle">按日期 / 应用 / 广告位聚合的请求、填充、展示、点击与收益</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="Download" @click="exportCsv">导出 CSV</el-button>
      </div>
    </div>
    <div class="page-filter">
      <el-form :inline="true" :model="filter" class="page-filter-form" @submit.prevent>
        <el-form-item label="时间范围">
          <el-date-picker v-model="filter.dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="应用">
          <el-select v-model="filter.appKey" placeholder="全部应用" clearable>
            <el-option v-for="a in appList" :key="a.app_key" :label="a.app_name" :value="a.app_key" />
          </el-select>
        </el-form-item>
        <el-form-item label="粒度">
          <el-select v-model="filter.granularity" placeholder="日">
            <el-option label="日" value="day" />
            <el-option label="小时" value="hour" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-filter-actions">
        <el-button @click="resetFilter">重置</el-button>
        <el-button type="primary" :icon="Search" @click="fetchList">查询</el-button>
      </div>
    </div>
    <div class="page-card">
      <div class="page-table-wrap">
        <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
          <el-table-column prop="stat_date" label="日期" width="120" />
          <el-table-column prop="app_name" label="应用" min-width="120">
            <template #default="{ row }"><div class="cell-name">{{ row.app_name || '—' }}</div></template>
          </el-table-column>
          <el-table-column prop="placement_name" label="广告位" min-width="120">
            <template #default="{ row }"><div class="cell-name">{{ row.placement_name || '—' }}</div></template>
          </el-table-column>
          <el-table-column prop="requests" label="请求数" width="100" align="right">
            <template #default="{ row }"><span class="cell-num">{{ formatNum(row.requests) }}</span></template>
          </el-table-column>
          <el-table-column prop="fills" label="填充数" width="100" align="right">
            <template #default="{ row }"><span class="cell-num">{{ formatNum(row.fills) }}</span></template>
          </el-table-column>
          <el-table-column prop="impressions" label="展示数" width="100" align="right">
            <template #default="{ row }"><span class="cell-num">{{ formatNum(row.impressions) }}</span></template>
          </el-table-column>
          <el-table-column prop="clicks" label="点击数" width="100" align="right">
            <template #default="{ row }"><span class="cell-num">{{ formatNum(row.clicks) }}</span></template>
          </el-table-column>
          <el-table-column prop="revenue" label="收益(元)" width="120" align="right">
            <template #default="{ row }"><span class="cell-num">¥{{ Number(row.revenue || 0).toFixed(2) }}</span></template>
          </el-table-column>
          <el-table-column prop="fill_rate" label="填充率" width="100" align="right">
            <template #default="{ row }"><span class="cell-num">{{ row.fill_rate != null ? row.fill_rate + '%' : '--' }}</span></template>
          </el-table-column>
          <el-table-column prop="ecpm" label="eCPM" width="100" align="right">
            <template #default="{ row }"><span class="cell-num">{{ row.ecpm != null ? '¥' + Number(row.ecpm).toFixed(2) : '--' }}</span></template>
          </el-table-column>
        </el-table>
      </div>
      <TablePagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      @change="fetchList" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import TablePagination from '@/components/TablePagination.vue';
import request from '../../utils/request';
import dayjs from 'dayjs';
import { Download } from '@element-plus/icons-vue';

const DownloadIcon = Download;

const loading = ref(false);
const tableData = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const appList = ref<any[]>([]);

const filter = reactive({
  dateRange: [] as string[],
  appKey: '',
});

const fetchApps = async () => {
  try { const res: any = await request.get('/api/v1/console/app/list', { params: { pageSize: 200 } }); appList.value = res.data?.list || []; } catch { /* ignore */ }
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (filter.dateRange?.length === 2) { params.startDate = filter.dateRange[0]; params.endDate = filter.dateRange[1]; }
    else { params.startDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD'); params.endDate = dayjs().format('YYYY-MM-DD'); }
    if (filter.appKey) params.appKey = filter.appKey;
    const res: any = await request.get('/api/v1/console/report/daily', { params });
    tableData.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } catch { /* ignore */ } finally { loading.value = false; }
};

const resetFilter = () => { filter.dateRange = []; filter.appKey = ''; fetchList(); };

const exportCsv = async () => {
  try {
    const params: URLSearchParams = new URLSearchParams();
    if (filter.dateRange?.length === 2) { params.append('startDate', filter.dateRange[0]); params.append('endDate', filter.dateRange[1]); }
    else { params.append('startDate', dayjs().subtract(7, 'day').format('YYYY-MM-DD')); params.append('endDate', dayjs().format('YYYY-MM-DD')); }
    if (filter.appKey) params.append('appKey', filter.appKey);
    const token = localStorage.getItem('token') || '';
    const url = `/api/v1/console/report/export?${params.toString()}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) { alert('导出失败'); return; }
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `report_${params.get('startDate')}_${params.get('endDate')}.csv`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch (e) { /* ignore */ }
};

onMounted(() => { fetchApps(); fetchList(); });
</script>
