<template>
  <div class="page-container admin-sdk-privacy">
    <div class="table-card mb-base">
      <div class="card-title-row">
        <div class="card-title">隐私政策管理</div>
        <el-button type="primary" size="small" @click="openCreate">
          <el-icon><Plus /></el-icon> 新建政策
        </el-button>
      </div>

      <el-table v-loading="loading" :data="policies" stripe size="small">
        <el-table-column label="ID" prop="id" width="60" />
        <el-table-column label="版本" prop="version" width="100" />
        <el-table-column label="平台" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.platform === 1" type="success" size="small">Android</el-tag>
            <el-tag v-else-if="row.platform === 2" type="primary" size="small">iOS</el-tag>
            <el-tag v-else type="info" size="small">通用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标题" prop="title" min-width="220" show-overflow-tooltip />
        <el-table-column label="格式" width="80">
          <template #default="{ row }">
            <el-tag :type="row.content_format === 1 ? 'warning' : 'info'" size="small" effect="plain">
              {{ row.content_format === 1 ? 'HTML' : 'MD' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="生效时间" width="120">
          <template #default="{ row }">{{ formatDate(row.effective_date) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success" size="small">生效中</el-tag>
            <el-tag v-else type="info" size="small">已下架</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="row.status !== 1" size="small" link type="success" @click="setStatus(row, 1)">启用</el-button>
            <el-button v-else size="small" link type="warning" @click="setStatus(row, 0)">停用</el-button>
            <el-popconfirm title="确认删除？" @confirm="remove(row)">
              <template #reference>
                <el-button size="small" link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑隐私政策' : '新建隐私政策'" width="800px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="版本号" prop="version">
          <el-input v-model="form.version" placeholder="如 1.1 / 1.0" />
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="如 YTads 隐私政策 v1.1" />
        </el-form-item>
        <el-form-item label="平台" prop="platform">
          <el-radio-group v-model="form.platform">
            <el-radio :value="1">Android</el-radio>
            <el-radio :value="2">iOS</el-radio>
            <el-radio :value="null">通用（全部平台）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="格式" prop="content_format">
          <el-radio-group v-model="form.content_format">
            <el-radio :value="1">HTML（富文本）</el-radio>
            <el-radio :value="2">Markdown</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生效时间" prop="effective_date">
          <el-date-picker v-model="form.effective_date" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">立即生效</el-radio>
            <el-radio :value="0">仅存档</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="简短摘要（可选）" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="16"
            :placeholder="form.content_format === 1 ? '支持 HTML' : '支持 Markdown'"
          />
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

interface Policy {
  id: number;
  version: string;
  platform: 1 | 2 | null;
  title: string;
  content_format: 1 | 2;
  content: string;
  summary?: string;
  effective_date?: string;
  status: number;
  created_by?: string;
  created_at?: string;
}

const policies = ref<Policy[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<number | null>(null);

const defaultForm = (): Partial<Policy> => ({
  version: '',
  title: '',
  platform: 1,
  content_format: 2,
  content: '',
  summary: '',
  effective_date: new Date().toISOString().slice(0, 19),
  status: 1,
});

const form = ref<Partial<Policy>>(defaultForm());

const rules: FormRules = {
  version: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content_format: [{ required: true, message: '请选择格式', trigger: 'change' }],
  effective_date: [{ required: true, message: '请选择生效时间', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
};

const formatDate = (date?: string): string => {
  if (!date) return '—';
  return new Date(date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const loadList = async () => {
  loading.value = true;
  try {
    const res: any = await request.get('/api/v1/sdk-cms/admin/privacy');
    policies.value = res.data || [];
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

const openEdit = (row: Policy) => {
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
    const payload: Partial<Policy> = { ...form.value };
    // null 平台：转为 undefined（不传给 DB）
    if (payload.platform === null) delete payload.platform;
    if (isEdit.value && editingId.value) {
      await request.put(`/api/v1/sdk-cms/admin/privacy/${editingId.value}`, payload);
      ElMessage.success('已保存');
    } else {
      await request.post('/api/v1/sdk-cms/admin/privacy', payload);
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

const setStatus = async (row: Policy, val: 0 | 1) => {
  try {
    await request.put(`/api/v1/sdk-cms/admin/privacy/${row.id}`, { status: val });
    row.status = val;
    ElMessage.success(val === 1 ? '已启用' : '已停用');
  } catch {
    /* ignore */
  }
};

const remove = async (row: Policy) => {
  try {
    await request.delete(`/api/v1/sdk-cms/admin/privacy/${row.id}`);
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
