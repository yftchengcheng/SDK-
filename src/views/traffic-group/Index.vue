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
        <el-table-column prop="group_name" label="分组名称" min-width="160">
          <template #default="{ row }">
            <div class="cell-stack">
              <div class="cell-stack-line1">
                <el-icon v-if="row.is_default" class="cell-default-icon"><Lock /></el-icon>
                <span :class="['cell-group-name', { 'cell-group-name--default': row.is_default }]">{{ row.group_name }}</span>
                <el-tag v-if="row.is_default" size="small" effect="plain" type="info">默认分组</el-tag>
                <el-tag v-else-if="row.is_system" size="small" effect="plain" type="info">系统</el-tag>
              </div>
              <div v-if="row.is_default" class="cell-stack-line2">不可删除 / 不可编辑，系统预置分组</div>
            </div>
          </template>
        </el-table-column>
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
            <div class="cell-actions">
              <el-button v-if="!row.is_default && !row.is_locked" link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button v-if="!row.is_default && !row.is_locked" link type="danger" @click="handleDelete(row)">删除</el-button>
              <span v-if="row.is_default || row.is_locked" class="text-muted">系统保护</span>
            </div>
          </template>
        </el-table-column>
      </el-table></div>
    </div>
    <!-- Drawer: Create / Edit Traffic Group（侧边抽屉，保留列表上下文） -->
    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      :size="drawerSize"
      :with-header="false"
      :destroy-on-close="false"
      :append-to-body="true"
      :modal="true"
      :modal-class="'page-form-drawer-mask'"
      class="page-form-drawer"
    >
      <div class="page-form-shell page-form-drawer-shell">
        <header class="page-form-header">
          <div class="page-form-header-titles">
            <h1 class="page-form-header-title">
              <el-icon :size="20" style="color: var(--color-primary-500, #2563EB);">
                <component :is="isEdit ? Edit : Plus" />
              </el-icon>
              <span>{{ isEdit ? '编辑分组' : '创建分组' }}</span>
              <el-tag v-if="isEdit" type="warning" effect="light" size="small">编辑模式</el-tag>
            </h1>
            <p class="page-form-header-subtitle">
              {{ isEdit ? '修改流量分组规则，保存后立即生效' : '为广告位配置流量分组与匹配规则' }}
            </p>
          </div>
          <div class="page-form-header-actions">
            <el-button :icon="RefreshLeft" @click="onFormReset">重置</el-button>
            <el-button :icon="Close" circle plain @click="closeDrawer" />
          </div>
        </header>

        <div class="page-form-body">
          <el-form
            ref="formRef"
            :model="editForm"
            :rules="formRules"
            label-position="top"
            @submit.prevent
          >
            <!-- 区块 1：基础信息 -->
            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title">
                  <el-icon><InfoFilled /></el-icon>
                  <span>基础信息</span>
                </h2>
              </div>
              <p class="page-form-section-desc">分组所属广告位、名称与优先级</p>

              <div class="page-form-grid">
                <el-form-item label="广告位" prop="placement_id">
                  <template #label><span class="required-mark">*</span><span>广告位</span></template>
                  <el-select v-model="editForm.placement_id" placeholder="请选择广告位" style="width: 100%">
                    <el-option v-for="p in placementList" :key="p.placement_id" :label="p.name" :value="p.placement_id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="分组名称" prop="group_name">
                  <template #label><span class="required-mark">*</span><span>分组名称</span></template>
                  <el-input v-model="editForm.group_name" placeholder="请输入分组名称" />
                </el-form-item>
                <el-form-item label="绑定瀑布流" prop="waterfall_id" class="span-2">
                  <el-select v-model="editForm.waterfall_id" placeholder="选择要绑定的瀑布流" clearable filterable style="width: 100%">
                    <el-option v-for="w in waterfallList" :key="w.waterfall_id" :label="`${w.name} (${w.waterfall_id})`" :value="w.waterfall_id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="优先级" prop="priority" class="span-2">
                  <el-input-number v-model="editForm.priority" :min="0" :max="999" style="width: 100%" />
                  <div class="form-help">数字越大优先级越高，匹配时优先命中</div>
                </el-form-item>
              </div>
            </section>

            <!-- 区块 2：规则条件 -->
            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title">
                  <el-icon><Filter /></el-icon>
                  <span>规则条件</span>
                </h2>
                <span class="page-form-section-tag">所有条件同时满足时命中此分组</span>
              </div>

              <div class="page-form-grid">
                <el-form-item label="匹配规则" class="span-2">
                  <template #label><span>匹配规则</span></template>
                  <div class="tg-condition-list">
                    <div v-for="(cond, idx) in editForm.conditions" :key="idx" class="tg-condition-row">
                      <el-select v-model="cond.dimension" placeholder="维度" style="width: 140px">
                        <el-option v-for="d in dimensions" :key="d.value" :label="d.label" :value="d.value" />
                      </el-select>
                      <el-select v-model="cond.operator" placeholder="操作" style="width: 120px">
                        <el-option v-for="o in operators" :key="o" :label="o" :value="o" />
                      </el-select>
                      <el-input v-model="cond.value" placeholder="值(多个逗号分隔)" style="flex: 1" />
                      <el-button link type="danger" :icon="Delete" @click="editForm.conditions.splice(idx, 1)" />
                    </div>
                    <el-button type="primary" link :icon="Plus" @click="editForm.conditions.push({ dimension: '', operator: 'IN', value: '' })">添加规则</el-button>
                  </div>
                </el-form-item>
              </div>
            </section>
          </el-form>
        </div>

        <footer class="page-form-footer">
          <div class="page-form-footer-left">
            <el-icon><InfoFilled /></el-icon>
            <span>带 * 为必填项</span>
          </div>
          <div class="page-form-footer-right">
            <el-button :icon="Close" @click="closeDrawer">取消</el-button>
            <el-button type="primary" :loading="submitting" :icon="Check" @click="handleSubmit">
              {{ isEdit ? '保存修改' : '创建分组' }}
            </el-button>
          </div>
        </footer>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import request from '../../utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { Plus, Search, RefreshLeft, Delete, Filter, Edit, InfoFilled, Close, Check, Lock } from '@element-plus/icons-vue';

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

