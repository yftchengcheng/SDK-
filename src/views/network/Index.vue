<template>
  <div class="page-shell">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><Connection /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">广告网络</h1>
          <p class="page-header-subtitle">管理预置与自定义广告网络、账号凭证与 Adapter 接入</p>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="network-tabs">
      <!-- 网络管理 Tab -->
      <el-tab-pane label="网络管理" name="manage">
        <div class="page-filter">
          <div class="page-filter-form"></div>
          <div class="page-filter-actions">
            <el-button type="primary" :icon="Plus" @click="openCreate">创建自定义网络</el-button>
          </div>
        </div>

        <!-- Preset Networks -->
        <div class="page-card"><div class="page-table-wrap">
          <div class="page-card-header"><div class="page-card-title">预置网络（系统内置）</div></div>
          <el-table :data="presetNetworks" stripe style="width: 100%; margin-top: 12px">
            <el-table-column prop="network_code" label="网络代码" width="120" />
            <el-table-column prop="network_name" label="网络名称" min-width="140" />
            <el-table-column prop="supports_bidding" label="支持Bidding" width="120">
              <template #default="{ row }">{{ row.supports_bidding ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column label="类型" width="100">
              <template #default><span class="status-tag status-tag--neutral">预置</span></template>
            </el-table-column>
          </el-table></div></div>

        <!-- Custom Networks -->
        <div class="page-card"><div class="page-table-wrap">
          <div class="page-card-header"><div class="page-card-title">自定义网络</div></div>
          <el-table :data="customNetworks" v-loading="loading" stripe style="width: 100%; margin-top: 12px">
            <el-table-column prop="network_code" label="网络代码" width="160" />
            <el-table-column prop="network_name" label="网络名称" min-width="140" />
            <el-table-column prop="supports_bidding" label="支持Bidding" width="120">
              <template #default="{ row }">{{ row.supports_bidding ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <span class="status-tag" :class="row.status === 1 ? 'status-tag--active' : 'status-tag--paused'">{{ row.status === 1 ? '启用' : '禁用' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="{ row }">
                <div class="cell-actions"><el-button link type="primary" @click="openAdapterManager(row)">Adapter</el-button><el-button link type="primary" @click="openAppBinding(row)">应用</el-button><el-button link type="primary" @click="handleEdit(row)">编辑</el-button><el-button link type="danger" @click="handleDelete(row)">删除</el-button></div>
              </template>
            </el-table-column>
          </el-table></div></div>
      </el-tab-pane>

      <!-- 广告网络账号 Tab -->
      <el-tab-pane label="广告网络账号" name="accounts">
        <div class="tab-toolbar-info">
          <el-text type="info" size="small">
            管理各广告网络的账号凭证，支持 JSON 键值对存储与敏感字段脱敏
          </el-text>
        </div>
        <AccountManager />
      </el-tab-pane>
    </el-tabs>

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="showDialog" :title="editForm.id ? '编辑自定义网络' : '创建自定义网络'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="editForm" :rules="formRules" label-position="top">
        <el-form-item label="网络名称" prop="network_name">
          <el-input v-model="editForm.network_name" placeholder="如 MyAdNetwork" />
        </el-form-item>
        <el-form-item label="网络代码" prop="network_code">
          <el-input v-model="editForm.network_code" placeholder="如 CUSTOM_MYAD (大写+下划线)" :disabled="!!editForm.id" />
        </el-form-item>
        <el-form-item label="初始化Adapter类名">
          <el-input v-model="editForm.adapter_class_init" placeholder="如 com.myadapter.MyCustomInitAdapter" />
        </el-form-item>
        <el-form-item label="Banner Adapter类名">
          <el-input v-model="editForm.adapter_class_banner" placeholder="选填" />
        </el-form-item>
        <el-form-item label="插屏Adapter类名">
          <el-input v-model="editForm.adapter_class_interstitial" placeholder="选填" />
        </el-form-item>
        <el-form-item label="激励视频Adapter类名">
          <el-input v-model="editForm.adapter_class_rewarded" placeholder="选填" />
        </el-form-item>
        <el-form-item label="原生Adapter类名">
          <el-input v-model="editForm.adapter_class_native" placeholder="选填" />
        </el-form-item>
        <el-form-item label="开屏Adapter类名">
          <el-input v-model="editForm.adapter_class_splash" placeholder="选填" />
        </el-form-item>
        <el-form-item label="支持Bidding">
          <el-switch v-model="editForm.supports_bidding" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- Adapter Manager Dialog -->
    <el-dialog v-model="adapterDialog.show" :title="`Adapter 版本管理 - ${adapterDialog.networkName}`" width="900px" destroy-on-close>
      <div style="margin-bottom: 12px">
        <el-button type="primary" size="small" @click="openAdapterUpload">上传新版本</el-button>
      </div>
      <ReviewPanel
        :versions="adapterDialog.versions"
        :loading="adapterDialog.loading"
        @review="handleReviewEvent"
        @download="downloadAdapter"
        @delete="deleteAdapter"
      />
    </el-dialog>

    <!-- Adapter Upload Dialog -->
    <el-dialog v-model="uploadDialog.show" title="上传 Adapter" width="560px" destroy-on-close>
      <el-form :model="uploadDialog.form" label-width="100px">
        <el-form-item label="版本号" required>
          <el-input v-model="uploadDialog.form.version" placeholder="如 1.0.0" />
        </el-form-item>
        <el-form-item label="Adapter类型" required>
          <el-select v-model="uploadDialog.form.adapter_type" placeholder="选择类型" style="width: 100%">
            <el-option label="初始化" :value="1" />
            <el-option label="Banner" :value="2" />
            <el-option label="插屏" :value="3" />
            <el-option label="激励视频" :value="4" />
            <el-option label="原生" :value="5" />
            <el-option label="开屏" :value="6" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件" required>
          <el-input v-model="uploadDialog.form.file_name" placeholder="文件名（演示用）" />
        </el-form-item>
        <el-form-item label="文件大小">
          <el-input-number v-model="uploadDialog.form.file_size" :min="0" :max="100000000" />
        </el-form-item>
        <el-form-item label="文件内容">
          <el-input v-model="uploadDialog.form.file_content" type="textarea" :rows="3" placeholder="实际项目中上传文件二进制（base64编码），演示可填描述" />
        </el-form-item>
        <el-form-item label="变更说明">
          <el-input v-model="uploadDialog.form.remark" type="textarea" :rows="2" placeholder="本次版本变更说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialog.show = false">取消</el-button>
        <el-button type="primary" @click="submitAdapter">提交</el-button>
      </template>
    </el-dialog>

    <!-- App Binding Dialog -->
    <el-dialog v-model="bindingDialog.show" :title="`应用关联 - ${bindingDialog.networkName}`" width="800px" destroy-on-close>
      <div style="margin-bottom: 12px">
        <el-button type="primary" size="small" @click="openBinding">新增关联</el-button>
      </div>
      <el-table :data="bindingDialog.bindings" v-loading="bindingDialog.loading" stripe size="small">
        <el-table-column prop="app_key" label="应用" min-width="160" />
        <el-table-column prop="network_app_id" label="网络AppId" min-width="160" />
        <el-table-column prop="adapter_version_id" label="Adapter版本" width="120">
          <template #default="{ row }">
            <span v-if="row.adapter_version_id">v{{ findAdapterVersion(row.adapter_version_id) }}</span>
            <span v-else style="color: #94a3b8">未指定</span>
          </template>
        </el-table-column>
        <el-table-column prop="extra_params" label="额外参数" min-width="160" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="unbindNetwork(row)">解绑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- New Binding Dialog -->
    <el-dialog v-model="newBindingDialog.show" title="新增应用关联" width="500px" destroy-on-close>
      <el-form :model="newBindingDialog.form" label-width="100px">
        <el-form-item label="选择应用" required>
          <el-select v-model="newBindingDialog.form.app_key" placeholder="选择应用" style="width: 100%" filterable>
            <el-option v-for="app in appList" :key="app.app_key" :label="`${app.app_name} (${app.app_key})`" :value="app.app_key" />
          </el-select>
        </el-form-item>
        <el-form-item label="网络AppId" required>
          <el-input v-model="newBindingDialog.form.network_app_id" placeholder="该网络为此应用分配的AppId" />
        </el-form-item>
        <el-form-item label="Adapter版本">
          <el-select v-model="newBindingDialog.form.adapter_version_id" placeholder="选择Adapter版本（默认不指定）" style="width: 100%" clearable>
            <el-option v-for="v in adapterDialog.versions" :key="v.id" :label="`v${v.version} (${typeLabel(v.adapter_type)})`" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="额外参数">
          <el-input v-model="newBindingDialog.form.extra_params" type="textarea" :rows="2" placeholder="JSON 格式，如 {&quot;timeout&quot;: 5000}" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newBindingDialog.show = false">取消</el-button>
        <el-button type="primary" @click="submitBinding">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import request from '../../utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import AccountManager from '../../components/AccountManager.vue';
