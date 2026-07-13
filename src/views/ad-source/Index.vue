<template>
  <div class="adsource-shell" data-hmr="v3-placement-fix-2026">
    <!-- 左侧：广告平台 + 应用列表 -->
    <aside class="adsource-side">
      <div class="adsource-side-platform">
        <div class="adsource-side-platform-row">
          <div class="adsource-side-platform-icon" :class="{ 'adsource-side-platform-icon--custom': entryMode === 'custom' }">
            <el-icon :size="18" color="#fff"><Connection /></el-icon>
          </div>
          <div class="adsource-side-platform-info">
            <div class="adsource-side-platform-name">{{ platformName || '广告源管理' }}</div>
            <div class="adsource-side-platform-sub">
              {{ entryMode === 'custom' ? '自定义广告平台' : '标准广告平台' }}
            </div>
          </div>
        </div>
      </div>

      <div class="adsource-side-apps">
        <div class="adsource-side-apps-title">应用列表</div>
        <el-input
          v-model="appSearch"
          placeholder="搜索应用名称/ID"
          clearable
          size="small"
          class="adsource-side-apps-search"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <div class="adsource-side-apps-list" v-loading="appsLoading">
          <div
            v-for="app in filteredApps"
            :key="app.id"
            class="adsource-side-app"
            :class="{ 'adsource-side-app--active': app.id === selectedAppId }"
            @click="onAppSelect(app)"
          >
            <div class="adsource-side-app-icon">
              <img v-if="app.iconUrlResolved" :src="app.iconUrlResolved" :alt="app.app_name" @error="onAppIconError($event)" />
              <el-icon v-else :size="16" color="#94A3B8"><Cellphone /></el-icon>
            </div>
            <div class="adsource-side-app-name">{{ app.app_name }}</div>
          </div>
          <div v-if="!appsLoading && filteredApps.length === 0" class="adsource-side-app--empty">
            暂无应用
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧：主区域 -->
    <main class="adsource-main">
      <header class="adsource-main-header">
        <div class="adsource-main-header-left">
          <div class="adsource-main-app">
            <span class="adsource-main-app-name">{{ selectedAppName || '请选择应用' }}</span>
            <el-button v-if="selectedAppId" link type="primary" size="small">
              <el-icon><Edit /></el-icon>
            </el-button>
          </div>
          <div v-if="entryMode === 'custom' && selectedNetworkId" class="adsource-main-context">
            <el-tag size="small" type="primary" effect="light">
              <el-icon><Filter /></el-icon>
              <span style="margin-left: 4px;">{{ platformName || '自定义广告平台' }}</span>
              <el-button link size="small" type="primary" style="margin-left: 6px;" @click="clearNetworkFilter">清除</el-button>
            </el-tag>
          </div>
        </div>
        <div class="adsource-main-header-right">
          <el-select
            v-model="selectedPlacementId"
            placeholder="请选择广告位"
            clearable
            filterable
            style="width: 200px"
            :disabled="!selectedAppId"
            @change="onPlacementChange"
          >
            <el-option
              v-for="p in placements"
              :key="p.id"
              :label="`${p.name}（${formatPlacementType(p.format)}）`"
              :value="p.id"
            />
          </el-select>
          <el-button type="primary" :icon="Plus" :disabled="!selectedAppId" @click="openCreate">
            添加广告源
          </el-button>
        </div>
      </header>

      <div class="adsource-main-toolbar">
        <div class="adsource-main-toolbar-left">
          <el-dropdown @command="onBatchCommand" :disabled="!selectedRowIds.length">
            <el-button :disabled="!selectedRowIds.length">
              批量操作
              <el-icon style="margin-left: 4px"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="enable">启用</el-dropdown-item>
                <el-dropdown-item command="disable">禁用</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span v-if="selectedRowIds.length" class="adsource-main-toolbar-tip">已选 {{ selectedRowIds.length }} 项</span>
        </div>
        <div class="adsource-main-toolbar-right">
          <el-input
            v-model="filter.keyword"
            placeholder="搜索广告源ID或广告单元ID"
            clearable
            size="small"
            style="width: 240px"
            @keyup.enter="onSearch"
            @clear="onSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>
      </div>

      <div class="adsource-main-table">
        <el-table
          :data="tableData"
          v-loading="loading"
          stripe
          @selection-change="onSelectionChange"
          style="width: 100%"
        >
          <el-table-column type="selection" width="48" />
          <el-table-column prop="id" label="广告源ID" min-width="100" />
          <el-table-column prop="source_name" label="广告源名称" min-width="160" />
          <el-table-column label="参数" min-width="220">
            <template #default="{ row }">
              <code class="adsource-cell-json">{{ formatExtra(row) }}</code>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <span class="status-tag" :class="row.status === 1 ? 'status-tag--active' : 'status-tag--paused'">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="adsource-main-pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @current-change="fetchList"
            @size-change="fetchList"
          />
        </div>
      </div>
    </main>

    <!-- 创建/编辑抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      :size="drawerSize"
      :with-header="false"
      :destroy-on-close="false"
      :append-to-body="true"
      class="page-form-drawer"
    >
      <div class="page-form-shell page-form-drawer-shell">
        <header class="page-form-header">
          <div class="page-form-header-titles">
            <h1 class="page-form-header-title">
              <el-icon :size="20" style="color: var(--color-primary-500, #2563EB)">
                <component :is="isEdit ? Edit : Plus" />
              </el-icon>
              <span>{{ isEdit ? '编辑广告源' : '添加广告源' }}</span>
            </h1>
            <p class="page-form-header-subtitle">
              {{ isEdit ? '修改广告源信息，保存后立即生效' : '为当前应用与广告位添加广告源' }}
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
            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title"><el-icon><InfoFilled /></el-icon><span>基础信息</span></h2>
              </div>
              <div class="page-form-grid">
                <el-form-item label="广告源名称" prop="source_name" class="span-2">
                  <template #label><span class="required-mark">*</span><span>广告源名称</span></template>
                  <el-input v-model="editForm.source_name" placeholder="如：穿山甲-激励视频-主" />
                </el-form-item>
                <el-form-item label="所属应用" class="span-2">
                  <el-input :value="selectedAppName" disabled />
                </el-form-item>
                <el-form-item label="所属广告位" class="span-2">
                  <el-input :value="selectedPlacementName" disabled />
                </el-form-item>
              </div>
            </section>

            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title"><el-icon><Connection /></el-icon><span>广告平台凭证</span></h2>
              </div>
              <p class="page-form-section-desc">当前所属：{{ platformName || '自定义广告平台' }}</p>
              <div class="page-form-grid">
                <el-form-item label="三方 App ID" prop="third_app_id" class="span-2">
                  <template #label><span class="required-mark">*</span><span>三方 App ID</span></template>
                  <el-input v-model="editForm.third_app_id" placeholder="在广告平台注册的应用ID" />
                </el-form-item>
                <el-form-item label="三方代码位 ID" prop="third_placement_id" class="span-2">
                  <template #label><span class="required-mark">*</span><span>三方代码位 ID</span></template>
                  <el-input v-model="editForm.third_placement_id" placeholder="在广告平台申请的代码位ID" />
                </el-form-item>
                <el-form-item label="额外配置" class="span-2">
                  <el-input
                    v-model="editForm.extraText"
                    type="textarea"
                    :rows="3"
                    placeholder='JSON 格式，如 {"slot_id":"xxx"}'
                  />
                  <div class="form-help">支持各广告平台特有的高级参数</div>
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
              {{ isEdit ? '保存修改' : '创建广告源' }}
            </el-button>
          </div>
        </footer>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import request from '../../utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  Plus, Connection, Search, InfoFilled, Edit, RefreshLeft, Close, Check,
  Filter, Cellphone, ArrowDown,
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

