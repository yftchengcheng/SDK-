<template>
  <div class="page-container admin-sdk-releases">
    <div class="table-card mb-base">
      <div class="card-title-row">
        <div class="card-title">SDK 版本管理</div>
        <div class="header-actions">
          <el-radio-group v-model="platformFilter" size="small" @change="loadList">
            <el-radio-button :value="0">全部</el-radio-button>
            <el-radio-button :value="1">Android</el-radio-button>
            <el-radio-button :value="2">iOS</el-radio-button>
          </el-radio-group>
          <el-button type="primary" size="small" @click="openCreate">
            <el-icon><Plus /></el-icon> 新建版本
          </el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="releases" stripe size="small">
        <el-table-column label="ID" prop="id" width="60" />
        <el-table-column label="平台" width="90">
          <template #default="{ row }">
            <el-tag :type="row.platform === 1 ? 'success' : 'primary'" size="small">
              {{ row.platform === 1 ? 'Android' : 'iOS' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="版本号" width="130">
          <template #default="{ row }">
            <strong>v{{ row.version }}</strong>
            <el-tag v-if="row.is_latest" type="success" size="small" effect="dark" style="margin-left: 6px">最新</el-tag>
            <el-tag v-else-if="row.is_force_update" type="danger" size="small" effect="dark" style="margin-left: 6px">强制</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="版本代码" prop="version_code" width="90" />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.release_type === 1" type="primary" size="small">稳定</el-tag>
            <el-tag v-else-if="row.release_type === 2" type="warning" size="small">测试</el-tag>
            <el-tag v-else type="info" size="small">历史</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch :model-value="row.status === 1" @change="(v: boolean) => toggleStatus(row, v)" />
          </template>
        </el-table-column>
        <el-table-column label="最低系统" prop="min_os_version" width="100" />
        <el-table-column label="包大小" width="100">
          <template #default="{ row }">{{ formatSize(row.file_size) }}</template>
        </el-table-column>
        <el-table-column label="下载" prop="download_count" width="80" />
        <el-table-column label="发布时间" width="120">
          <template #default="{ row }">{{ formatDate(row.release_date) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="!row.is_latest" size="small" link type="success" @click="markLatest(row)">设为最新</el-button>
            <el-popconfirm title="确认删除？" @confirm="remove(row)">
              <template #reference>
                <el-button size="small" link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑/创建弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑版本' : '新建版本'" width="720px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" label-position="right">
        <el-form-item label="平台" prop="platform">
          <el-radio-group v-model="form.platform">
            <el-radio :value="1">Android</el-radio>
            <el-radio :value="2">iOS</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input v-model="form.version" placeholder="如 6.0.9 / 1.1.0" />
        </el-form-item>
        <el-form-item label="版本代码" prop="version_code">
          <el-input-number v-model="form.version_code" :min="1" :step="1" />
        </el-form-item>
        <el-form-item label="发布类型" prop="release_type">
          <el-radio-group v-model="form.release_type">
            <el-radio :value="1">稳定版</el-radio>
            <el-radio :value="2">测试版</el-radio>
            <el-radio :value="3">历史</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="最低系统" prop="min_os_version">
          <el-input v-model="form.min_os_version" placeholder="如 5.0 / 11.0" />
        </el-form-item>
        <el-form-item label="依赖 SDK">
          <el-input v-model="form.sdk_min_version" placeholder="可选，如 4.0.0" />
        </el-form-item>
        <el-form-item label="包大小 (Byte)">
          <el-input-number v-model="form.file_size" :min="0" :step="1024" />
        </el-form-item>
        <el-form-item label="MD5">
          <el-input v-model="form.file_md5" placeholder="可选" />
        </el-form-item>
        <el-form-item label="下载链接" prop="download_url">
          <el-input v-model="form.download_url" placeholder="OSS / CDN 完整地址" />
        </el-form-item>
        <el-form-item label="发布时间" prop="release_date">
          <el-date-picker v-model="form.release_date" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" />
        </el-form-item>
        <el-form-item label="标记">
          <el-checkbox v-model="form.is_latest">设为最新版本</el-checkbox>
          <el-checkbox v-model="form.is_force_update">强制升级</el-checkbox>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">发布</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="更新日志" prop="changelog">
          <el-input v-model="form.changelog" type="textarea" :rows="8" placeholder="支持 Markdown，例如：&#10;## v6.0.9&#10;### 新功能&#10;- xxx" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import request from '@/utils/request';

interface Release {
  id: number;
  platform: 1 | 2;
  version: string;
  version_code?: number;
  changelog?: string;
  download_url?: string;
  file_size?: number;
  file_md5?: string;
  sdk_min_version?: string;
  min_os_version?: string;
  release_type?: number;
  is_latest?: boolean;
  is_force_update?: boolean;
  release_date?: string;
  status?: number;
  download_count?: number;
}

const releases = ref<Release[]>([]);
const loading = ref(false);
const platformFilter = ref<0 | 1 | 2>(0);

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

const defaultForm = (): Partial<Release> => ({
  platform: 1,
  version: '',
  version_code: 1,
  release_type: 1,
  min_os_version: '',
  sdk_min_version: '',
  file_size: 0,
  file_md5: '',
  download_url: '',
  release_date: new Date().toISOString().slice(0, 19),
  is_latest: false,
  is_force_update: false,
  status: 1,
  changelog: '',
});

const form = ref<Partial<Release>>(defaultForm());
const editingId = ref<number | null>(null);

const rules: FormRules = {
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
  version: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
  version_code: [{ required: true, message: '请输入版本代码', trigger: 'blur' }],
  release_type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  download_url: [{ required: true, message: '请输入下载链接', trigger: 'blur' }],
  release_date: [{ required: true, message: '请选择发布时间', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  changelog: [{ required: true, message: '请填写更新日志', trigger: 'blur' }],
};

const formatSize = (size?: number): string => {
  if (!size) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

const formatDate = (date?: string): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('zh-CN');
};

const loadList = async () => {
  loading.value = true;
  try {
    const params: Record<string, number> = {};
    if (platformFilter.value !== 0) params.platform = platformFilter.value;
    const res: any = await request.get('/api/v1/sdk-cms/admin/releases', { params });
    releases.value = res.data || [];
  } catch {
    /* ignore */
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  isEdit.value = false;
  editingId.value = null;
  form.value = defaultForm();
  dialogVisible.value = true;
};

const openEdit = (row: Release) => {
  isEdit.value = true;
  editingId.value = row.id;
  form.value = { ...row };
  dialogVisible.value = true;
};

const submit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  submitting.value = true;
  try {
    if (isEdit.value && editingId.value) {
      await request.put(`/api/v1/sdk-cms/admin/releases/${editingId.value}`, form.value);
      ElMessage.success('已保存');
    } else {
      await request.post('/api/v1/sdk-cms/admin/releases', form.value);
      ElMessage.success('已创建');
    }
    dialogVisible.value = false;
    await loadList();
  } catch {
    /* ignore */
  } finally {
    submitting.value = false;
  }
};

const toggleStatus = async (row: Release, val: boolean) => {
  try {
    await request.put(`/api/v1/sdk-cms/admin/releases/${row.id}`, { status: val ? 1 : 0 });
    row.status = val ? 1 : 0;
    ElMessage.success(val ? '已发布' : '已下架');
  } catch {
    /* ignore */
  }
};

const markLatest = async (row: Release) => {
  try {
    await request.put(`/api/v1/sdk-cms/admin/releases/${row.id}`, { is_latest: true });
    ElMessage.success('已设为最新');
    await loadList();
  } catch {
    /* ignore */
  }
};

const remove = async (row: Release) => {
  try {
    await request.delete(`/api/v1/sdk-cms/admin/releases/${row.id}`);
    ElMessage.success('已删除');
    await loadList();
  } catch {
    /* ignore */
  }
};

onMounted(() => {
  loadList();
});
</script>
