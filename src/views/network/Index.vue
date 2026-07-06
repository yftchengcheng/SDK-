<template>
  <div class="page-container">
    <div class="page-header">
      <h1>广告网络</h1>
      <el-button type="primary" @click="openCreate">创建自定义网络</el-button>
    </div>
    <!-- Preset Networks -->
    <div class="table-card mb-base">
      <div class="card-title">预置网络</div>
      <el-table :data="presetNetworks" stripe style="width: 100%; margin-top: 12px">
        <el-table-column prop="network_code" label="网络代码" width="120" />
        <el-table-column prop="network_name" label="网络名称" min-width="140" />
        <el-table-column prop="supports_bidding" label="支持Bidding" width="120">
          <template #default="{ row }">{{ row.supports_bidding ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default><el-tag type="info" size="small">预置</el-tag></template>
        </el-table-column>
      </el-table>
    </div>
    <!-- Custom Networks -->
    <div class="table-card">
      <div class="card-title">自定义网络</div>
      <el-table :data="customNetworks" v-loading="loading" stripe style="width: 100%; margin-top: 12px">
        <el-table-column prop="network_code" label="网络代码" width="160" />
        <el-table-column prop="network_name" label="网络名称" min-width="140" />
        <el-table-column prop="supports_bidding" label="支持Bidding" width="120">
          <template #default="{ row }">{{ row.supports_bidding ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import request from '../../utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

const loading = ref(false);
const allNetworks = ref<any[]>([]);

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

onMounted(fetchList);
</script>

<style scoped>
.card-title {
  font: var(--fs-section-title);
  color: #111827;
}
</style>
