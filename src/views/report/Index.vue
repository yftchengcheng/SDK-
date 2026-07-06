<template>
  <div class="page-container">
    <div class="page-header">
      <h1>数据报表</h1>
    </div>
    <div class="filter-card">
      <el-form :inline="true" :model="filter">
        <el-form-item label="时间范围">
          <el-date-picker v-model="filter.dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width: 260px" />
        </el-form-item>
        <el-form-item label="应用">
          <el-select v-model="filter.appKey" placeholder="全部应用" clearable style="width: 180px">
            <el-option v-for="a in appList" :key="a.app_key" :label="a.app_name" :value="a.app_key" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="stat_date" label="日期" width="120" />
        <el-table-column prop="app_name" label="应用" min-width="120" />
        <el-table-column prop="placement_name" label="广告位" min-width="120" />
        <el-table-column prop="requests" label="请求数" width="100" />
        <el-table-column prop="fills" label="填充数" width="100" />
        <el-table-column prop="impressions" label="展示数" width="100" />
        <el-table-column prop="clicks" label="点击数" width="100" />
        <el-table-column prop="revenue" label="收益(元)" width="120" />
        <el-table-column prop="fill_rate" label="填充率" width="100">
          <template #default="{ row }">{{ row.fill_rate != null ? row.fill_rate + '%' : '--' }}</template>
        </el-table-column>
        <el-table-column prop="ecpm" label="eCPM" width="100" />
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next" @change="fetchList" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import request from '../../utils/request';
import dayjs from 'dayjs';

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

onMounted(() => { fetchApps(); fetchList(); });
</script>
