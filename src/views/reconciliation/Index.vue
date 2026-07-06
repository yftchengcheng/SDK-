<template>
  <div class="page-container">
    <div class="page-header">
      <h1>对账管理</h1>
      <el-button @click="exportExcel">导出Excel</el-button>
    </div>
    <div class="filter-card">
      <el-form :inline="true" :model="filter">
        <el-form-item label="时间范围">
          <el-date-picker v-model="filter.dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width: 260px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="network_name" label="广告平台" width="120" />
        <el-table-column prop="placement_name" label="广告位" min-width="140" />
        <el-table-column prop="sdk_impressions" label="SDK展示量" width="120" />
        <el-table-column prop="api_impressions" label="API展示量" width="120" />
        <el-table-column prop="sdk_revenue" label="SDK预估收益" width="130" />
        <el-table-column prop="api_revenue" label="API实际结算" width="130" />
        <el-table-column prop="impression_diff" label="展示差异率" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-danger': Math.abs(Number(row.impression_diff)) > 5 }">{{ row.impression_diff != null ? row.impression_diff + '%' : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="revenue_diff" label="收益差异率" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-danger': Math.abs(Number(row.revenue_diff)) > 5 }">{{ row.revenue_diff != null ? row.revenue_diff + '%' : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="对账状态" width="100">
          <template #default="{ row }">
            <el-tag :type="reconStatusType(row.status)" size="small">{{ reconStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
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

const reconStatusType = (s: number) => s === 1 ? 'success' : s === 2 ? 'warning' : 'info';
const reconStatusLabel = (s: number) => s === 1 ? '一致' : s === 2 ? '异常' : '待确认';

const loading = ref(false);
const tableData = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const filter = reactive({ dateRange: [] as string[] });

const fetchList = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (filter.dateRange?.length === 2) { params.startDate = filter.dateRange[0]; params.endDate = filter.dateRange[1]; }
    else { params.startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD'); params.endDate = dayjs().format('YYYY-MM-DD'); }
    const res: any = await request.get('/api/v1/console/reconciliation', { params });
    tableData.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } catch { /* ignore */ } finally { loading.value = false; }
};

const resetFilter = () => { filter.dateRange = []; fetchList(); };

const exportExcel = async () => {
  try {
    const params: any = {};
    if (filter.dateRange?.length === 2) { params.startDate = filter.dateRange[0]; params.endDate = filter.dateRange[1]; }
    const res = await fetch(`/api/v1/console/reconciliation/export?${new URLSearchParams(params).toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `对账报表_${dayjs().format('YYYYMMDD')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch { /* ignore */ }
};

onMounted(fetchList);
</script>

<style scoped>
.text-danger { color: #DC2626; font-weight: 600; }
</style>