import ReviewPanel, { type AdapterVersion } from '../../components/ReviewPanel.vue';

const activeTab = ref<'manage' | 'accounts'>('manage');

const loading = ref(false);
const allNetworks = ref<any[]>([]);
const appList = ref<any[]>([]);

const presetNetworks = computed(() => allNetworks.value.filter(n => n.network_type === 1));
const customNetworks = computed(() => allNetworks.value.filter(n => n.network_type === 2));

const showDialog = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const defaultForm = {
  id: 0, network_name: '', network_code: '', adapter_class_init: '',
  adapter_class_banner: '', adapter_class_interstitial: '', adapter_class_rewarded: '',
  adapter_class_native: '', adapter_class_splash: '', supports_bidding: false,
};
const editForm = reactive({ ...defaultForm });

const formRules: FormRules = {
  network_name: [{ required: true, message: '请输入网络名称', trigger: 'blur' }],
  network_code: [{ required: true, message: '请输入网络代码', trigger: 'blur' }],
};

const fetchList = async () => {
  loading.value = true;
  try { const res: any = await request.get('/api/v1/console/network/list'); allNetworks.value = res.data?.list || []; } catch { /* ignore */ } finally { loading.value = false; }
};

const fetchAppList = async () => {
  try { const res: any = await request.get('/api/v1/console/app/list?pageSize=1000'); appList.value = res.data?.list || []; } catch { /* ignore */ }
};

