<template>
  <div class="page-shell">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><Connection /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">广告源管理</h1>
          <p class="page-header-subtitle">管理接入的广告网络代码位与三方账号映射</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button @click="openCustomCreate">创建自定义广告源</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">创建标准广告源</el-button>
      </div>
    </div>
    <!-- Filter -->
    <div class="page-filter">
      <el-form :inline="true" :model="filter" class="page-filter-form" @submit.prevent>
        <el-form-item label="广告网络">
          <el-select v-model="filter.networkCode" placeholder="全部网络" clearable @change="onSearch">
            <el-option v-for="n in networks" :key="n.network_code" :label="n.network_name" :value="n.network_code" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部" clearable @change="onSearch">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filter.keyword" placeholder="搜索名称 / 三方ID" clearable @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
      </el-form>
      <div class="page-filter-actions">
        <el-button @click="onReset">重置</el-button>
        <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
      </div>
    </div>
    <!-- Table -->
    <div class="page-card"><div class="page-table-wrap">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="source_name" label="广告源名称" min-width="160" />
        <el-table-column prop="network_name" label="广告网络" width="120" />
        <el-table-column prop="third_app_id" label="三方App ID" min-width="160" />
        <el-table-column prop="third_placement_id" label="三方代码位ID" min-width="160" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <span class="status-tag" :class="row.status === 1 ? 'status-tag--active' : 'status-tag--paused'">{{ row.status === 1 ? '启用' : '禁用' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div><div class="page-pagination">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next" @change="fetchList" />
      </div>
    </div>
    <!-- Dialog -->
    <el-dialog v-model="showDialog" :title="editForm.id ? '编辑广告源' : '创建广告源'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="editForm" :rules="formRules" label-position="top">
        <div class="dialog-section">
          <div class="dialog-section-title">基础信息</div>
          <div class="dialog-form-row">
            <el-form-item label="广告网络" prop="network_code">
              <el-select v-model="editForm.network_code" placeholder="请选择广告网络" style="width: 100%">
                <el-option v-for="n in networks" :key="n.network_code" :label="n.network_name" :value="n.network_code" />
              </el-select>
            </el-form-item>
            <el-form-item label="广告源名称" prop="source_name">
              <el-input v-model="editForm.source_name" placeholder="如：穿山甲-激励视频-主" />
            </el-form-item>
          </div>
        </div>
        <div class="dialog-section">
          <div class="dialog-section-title">平台凭证</div>
          <div class="dialog-form-row">
            <el-form-item label="三方 App ID" prop="third_app_id">
              <el-input v-model="editForm.third_app_id" placeholder="在广告平台注册的应用ID" />
            </el-form-item>
            <el-form-item label="三方代码位 ID" prop="third_placement_id">
              <el-input v-model="editForm.third_placement_id" placeholder="在广告平台申请的代码位ID" />
            </el-form-item>
          </div>
          <div class="dialog-form-row dialog-form-row--full" style="padding-top: 0;">
            <el-form-item label="额外配置">
              <el-input v-model="editForm.extra" type="textarea" :rows="3" placeholder="JSON格式，各平台特殊参数（选填）" />
              <div class="dialog-form-help">支持各广告网络特有的高级参数，如超时、底价、用户定向等</div>
            </el-form-item>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 自定义广告源 Dialog -->
    <el-dialog v-model="showCustomDialog" title="创建自定义广告源" width="560px" destroy-on-close>
      <div class="dialog-form-info" style="margin-bottom: 12px;">
        <el-icon><InfoFilled /></el-icon>
        <span>请先在「广告网络管理 → 自定义网络」中创建 Adapter 并通过审核，再来此处绑定。</span>
      </div>
      <el-form ref="customFormRef" :model="customForm" :rules="customFormRules" label-position="top">
        <div class="dialog-section">
          <div class="dialog-section-title">基础信息</div>
          <div class="dialog-form-row">
            <el-form-item label="自定义网络" prop="networkDefId">
              <el-select v-model="customForm.networkDefId" placeholder="请选择已通过审核的自定义网络" style="width: 100%" filterable>
                <el-option v-for="n in customNetworks" :key="n.id" :label="`${n.network_name} (${n.network_code})`" :value="n.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="广告源名称" prop="source_name">
              <el-input v-model="customForm.source_name" placeholder="如：自定义-激励视频-主" />
            </el-form-item>
          </div>
        </div>
        <div class="dialog-section">
          <div class="dialog-section-title">平台凭证</div>
          <div class="dialog-form-row">
            <el-form-item label="自定义网络 App ID" prop="third_app_id">
              <el-input v-model="customForm.third_app_id" placeholder="在自定义网络申请的 App ID" />
            </el-form-item>
            <el-form-item label="自定义网络 代码位 ID" prop="third_placement_id">
              <el-input v-model="customForm.third_placement_id" placeholder="在自定义网络申请的代码位 ID" />
            </el-form-item>
          </div>
          <div class="dialog-form-row dialog-form-row--full" style="padding-top: 0;">
            <el-form-item label="额外配置">
              <el-input v-model="customForm.extra" type="textarea" :rows="3" placeholder="JSON 格式，自定义网络特殊参数（选填）" />
              <div class="dialog-form-help">支持自定义网络特有的高级参数</div>
            </el-form-item>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showCustomDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCustomSubmit">确定</el-button>
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
import { Plus, Connection, Search, InfoFilled } from '@element-plus/icons-vue';

const formatTime = (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '--';

const loading = ref(false);
const tableData = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const networks = ref<any[]>([]);
const filter = reactive({ networkCode: '', status: '', keyword: '' });

const onSearch = () => {
  page.value = 1;
  fetchList();
};

const onReset = () => {
  filter.networkCode = '';
  filter.status = '';
  filter.keyword = '';
  page.value = 1;
  fetchList();
};

const showDialog = ref(false);
const showCustomDialog = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const customFormRef = ref<FormInstance>();
const defaultForm = { id: 0, network_code: '', source_name: '', third_app_id: '', third_placement_id: '', extra: '' };
const editForm = reactive({ ...defaultForm });
const customForm = reactive<{ networkDefId: number | ''; sourceName: string; thirdAppId: string; thirdPlacementId: string; extra: string; appId: string; placementId: string }>({ networkDefId: '', sourceName: '', thirdAppId: '', thirdPlacementId: '', extra: '', appId: '', placementId: '' });
const customNetworks = ref<Array<{ id: number; network_name: string; network_code: string }>>([]);

const formRules: FormRules = {
  network_code: [{ required: true, message: '请选择广告网络', trigger: 'change' }],
  source_name: [{ required: true, message: '请输入广告源名称', trigger: 'blur' }],
  third_app_id: [{ required: true, message: '请输入三方App ID', trigger: 'blur' }],
  third_placement_id: [{ required: true, message: '请输入三方代码位ID', trigger: 'blur' }],
};
const customFormRules: FormRules = {
  networkDefId: [{ required: true, message: '请选择自定义广告网络', trigger: 'change' }],
  source_name: [{ required: true, message: '请输入广告源名称', trigger: 'blur' }],
  third_app_id: [{ required: true, message: '请输入三方App ID', trigger: 'blur' }],
  third_placement_id: [{ required: true, message: '请输入三方代码位ID', trigger: 'blur' }],
};

const fetchCustomNetworks = async () => {
  try {
    const res: any = await request.get('/api/v1/console/network/custom/list', { params: { page: 1, pageSize: 100 } });
    customNetworks.value = res.data?.list || [];
  } catch { /* ignore */ }
};

const fetchNetworks = async () => {
  try { const res: any = await request.get('/api/v1/console/network/list'); networks.value = res.data?.list || []; } catch { /* ignore */ }
};

const _orig_fetchList = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (filter.networkCode) params.networkCode = filter.networkCode;
    const res: any = await request.get('/api/v1/console/ad-source/list', { params });
    tableData.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } catch { /* ignore */ } finally { loading.value = false; }
};

const openCreate = () => { Object.assign(editForm, defaultForm); showDialog.value = true; };
const openCustomCreate = () => {
  Object.assign(customForm, { network_def_id: '', source_name: '', third_app_id: '', third_placement_id: '', extra: '' });
  showCustomDialog.value = true;
};

const handleCustomSubmit = async () => {
  const valid = await customFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    const payload: any = { ...customForm };
    if (payload.extra) { try { payload.extra = JSON.parse(payload.extra); } catch { payload.extra = {}; } }
    else { payload.extra = {}; }
    await request.post('/api/v1/console/ad-source/create-custom', payload);
    ElMessage.success('创建成功');
    showCustomDialog.value = false;
    fetchList();
  } catch { /* ignore */ } finally { submitting.value = false; }
};

const handleEdit = (row: any) => {
  Object.assign(editForm, {
    id: row.id, network_code: row.network_code, source_name: row.source_name,
    third_app_id: row.third_app_id, third_placement_id: row.third_placement_id,
    extra: row.extra ? JSON.stringify(row.extra) : '',
  });
  showDialog.value = true;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    const payload: any = { ...editForm };
    if (payload.extra) { try { payload.extra = JSON.parse(payload.extra); } catch { payload.extra = {}; } }
    else { payload.extra = {}; }
    if (editForm.id) {
      await request.put(`/api/v1/console/ad-source/${editForm.id}`, payload);
      ElMessage.success('更新成功');
    } else {
      await request.post('/api/v1/console/ad-source/create', payload);
      ElMessage.success('创建成功');
    }
    showDialog.value = false;
    fetchList();
  } catch { /* ignore */ } finally { submitting.value = false; }
};

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定删除广告源"${row.source_name}"吗？`, '警告', { type: 'error' });
  try { await request.delete(`/api/v1/console/ad-source/${row.id}`); ElMessage.success('删除成功'); fetchList(); } catch { /* ignore */ }
};

onMounted(() => { fetchNetworks(); fetchList(); });
</script>
