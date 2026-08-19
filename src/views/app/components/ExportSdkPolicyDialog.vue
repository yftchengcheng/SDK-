<template>
  <el-dialog
    custom-class="policy-dialog"
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    width="760px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="true"
    destroy-on-close
    align-center
    @open="handleOpen"
  >
    <template #header>
      <div class="policy-header">
        <div class="policy-header__icon">
          <el-icon :size="20"><Download /></el-icon>
        </div>
        <div class="policy-header__text">
          <div class="policy-header__title">导出SDK预置策略</div>
          <div class="policy-header__sub">将所选应用的广告位策略与指定 SDK 版本合并导出</div>
        </div>
      </div>
    </template>

    <!-- ============== Section 1 · 使用须知 ============== -->
    <section class="policy-section">
      <header class="policy-section__title">
        <span class="policy-section__bar" />
        <el-icon class="policy-section__icon"><InfoFilled /></el-icon>
        使用须知
      </header>
      <div class="policy-notice">
        <ol class="policy-notice__list">
          <li><span class="policy-notice__no">1</span><span>修改SDK预置策略后需等待 <em>15 分钟</em>完成服务端同步，方可执行导出操作</span></li>
          <li><span class="policy-notice__no">2</span><span>应用管理支持批量导出策略文件，需确保 <em>SDK 版本 ≥ 6.4.58</em> 且与集成版本一致，详情<a href="#" target="_blank">帮助文档</a></span></li>
          <li><span class="policy-notice__no">3</span><span>常规/共享广告位策略须通过聚合管理新建，<em>共享位须绑定常规广告位</em>方可导出策略</span></li>
          <li><span class="policy-notice__no">4</span><span>存在 AB 实验的广告位流量分组将无法在「待确定聚合广告位」中选取</span></li>
          <li><span class="policy-notice__no">5</span><span>未选择聚合广告位时仍可导出应用策略优化共享位请求，<em>建议同步导出共享位策略</em>以确保效果</span></li>
        </ol>
      </div>
    </section>

    <!-- ============== Section 2 · 基础配置 ============== -->
    <section class="policy-section">
      <header class="policy-section__title">
        <span class="policy-section__bar" />
        <span class="policy-section__no">1</span>
        基础配置
      </header>
      <el-form :model="form" label-position="top" class="policy-form">
        <div class="policy-form__row">
          <el-form-item label="请选择聚合SDK版本" required>
            <el-select v-model="form.sdkVersion" placeholder="请选择" style="width: 100%">
              <el-option v-for="opt in sdkVersions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="共享位指定生效应用版本号">
            <el-select v-model="form.effectVersion" placeholder="请选择" style="width: 100%">
              <el-option v-for="opt in effectVersions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
    </section>

    <!-- ============== Section 3 · 导出范围 ============== -->
    <section class="policy-section">
      <header class="policy-section__title">
        <span class="policy-section__bar" />
        <span class="policy-section__no">2</span>
        导出范围
      </header>

      <!-- 已选应用 -->
      <div class="policy-subsection">
        <div class="policy-subsection__label">
          已选择应用
          <span class="policy-subsection__required">*</span>
          <el-tag v-if="selectedApps.length" type="info" size="small" effect="plain" round>共 {{ selectedApps.length }} 个</el-tag>
        </div>
        <div v-if="selectedApps.length === 0" class="policy-app-empty">
          <el-icon :size="28"><Box /></el-icon>
          <span>暂未选择应用</span>
        </div>
        <div v-else class="policy-app-cards">
          <div v-for="a in selectedApps" :key="a.app_key" class="policy-app-card">
            <div class="policy-app-card__icon" :style="avatarBg(a.app_key)">{{ (a.app_name || '?').charAt(0) }}</div>
            <div class="policy-app-card__info">
              <div class="policy-app-card__name" :title="a.app_name">{{ a.app_name }}</div>
              <div class="policy-app-card__id">
                <span>ID: {{ a.app_key }}</span>
                <el-icon class="policy-app-card__copy" @click.stop="copyText(a.app_key)"><CopyDocument /></el-icon>
              </div>
            </div>
            <el-tag v-if="a.platform === 1" type="primary" size="small" effect="plain">Android</el-tag>
            <el-tag v-else-if="a.platform === 2" type="success" size="small" effect="plain">iOS</el-tag>
            <el-tag v-else type="warning" size="small" effect="plain">双端</el-tag>
          </div>
        </div>
      </div>

      <!-- 双栏聚合广告位选择器 -->
      <div class="policy-subsection">
        <div class="policy-subsection__label">
          选择聚合广告位
          <span class="policy-subsection__hint">（从左侧点击或拖入右侧）</span>
        </div>
        <div class="policy-dual">
          <div class="policy-dual__col">
            <div class="policy-dual__head">
              <span class="policy-dual__head-title">待确定</span>
              <el-tag size="small" type="info" effect="plain" round>{{ leftList.length }} 个</el-tag>
            </div>
            <div class="policy-dual__list">
              <div v-if="leftList.length === 0" class="policy-dual__empty">
                <el-icon :size="32"><DocumentRemove /></el-icon>
                <span>暂无可选广告位</span>
              </div>
              <div
                v-for="item in leftList"
                :key="item.placementId"
                class="policy-dual__item"
                @click="moveToRight(item)"
              >
                <div class="policy-dual__item-main">
                  <div class="policy-dual__item-name">{{ item.name }}</div>
                  <div class="policy-dual__item-meta">
                    <span class="policy-dual__item-app">{{ item.appName }}</span>
                    <span class="policy-dual__item-format">{{ formatLabel(item.format) }}</span>
                    <el-tag v-if="item.isShared" type="warning" size="small" effect="plain">共享位</el-tag>
                  </div>
                </div>
                <el-icon class="policy-dual__item-arrow"><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
          <div class="policy-dual__divider">
            <button class="policy-dual__divider-btn" :disabled="leftList.length === 0" @click="moveAllToRight" type="button" title="全部加入">
              <el-icon :size="16"><DArrowRight /></el-icon>
            </button>
            <button class="policy-dual__divider-btn" :disabled="rightList.length === 0" @click="moveAllToLeft" type="button" title="全部移除">
              <el-icon :size="16"><DArrowLeft /></el-icon>
            </button>
          </div>
          <div class="policy-dual__col">
            <div class="policy-dual__head">
              <span class="policy-dual__head-title">已确定</span>
              <el-tag size="small" :type="rightList.length > 0 ? 'success' : 'info'" effect="plain" round>{{ rightList.length }} 个</el-tag>
              <el-link v-if="rightList.length > 0" type="primary" :underline="false" class="policy-dual__head-clear" @click="clearRight">清空</el-link>
            </div>
            <div class="policy-dual__list">
              <div v-if="rightList.length === 0" class="policy-dual__empty">
                <el-icon :size="32"><Plus /></el-icon>
                <span>从左侧选择广告位</span>
              </div>
              <div
                v-for="(item, idx) in rightList"
                :key="item.placementId"
                class="policy-dual__item policy-dual__item--selected"
                @click="moveToLeft(idx)"
              >
                <div class="policy-dual__item-main">
                  <div class="policy-dual__item-name">{{ item.name }}</div>
                  <div class="policy-dual__item-meta">
                    <span class="policy-dual__item-app">{{ item.appName }}</span>
                    <span class="policy-dual__item-format">{{ formatLabel(item.format) }}</span>
                    <el-tag v-if="item.isShared" type="warning" size="small" effect="plain">共享位</el-tag>
                  </div>
                </div>
                <el-icon class="policy-dual__item-arrow"><ArrowLeft /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
  platform?: number;
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
  appKey?: string;        // 单应用：app_key
  appName?: string;       // 单应用：app_name（从父组件传）
  appPlatform?: number;   // 单应用：platform
  app?: AppItem | null;   // 兼容：直接传对象（多应用场景用 extraApps）
  extraApps?: AppItem[];  // 多选导出时的额外应用
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
  // 兼容 1：父组件传 appKey/appName/appPlatform 三个标量
  if (props.appKey) {
    list.push({ app_key: props.appKey, app_name: props.appName || props.appKey, platform: props.appPlatform });
  }
  // 兼容 2：父组件传 app 对象
  if (props.app) {
    if (!list.find((x) => x.app_key === props.app!.app_key)) list.push(props.app);
  }
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
