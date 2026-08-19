<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="导出SDK预置策略"
    width="720px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="true"
    destroy-on-close
    @open="handleOpen"
  >
    <!-- 注意事项 -->
    <div class="policy-notice">
      <div class="policy-notice__title">注意事项</div>
      <ol class="policy-notice__list">
        <li>修改SDK预置策略后需等待 <strong>15 分钟</strong>完成服务端同步，方可执行导出操作；</li>
        <li>应用管理支持批量导出策略文件，需确保 <strong>SDK 版本 ≥ 6.4.58</strong> 且与集成版本一致，详情<a href="#" target="_blank">帮助文档</a>；</li>
        <li>常规/共享广告位策略须通过聚合管理新建，<strong>共享位须绑定常规广告位</strong>方可导出策略；</li>
        <li>存在 AB 实验的广告位流量分组将无法在「待确定聚合广告位」中选取；</li>
        <li>未选择聚合广告位时仍可导出应用策略优化共享位请求，<strong>建议同步导出共享位策略</strong>以确保效果。</li>
      </ol>
    </div>

    <!-- 表单区 -->
    <el-form :model="form" label-width="140px" label-position="left" class="policy-form">
      <el-form-item label="请选择聚合SDK版本" required>
        <el-select v-model="form.sdkVersion" placeholder="请选择" size="default" style="width: 240px">
          <el-option v-for="opt in sdkVersions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="共享位指定生效应用版本号">
        <el-select v-model="form.effectVersion" placeholder="请选择" size="default" style="width: 240px">
          <el-option v-for="opt in effectVersions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="已选择应用" required>
        <div class="policy-app-cards">
          <div v-for="a in selectedApps" :key="a.app_key" class="policy-app-card">
            <div class="policy-app-card__icon">{{ (a.app_name || '?').charAt(0) }}</div>
            <div class="policy-app-card__info">
              <div class="policy-app-card__name">{{ a.app_name }}</div>
              <div class="policy-app-card__id">
                ID: {{ a.app_key }}
                <el-icon class="policy-app-card__copy" @click="copyText(a.app_key)"><CopyDocument /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <!-- 双栏聚合广告位选择器 -->
    <div class="policy-dual">
      <div class="policy-dual__col">
        <div class="policy-dual__title">待确定聚合广告位</div>
        <div class="policy-dual__list">
          <el-empty v-if="leftList.length === 0" description="暂无可选广告位" :image-size="80" />
          <div
            v-for="item in leftList"
            :key="item.placementId"
            class="policy-dual__item"
            @click="moveToRight(item)"
          >
            <div class="policy-dual__item-main">
              <div class="policy-dual__item-name">{{ item.name }}</div>
              <div class="policy-dual__item-meta">
                <span>{{ item.appName }}</span>
                <span class="policy-dual__item-format">{{ formatLabel(item.format) }}</span>
                <el-tag v-if="item.isShared" type="warning" size="small">共享位</el-tag>
              </div>
            </div>
            <el-icon class="policy-dual__item-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
      <div class="policy-dual__col">
        <div class="policy-dual__title">已确定聚合广告位</div>
        <div class="policy-dual__list">
          <el-empty v-if="rightList.length === 0" description="尚未选择聚合广告位" :image-size="80" />
          <div
            v-for="(item, idx) in rightList"
            :key="item.placementId"
            class="policy-dual__item policy-dual__item--selected"
            @click="moveToLeft(idx)"
          >
            <div class="policy-dual__item-main">
              <div class="policy-dual__item-name">{{ item.name }}</div>
              <div class="policy-dual__item-meta">
                <span>{{ item.appName }}</span>
                <span class="policy-dual__item-format">{{ formatLabel(item.format) }}</span>
                <el-tag v-if="item.isShared" type="warning" size="small">共享位</el-tag>
              </div>
            </div>
            <el-icon class="policy-dual__item-arrow"><ArrowLeft /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">
        {{ submitting ? '导出中...' : '确定' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { CopyDocument, ArrowRight, ArrowLeft } from '@element-plus/icons-vue';
import request from '@/utils/request';
import { downloadFile } from '@/utils/download';

interface AppItem {
  app_key: string;
  app_name: string;
}

interface CandidateItem {
  id: number;
  placementId: string;
  name: string;
  appKey: string;
  appName: string;
  format: number;
  status: number;
  isShared: boolean;
  bindRegularPlacementId: string | null;
  sdkVersionMin: string | null;
}

const props = defineProps<{
  visible: boolean;
  app?: AppItem | null;
  extraApps?: AppItem[]; // 多选导出时的额外应用
}>();

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
}>();

const form = reactive({
  sdkVersion: '',
  effectVersion: '',
});

const sdkVersions = ref<Array<{ value: string; label: string; isMin: boolean }>>([]);
const effectVersions = ref<Array<{ value: string; label: string }>>([]);

const candidates = ref<CandidateItem[]>([]);
const rightList = ref<CandidateItem[]>([]);
const submitting = ref(false);

const selectedApps = computed<AppItem[]>(() => {
  const list: AppItem[] = [];
  if (props.app) list.push(props.app);
  if (props.extraApps && props.extraApps.length > 0) {
    for (const a of props.extraApps) {
      if (!list.find((x) => x.app_key === a.app_key)) list.push(a);
    }
  }
  return list;
});

const leftList = computed<CandidateItem[]>(() => {
  const rightIds = new Set(rightList.value.map((r) => r.placementId));
  return candidates.value.filter((c) => !rightIds.has(c.placementId));
});

const FORMAT_LABELS: Record<number, string> = {
  1: '横幅',
  2: '插屏',
  3: '原生',
  4: '激励',
  5: '开屏',
};
function formatLabel(fmt: number): string {
  return FORMAT_LABELS[fmt] || `类型${fmt}`;
}

function copyText(text: string): void {
  void navigator.clipboard?.writeText(text);
  ElMessage.success('已复制');
}

function moveToRight(item: CandidateItem): void {
  if (rightList.value.find((r) => r.placementId === item.placementId)) return;
  rightList.value.push({ ...item });
}

function moveToLeft(idx: number): void {
  rightList.value.splice(idx, 1);
}

async function handleOpen(): Promise<void> {
  form.sdkVersion = '';
  form.effectVersion = '';
  rightList.value = [];
  candidates.value = [];
  await Promise.all([loadSdkVersions(), loadEffectVersions(), loadCandidates()]);
}

async function loadSdkVersions(): Promise<void> {
  try {
    const res = await request.get<{ value: string; label: string; isMin: boolean }[]>(
      '/api/v1/console/app/sdk-versions',
    );
    sdkVersions.value = res.data || [];
  } catch (err) {
    console.error('loadSdkVersions error', err);
  }
}

async function loadEffectVersions(): Promise<void> {
  if (!props.app) return;
  try {
    const res = await request.get<{ value: string; label: string }[]>(
      `/api/v1/console/app/effect-versions?appKey=${encodeURIComponent(props.app.app_key)}`,
    );
    effectVersions.value = res.data || [];
  } catch (err) {
    console.error('loadEffectVersions error', err);
  }
}

async function loadCandidates(): Promise<void> {
  const appKeys = selectedApps.value.map((a) => a.app_key);
  if (appKeys.length === 0) {
    candidates.value = [];
    return;
  }
  try {
    const res = await request.get<CandidateItem[]>(
      `/api/v1/console/app/placement-candidates?appKeys=${encodeURIComponent(appKeys.join(','))}`,
    );
    candidates.value = res.data || [];
  } catch (err) {
    console.error('loadCandidates error', err);
    candidates.value = [];
  }
}

watch(
  () => selectedApps.value.map((a) => a.app_key).join(','),
  () => {
    if (props.visible) void loadCandidates();
  },
);

function handleCancel(): void {
  emit('update:visible', false);
}

async function handleConfirm(): Promise<void> {
  if (!form.sdkVersion) {
    ElMessage.warning('请选择聚合 SDK 版本');
    return;
  }
  if (selectedApps.value.length === 0) {
    ElMessage.warning('请至少选择一个应用');
    return;
  }
  if (rightList.value.length === 0) {
    ElMessage.warning('请至少选择一个聚合广告位');
    return;
  }
  submitting.value = true;
  try {
    const payload = {
      sdkVersion: form.sdkVersion,
      effectVersion: form.effectVersion,
      appKeys: selectedApps.value.map((a) => a.app_key),
      placementIds: rightList.value.map((r) => r.placementId),
    };
    const res = await request.post<{
      downloadUrl: string;
      filename: string;
      expiresAt: number;
    }>('/api/v1/console/app/export-sdk-policy', payload);
    const { downloadUrl, filename } = res.data;
    ElMessage.success('策略生成成功，开始下载');
    await downloadFile(downloadUrl, filename);
    emit('update:visible', false);
  } catch (err) {
    console.error('export error', err);
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      || '导出失败';
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
}
</script>

