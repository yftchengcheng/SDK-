<template>
  <div class="page-container">
    <div class="page-header">
      <h1>个人中心</h1>
    </div>
    <!-- Basic Info -->
    <div class="table-card mb-base">
      <div class="card-title">基本信息</div>
      <el-descriptions :column="2" border style="margin-top: 12px">
        <el-descriptions-item label="开发者 TOKEN">
          {{ userInfo.developer_id }}
          <el-icon class="copy-btn" @click="copyText(userInfo.developer_id)"><CopyDocument /></el-icon>
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ userInfo.email }}</el-descriptions-item>
        <el-descriptions-item label="公司名称">{{ userInfo.company }}</el-descriptions-item>
        <el-descriptions-item label="公司简称">{{ userInfo.company_short_name || '--' }}</el-descriptions-item>
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
    <!-- Report API 密钥 -->
    <div class="table-card mb-base">
      <div class="card-title">Report API 密钥</div>
      <div class="api-block">
        <template v-if="userInfo.api_access_token">
          <div class="api-row">
            <div class="api-field">
              <div class="api-label">密钥</div>
              <div class="api-value">
                <code class="api-token-code">{{ maskToken(userInfo.api_access_token) }}</code>
                <el-icon class="copy-btn" @click="copyText(userInfo.api_access_token)"><CopyDocument /></el-icon>
              </div>
            </div>
            <div class="api-field">
              <div class="api-label">当前过期时间</div>
              <div class="api-value">{{ formatExpire(userInfo.api_token_expire) }}</div>
            </div>
          </div>
          <div class="api-row">
            <div class="api-field api-field--grow">
              <div class="api-label">生效时间</div>
              <div class="api-value">
                <el-date-picker
                  v-model="tokenExpireDraft"
                  type="datetime"
                  placeholder="选择过期时间"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DDTHH:mm:ss[Z]"
                  :disabled-date="(d: Date) => d.getTime() <= Date.now() - 86400000"
                  size="default"
                  class="api-expire-picker"
                />
              </div>
            </div>
            <div class="api-field api-field--actions">
              <el-button type="primary" :loading="savingExpire" @click="saveTokenExpire">保存生效时间</el-button>
              <el-button @click="generateApiToken">刷新密钥</el-button>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="api-empty">
            <span class="text-secondary">尚未生成 Report API 密钥</span>
            <el-button type="primary" size="small" style="margin-left: 12px" @click="generateApiToken">生成密钥</el-button>
          </div>
        </template>
      </div>
    </div>
    <!-- Edit Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑信息" width="480px" destroy-on-close>
      <el-form ref="editFormRef" :model="editForm" label-position="top">
        <el-form-item label="公司名称"><el-input v-model="editForm.company" /></el-form-item>
        <el-form-item label="公司简称"><el-input v-model="editForm.company_short_name" /></el-form-item>
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
const formatExpire = (ts: string) => ts ? new Date(ts).toLocaleString('zh-CN', { hour12: false }) : '--';

const fetchInfo = async () => {
  try {
    const res: any = await request.get('/api/v1/console/profile/info');
    Object.assign(userInfo, res.data);
    Object.assign(editForm, { company: res.data.company, company_short_name: res.data.company_short_name, contact_name: res.data.contact_name, phone: res.data.phone });
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

// 生效时间草稿（独立于 userInfo.api_token_expire，用户可改）
const tokenExpireDraft = ref<string>('');

// 同步草稿为当前过期时间
const syncExpireDraft = () => {
  if (userInfo.value.api_token_expire) {
    tokenExpireDraft.value = new Date(userInfo.value.api_token_expire).toISOString();
  } else {
    tokenExpireDraft.value = '';
  }
};

const generateApiToken = async () => {
  try {
    const body: Record<string, unknown> = {};
    if (tokenExpireDraft.value) body.expireDate = tokenExpireDraft.value;
    const res: any = await request.post('/api/v1/console/profile/api-token', body);
    ElMessage.success('Report API 密钥已重新生成');
    await fetchInfo();
    syncExpireDraft();
  } catch { /* ignore */ }
};

const savingExpire = ref(false);
const saveTokenExpire = async () => {
  if (!tokenExpireDraft.value) {
    ElMessage.warning('请选择生效时间');
    return;
  }
  savingExpire.value = true;
  try {
    const res: any = await request.patch('/api/v1/console/profile/api-token/expire', {
      expireDate: tokenExpireDraft.value,
    });
    ElMessage.success('生效时间已保存');
    await fetchInfo();
  } catch { /* ignore */ }
  finally {
    savingExpire.value = false;
  }
};

onMounted(async () => {
  await fetchInfo();
  syncExpireDraft();
});
</script>

