<template>
  <div class="page-container">
    <div class="page-header">
      <h1>消息中心</h1>
      <el-button @click="markAllRead">全部已读</el-button>
    </div>
    <div class="filter-card">
      <el-form :inline="true" :model="filter">
        <el-form-item label="消息类型">
          <el-select v-model="filter.type" placeholder="全部" clearable style="width: 140px" @change="fetchList">
            <el-option label="系统通知" :value="1" />
            <el-option label="运营公告" :value="2" />
            <el-option label="收益提醒" :value="3" />
            <el-option label="异常告警" :value="4" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <div class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="is_read" label="" width="40">
          <template #default="{ row }">
            <span v-if="!row.is_read" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#DC2626"></span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="240">
          <template #default="{ row }">
            <span :class="{ 'text-secondary': row.is_read }" style="cursor:pointer" @click="handleRead(row)">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="typeTagMap[row.type] || 'info'" size="small">{{ typeLabelMap[row.type] || '未知' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="170">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleRead(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next" @change="fetchList" />
      </div>
    </div>
    <!-- Detail Dialog -->
    <el-dialog v-model="showDetail" :title="currentMsg.title" width="560px">
      <div style="font:var(--fs-body);color:#374151;line-height:1.8">{{ currentMsg.content }}</div>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import request from '../../utils/request';
import dayjs from 'dayjs';

const typeLabelMap: Record<number, string> = { 1: '系统通知', 2: '运营公告', 3: '收益提醒', 4: '异常告警' };
const typeTagMap: Record<number, string> = { 1: 'info', 2: '', 3: 'success', 4: 'danger' };

const loading = ref(false);
const tableData = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const filter = reactive({ type: null as number | null });

const showDetail = ref(false);
const currentMsg = reactive({ title: '', content: '' });

const formatTime = (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '--';

const fetchList = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (filter.type) params.type = filter.type;
    const res: any = await request.get('/api/v1/console/message/list', { params });
    tableData.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } catch { /* ignore */ } finally { loading.value = false; }
};

const handleRead = async (row: any) => {
  Object.assign(currentMsg, { title: row.title, content: row.content });
  showDetail.value = true;
  if (!row.is_read) {
    try { await request.put(`/api/v1/console/message/${row.id}/read`); row.is_read = 1; } catch { /* ignore */ }
  }
};

const markAllRead = async () => {
  try { await request.put('/api/v1/console/message/read-all'); ElMessage.success('已全部标记已读'); fetchList(); } catch { /* ignore */ }
};

import { ElMessage } from 'element-plus';

onMounted(fetchList);
</script>
