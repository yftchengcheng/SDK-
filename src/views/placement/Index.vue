<template>
  <div class="page-container">
    <div class="page-header">
      <h1>广告位管理</h1>
      <el-button type="primary" @click="openCreate">创建广告位</el-button>
    </div>
    <!-- Filter -->
    <div class="filter-card">
      <el-form :inline="true" :model="filter">
        <el-form-item label="应用">
          <el-select v-model="filter.appKey" placeholder="全部应用" clearable style="width: 200px" @change="fetchList">
            <el-option v-for="a in appList" :key="a.app_key" :label="a.app_name" :value="a.app_key" />
          </el-select>
        </el-form-item>
        <el-form-item label="广告格式">
          <el-select v-model="filter.format" placeholder="全部格式" clearable style="width: 140px" @change="fetchList">
            <el-option v-for="f in formatOptions" :key="f.value" :label="f.label" :value="f.value" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <!-- Table -->
    <div class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="placement_id" label="Placement ID" min-width="200">
          <template #default="{ row }">
            <span class="text-primary">{{ row.placement_id }}</span>
            <el-icon class="copy-btn" @click="copyText(row.placement_id)"><CopyDocument /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="广告位名称" min-width="140" />
        <el-table-column prop="app_name" label="所属应用" min-width="120" />
        <el-table-column prop="format" label="广告格式" width="100">
          <template #default="{ row }">{{ formatLabel(row.format) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link :type="row.status === 1 ? 'warning' : 'success'" size="small" @click="handleToggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next" @change="fetchList" />
      </div>
    </div>
    <!-- Dialog -->
    <el-dialog v-model="showDialog" :title="editForm.id ? '编辑广告位' : '创建广告位'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="editForm" :rules="formRules" label-position="top">
        <el-form-item label="所属应用" prop="app_key">
          <el-select v-model="editForm.app_key" placeholder="请选择应用" style="width: 100%" :disabled="!!editForm.id">
            <el-option v-for="a in appList" :key="a.app_key" :label="a.app_name" :value="a.app_key" />
          </el-select>
        </el-form-item>
        <el-form-item label="广告位名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入广告位名称" />
        </el-form-item>
        <el-form-item label="广告格式" prop="format">
          <el-select v-model="editForm.format" placeholder="请选择广告格式" style="width: 100%" :disabled="!!editForm.id">
            <el-option v-for="f in formatOptions" :key="f.value" :label="f.label" :value="f.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import request from '../../utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import dayjs from 'dayjs';

const formatOptions = [
  { value: 1, label: 'Banner' },
  { value: 2, label: '插屏' },
  { value: 3, label: '激励视频' },
  { value: 4, label: '原生' },
  { value: 5, label: '开屏' },
];

const formatLabel = (v: number) => formatOptions.find(f => f.value === v)?.label || '--';
const formatTime = (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '--';
const copyText = (text: string) => navigator.clipboard.writeText(text).then(() => ElMessage.success('已复制'));

const loading = ref(false);
const tableData = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const appList = ref<any[]>([]);
const filter = reactive({ appKey: '', format: null as number | null });

const showDialog = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const defaultForm = { id: 0, app_key: '', name: '', format: null as number | null };
const editForm = reactive({ ...defaultForm });

const formRules: FormRules = {
  app_key: [{ required: true, message: '请选择应用', trigger: 'change' }],
  name: [{ required: true, message: '请输入广告位名称', trigger: 'blur' }],
  format: [{ required: true, message: '请选择广告格式', trigger: 'change' }],
};

const fetchApps = async () => {
  try { const res: any = await request.get('/api/v1/console/app/list', { params: { pageSize: 200 } }); appList.value = res.data?.list || []; } catch { /* ignore */ }
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (filter.appKey) params.appKey = filter.appKey;
    if (filter.format) params.format = filter.format;
    const res: any = await request.get('/api/v1/console/placement/list', { params });
    tableData.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } catch { /* ignore */ } finally { loading.value = false; }
};

const openCreate = () => {
  Object.assign(editForm, defaultForm);
  showDialog.value = true;
};

const handleEdit = (row: any) => {
  Object.assign(editForm, { id: row.id, app_key: row.app_key, name: row.name, format: row.format });
  showDialog.value = true;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    if (editForm.id) {
      await request.put(`/api/v1/console/placement/${editForm.id}`, editForm);
      ElMessage.success('更新成功');
    } else {
      await request.post('/api/v1/console/placement/create', editForm);
      ElMessage.success('创建成功');
    }
    showDialog.value = false;
    fetchList();
  } catch { /* ignore */ } finally { submitting.value = false; }
};

const handleToggleStatus = async (row: any) => {
  const newStatus = row.status === 1 ? 2 : 1;
  await ElMessageBox.confirm(`确定${newStatus === 2 ? '禁用' : '启用'}广告位"${row.name}"吗？`, '提示', { type: 'warning' });
  try { await request.put(`/api/v1/console/placement/${row.id}/status`, { status: newStatus }); ElMessage.success('操作成功'); fetchList(); } catch { /* ignore */ }
};

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定删除广告位"${row.name}"吗？`, '警告', { type: 'error' });
  try { await request.delete(`/api/v1/console/placement/${row.id}`); ElMessage.success('删除成功'); fetchList(); } catch { /* ignore */ }
};

onMounted(() => { fetchApps(); fetchList(); });
</script>