// 入口模式：custom 来自 /network 的「广告源」按钮；standard 直接访问
const entryMode = ref<'custom' | 'standard'>('standard');
const selectedNetworkId = ref<number | null>(null);
const platformName = ref<string>('');

const loading = ref(false);
const tableData = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const selectedRowIds = ref<number[]>([]);

const appList = ref<any[]>([]);
const appsLoading = ref(false);
const selectedAppId = ref<number | null>(null);
const appSearch = ref('');

const placements = ref<any[]>([]);
const selectedPlacementId = ref<number | null>(null);

const filter = reactive({ keyword: '' });

const drawerVisible = ref(false);
const drawerSize = '720px';
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

const defaultForm = {
  id: 0 as number,
  source_name: '',
  third_app_id: '',
  third_placement_id: '',
  extraText: '',
};
const editForm = reactive({ ...defaultForm });

const formRules: FormRules = {
  source_name: [{ required: true, message: '请输入广告源名称', trigger: 'blur' }],
  third_app_id: [{ required: true, message: '请输入三方App ID', trigger: 'blur' }],
  third_placement_id: [{ required: true, message: '请输入三方代码位ID', trigger: 'blur' }],
};

const filteredApps = computed(() => {
  const kw = appSearch.value.trim().toLowerCase();
  if (!kw) return appList.value;
  return appList.value.filter(a =>
    String(a.app_name || '').toLowerCase().includes(kw) ||
    String(a.app_key || '').toLowerCase().includes(kw) ||
    String(a.id).includes(kw),
  );
});