const drawerVisible = ref(false);
const drawerSize = '720px';
const isEdit = ref(false);
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
    const list = res.data?.list || [];
    // 默认分组（is_default=true）始终排在最前
    list.sort((a: any, b: any) => {
      if (a.is_default === true && b.is_default !== true) return -1;
      if (b.is_default === true && a.is_default !== true) return 1;
      return (b.id || 0) - (a.id || 0);
    });
    tableData.value = list;
  } catch { /* ignore */ } finally { loading.value = false; }
};

const openCreate = () => { isEdit.value = false; Object.assign(editForm, { ...defaultForm, conditions: [] }); drawerVisible.value = true; };

const handleEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(editForm, {
    id: row.id, placement_id: row.placement_id, group_name: row.group_name,
    priority: row.priority, conditions: row.conditions?.length ? row.conditions : [],
  });
  drawerVisible.value = true;
};

const closeDrawer = () => { drawerVisible.value = false; };
const onFormReset = () => { Object.assign(editForm, { ...defaultForm, conditions: [] }); };

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
    drawerVisible.value = false;
    fetchList();
  } catch { /* ignore */ } finally { submitting.value = false; }
};

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定删除分组"${row.group_name}"吗？`, '警告', { type: 'error' });
  try { await request.delete(`/api/v1/console/traffic-group/${row.id}`); ElMessage.success('删除成功'); fetchList(); } catch { /* ignore */ }
};

onMounted(async () => {
  // 加载广告位列表后，默认选中第一个，让流量分组有归属上下文
  await fetchPlacements();
  const firstId = placementList.value[0]?.placement_id;
  if (firstId) {
    filter.placementId = firstId;
  }
  await fetchList();
});
</script>
