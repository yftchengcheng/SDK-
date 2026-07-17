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
        <el-table-column label="来源" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.source_url" type="warning" size="small" effect="plain">
              <el-icon><Link /></el-icon> 外链
            </el-tag>
            <el-tag v-else :type="row.content_format === 1 ? 'primary' : 'info'" size="small" effect="plain">
              {{ row.content_format === 1 ? 'HTML' : 'MD' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="hasExternalPolicy" label="外链地址" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <a v-if="row.source_url" :href="row.source_url" target="_blank" class="ext-link">{{ row.source_url }}</a>
            <span v-else class="muted">—</span>
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
        <el-form-item label="内容来源" prop="source_type">
          <el-radio-group v-model="form.source_type">
            <el-radio :value="'internal'">内部内容（HTML / Markdown）</el-radio>
            <el-radio :value="'external'">外部链接（跳转 / 嵌入官方页面）</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="form.source_type === 'external'">
          <el-form-item label="外链地址" prop="source_url">
            <el-input v-model="form.source_url" placeholder="https://docs.example.com/privacy.html" clearable>
              <template #append>
                <el-button :disabled="!form.source_url" @click="previewExternal">预览</el-button>
              </template>
            </el-input>
            <div class="form-hint">
              开发者端默认在站内嵌入此页面（iframe）；用户也可"前往查看原文"打开新窗口。
            </div>
          </el-form-item>
          <el-form-item label="摘要">
            <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="简短摘要（可选，展示在嵌入式页面顶部）" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="格式" prop="content_format">
            <el-radio-group v-model="form.content_format">
              <el-radio :value="1">HTML（富文本）</el-radio>
              <el-radio :value="2">Markdown</el-radio>
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
        </template>
        <el-form-item label="生效时间" prop="effective_date">
          <el-date-picker v-model="form.effective_date" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">立即生效</el-radio>
            <el-radio :value="0">仅存档</el-radio>
          </el-radio-group>
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
import { ref, computed, onMounted } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Link } from '@element-plus/icons-vue';
import request from '@/utils/request';

interface Policy {
  id: number;
  version: string;
  platform: 1 | 2 | null;
  title: string;
  content_format: 1 | 2 | 3;
  content: string;
  summary?: string;
  source_url?: string;
  effective_date?: string;
  status: number;
  created_by?: string;
  created_at?: string;
}

type SourceType = 'internal' | 'external';

interface FormState extends Partial<Policy> {
  source_type: SourceType;
}

const policies = ref<Policy[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<number | null>(null);

const hasExternalPolicy = computed(() => policies.value.some(p => !!p.source_url));

const defaultForm = (): FormState => ({
  version: '',
  title: '',
  platform: 1,
  content_format: 2,
  content: '',
  summary: '',
  source_url: '',
  source_type: 'internal',
  effective_date: new Date().toISOString().slice(0, 19),
  status: 1,
});

const form = ref<FormState>(defaultForm());

const rules: FormRules = {
  version: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  effective_date: [{ required: true, message: '请选择生效时间', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  source_url: [
    {
      validator: (_r, v, cb) => {
        if (form.value.source_type === 'external' && !v) return cb(new Error('请输入外链地址'));
        if (v && !/^https?:\/\//i.test(String(v))) return cb(new Error('外链必须以 http:// 或 https:// 开头'));
        cb();
      },
      trigger: 'blur',
    },
  ],
  content: [
    {
      validator: (_r, v, cb) => {
        if (form.value.source_type === 'internal' && !v) return cb(new Error('请输入内容'));
        cb();
      },
      trigger: 'blur',
    },
  ],
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
  form.value = {
    ...row,
    source_type: row.source_url ? 'external' : 'internal',
  };
  dialogVisible.value = true;
};

const previewExternal = () => {
  if (!form.value.source_url) return;
  window.open(form.value.source_url, '_blank', 'noopener,noreferrer');
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
    // 拆分 source_type → source_url / content_format
    const isExternal = form.value.source_type === 'external';
    const payload: Partial<Policy> = {
      version: form.value.version,
      title: form.value.title,
      platform: form.value.platform,
      summary: form.value.summary,
      effective_date: form.value.effective_date,
      status: form.value.status,
    };
    if (isExternal) {
      payload.source_url = form.value.source_url;
      payload.content = '';
      payload.content_format = 3;
    } else {
      payload.source_url = '';
      payload.content = form.value.content;
      payload.content_format = form.value.content_format;
    }
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
