<template>
  <div class="page-container admin-sdk-docs">
    <div class="table-card mb-base">
      <div class="card-title-row">
        <div class="card-title">技术文档管理</div>
        <div class="header-actions">
          <el-select v-model="categoryFilter" placeholder="按分类筛选" clearable size="small" style="width: 200px" @change="loadList">
            <el-option v-for="c in categories" :key="c.id" :value="c.id" :label="c.name" />
          </el-select>
          <el-button type="primary" size="small" @click="openCreate">
            <el-icon><Plus /></el-icon> 新建文档
          </el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="docs" stripe size="small">
        <el-table-column label="ID" prop="id" width="60" />
        <el-table-column label="分类" width="140">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ getCategoryName(row.category_id) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标题" prop="title" min-width="240" show-overflow-tooltip />
        <el-table-column label="格式" width="80">
          <template #default="{ row }">
            <el-tag :type="row.content_format === 1 ? 'warning' : 'info'" size="small" effect="plain">
              {{ row.content_format === 1 ? 'HTML' : 'MD' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sort_order" width="80" />
        <el-table-column label="推荐" width="80">
          <template #default="{ row }">
            <el-icon v-if="row.is_featured" :size="16" color="#F59E0B"><StarFilled /></el-icon>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="已发布" width="90">
          <template #default="{ row }">
            <el-switch :model-value="row.is_published" @change="(v: boolean) => togglePublish(row, v)" />
          </template>
        </el-table-column>
        <el-table-column label="阅读" prop="view_count" width="80" />
        <el-table-column label="更新时间" width="160">
          <template #default="{ row }">{{ formatDate(row.updated_at || row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确认删除？" @confirm="remove(row)">
              <template #reference>
                <el-button size="small" link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑文档' : '新建文档'" width="900px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="文档标题" />
        </el-form-item>
        <el-form-item label="分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="选择分类" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :value="c.id" :label="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="Slug">
          <el-input v-model="form.slug" placeholder="URL 友好别名（可选）" />
        </el-form-item>
        <el-form-item label="格式" prop="content_format">
          <el-radio-group v-model="form.content_format" @change="onFormatChange">
            <el-radio :value="1">HTML（富文本）</el-radio>
            <el-radio :value="2">Markdown</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="form.excerpt" type="textarea" :rows="2" placeholder="简短描述（列表页显示）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="推荐">
          <el-switch v-model="form.is_featured" />
        </el-form-item>
        <el-form-item v-if="form.is_published !== undefined" label="发布状态">
          <el-switch v-model="form.is_published" active-text="已发布" inactive-text="草稿" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            :type="form.content_format === 1 ? 'textarea' : 'textarea'"
            :rows="14"
            :placeholder="form.content_format === 1 ? '支持 HTML 标签，例如 <h2>标题</h2>' : '支持 Markdown 语法，例如 ## 标题'"
          />
          <div class="form-hint">
            开发者端查看时会根据格式自动渲染。
            <span v-if="form.content_format === 1">HTML 模式下请确保来源可信，避免 XSS。</span>
            <span v-else>Markdown 模式推荐使用 GFM 语法。</span>
          </div>
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
import { Plus, StarFilled } from '@element-plus/icons-vue';
import request from '@/utils/request';

interface Doc {
  id: number;
  category_id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  content_format: 1 | 2;
  view_count?: number;
  is_featured?: boolean;
  is_published?: boolean;
  sort_order?: number;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  cover_url?: string;
}

interface Category {
  id: number;
  name: string;
  code: string;
}

const docs = ref<Doc[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(false);
const categoryFilter = ref<number | null>(null);

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<number | null>(null);

const defaultForm = (): Partial<Doc> => ({
  category_id: undefined,
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  content_format: 2,
  sort_order: 0,
  is_featured: false,
  is_published: true,
});

const form = ref<Partial<Doc>>(defaultForm());

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content_format: [{ required: true, message: '请选择格式', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
};

const getCategoryName = (id?: number): string => {
  if (!id) return '—';
  return categories.value.find((c) => c.id === id)?.name || `#${id}`;
};

const formatDate = (date?: string): string => {
  if (!date) return '—';
  return new Date(date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const loadCategories = async () => {
  try {
    const res: any = await request.get('/api/v1/sdk-cms/doc-categories');
    categories.value = res.data || [];
  } catch {
    /* ignore */
  }
};

const loadList = async () => {
  loading.value = true;
  try {
    const res: any = await request.get('/api/v1/sdk-cms/admin/docs');
    let list: Doc[] = res.data || [];
    if (categoryFilter.value) {
      list = list.filter((d) => d.category_id === categoryFilter.value);
    }
    docs.value = list;
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

const openEdit = (row: Doc) => {
  isEdit.value = true;
  editingId.value = row.id;
  form.value = { ...row };
  dialogVisible.value = true;
};

const onFormatChange = () => {
  // 格式切换不影响字段
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
    const payload: Partial<Doc> = { ...form.value };
    if (payload.is_published && !payload.published_at) {
      payload.published_at = new Date().toISOString();
    }
    if (isEdit.value && editingId.value) {
      await request.put(`/api/v1/sdk-cms/admin/docs/${editingId.value}`, payload);
      ElMessage.success('已保存');
    } else {
      await request.post('/api/v1/sdk-cms/admin/docs', payload);
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

const togglePublish = async (row: Doc, val: boolean) => {
  try {
    await request.put(`/api/v1/sdk-cms/admin/docs/${row.id}`, {
      is_published: val,
      published_at: val ? new Date().toISOString() : null,
    });
    row.is_published = val;
    ElMessage.success(val ? '已发布' : '已下架');
  } catch {
    /* ignore */
  }
};

const remove = async (row: Doc) => {
  try {
    await request.delete(`/api/v1/sdk-cms/admin/docs/${row.id}`);
    ElMessage.success('已删除');
    await loadList();
  } catch {
    /* ignore */
  }
};

onMounted(async () => {
  await loadCategories();
  await loadList();
});
</script>
