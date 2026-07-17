<template>
  <div class="page-container sdk-home">
    <!-- 顶部 Hero -->
    <div class="sdk-hero">
      <div class="hero-left">
        <div class="hero-eyebrow">YTads 聚合 SDK</div>
        <h1 class="hero-title">高性能 · 易集成 · 多平台</h1>
        <p class="hero-desc">
          一套 SDK 接入主流广告平台，标准化的瀑布流配置和流量分组策略，<br />
          帮助你把 eCPM 最大化。
        </p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="goDocs">
            <el-icon><Reading /></el-icon> 快速开始
          </el-button>
          <el-button size="large" @click="goHistory">
            <el-icon><Histogram /></el-icon> 版本历史
          </el-button>
          <el-button size="large" @click="goPrivacy">
            <el-icon><Lock /></el-icon> 隐私政策
          </el-button>
        </div>
      </div>
      <div class="hero-right">
        <div class="hero-platform-card">
          <div class="platform-card-header">
            <el-icon :size="20"><Cellphone /></el-icon>
            <span>当前推荐版本</span>
          </div>
          <div class="platform-card-version">
            <span class="version-platform">Android</span>
            <span class="version-num">{{ latestAndroid?.version || '—' }}</span>
            <el-tag v-if="latestAndroid?.is_force_update" type="danger" size="small">强制升级</el-tag>
            <el-tag v-else type="success" size="small">推荐</el-tag>
          </div>
          <div class="platform-card-meta">
            <div>最低系统：Android {{ latestAndroid?.min_os_version || '5.0' }}</div>
            <div>包大小：{{ formatSize(latestAndroid?.file_size) }}</div>
            <div>更新时间：{{ formatDate(latestAndroid?.release_date) }}</div>
          </div>
          <el-button
            type="primary"
            class="download-btn"
            :loading="downloadingId === latestAndroid?.id"
            :disabled="!latestAndroid"
            @click="handleDownload(latestAndroid)"
          >
            <el-icon><Download /></el-icon>
            下载 AAR 包
          </el-button>
        </div>
        <div class="hero-platform-card">
          <div class="platform-card-header">
            <el-icon :size="20"><Iphone /></el-icon>
            <span>当前推荐版本</span>
          </div>
          <div class="platform-card-version">
            <span class="version-platform">iOS</span>
            <span class="version-num">{{ latestIos?.version || '—' }}</span>
            <el-tag v-if="latestIos?.is_force_update" type="danger" size="small">强制升级</el-tag>
            <el-tag v-else type="success" size="small">推荐</el-tag>
          </div>
          <div class="platform-card-meta">
            <div>最低系统：iOS {{ latestIos?.min_os_version || '11.0' }}</div>
            <div>包大小：{{ formatSize(latestIos?.file_size) }}</div>
            <div>更新时间：{{ formatDate(latestIos?.release_date) }}</div>
          </div>
          <el-button
            type="primary"
            class="download-btn"
            :loading="downloadingId === latestIos?.id"
            :disabled="!latestIos"
            @click="handleDownload(latestIos)"
          >
            <el-icon><Download /></el-icon>
            下载 Framework
          </el-button>
        </div>
      </div>
    </div>

    <!-- 平台选择 Tab -->
    <div class="table-card mb-base">
      <div class="card-title-row">
        <div class="card-title">最新发布说明</div>
        <el-radio-group v-model="activePlatform" size="small">
          <el-radio-button :value="1">Android</el-radio-button>
          <el-radio-button :value="2">iOS</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="latestForActive" class="latest-changelog" v-html="renderMarkdown(latestForActive.changelog || '暂无更新说明')" />
      <div v-else class="empty-block">暂无该平台的发布版本</div>
    </div>

    <!-- 快速开始卡片 -->
    <div class="sdk-feature-grid">
      <div class="feature-card" @click="goDocs">
        <div class="feature-icon feature-icon--blue"><el-icon :size="24"><Reading /></el-icon></div>
        <div class="feature-title">技术文档</div>
        <div class="feature-desc">快速开始、集成指南、API 参考、常见问题</div>
      </div>
      <div class="feature-card" @click="goHistory">
        <div class="feature-icon feature-icon--green"><el-icon :size="24"><Histogram /></el-icon></div>
        <div class="feature-title">版本历史</div>
        <div class="feature-desc">查看 SDK 全部历史版本的升级指南</div>
      </div>
      <div class="feature-card" @click="goPrivacy">
        <div class="feature-icon feature-icon--orange"><el-icon :size="24"><Lock /></el-icon></div>
        <div class="feature-title">隐私政策</div>
        <div class="feature-desc">了解 SDK 收集的数据范围与合规说明</div>
      </div>
      <div class="feature-card" @click="goApiReference">
        <div class="feature-icon feature-icon--purple"><el-icon :size="24"><Connection /></el-icon></div>
        <div class="feature-title">服务端 API</div>
        <div class="feature-desc">广告请求与数据上报的 REST API 文档</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Cellphone, Iphone, Download, Reading, Histogram, Lock, Connection } from '@element-plus/icons-vue';
import MarkdownIt from 'markdown-it';
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
}

const router = useRouter();
const md = new MarkdownIt({ html: true, linkify: true, breaks: true });

const allReleases = ref<Release[]>([]);
const latestAndroid = ref<Release | null>(null);
const latestIos = ref<Release | null>(null);
const activePlatform = ref<1 | 2>(1);
const downloadingId = ref<number | null>(null);

const latestForActive = computed<Release | null>(() => {
  if (activePlatform.value === 1) return latestAndroid.value;
  return latestIos.value;
});

const renderMarkdown = (text: string) => md.render(text);

const formatSize = (size?: number): string => {
  if (!size) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

const formatDate = (date?: string): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const loadReleases = async () => {
  try {
    const res: any = await request.get('/api/v1/sdk-cms/releases');
    allReleases.value = res.data || [];
    latestAndroid.value = allReleases.value.find((r) => r.platform === 1 && r.is_latest) || null;
    latestIos.value = allReleases.value.find((r) => r.platform === 2 && r.is_latest) || null;
  } catch {
    /* ignore */
  }
};

const handleDownload = async (release: Release | null) => {
  if (!release) return;
  downloadingId.value = release.id;
  try {
    const res: any = await request.post(`/api/v1/sdk-cms/releases/${release.id}/download`, {});
    const url = res.data?.download_url;
    if (url) {
      ElMessage.success(`开始下载 ${release.version}`);
      // 跳转到 OSS / 静态下载链接（新标签）
      window.open(url, '_blank');
    } else {
      ElMessage.warning('该版本暂未提供下载链接');
    }
  } catch {
    /* request 拦截器已弹错 */
  } finally {
    downloadingId.value = null;
  }
};

const goDocs = () => router.push('/sdk/docs');
const goHistory = () => router.push('/sdk/history');
const goPrivacy = () => router.push('/sdk/privacy');
const goApiReference = () => router.push('/sdk/docs');

onMounted(() => {
  loadReleases();
});
</script>
