<template>
  <div class="page-container sdk-history">
    <div class="table-card mb-base">
      <div class="card-title-row">
        <div class="card-title">版本历史</div>
        <el-radio-group v-model="activePlatform" size="small">
          <el-radio-button :value="1">Android</el-radio-button>
          <el-radio-button :value="2">iOS</el-radio-button>
        </el-radio-group>
      </div>
      <p class="history-intro">
        按发布时间倒序排列，建议保持 SDK 在最新稳定版本，以获得最佳性能与安全更新。
      </p>
    </div>

    <div v-if="releases.length > 0" class="history-timeline">
      <div v-for="r in releases" :key="r.id" class="history-item">
        <div class="history-dot" :class="{ 'is-latest': r.is_latest, 'is-force': r.is_force_update }" />
        <div class="history-card">
          <div class="history-header">
            <div class="history-version">
              <span class="history-version-num">v{{ r.version }}</span>
              <el-tag v-if="r.is_latest" type="success" size="small" effect="dark">最新</el-tag>
              <el-tag v-else-if="r.is_force_update" type="danger" size="small" effect="dark">强制升级</el-tag>
              <el-tag v-else-if="r.release_type === 1" type="primary" size="small" effect="plain">稳定版</el-tag>
              <el-tag v-else-if="r.release_type === 2" type="warning" size="small" effect="plain">测试版</el-tag>
              <el-tag v-else type="info" size="small" effect="plain">历史</el-tag>
            </div>
            <div class="history-date">{{ formatDate(r.release_date) }}</div>
          </div>
          <div class="history-meta">
            <span><el-icon :size="11"><Cellphone /></el-icon> {{ getPlatformLabel(r.platform) }}</span>
            <span v-if="r.min_os_version"><el-icon :size="11"><Platform /></el-icon> 最低 {{ getPlatformLabel(r.platform) }} {{ r.min_os_version }}</span>
            <span v-if="r.file_size"><el-icon :size="11"><Box /></el-icon> {{ formatSize(r.file_size) }}</span>
            <span v-if="r.sdk_min_version"><el-icon :size="11"><Link /></el-icon> 依赖 SDK {{ r.sdk_min_version }}</span>
          </div>
          <div class="history-changelog" v-html="renderMarkdown(r.changelog || '暂无说明')" />
          <div class="history-actions">
            <el-button
              v-if="r.download_url"
              type="primary"
              size="small"
              :loading="downloadingId === r.id"
              @click="handleDownload(r)"
            >
              <el-icon><Download /></el-icon> 下载此版本
            </el-button>
            <el-button size="small" @click="showDetail(r)">
              <el-icon><View /></el-icon> 详情
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="table-card empty-block">该平台暂无发布历史</div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="detail?.version ? `v${detail.version} 详细信息` : '版本详情'" width="640px">
      <div v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="版本号">{{ detail.version }}</el-descriptions-item>
          <el-descriptions-item label="版本代码">{{ detail.version_code || '—' }}</el-descriptions-item>
          <el-descriptions-item label="平台">{{ getPlatformLabel(detail.platform) }}</el-descriptions-item>
          <el-descriptions-item label="包大小">{{ formatSize(detail.file_size) }}</el-descriptions-item>
          <el-descriptions-item label="最低系统">{{ getPlatformLabel(detail.platform) }} {{ detail.min_os_version || '—' }}</el-descriptions-item>
          <el-descriptions-item label="MD5">{{ detail.file_md5 || '—' }}</el-descriptions-item>
          <el-descriptions-item label="依赖 SDK">{{ detail.sdk_min_version || '—' }}</el-descriptions-item>
          <el-descriptions-item label="发布类型">
            <el-tag v-if="detail.release_type === 1" type="primary" size="small">稳定版</el-tag>
            <el-tag v-else-if="detail.release_type === 2" type="warning" size="small">测试版</el-tag>
            <el-tag v-else type="info" size="small">历史</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ formatDate(detail.release_date) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="detail.status === 1" type="success" size="small">已发布</el-tag>
            <el-tag v-else type="info" size="small">已下架</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div class="detail-section-title">更新日志</div>
        <div class="detail-changelog" v-html="renderMarkdown(detail.changelog || '暂无说明')" />
      </div>
      <template #footer>
        <el-button v-if="detail?.download_url" type="primary" @click="handleDownload(detail!)">下载</el-button>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Cellphone, Platform, Box, Link, Download, View } from '@element-plus/icons-vue';
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

const md = new MarkdownIt({ html: true, linkify: true, breaks: true });

const activePlatform = ref<1 | 2>(1);
const allReleases = ref<Release[]>([]);
const downloadingId = ref<number | null>(null);
const detailVisible = ref(false);
const detail = ref<Release | null>(null);

const releases = computed<Release[]>(() =>
  allReleases.value.filter((r) => r.platform === activePlatform.value)
);

const renderMarkdown = (text: string) => md.render(text);

const formatDate = (date?: string): string => {
  if (!date) return '—';
  return new Date(date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const formatSize = (size?: number): string => {
  if (!size) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

const getPlatformLabel = (p?: 1 | 2) => (p === 1 ? 'Android' : p === 2 ? 'iOS' : '—');

const loadReleases = async () => {
  try {
    const res: any = await request.get('/api/v1/sdk-cms/releases');
    allReleases.value = res.data || [];
  } catch {
    /* ignore */
  }
};

const showDetail = (r: Release) => {
  detail.value = r;
  detailVisible.value = true;
};

const handleDownload = async (r: Release | null) => {
  if (!r) return;
  downloadingId.value = r.id;
  try {
    const res: any = await request.post(`/api/v1/sdk-cms/releases/${r.id}/download`, {});
    const url = res.data?.download_url;
    if (url) {
      ElMessage.success(`开始下载 v${r.version}`);
      window.open(url, '_blank');
    } else {
      ElMessage.warning('该版本暂未提供下载链接');
    }
  } catch {
    /* ignore */
  } finally {
    downloadingId.value = null;
  }
};

watch(activePlatform, () => {
  // platform change 不需要重新加载，复用 allReleases
});

onMounted(() => {
  loadReleases();
});
</script>
