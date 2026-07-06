<template>
  <div class="page-container">
    <div class="page-header">
      <h1>个人中心</h1>
    </div>
    <!-- Basic Info -->
    <div class="table-card mb-base">
      <div class="card-title">基本信息</div>
      <el-descriptions :column="2" border style="margin-top: 12px">
        <el-descriptions-item label="Developer ID">
          {{ userInfo.developer_id }}
          <el-icon class="copy-btn" @click="copyText(userInfo.developer_id)"><CopyDocument /></el-icon>
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ userInfo.email }}</el-descriptions-item>
        <el-descriptions-item label="公司名称">{{ userInfo.company }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ userInfo.contact_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ userInfo.phone }}</el-descriptions-item>
        <el-descriptions-item label="接入方式">{{ userInfo.access_type === 1 ? 'SDK接入' : 'API接入' }}</el-descriptions-item>
      </el-descriptions>
      <el-button type="primary" size="small" style="margin-top: 16px" @click="showEditDialog = true">编辑信息</el-button>
    </div>
    <!-- Security -->
    <div class="table-card mb-base">
      <div class="card-title">安全设置</div>
      <div style="margin-top: 12px">
        <el-button size="small" @click="showPasswordDialog = true">修改密码</el-button>
      </div>
    </div>
    <!-- API Token -->
    <div class="table-card mb-base" v-if="userInfo.access_type === 2">
      <div class="card-title">API管理</div>
      <div style="margin-top: 12px">
        <template v-if="userInfo.api_access_token">
          <span class="text-primary">API Token: {{ maskToken(userInfo.api_access_token) }}</span>
          <el-icon class="copy-btn" @click="copyText(userInfo.api_access_token)"><CopyDocument /></el-icon>
        </template>
        <template v-else>
          <span class="text-secondary">尚未生成API Token</span>
        </template>
        <el-button type="primary" size="small" style="margin-left: 12px" @click="generateApiToken">
          {{ userInfo.api_access_token ? '刷新Token' : '生成Token' }}
        </el-button>
      </div>
    </div>
    <!-- Edit Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑信息" width="480px" destroy-on-close>
      <el-form ref="editFormRef" :model="editForm" label-position="top">
        <el-form-item label="公司名称"><el-input v-model="editForm.company" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="editForm.contact_name" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="editForm.phone" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveInfo">保存</el-button>
      </template>
    </el-dialog>
    <!-- Password Dialog -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="480px" destroy-on-close>
      <el-form :model="passwordForm" label-position="top">
        <el-form-item label="旧密码"><el-input v-model="passwordForm.oldPassword" type="password" show-password /></el-form-item>
        <el-form-item label="新密码"><el-input v-model="passwordForm.newPassword" type="password" show-password /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import request from '../../utils/request';
import { ElMessage } from 'element-plus';

const userInfo = reactive<any>({});
const showEditDialog = ref(false);
const showPasswordDialog = ref(false);
const editForm = reactive({ company: '', contact_name: '', phone: '' });
const passwordForm = reactive({ oldPassword: '', newPassword: '' });

const copyText = (text: string) => navigator.clipboard.writeText(text).then(() => ElMessage.success('已复制'));
const maskToken = (t: string) => t ? t.substring(0, 8) + '****' + t.substring(t.length - 4) : '--';

const fetchInfo = async () => {
  try {
    const res: any = await request.get('/api/v1/console/profile/info');
    Object.assign(userInfo, res.data);
    Object.assign(editForm, { company: res.data.company, contact_name: res.data.contact_name, phone: res.data.phone });
  } catch { /* ignore */ }
};

const saveInfo = async () => {
  try {
    await request.put('/api/v1/console/profile/info', editForm);
    ElMessage.success('保存成功');
    showEditDialog.value = false;
    fetchInfo();
  } catch { /* ignore */ }
};

const changePassword = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) return ElMessage.warning('请填写完整');
  try {
    await request.put('/api/v1/console/profile/password', passwordForm);
    ElMessage.success('密码修改成功');
    showPasswordDialog.value = false;
  } catch { /* ignore */ }
};

const generateApiToken = async () => {
  try {
    const res: any = await request.post('/api/v1/console/profile/api-token');
    ElMessage.success('API Token已生成');
    fetchInfo();
  } catch { /* ignore */ }
};

onMounted(fetchInfo);
</script>

<style scoped>
.card-title {
  font: var(--fs-section-title);
  color: #111827;
}
</style>