const selectedAppName = computed(() => {
  const a = appList.value.find(x => x.id === selectedAppId.value);
  return a ? a.app_name : '';
});

const selectedPlacementName = computed(() => {
  const p = placements.value.find(x => x.id === selectedPlacementId.value);
  return p ? p.name : '';
});

const formatPlacementType = (t: number | string) => {
  const map: Record<string, string> = { 1: '横幅', 2: '插屏', 3: '激励视频', 4: '开屏', 5: '原生' };
  return map[String(t)] || `类型${t}`;
};

const formatExtra = (row: any) => {
  if (!row) return '';
  if (row.extra && typeof row.extra === 'object') {
    return JSON.stringify(row.extra);
  }
  if (typeof row.extra === 'string' && row.extra) {
    try { return JSON.stringify(JSON.parse(row.extra)); } catch { return row.extra; }
  }
  return '';
};

const onAppIconError = (e: Event) => {
  (e.target as HTMLImageElement).style.display = 'none';
};

const fetchApps = async () => {
  appsLoading.value = true;
  try {
    const res: any = await request.get('/api/v1/console/app/list', { params: { page: 1, pageSize: 200 } });
    appList.value = res.data?.list || [];
  } catch { /* ignore */ } finally { appsLoading.value = false; }
};

const fetchPlacements = async (appId: number) => {
  if (!appId) { placements.value = []; selectedPlacementId.value = null; return; }
  try {
    const res: any = await request.get('/api/v1/console/placement/list', { params: { appId, page: 1, pageSize: 200 } });
    placements.value = res.data?.list || [];
  } catch { placements.value = []; }
};

const fetchPlatformInfo = async (networkId: number) => {
  try {
    // /network/custom/detail 走 authMiddleware ?id=...; 预设网络可能不在 custom 表，走 list 兜底
    let res: any;
    try {
      res = await request.get('/api/v1/console/network/custom/detail', { params: { id: networkId } });
    } catch {
      res = await request.get('/api/v1/console/network/list', { params: { page: 1, pageSize: 200 } });
      const row = (res.data?.list || []).find((n: any) => n.id === networkId);
      if (row) res = { data: row };
    }
    if (res?.data) {
      platformName.value = res.data.network_name || '';
    }
  } catch { /* ignore */ }
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (selectedNetworkId.value) params.networkDefId = selectedNetworkId.value;
    if (selectedAppId.value) params.appId = selectedAppId.value;
    if (selectedPlacementId.value) params.placementId = selectedPlacementId.value;
    const res: any = await request.get('/api/v1/console/ad-source/list', { params });
    tableData.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } catch { /* ignore */ } finally { loading.value = false; }
};

const onSearch = () => {
  page.value = 1;
  fetchList();
};

const onAppSelect = (app: any) => {
  selectedAppId.value = app.id;
  selectedPlacementId.value = null;
  fetchPlacements(app.id);
  fetchList();
};

const onPlacementChange = () => {
  page.value = 1;
  fetchList();
};

const clearNetworkFilter = () => {
  selectedNetworkId.value = null;
  platformName.value = '';
  entryMode.value = 'standard';
  router.replace({ path: '/ad-source' });
  fetchList();
};

