<template>
  <div class="page-container">
    <div class="page-header">
      <h1>应用管理</h1>
      <el-button type="primary" @click="showCreateDialog = true">创建应用</el-button>
    </div>
    <!-- Table -->
    <div class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="app_name" label="应用名称" min-width="140" />
        <el-table-column prop="app_key" label="App Key" min-width="200">
          <template #default="{ row }">
            <span class="text-primary">{{ row.app_key }}</span>
            <el-icon class="copy-btn" @click="copyText(row.app_key)"><CopyDocument /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="platform" label="平台" width="100">
          <template #default="{ row }">{{ row.platform === 1 ? 'Android' : 'iOS' }}</template>
        </el-table-column>
        <el-table-column prop="package_name" label="包名" min-width="160" />
        <el-table-column prop="category" label="分类" width="100" />
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
    <!-- Create/Edit Dialog -->
    <el-dialog v-model="showCreateDialog" :title="editForm.id ? '编辑应用' : '创建应用'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="editForm" :rules="formRules" label-position="top">
        <el-form-item label="应用名称" prop="app_name">
          <el-input v-model="editForm.app_name" placeholder="请输入应用名称" />
        </el-form-item>
        <el-form-item label="包名" prop="package_name">
          <el-input v-model="editForm.package_name" placeholder="Android包名或iOS Bundle ID" />
        </el-form-item>
        <el-form-item label="平台" prop="platform">
          <el-radio-group v-model="editForm.platform">
            <el-radio :value="1">Android</el-radio>
            <el-radio :value="2">iOS</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="应用分类" prop="category">
          <el-select v-model="editForm.category" placeholder="请选择分类" clearable style="width: 100%">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
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

const categories = ['游戏', '工具', '社交', '电商', '教育', '娱乐', '其他'];
const loading = ref(false);
const tableData = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const showCreateDialog = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

const defaultForm = { id: 0, app_name: '', package_name: '', platform: 1, category: '' };
const editForm = reactive({ ...defaultForm });

const formRules: FormRules = {
  app_name: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  package_name: [{ required: true, message: '请输入包名', trigger: 'blur' }],
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
};

const formatTime = (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '--';

const copyText = (text: string) => {
  navigator.clipboard.writeText(text).then(() => ElMessage.success('已复制'));
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res: any = await request.get('/api/v1/console/app/list', { params: { page: page.value, pageSize: pageSize.value } });
    tableData.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } catch { /* ignore */ } finally {
    loading.value = false;
  }
};

const handleEdit = (row: any) => {
  Object.assign(editForm, { id: row.id, app_name: row.app_name, package_name: row.package_name, platform: row.platform, category: row.category || '' });
  showCreateDialog.value = true;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    if (editForm.id) {
      await request.put(`/api/v1/console/app/${editForm.id}`, editForm);
      ElMessage.success('更新成功');
    } else {
      await request.post('/api/v1/console/app/create', editForm);
      ElMessage.success('创建成功');
    }
    showCreateDialog.value = false;
    Object.assign(editForm, defaultForm);
    fetchList();
  } catch { /* ignore */ } finally {
    submitting.value = false;
  }
};

const handleToggleStatus = async (row: any) => {
  const newStatus = row.status === 1 ? 2 : 1;
  const action = newStatus === 2 ? '禁用' : '启用';
  await ElMessageBox.confirm(`确定${action}应用"${row.app_name}"吗？`, '提示', { type: 'warning' });
  try {
    await request.put(`/api/v1/console/app/${row.id}/status`, { status: newStatus });
    ElMessage.success(`${action}成功`);
    fetchList();
  } catch { /* ignore */ }
};

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定删除应用"${row.app_name}"吗？此操作不可恢复。`, '警告', { type: 'error' });
  try {
    await request.delete(`/api/v1/console/app/${row.id}`);
    ElMessage.success('删除成功');
    fetchList();
  } catch { /* ignore */ }
};

onMounted(fetchList);
</script>