const openCreate = () => { Object.assign(editForm, defaultForm); showDialog.value = true; };

const handleEdit = (row: any) => {
  Object.assign(editForm, {
    id: row.id, network_name: row.network_name, network_code: row.network_code,
    adapter_class_init: row.adapter_class_init || '', adapter_class_banner: row.adapter_class_banner || '',
    adapter_class_interstitial: row.adapter_class_interstitial || '', adapter_class_rewarded: row.adapter_class_rewarded || '',
    adapter_class_native: row.adapter_class_native || '', adapter_class_splash: row.adapter_class_splash || '',
    supports_bidding: !!row.supports_bidding,
  });
  showDialog.value = true;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    const code = editForm.network_code.startsWith('CUSTOM_') ? editForm.network_code : `CUSTOM_${editForm.network_code}`;
    const payload = { ...editForm, network_code: code, supports_bidding: editForm.supports_bidding ? 1 : 0 };
    if (editForm.id) {
      await request.put(`/api/v1/console/network/custom/${editForm.id}`, payload);
      ElMessage.success('更新成功');
    } else {
      await request.post('/api/v1/console/network/custom/create', payload);
      ElMessage.success('创建成功');
    }
    showDialog.value = false;
    fetchList();
  } catch { /* ignore */ } finally { submitting.value = false; }
};

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定删除自定义网络"${row.network_name}"吗？`, '警告', { type: 'error' });
  try { await request.delete(`/api/v1/console/network/custom/${row.id}`); ElMessage.success('删除成功'); fetchList(); } catch { /* ignore */ }
};

// ===== Adapter Manager =====
const adapterDialog = reactive({
  show: false, networkId: 0, networkName: '', loading: false, versions: [] as any[],
});

const typeLabel = (t: number) => ({ 1: '初始化', 2: 'Banner', 3: '插屏', 4: '激励视频', 5: '原生', 6: '开屏' }[t] || '其他');
const formatDate = (d: string) => (d ? new Date(d).toLocaleString('zh-CN') : '-');

const openAdapterManager = async (row: any) => {
  adapterDialog.show = true;
  adapterDialog.networkId = row.id;
  adapterDialog.networkName = row.network_name;
  await fetchAdapterVersions();
};

const fetchAdapterVersions = async () => {
  adapterDialog.loading = true;
  try {
    const res: any = await request.get(`/api/v1/console/network/adapter/list?networkDefId=${adapterDialog.networkId}`);
    adapterDialog.versions = res.data?.list || [];
  } catch { /* ignore */ } finally { adapterDialog.loading = false; }
};

const uploadDialog = reactive({
  show: false,
  form: { version: '', adapter_type: 1, file_name: '', file_size: 0, file_content: '', remark: '' },
});

const openAdapterUpload = () => {
  Object.assign(uploadDialog.form, { version: '', adapter_type: 1, file_name: '', file_size: 0, file_content: '', remark: '' });
  uploadDialog.show = true;
};

const submitAdapter = async () => {
  const f = uploadDialog.form;
  if (!f.version || !f.adapter_type || !f.file_name) {
    ElMessage.warning('请填写版本号、类型和文件名');
    return;
  }
  try {
    await request.post('/api/v1/console/network/adapter/upload', {
      network_def_id: adapterDialog.networkId,
      version: f.version,
      adapter_type: f.adapter_type,
      file_name: f.file_name,
      file_size: f.file_size,
      file_content: f.file_content,
      remark: f.remark,
    });
    ElMessage.success('上传成功，等待审核');
    uploadDialog.show = false;
    await fetchAdapterVersions();
  } catch { /* ignore */ }
};

const downloadAdapter = async (row: any) => {
  try {
    const res: any = await request.get(`/api/v1/console/network/adapter/download/${row.id}`);
    if (res.data?.file_content) {
      const blob = new Blob([res.data.file_content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = res.data.file_name || `adapter-${row.id}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      ElMessage.info('无文件内容可下载');
    }
  } catch { /* ignore */ }
};