const onSelectionChange = (rows: any[]) => {
  selectedRowIds.value = rows.map(r => r.id);
};

const onBatchCommand = async (cmd: string) => {
  if (!selectedRowIds.value.length) return;
  if (cmd === 'delete') {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedRowIds.value.length} 个广告源吗？`, '警告', { type: 'error' });
    try {
      await Promise.all(selectedRowIds.value.map(id => request.delete(`/api/v1/console/ad-source/${id}`)));
      ElMessage.success('删除成功');
      fetchList();
    } catch { /* ignore */ }
    return;
  }
  const status = cmd === 'enable' ? 1 : 0;
  try {
    await Promise.all(selectedRowIds.value.map(id => request.put(`/api/v1/console/ad-source/${id}`, { status })));
    ElMessage.success('更新成功');
    fetchList();
  } catch { /* ignore */ }
};

const openCreate = () => {
  if (!selectedAppId.value) {
    ElMessage.warning('请先选择左侧应用');
    return;
  }
  isEdit.value = false;
  Object.assign(editForm, defaultForm);
  drawerVisible.value = true;
};

const closeDrawer = () => { drawerVisible.value = false; };
const onFormReset = () => { Object.assign(editForm, defaultForm); };

const handleEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(editForm, {
    id: row.id,
    source_name: row.source_name,
    third_app_id: row.third_app_id,
    third_placement_id: row.third_placement_id,
    extraText: row.extra ? (typeof row.extra === 'string' ? row.extra : JSON.stringify(row.extra)) : '',
  });
  drawerVisible.value = true;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    let extraVal: any = {};
    if (editForm.extraText && editForm.extraText.trim()) {
      try { extraVal = JSON.parse(editForm.extraText); }
      catch { ElMessage.error('额外配置 JSON 格式错误'); submitting.value = false; return; }
    }
    const payload: any = {
      sourceName: editForm.source_name,
      thirdAppId: editForm.third_app_id,
      thirdPlacementId: editForm.third_placement_id,
      extra: extraVal,
      appId: selectedAppId.value,
      placementId: selectedPlacementId.value,
    };
    if (selectedNetworkId.value) {
      // 自定义广告平台入口：调用 create-custom
      payload.networkDefId = selectedNetworkId.value;
      if (isEdit.value) {
        await request.put(`/api/v1/console/ad-source/${editForm.id}`, { ...payload, network_code: `custom_${selectedNetworkId.value}` });
      } else {
        await request.post('/api/v1/console/ad-source/create-custom', payload);
      }
    } else {
      // 标准入口：使用 network_code（这里简化让后端按 ad_source.create 走）
      if (isEdit.value) {
        await request.put(`/api/v1/console/ad-source/${editForm.id}`, payload);
      } else {
        // 标准入口需要 network_code：这里取第一个 network 作为兜底
        const networkCode = 'STD_DEFAULT';
        await request.post('/api/v1/console/ad-source/create', { ...payload, network_code: networkCode, network_name: '标准广告平台' });
      }
    }
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
    drawerVisible.value = false;
    fetchList();
  } catch { /* ignore */ } finally { submitting.value = false; }
};

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定删除广告源"${row.source_name}"吗？`, '警告', { type: 'error' });
  try {
    await request.delete(`/api/v1/console/ad-source/${row.id}`);
    ElMessage.success('删除成功');
    fetchList();
  } catch { /* ignore */ }
};

// 监听 route.query 变化
watch(() => route.query, (q) => {
  const nid = q.networkId ? Number(q.networkId) : null;
  if (nid) {
    selectedNetworkId.value = nid;
    entryMode.value = 'custom';
    platformName.value = String(q.networkName || '');
    fetchPlatformInfo(nid);
  } else {
    selectedNetworkId.value = null;
    entryMode.value = 'standard';
    platformName.value = '';
  }
  fetchList();
}, { immediate: true });

onMounted(async () => {
  await fetchApps();
  // 默认选中第一个应用
  if (appList.value.length && !selectedAppId.value) {
    const first = appList.value[0];
    selectedAppId.value = first.id;
    await fetchPlacements(first.id);
  }
});
</script>
