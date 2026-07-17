<template>
  <div class="page-shell">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><Bell /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">消息中心</h1>
          <p class="page-header-subtitle">系统通知、运营公告、收益提醒与异常告警</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button @click="markAllRead">全部已读</el-button>
      </div>
    </div>
    <div class="page-section-card">
      <div class="page-card"><div class="page-filter">
        <el-form :inline="true" :model="filter" class="page-filter-form" @submit.prevent>
          <el-form-item label="消息类型">
            <el-select v-model="filter.type" placeholder="全部" clearable @change="onSearch">
              <el-option label="系统通知" :value="1" />
              <el-option label="运营公告" :value="2" />
              <el-option label="收益提醒" :value="3" />
              <el-option label="异常告警" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filter.isRead" placeholder="全部" clearable @change="onSearch">
              <el-option label="未读" :value="0" />
              <el-option label="已读" :value="1" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="filter.keyword" placeholder="搜索消息标题" clearable @keyup.enter="onSearch" @clear="onSearch" />
          </el-form-item>
        </el-form>
        <div class="page-filter-actions">
          <el-button @click="onReset">重置</el-button>
          <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
        </div>
      </div></div>
      <div class="page-card">
        <div class="page-table-wrap"><el-table :data="tableData" v-loading="loading" stripe style="width: 100%" align="center" header-align="center">
        <el-table-column prop="is_read" label="" width="40" align="center" header-align="center">
          <template #default="{ row }">
            <span v-if="!row.is_read" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#DC2626"></span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="240" align="center" header-align="center">
          <template #default="{ row }">
            <span :class="{ 'text-secondary': row.is_read }" style="cursor:pointer" @click="handleRead(row)">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120" align="center" header-align="center">
          <template #default="{ row }">
            <span class="status-tag" :class="{
                'status-tag--info': row.type === 1,
                'status-tag--pending': row.type === 2,
                'status-tag--active': row.type === 3,
                'status-tag--error': row.type === 4,
                'status-tag--neutral': ![1,2,3,4].includes(row.type)
              }">{{ messageTypeLabel(row.type) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="170" align="center" header-align="center">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" header-align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleRead(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div><TablePagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      @change="fetchList" />
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
import TablePagination from '@/components/TablePagination.vue';
import request from '../../utils/request';
import dayjs from 'dayjs';
import { Bell, Search } from '@element-plus/icons-vue';
import { messageTypeLabel } from '../../shared/enum-labels';

const typeTagMap: Record<number, string> = { 1: 'info', 2: '', 3: 'success', 4: 'danger' };

const loading = ref(false);
const tableData = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const filter = reactive({ type: null as number | null, isRead: null as number | null, keyword: '' });

const onSearch = () => { page.value = 1; fetchList(); };
const onReset = () => { filter.type = null; filter.isRead = null; filter.keyword = ''; page.value = 1; fetchList(); };

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
  } catch (err: any) {
    // 不再静默吞错：清空列表 + 提示错误（避免页面"没了"却无任何反馈）
    tableData.value = [];
    total.value = 0;
    // axios 拦截器已经弹过 ElMessage；这里只在拦截器没弹（silent 模式）时再补一次
    console.error('[message] fetchList failed:', err?.message || err);
  } finally { loading.value = false; }
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
