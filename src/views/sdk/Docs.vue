<template>
  <div class="page-container sdk-docs">
    <div class="docs-layout">
      <!-- 左侧：文档分类 -->
      <aside class="docs-sidebar">
        <div class="docs-sidebar-title">文档分类</div>
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="docs-cat-item"
          :class="{ active: activeCategoryId === cat.id }"
          @click="selectCategory(cat.id)"
        >
          <el-icon :size="14"><component :is="cat.icon || 'Document'" /></el-icon>
          <span>{{ cat.name }}</span>
        </div>
      </aside>

      <!-- 中间：文档列表 -->
      <div class="docs-list">
        <div class="docs-list-header">
          <span class="docs-list-title">{{ activeCategoryName }}</span>
          <span class="docs-list-count">共 {{ docs.length }} 篇</span>
        </div>
        <div
          v-for="doc in docs"
          :key="doc.id"
          class="docs-list-item"
          :class="{ active: activeDocId === doc.id }"
          @click="selectDoc(doc.id)"
        >
          <div class="docs-list-item-title">
            <el-icon v-if="doc.is_featured" :size="12" color="#F59E0B"><StarFilled /></el-icon>
            {{ doc.title }}
          </div>
          <div v-if="doc.excerpt" class="docs-list-item-excerpt">{{ doc.excerpt }}</div>
          <div class="docs-list-item-meta">
            <span><el-icon :size="11"><View /></el-icon> {{ doc.view_count || 0 }} 阅读</span>
            <span><el-icon :size="11"><Clock /></el-icon> {{ formatDate(doc.published_at || doc.created_at) }}</span>
            <el-tag v-if="doc.content_format === 1" size="small" type="warning" effect="plain">HTML</el-tag>
            <el-tag v-else size="small" effect="plain">Markdown</el-tag>
          </div>
        </div>
        <div v-if="docs.length === 0" class="empty-block">该分类暂无文档</div>
      </div>

      <!-- 右侧：文档详情 -->
      <div class="docs-detail">
        <div v-if="activeDoc" class="docs-detail-inner">
          <h1 class="docs-detail-title">{{ activeDoc.title }}</h1>
          <div class="docs-detail-meta">
            <span><el-icon :size="11"><Clock /></el-icon> {{ formatDate(activeDoc.published_at || activeDoc.created_at) }}</span>
            <span><el-icon :size="11"><View /></el-icon> {{ activeDoc.view_count || 0 }} 阅读</span>
            <el-tag v-if="activeDoc.content_format === 1" size="small" type="warning" effect="plain">HTML</el-tag>
            <el-tag v-else size="small" effect="plain">Markdown</el-tag>
          </div>
          <div class="docs-detail-divider" />
          <div class="docs-detail-content">
            <div v-if="activeDoc.content_format === 1" v-html="activeDoc.content" />
            <div v-else v-html="renderMarkdown(activeDoc.content || '')" />
          </div>
        </div>
        <div v-else class="empty-block">从左侧选择一篇文档查看详情</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Document, StarFilled, View, Clock } from '@element-plus/icons-vue';
import MarkdownIt from 'markdown-it';
import request from '@/utils/request';

interface Category {
  id: number;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  sort_order?: number;
}

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
  published_at?: string;
  created_at?: string;
  cover_url?: string;
}

const route = useRoute();
const md = new MarkdownIt({ html: true, linkify: true, breaks: true });

const categories = ref<Category[]>([]);
const docs = ref<Doc[]>([]);
const allDocs = ref<Record<number, Doc[]>>({});
const activeCategoryId = ref<number | null>(null);
const activeDocId = ref<number | null>(null);
const activeDoc = ref<Doc | null>(null);

const activeCategoryName = computed(() => {
  const cat = categories.value.find((c) => c.id === activeCategoryId.value);
  return cat?.name || '请选择分类';
});

const renderMarkdown = (text: string) => md.render(text);

const formatDate = (date?: string): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const loadCategories = async () => {
  try {
    const res: any = await request.get('/api/v1/sdk-cms/doc-categories');
    categories.value = res.data || [];
    if (categories.value.length > 0 && activeCategoryId.value === null) {
      selectCategory(categories.value[0].id);
    }
  } catch {
    /* ignore */
  }
};

const loadDocs = async (categoryId: number) => {
  if (allDocs.value[categoryId]) {
    docs.value = allDocs.value[categoryId];
    return;
  }
  try {
    const res: any = await request.get('/api/v1/sdk-cms/docs', { params: { category_id: categoryId } });
    allDocs.value[categoryId] = res.data || [];
    docs.value = allDocs.value[categoryId];
  } catch {
    /* ignore */
  }
};

const loadDoc = async (id: number) => {
  try {
    const res: any = await request.get(`/api/v1/sdk-cms/docs/${id}`);
    activeDoc.value = res.data;
  } catch {
    activeDoc.value = null;
  }
};

const selectCategory = (id: number) => {
  activeCategoryId.value = id;
  activeDocId.value = null;
  activeDoc.value = null;
  loadDocs(id);
};

const selectDoc = (id: number) => {
  activeDocId.value = id;
  loadDoc(id);
};

// 监听路由 query（支持 ?doc=xx 直接打开）
watch(
  () => route.query,
  (q) => {
    const docId = Number(q.doc || 0);
    if (docId && docId !== activeDocId.value) {
      activeDocId.value = docId;
      loadDoc(docId);
    }
  }
);

onMounted(async () => {
  await loadCategories();
  // 处理 ?doc= 参数
  const docId = Number(route.query.doc || 0);
  if (docId) {
    activeDocId.value = docId;
    await loadDoc(docId);
  }
});
</script>