const reviewAdapter = async (row: AdapterVersion, status: number, remark = ''): Promise<void> => {
  const action = status === 1 ? '通过' : '拒绝';
  try {
    await request.post(`/api/v1/console/network/adapter/review/${row.id}`, { status, remark });
    ElMessage.success(`已${action}`);
    await fetchAdapterVersions();
  } catch { /* ignore */ }
};

const handleReviewEvent = (payload: { row: AdapterVersion; status: number; remark: string }): void => {
  void reviewAdapter(payload.row, payload.status, payload.remark);
};

const deleteAdapter = async (row: any) => {
  await ElMessageBox.confirm(`确定删除 v${row.version} 吗？`, '警告', { type: 'error' });
  try {
    await request.delete(`/api/v1/console/network/adapter/${row.id}`);
    ElMessage.success('删除成功');
    await fetchAdapterVersions();
  } catch { /* ignore */ }
};

// ===== App Binding =====
const bindingDialog = reactive({
  show: false, networkId: 0, networkName: '', loading: false, bindings: [] as any[],
});

const newBindingDialog = reactive({
  show: false,
  form: { app_key: '', network_app_id: '', adapter_version_id: null as number | null, extra_params: '' },
});

const openAppBinding = async (row: any) => {
  bindingDialog.show = true;
  bindingDialog.networkId = row.id;
  bindingDialog.networkName = row.network_name;
  // 同时加载 adapter 列表供下拉使用
  if (!adapterDialog.versions.length || adapterDialog.networkId !== row.id) {
    adapterDialog.networkId = row.id;
    adapterDialog.networkName = row.network_name;
    await fetchAdapterVersions();
  }
  await fetchBindings();
};

const fetchBindings = async () => {
  bindingDialog.loading = true;
  try {
    const res: any = await request.get(`/api/v1/console/network/app/list?networkDefId=${bindingDialog.networkId}`);
    bindingDialog.bindings = res.data?.list || [];
  } catch { /* ignore */ } finally { bindingDialog.loading = false; }
};

const openBinding = async () => {
  if (!appList.value.length) await fetchAppList();
  Object.assign(newBindingDialog.form, { app_key: '', network_app_id: '', adapter_version_id: null, extra_params: '' });
  newBindingDialog.show = true;
};

const submitBinding = async () => {
  const f = newBindingDialog.form;
  if (!f.app_key || !f.network_app_id) {
    ElMessage.warning('请选择应用并填写网络AppId');
    return;
  }
  try {
    await request.post('/api/v1/console/network/app/bind', {
      appKey: f.app_key,
      networkDefId: bindingDialog.networkId,
      adapterVersionId: f.adapter_version_id,
      networkAppId: f.network_app_id,
      extraParams: f.extra_params || null,
    });
    ElMessage.success('关联成功');
    newBindingDialog.show = false;
    await fetchBindings();
  } catch (e: any) {
    const msg = e?.response?.data?.message || '关联失败';
    ElMessage.error(msg);
  }
};

const unbindNetwork = async (row: any) => {
  await ElMessageBox.confirm(`确定解除 "${row.app_key}" 与此网络的关联吗？`, '警告', { type: 'error' });
  try {
    await request.post('/api/v1/console/network/app/unbind', {
      appKey: row.app_key,
      networkDefId: bindingDialog.networkId,
    });
    ElMessage.success('已解绑');
    await fetchBindings();
  } catch { /* ignore */ }
};

const findAdapterVersion = (id: number) => {
  const v = adapterDialog.versions.find(x => x.id === id);
  return v ? v.version : id;
};

onMounted(() => {
  fetchList();
  fetchAppList();
});
</script>
