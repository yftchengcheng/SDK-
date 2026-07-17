<template>
  <div class="page-container sdk-privacy">
    <div class="table-card mb-base">
      <div class="card-title">隐私政策</div>
      <p class="privacy-intro">
        本页面展示 YTads 聚合 SDK 收集、使用、存储和保护用户个人信息的相关条款。<br />
        请仔细阅读，确保你的应用符合《个人信息保护法》及行业规范。
      </p>
      <el-radio-group v-model="activePlatform" size="default" class="privacy-tabs">
        <el-radio-button :value="1">
          <el-icon><Cellphone /></el-icon> Android
        </el-radio-button>
        <el-radio-button :value="2">
          <el-icon><Iphone /></el-icon> iOS
        </el-radio-button>
      </el-radio-group>
    </div>

    <div v-if="policy" class="table-card">
      <div class="privacy-header">
        <div>
          <h2 class="privacy-title">{{ policy.title }}</h2>
          <div class="privacy-meta">
            <el-tag effect="plain" size="small">版本 {{ policy.version }}</el-tag>
            <el-tag effect="plain" size="small" type="success">生效中</el-tag>
            <span class="privacy-date">生效时间：{{ formatDate(policy.effective_date) }}</span>
          </div>
        </div>
        <el-button v-if="!consented" type="primary" @click="onConsent">我已阅读并同意</el-button>
        <el-button v-else type="success" disabled>
          <el-icon><Check /></el-icon> 已同意
        </el-button>
      </div>
      <div class="privacy-divider" />
      <div v-if="policy.summary" class="privacy-summary">{{ policy.summary }}</div>
      <div class="privacy-content">
        <div v-if="policy.content_format === 1" v-html="policy.content" />
        <div v-else v-html="renderMarkdown(policy.content || '')" />
      </div>
    </div>
    <div v-else class="table-card empty-block">暂无隐私政策</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Cellphone, Iphone, Check } from '@element-plus/icons-vue';
import MarkdownIt from 'markdown-it';
import request from '@/utils/request';
import { useUserStore } from '@/stores/user';

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
}

const userStore = useUserStore();
const md = new MarkdownIt({ html: true, linkify: true, breaks: true });

const activePlatform = ref<1 | 2>(1);
const policy = ref<Policy | null>(null);
const consented = ref(false);

const renderMarkdown = (text: string) => md.render(text);

const formatDate = (date?: string): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const loadPolicy = async () => {
  try {
    const res: any = await request.get('/api/v1/sdk-cms/privacy/policy', { params: { platform: activePlatform.value } });
    policy.value = res.data;
  } catch {
    policy.value = null;
  }
};

const onConsent = async () => {
  if (!policy.value) return;
  if (!userStore.userInfo) {
    ElMessage.warning('请先登录');
    return;
  }
  try {
    await request.post('/api/v1/sdk-cms/privacy/consent', {
      privacy_id: policy.value.id,
      developer_id: userStore.userInfo.developerId,
      user_agent: navigator.userAgent,
    });
    consented.value = true;
    ElMessage.success('已记录您的同意');
  } catch {
    /* request 已弹错 */
  }
};

watch(activePlatform, () => {
  loadPolicy();
});

onMounted(() => {
  loadPolicy();
});
</script>
