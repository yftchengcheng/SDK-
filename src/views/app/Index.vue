<template>
  <div class="page-shell">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <el-icon :size="18"><Cellphone /></el-icon>
        </div>
        <div class="page-header-titles">
          <h1 class="page-header-title">应用管理</h1>
          <p class="page-header-subtitle">管理你的 SDK 接入应用，应用创建后用于广告位与数据上报的关联</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button type="primary" :icon="Plus" @click="goCreate">创建应用</el-button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="page-filter">
      <el-form :inline="true" class="page-filter-form" @submit.prevent>
        <el-form-item label="应用名称">
          <el-input v-model="filters.keyword" placeholder="搜索应用名称 / 包名 / AppKey" clearable @keyup.enter="onSearch" />
        </el-form-item>
        <el-form-item label="系统">
          <el-select v-model="filters.platform" placeholder="全部" clearable>
            <el-option label="Android" :value="1" />
            <el-option label="iOS" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="对接方式">
          <el-select v-model="filters.accessType" placeholder="全部" clearable>
            <el-option label="SDK" :value="1" />
            <el-option label="API" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <div class="page-filter-actions">
        <el-button @click="onReset">重置</el-button>
        <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="page-card">
      <div class="page-table-wrap">
        <el-table :data="tableData" v-loading="loading" row-key="app_key">
          <el-table-column label="应用" min-width="240" fixed>
            <template #default="{ row }">
              <div class="cell-icon-text">
                <div class="icon">
                  <img v-if="row.iconUrlResolved" :src="row.iconUrlResolved" :alt="row.app_name" @error="onIconThumbError" />
                  <el-icon v-else :size="16"><Picture /></el-icon>
                </div>
                <div class="cell-text">
                  <div class="cell-name">{{ row.app_name }}</div>
                  <div class="cell-sub">{{ row.package_name }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="AppKey" min-width="220">
            <template #default="{ row }">
              <div class="cell-icon-text" @click="copyText(row.app_key)">
                <span class="cell-num cell-link">{{ row.app_key }}</span>
                <el-icon :size="12" color="#94A3B8"><CopyDocument /></el-icon>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="系统" width="90">
            <template #default="{ row }">
              <span class="status-tag" :class="row.platform === 1 ? 'status-tag--info' : 'status-tag--neutral'">
                {{ row.platform === 1 ? 'Android' : 'iOS' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="对接方式" width="100">
            <template #default="{ row }">
              <span class="status-tag" :class="row.access_type === 1 ? 'status-tag--info' : 'status-tag--success'">
                {{ row.access_type === 1 ? 'SDK' : 'API' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="分类" prop="category" width="120" />
          <el-table-column label="超时" prop="timeout_ms" width="90">
            <template #default="{ row }">
              <span class="cell-num">{{ row.timeout_ms }} ms</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <span class="status-tag" :class="row.status === 1 ? 'status-tag--active' : 'status-tag--paused'">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="170">
            <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="right">
            <template #default="{ row }">
              <div class="cell-actions">
                <el-button link type="primary" size="small" @click="goEdit(row)">编辑</el-button>
                <el-button link :type="row.status === 1 ? 'warning' : 'success'" size="small" @click="handleToggleStatus(row)">
                  {{ row.status === 1 ? '禁用' : '启用' }}
                </el-button>
                <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="page-pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            background
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="fetchList"
            @size-change="fetchList"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '../../utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';

import { Cellphone, CopyDocument, Plus, Search } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const router = useRouter();

const goCreate = (): void => { router.push('/app/create'); };
const goEdit = (row: any): void => { router.push(`/app/edit/${row.appKey || row.app_key || row.id}`); };
const onBack = (): void => { if (window.history.length > 1) router.back(); else router.push('/app'); };

const loading = ref(false);
const tableData = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const filters = ref<{
  keyword: string;
  platform: number | null;
  accessType: number | null;
  status: number | null;
  dateRange: [string, string] | null;
}>({
  keyword: '',
  platform: null,
  accessType: null,
  status: null,
  dateRange: null,
});

const onSearch = (): void => {
  page.value = 1;
  fetchList();
};
const onReset = (): void => {
  filters.value = { keyword: '', platform: null, accessType: null, status: null, dateRange: null };
  page.value = 1;
  fetchList();
};
const onIconThumbError = (e: Event): void => {
  (e.target as HTMLImageElement).style.display = 'none';
};

const handleToggleStatus = async (row: any) => {
  const newStatus = row.status === 1 ? 2 : 1;
  const action = newStatus === 2 ? '禁用' : '启用';
  await ElMessageBox.confirm(`确定${action}应用"${row.app_name}"吗？`, '提示', { type: 'warning' });
  try {
    await request.put('/api/v1/console/app/toggle-status', { appKey: row.app_key, status: newStatus });
    ElMessage.success(`${action}成功`);
    fetchList();
  } catch { /* ignore */ }
};

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定删除应用"${row.app_name}"吗？此操作不可恢复。`, '警告', { type: 'error' });
  try {
    await request.delete('/api/v1/console/app/delete', { params: { appKey: row.app_key } });
    ElMessage.success('删除成功');
    fetchList();
  } catch { /* ignore */ }
};

const fetchList = async (): Promise<void> => {
  loading.value = true;
  try {
    const res: any = await request.get('/api/v1/console/app/list', { params: { page: page.value, pageSize: pageSize.value, ...filters.value } });
    if (res.code === 0) {
      tableData.value = res.data?.list || [];
      total.value = res.data?.total || 0;
    } else {
      ElMessage.error(res.message || '加载失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败');
  } finally {
    loading.value = false;
  }
};


const formatTime = (ts: number | string | undefined | null): string => {
  if (!ts) return '-';
  const d = new Date(typeof ts === 'number' ? ts * (ts.toString().length <= 10 ? 1000 : 1) : ts);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

onMounted(fetchList);
</script>
