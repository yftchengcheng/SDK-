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
                <el-radio-group
                  v-model="expirePresetKey"
                  class="expire-preset-group"
                  @change="onExpirePresetChange"
                >
                  <el-radio-button
                    v-for="preset in expirePresets"
                    :key="preset.key"
                    :value="preset.key"
                    :label="preset.key"
                  >
                    {{ preset.label }}
                  </el-radio-button>
                </el-radio-group>
                <div v-if="expirePresetHint" class="expire-preset-hint">
                  将于 <strong>{{ expirePresetHint }}</strong> 到期
                </div>
              </div>
            </div>
            <div class="api-field api-field--actions">
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
    <!-- 修改密码抽屉: 原密码 / 新密码 / 确认新密码 -->
    <el-drawer v-model="showPasswordDialog" title="修改密码" direction="rtl" :size="480" destroy-on-close>
      <div class="password-drawer-body">
        <el-form :model="passwordForm" label-position="top">
          <el-form-item label="原密码" required>
            <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入当前使用的密码" clearable />
          </el-form-item>
          <el-form-item label="新密码" required>
            <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="6-32 位，建议字母+数字组合" clearable />
          </el-form-item>
          <el-form-item label="确认新密码" required>
            <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" clearable />
          </el-form-item>
          <div class="password-tips">
            <el-icon><InfoFilled /></el-icon>
            <span>新密码修改成功后需重新登录，且不能与原密码相同</span>
          </div>
        </el-form>
      </div>
      <template #footer>
        <div class="password-drawer-footer">
          <el-button @click="showPasswordDialog = false">取消</el-button>
          <el-button type="primary" :loading="changingPassword" @click="changePassword">确定修改</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import request from '../../utils/request';
import { ElMessage } from 'element-plus';

const userInfo = reactive<any>({});
const showEditDialog = ref(false);
const showPasswordDialog = ref(false);
const changingPassword = ref(false);
const editForm = reactive({ company: '', contact_name: '', phone: '' });
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });

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
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    return ElMessage.warning('请填写完整');
  }
  if (passwordForm.newPassword.length < 6) {
    return ElMessage.warning('新密码至少 6 位');
  }
  if (passwordForm.newPassword === passwordForm.oldPassword) {
    return ElMessage.warning('新密码不能与原密码相同');
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    return ElMessage.warning('两次输入的新密码不一致');
  }
  changingPassword.value = true;
  try {
    await request.put('/api/v1/console/profile/password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
    ElMessage.success('密码修改成功，请重新登录');
    showPasswordDialog.value = false;
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    // 清除本地凭据, 跳回登录页
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('userRole');
      location.href = '/login';
    }, 800);
  } catch {
    /* ignore */
  } finally {
    changingPassword.value = false;
  }
};

// 生效时间预设（用户点选后立即 PATCH 保存）
const FAR_FUTURE = '2099-12-31T23:59:59.000Z';
type ExpirePreset = { key: string; label: string; compute: () => string };
const expirePresets: ExpirePreset[] = [
  { key: '7d', label: '7 天', compute: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
  { key: '1m', label: '1 个月', compute: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  { key: '3m', label: '3 个月', compute: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() },
  { key: '6m', label: '6 个月', compute: () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() },
  { key: '1y', label: '1 年', compute: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() },
  { key: 'forever', label: '永久', compute: () => FAR_FUTURE },
];
const expirePresetKey = ref<string>('1y');
const expirePresetHint = ref<string>('');

// 根据当前 api_token_expire 反推匹配哪个预设（用于 UI 高亮）
const matchPresetByExpireDate = (expire: string): string => {
  if (!expire) return '1y';
  const target = new Date(expire).getTime();
  if (Math.abs(target - new Date(FAR_FUTURE).getTime()) < 1000) return 'forever';
  for (const p of expirePresets) {
    if (p.key === 'forever') continue;
    const t = new Date(p.compute()).getTime();
    // 24h 误差容差：把 "现在" 当作下界
    if (Math.abs(target - t) < 24 * 60 * 60 * 1000) return p.key;
  }
  return '';
};

const syncExpirePreset = () => {
  const matched = matchPresetByExpireDate(userInfo.value.api_token_expire);
  if (matched) {
    expirePresetKey.value = matched;
    expirePresetHint.value = '';
  } else {
    // 匹配不上（如后端返回自定义时间），保持当前值并提示
    expirePresetHint.value = userInfo.value.api_token_expire
      ? formatExpire(userInfo.value.api_token_expire)
      : '';
  }
};

const onExpirePresetChange = async (key: string | number | boolean | undefined) => {
  const preset = expirePresets.find((p) => p.key === key);
  if (!preset) return;
  const expireDate = preset.compute();
  try {
    await request.patch('/api/v1/console/profile/api-token/expire', { expireDate });
    ElMessage.success(`生效时间已更新为：${preset.label}`);
    await fetchInfo();
    syncExpirePreset();
  } catch { /* ignore */ }
};

const generateApiToken = async () => {
  try {
    const res: any = await request.post('/api/v1/console/profile/api-token', {});
    ElMessage.success('Report API 密钥已重新生成');
    await fetchInfo();
    syncExpirePreset();
  } catch { /* ignore */ }
};

onMounted(async () => {
  await fetchInfo();
  syncExpirePreset();
});
</script>

