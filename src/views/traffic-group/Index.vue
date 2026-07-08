<template>
  <div class="page-shell">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><Filter /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">流量分组</h1>
          <p class="page-header-subtitle">按规则将流量分配到不同瀑布流配置</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button type="primary" :icon="Plus" @click="openCreate">创建分组</el-button>
      </div>
    </div>
    <div class="page-filter">
      <el-form :inline="true" :model="filter" class="page-filter-form" @submit.prevent>
        <el-form-item label="广告位">
          <el-select v-model="filter.placementId" placeholder="全部广告位" clearable @change="onSearch">
            <el-option v-for="p in placementList" :key="p.placement_id" :label="`${p.name} (${p.placement_id})`" :value="p.placement_id" />
          </el-select>
        </el-form-item>
        <el-form-item label="瀑布流">
          <el-select v-model="filter.waterfallId" placeholder="全部瀑布流" clearable @change="onSearch">
            <el-option v-for="w in waterfallList" :key="w.waterfall_id" :label="`${w.name} (${w.waterfall_id})`" :value="w.waterfall_id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部" clearable @change="onSearch">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filter.keyword" placeholder="搜索分组名称" clearable @keyup.enter="onSearch" @clear="onSearch" />
        </el-form-item>
      </el-form>
      <div class="page-filter-actions">
        <el-button @click="onReset">重置</el-button>
        <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
      </div>
    </div>
    <div class="page-card">
      <div class="page-table-wrap"><el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="group_name" label="分组名称" min-width="140" />
        <el-table-column prop="placement_id" label="广告位" min-width="180" />
        <el-table-column prop="waterfall_id" label="绑定瀑布流" min-width="200">
          <template #default="{ row }">
            <span v-if="row.waterfall_id" class="status-tag status-tag--pending">{{ waterfallMap.get(row.waterfall_id) || row.waterfall_id }}</span>
            <span v-else class="text-muted">--</span>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" />
        <el-table-column prop="conditions" label="规则" min-width="240">
          <template #default="{ row }">{{ formatConditions(row.conditions) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <span class="status-tag" :class="row.status === 1 ? 'status-tag--active' : 'status-tag--paused'">{{ row.status === 1 ? '启用' : '禁用' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div class="cell-actions"><el-button link type="primary" @click="handleEdit(row)">编辑</el-button><el-button link type="danger" @click="handleDelete(row)">删除</el-button></div>
          </template>
        </el-table-column>
      </el-table></div>
    </div>
    <!-- Dialog -->
    <el-dialog v-model="showDialog" :title="editForm.id ? '编辑分组' : '创建分组'" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="editForm" :rules="formRules" label-position="top">
        <el-form-item label="广告位" prop="placement_id">
          <el-select v-model="editForm.placement_id" placeholder="请选择广告位" style="width: 100%">
            <el-option v-for="p in placementList" :key="p.placement_id" :label="`${p.name}`" :value="p.placement_id" />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定瀑布流" prop="waterfall_id">
          <el-select v-model="editForm.waterfall_id" placeholder="选择要绑定的瀑布流" clearable filterable style="width: 100%">
            <el-option v-for="w in waterfallList" :key="w.waterfall_id" :label="`${w.name} (${w.waterfall_id})`" :value="w.waterfall_id" />
          </el-select>
          <div class="form-tip">绑定后，该分组匹配的流量会使用此瀑布流配置</div>
        </el-form-item>
        <el-form-item label="分组名称" prop="group_name">
          <el-input v-model="editForm.group_name" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="editForm.priority" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="规则条件">
          <div v-for="(cond, idx) in editForm.conditions" :key="idx" style="display:flex;gap:8px;margin-bottom:8px;width:100%">
            <el-select v-model="cond.dimension" placeholder="维度" style="width:120px">
              <el-option v-for="d in dimensions" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
            <el-select v-model="cond.operator" placeholder="操作" style="width:100px">
              <el-option v-for="o in operators" :key="o" :label="o" :value="o" />
            </el-select>
            <el-input v-model="cond.value" placeholder="值(多个逗号分隔)" style="flex:1" />
            <el-button link type="danger" @click="editForm.conditions.splice(idx, 1)"><el-icon><Delete /></el-icon></el-button>
          </div>
          <el-button type="primary" link @click="editForm.conditions.push({ dimension: '', operator: 'IN', value: '' })">+ 添加规则</el-button>
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

const dimensions = [
  { value: 'country', label: '国家/地区' },
  { value: 'region', label: '省份/城市' },
  { value: 'network_type', label: '网络类型' },
  { value: 'app_version', label: 'APP版本' },
  { value: 'sdk_version', label: 'SDK版本' },
  { value: 'os_version', label: '系统版本' },
  { value: 'device_type', label: '设备类型' },
  { value: 'brand', label: '设备品牌' },
  { value: 'channel', label: '渠道' },
];
const operators = ['IN', 'NOT_IN', 'EQ', 'GTE', 'LTE'];

const loading = ref(false);
const tableData = ref<any[]>([]);
const placementList = ref<any[]>([]);
const filter = reactive({ placementId: '', waterfallId: '', status: '', keyword: '' });
const onSearch = () => { page.value = 1; fetchList(); };
const onReset = () => { filter.placementId = ''; filter.waterfallId = ''; filter.status = ''; filter.keyword = ''; page.value = 1; fetchList(); };

const showDialog = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const defaultForm = { id: 0, placement_id: '', group_name: '', priority: 0, conditions: [] as { dimension: string; operator: string; value: string }[] };
const editForm = reactive({ ...defaultForm });

const formRules: FormRules = {
  placement_id: [{ required: true, message: '请选择广告位', trigger: 'change' }],
  group_name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
};

const formatConditions = (conditions: any[]) => {
  if (!conditions || !conditions.length) return '--';
  return conditions.map((c: any) => `${c.dimension} ${c.operator} ${c.value}`).join(' AND ');
};

const fetchPlacements = async () => {
  try { const res: any = await request.get('/api/v1/console/placement/list', { params: { pageSize: 200 } }); placementList.value = res.data?.list || []; } catch { /* ignore */ }
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filter.placementId) params.placementId = filter.placementId;
    if (filter.waterfallId) params.waterfallId = filter.waterfallId;
    if (filter.status !== '') params.status = filter.status;
    if (filter.keyword.trim()) params.keyword = filter.keyword.trim();
    const res: any = await request.get('/api/v1/console/traffic-group/list', { params });
    tableData.value = res.data?.list || [];
  } catch { /* ignore */ } finally { loading.value = false; }
};

const openCreate = () => { Object.assign(editForm, { ...defaultForm, conditions: [] }); showDialog.value = true; };

const handleEdit = (row: any) => {
  Object.assign(editForm, {
    id: row.id, placement_id: row.placement_id, group_name: row.group_name,
    priority: row.priority, conditions: row.conditions?.length ? row.conditions : [],
  });
  showDialog.value = true;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    if (editForm.id) {
      await request.put(`/api/v1/console/traffic-group/${editForm.id}`, editForm);
      ElMessage.success('更新成功');
    } else {
      await request.post('/api/v1/console/traffic-group/create', editForm);
      ElMessage.success('创建成功');
    }
    showDialog.value = false;
    fetchList();
  } catch { /* ignore */ } finally { submitting.value = false; }
};

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定删除分组"${row.group_name}"吗？`, '警告', { type: 'error' });
  try { await request.delete(`/api/v1/console/traffic-group/${row.id}`); ElMessage.success('删除成功'); fetchList(); } catch { /* ignore */ }
};

onMounted(() => { fetchPlacements(); fetchList(); });
</script>
