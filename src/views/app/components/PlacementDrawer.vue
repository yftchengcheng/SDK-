<template>
  <el-drawer
    v-model="visible"
    :title="isEdit ? '编辑广告位' : '创建广告位'"
    size="720px"
    direction="rtl"
    :close-on-click-modal="false"
  >
    <div class="pd-body" v-loading="loading">
      <!-- drawer 头部：展示对接方式（继承自所属应用） -->
      <div v-if="currentAccessType" class="pd-access-hint">
        <span :class="['access-tag', currentAccessType === 1 ? 'access-tag--sdk' : 'access-tag--api']">
          {{ accessTypeLabel }}
        </span>
        <span class="pd-access-hint__text">
          模版样式将按所属应用的对接方式自动切换{{ currentAccessType === 1 ? '（SDK 4 种）' : '（API 13 种）' }}
        </span>
      </div>
      <!-- 区块 1：基础信息 -->
      <section class="pd-section">
        <div class="pd-section-head">
          <el-icon><InfoFilled /></el-icon>
          <span>基础信息</span>
          <span class="pd-section-sub">广告位的基本资料、所属应用和广告形式</span>
          <span class="pd-required-hint">
            已填 <b>{{ requiredBasicCount }}</b> / 共 <b>{{ requiredBasicTotal }}</b> 项必填
          </span>
        </div>
        <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="pd-form">
          <!-- 所属应用：Drawer 中自动预填、不可改 -->
          <el-form-item label="所属应用" prop="appKey">
            <el-input :model-value="appKey" disabled>
              <template #prefix><el-icon><Cellphone /></el-icon></template>
            </el-input>
            <div class="pd-form-help">广告位将自动归属至当前应用，不可修改</div>
          </el-form-item>

          <el-form-item label="广告位名称" prop="name" class="span-2">
            <el-input v-model="form.name" :placeholder="namePlaceholder" maxlength="40" show-word-limit />
            <div class="pd-form-help">命名建议：媒体简称-应用名-系统-广告形式（如：新义-demo-iOS-信息流）</div>
          </el-form-item>

          <el-form-item label="广告形式" prop="format">
            <el-radio-group v-model="form.format" class="pd-format-grid" :disabled="isEdit">
              <el-radio-button v-for="f in formatOptions" :key="f.value" :value="f.value">{{ f.label }}</el-radio-button>
            </el-radio-group>
            <div class="pd-form-help">{{ formatHelpText }}</div>
          </el-form-item>

          <section class="pd-field-details">
            <div class="pd-field-details__header">
              <div class="pd-field-details__title">
                <el-icon><InfoFilled /></el-icon>
                <span>字段明细表 — 当前广告形式（{{ ['未知', '横幅', '插屏', '开屏', '原生', '视频'][form.format] || '未知' }}）在当前对接方式（{{ form.accessType === 1 ? 'SDK' : 'API' }}）下需配置以下字段</span>
              </div>
              <div class="pd-field-details__legend">
                <span class="pd-legend pd-legend--sdk">SDK</span>
                <span class="pd-legend pd-legend--api">API</span>
                <span class="pd-legend pd-legend--required">*必填</span>
              </div>
            </div>
            <el-table :data="formatFieldDetails" border size="small" class="pd-field-details__table" :show-header="true">
              <el-table-column prop="name" label="字段名" width="140" align="left" />
              <el-table-column label="SDK" width="60" align="center">
                <template #default="{ row }">
                  <el-icon v-if="row.sdk" class="pd-ok"><CircleCheckFilled /></el-icon>
                  <span v-else class="pd-na">—</span>
                </template>
              </el-table-column>
              <el-table-column label="API" width="60" align="center">
                <template #default="{ row }">
                  <el-icon v-if="row.api" class="pd-ok"><CircleCheckFilled /></el-icon>
                  <span v-else class="pd-na">—</span>
                </template>
              </el-table-column>
              <el-table-column label="必填" width="60" align="center">
                <template #default="{ row }">
                  <span v-if="row.required" class="pd-req">*</span>
                  <span v-else class="pd-na">—</span>
                </template>
              </el-table-column>
              <el-table-column prop="note" label="备注" min-width="220" align="left" />
            </el-table>
          </section>
          <el-form-item label="竞价类型" prop="biddingType">
            <el-radio-group v-model="form.biddingType">
              <el-radio-button :value="1">固价</el-radio-button>
              <el-radio-button :value="2">竞价</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </section>

      <!-- 区块 2：展示设置（SDK 接入 + 插屏/原生/视频） -->
      <section v-if="showOrientation" class="pd-section">
        <div class="pd-section-head">
          <el-icon><Crop /></el-icon>
          <span>展示设置</span>
          <span class="pd-section-sub">SDK 接入专属</span>
        </div>
        <el-form :model="form" :rules="orientationRules" ref="orientationFormRef" label-position="top" class="pd-form">
          <el-form-item label="屏幕方向" prop="screenOrientation" class="span-2">
            <el-radio-group v-model="form.screenOrientation">
              <el-radio-button v-for="o in orientationOptions" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
            </el-radio-group>
            <div class="pd-form-help">
              默认继承自所属应用「{{ currentAppInfo?.app_name || '当前应用' }}」的屏幕方向（{{ orientationLabel(currentAppInfo?.orientation) || '横屏' }}），可按广告位实际需要调整
            </div>
          </el-form-item>

          <el-form-item v-if="showAdSize" label="广告展示大小" prop="adSize" class="span-2">
            <el-radio-group v-model="form.adSize">
              <el-radio-button v-for="s in adSizeOptions" :key="s.value" :value="s.value">{{ s.label }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </section>

      <!-- 区块 3：素材形式（插屏 / 原生） -->
      <section v-if="showMaterial" class="pd-section">
        <div class="pd-section-head">
          <el-icon><Picture /></el-icon>
          <span>素材形式</span>
          <span class="pd-section-sub">SDK 接入专属</span>
        </div>
        <el-form :model="form" :rules="materialRules" ref="materialFormRef" label-position="top" class="pd-form">
          <el-form-item label="素材形式" prop="materialType" class="span-2">
            <el-radio-group v-model="form.materialType">
              <el-radio-button v-for="m in materialOptions" :key="m.value" :value="m.value">{{ m.label }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </section>

      <!-- 区块 4：原生样式（仅原生广告） -->
      <section v-if="showNativeFields" class="pd-section">
        <div class="pd-section-head">
          <el-icon><VideoCamera /></el-icon>
          <span>原生样式</span>
          <span class="pd-section-sub">仅原生广告</span>
        </div>
        <el-form :model="form" :rules="nativeRules" ref="nativeFormRef" label-position="top" class="pd-form">
          <el-form-item v-if="showVideoMute" label="视频静音" prop="videoMute" class="span-2">
            <el-radio-group v-model="form.videoMute">
              <el-radio-button :value="0">否</el-radio-button>
              <el-radio-button :value="1">是</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="showAutoPlay" label="自动播放" prop="autoPlay" class="span-2">
            <el-radio-group v-model="form.autoPlay">
              <el-radio-button v-for="a in autoPlayOptions" :key="a.value" :value="a.value">{{ a.label }}</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="模版样式" prop="templateStyle" class="span-2">
            <el-select v-model="form.templateStyle" placeholder="请选择模版样式" style="width: 100%">
              <el-option v-for="t in currentTemplateOptions" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
          </el-form-item>
        </el-form>
      </section>

      <!-- 区块 5：API 接入时提示 -->
      <section v-if="form.format && !isSDK" class="pd-section">
        <div class="pd-section-head">
          <el-icon><Promotion /></el-icon>
          <span>API 接入</span>
        </div>
        <el-alert type="info" :closable="false" show-icon>
          <template #title>当前为 API 接入，屏幕方向 / 视频静音 / 自动播放 字段不适用。</template>
        </el-alert>
      </section>
    </div>

    <template #footer>
      <div class="pd-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">确定{{ isEdit ? '保存' : '创建' }}</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import request from '../../../utils/request';
import { useUserStore } from '../../../stores/user';
import { dictCache } from '../../../utils/dict-cache';
import {
  InfoFilled, Cellphone, Crop, Picture, VideoCamera, Promotion, CircleCheckFilled,
} from '@element-plus/icons-vue';

const props = defineProps<{
  visible: boolean;
  appKey: string;
  editPlacement: any | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'saved'): void;
}>();

const visible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
});

const userStore = useUserStore();
const isEdit = computed(() => !!props.editPlacement);
const loading = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const orientationFormRef = ref<FormInstance>();
const materialFormRef = ref<FormInstance>();
const nativeFormRef = ref<FormInstance>();

// 接入方式：1=SDK / 2=API —— 创建态读所属应用 access_type（应用已从 dev 继承），
// 编辑态读该 placement 自己的 access_type 快照（placement 锁定不可改）
const isSDK = computed(() => {
  const at = isEdit.value
    ? props.editPlacement?.access_type
    : currentAppInfo.value?.access_type;
  return (at ?? 1) !== 2;
});
// 当前对街方式的展示（0=未态、1=SDK、2=API）
const currentAccessType = computed<number | null>(() =>
  isEdit.value
    ? (props.editPlacement?.access_type ?? null)
    : (currentAppInfo.value?.access_type ?? null)
);
const accessTypeLabel = computed(() => {
  const v = currentAccessType.value;
  if (v === 1) return 'SDK 接入';
  if (v === 2) return 'API 接入';
  return '未识别';
});

// ========== 通用 options（与 /placement 页完全一致） ==========
const formatOptions = [
  { value: 1, label: '横幅' },
  { value: 2, label: '插屏' },
  { value: 3, label: '开屏' },
  { value: 4, label: '原生' },
  { value: 5, label: '视频' },
];
const orientationOptions = [
  { value: 1, label: '横屏' },
  { value: 2, label: '竖屏' },
  { value: 3, label: '横竖兼容' },
];
const orientationLabel = (v: number | null | undefined) =>
  orientationOptions.find(o => o.value === v)?.label || '';
const adSizeOptions = [
  { value: 1, label: '半屏' },
  { value: 2, label: '全屏' },
  { value: 3, label: '优选' },
];
const materialOptions = [
  { value: 1, label: '图片' },
  { value: 2, label: '视频' },
  { value: 3, label: '视频+图片' },
];
const autoPlayOptions = [
  { value: 1, label: '总是' },
  { value: 2, label: '仅WIFI' },
  { value: 3, label: '点击播放' },
];
// API 接入的模版样式（原有 13 种）
const apiTemplateOptions = [
  { value: 1,  label: '1图1文' },
  { value: 2,  label: '1图2文' },
  { value: 3,  label: '1图3文' },
  { value: 4,  label: '1图1图标1文' },
  { value: 5,  label: '1图1图标2文' },
  { value: 6,  label: '3图1文' },
  { value: 7,  label: '1图标2文' },
  { value: 8,  label: '3图1图标2文' },
  { value: 9,  label: '1图1图标2文1按钮' },
  { value: 10, label: '图片' },
  { value: 11, label: '1视频1封面1文' },
  { value: 12, label: '1视频1封面1图标2文' },
  { value: 13, label: '1视频1封面' },
];
// SDK 接入的模版样式（4 种）
const sdkTemplateOptions = [
  { value: 14, label: '上图下文' },
  { value: 15, label: '上文下图' },
  { value: 16, label: '左图右文' },
  { value: 17, label: '左文右图' },
];
// 按当前接入方式动态切换下拉选项
const currentTemplateOptions = computed(() => (isSDK.value ? sdkTemplateOptions : apiTemplateOptions));

// ========== 条件显示 computed（与 /placement 页一致） ==========
const showOrientation = computed(() => {
  if (!isSDK.value) return false;
  return [2, 4, 5].includes(form.format as number);
});
const showAdSize = computed(() => form.format === 2);
const showMaterial = computed(() => [2, 4].includes(form.format as number));
const showNativeFields = computed(() => form.format === 4);
const showVideoMute = computed(() => isSDK.value && form.format === 4);
const showAutoPlay = computed(() => isSDK.value && form.format === 4);

// 媒体简称（用于名称 placeholder 建议）
const mediaShortName = computed(() =>
  userStore.userInfo?.companyShortName || userStore.userInfo?.company || '媒体'
);

const currentAppInfo = ref<any>(null);
const fetchAppInfo = async () => {
  if (!props.appKey) { currentAppInfo.value = null; return; }
  try {
    const res: any = await request.get('/api/v1/console/app/list', {
      params: { pageSize: 200, appKey: props.appKey },
    });
    currentAppInfo.value = (res.data?.list || []).find((a: any) => a.app_key === props.appKey) || null;
  } catch { currentAppInfo.value = null; }
};

const findLabel = (options: { value: number; label: string }[], v: number | null | undefined) =>
  options.find(o => o.value === v)?.label || '--';
const formatLabel = (v: number) => findLabel(formatOptions, v);

const formatHelpText = computed(() => {
  const map: Record<number, string> = {
    1: '横幅：固定位置显示的广告位',
    2: '插屏：全屏展示，切换页面/关卡时弹出',
    3: '开屏：应用启动时全屏展示',
    4: '原生：与应用内容融合的原生样式广告',
    5: '视频：横版/竖版视频广告',
  };
  return map[form.format] || '';
});

// 名称 placeholder（自动生成建议）
const namePlaceholder = computed(() => {
  const app = currentAppInfo.value;
  if (!app) return '请输入广告位名称';
  const platformName =
    app.platform === 1 ? 'Android' :
    app.platform === 2 ? 'iOS' :
    '未知';
  const formatName = form.format ? formatLabel(form.format) : '广告形式';
  return `${mediaShortName.value}-${app.app_name || 'app'}-${platformName}-${formatName}`;
});

// ========== 表单 state ==========
interface FormState {
  appKey: string;
  name: string;
  format: number;
  biddingType: number;
  screenOrientation: number | null;
  adSize: number | null;
  materialType: number | null;
  videoMute: number;
  autoPlay: number | null;
  templateStyle: number | null;
  accessType: number | null; // 锁定继承自所属应用，不允许手动改
}


// 字段明细表：当前 format × 当前 accessType 需展示的字段（**从 dictCache 拉取**）
const formatFieldDetails = ref<{ name: string; fieldType: string; required: boolean; sdk: boolean; api: boolean; note: string }[]>([]);
const loadFormatFieldDetails = () => {
  const format = form.format;
  const accessType = currentAccessType.value;
  if (!format || !accessType) { formatFieldDetails.value = []; return; }
  // 从 dictCache 同步拉取当前 (format, accessType) 的字段定义
  const fields = dictCache.getPlacementFieldList(format, accessType) || [];
  // 拉取另一 accessType 用于对比展示（SDK vs API 列）
  const otherAccessType = accessType === 1 ? 2 : 1;
  const otherFields = dictCache.getPlacementFieldList(format, otherAccessType) || [];
  const base: typeof formatFieldDetails.value = [
    { name: '广告位名称', fieldType: 'input', required: true, sdk: true, api: true, note: '媒体简称-应用名-系统-广告形式' },
    { name: '广告形式', fieldType: 'select', required: true, sdk: true, api: true, note: '创建后不可修改' },
    { name: '竞价类型', fieldType: 'radio', required: true, sdk: true, api: true, note: '客户端竞价 / 服务端竞价' },
  ];
  const detailRows = fields.map((f) => ({
    name: f.display_name,
    fieldType: f.field_type,
    required: f.required,
    sdk: true, // 当前 accessType 必有
    api: otherAccessType === 2 ? (otherFields || []).some((x) => x.field_name === f.field_name) : false,
    note: f.note ?? '',
  }));
  formatFieldDetails.value = [...base, ...detailRows];
};
watch(
  () => [form.format, currentAccessType.value, currentAppInfo.value] as const,
  () => { void loadFormatFieldDetails(); },
  { immediate: true, deep: true },
);
const form = reactive<FormState>({
  appKey: '',
  name: '',
  format: 1,
  biddingType: 1,
  screenOrientation: null,
  adSize: null,
  materialType: null,
  videoMute: 0,
  autoPlay: null,
  templateStyle: null,
  accessType: null,
});

// 基础信息校验（始终生效）
const rules: FormRules = {
  name: [{ required: true, message: '请输入广告位名称', trigger: 'blur' }],
  format: [{ required: true, message: '请选择广告形式', trigger: 'change' }],
  biddingType: [{ required: true, message: '请选择竞价类型', trigger: 'change' }],
};
// 区块 2：展示设置
const orientationRules: FormRules = {
  screenOrientation: [{ required: true, message: '请选择屏幕方向', trigger: 'change' }],
  adSize: [{ required: true, message: '请选择广告展示大小', trigger: 'change' }],
};
// 区块 3：素材形式
const materialRules: FormRules = {
  materialType: [{ required: true, message: '请选择素材形式', trigger: 'change' }],
};
// 区块 4：原生样式
const nativeRules: FormRules = {
  videoMute: [{ required: true, message: '请选择视频静音', trigger: 'change' }],
  autoPlay: [{ required: true, message: '请选择自动播放', trigger: 'change' }],
  templateStyle: [{ required: true, message: '请选择模版样式', trigger: 'change' }],
};

const requiredBasicTotal = 3;
const requiredBasicCount = computed(() => {
  let n = 0;
  if (form.appKey) n++;
  if (form.name.trim()) n++;
  if (form.format) n++;
  return n;
});

// ========== 重置 / 回填 ==========
// 从当前应用继承屏幕方向（默认 1=横屏），新广告位将沿用所属应用的屏幕方向
const inheritOrientation = (): number => {
  const v = currentAppInfo.value?.orientation;
  return v === 1 || v === 2 || v === 3 ? v : 1;
};

const resetForm = () => {
  form.appKey = props.appKey;
  form.name = '';
  form.format = 1;
  form.biddingType = 1;
  form.screenOrientation = inheritOrientation();
  form.adSize = null;
  form.materialType = null;
  form.videoMute = 0;
  form.autoPlay = null;
  form.templateStyle = null;
  // 创建态：accessType 自动继承自所属应用，不可手动改
  form.accessType = currentAppInfo.value?.access_type ?? null;
};

const fillFromEdit = (row: any) => {
  form.appKey = props.appKey;
  form.name = row.name || '';
  form.format = row.format || 1;
  form.biddingType = row.bidding_type ?? 1;
  form.screenOrientation = row.screen_orientation ?? null;
  form.adSize = row.ad_size ?? null;
  form.materialType = row.material_type ?? null;
  form.videoMute = row.video_mute ?? 0;
  form.autoPlay = row.auto_play ?? null;
  form.templateStyle = row.template_style ?? null;
  // 编辑态：accessType 走 placement 自己的快照（来自创建时继承的应用，锁定）
  form.accessType = row.access_type ?? null;
};

watch(() => props.visible, async (v) => {
  if (v) {
    loading.value = true;
    await fetchAppInfo();
    await nextTick();
    if (props.editPlacement) {
      fillFromEdit(props.editPlacement);
    } else {
      resetForm();
    }
    loading.value = false;
  }
});

// 切换 format 时清空条件字段（避免遗留值绕过校验）
// 新建模式下重新继承应用屏幕方向（仅在 SDK + 当前 format 需要此字段时）
watch(() => form.format, () => {
  if (isEdit.value) return; // 编辑时保留原值
  form.adSize = null;
  form.materialType = null;
  form.autoPlay = null;
  form.templateStyle = null;
  // 仅当当前 format 适用屏幕方向字段时才覆盖
  if ([2, 4, 5].includes(form.format as number)) {
    form.screenOrientation = inheritOrientation();
  } else {
    form.screenOrientation = null;
  }
});

// ========== 提交 ==========
const buildPayload = () => {
  const payload: Record<string, unknown> = {
    appKey: props.appKey,
    name: form.name.trim(),
    format: form.format,
    biddingType: form.biddingType,
  };
  if (showOrientation.value && form.screenOrientation !== null) {
    payload.screenOrientation = form.screenOrientation;
  }
  if (showAdSize.value && form.adSize !== null) {
    payload.adSize = form.adSize;
  }
  if (showMaterial.value && form.materialType !== null) {
    payload.materialType = form.materialType;
  }
  if (showVideoMute.value && form.videoMute !== null) {
    payload.videoMute = form.videoMute;
  }
  if (showAutoPlay.value && form.autoPlay !== null) {
    payload.autoPlay = form.autoPlay;
  }
  if (showNativeFields.value && form.templateStyle !== null) {
    payload.templateStyle = form.templateStyle;
  }
  // 对接方式：透传 accessType（后端会按所属应用 access_type 锁定，create 时会覆盖）
  if (form.accessType !== null) {
    payload.accessType = form.accessType;
  }
  return payload;
};

const submit = async () => {
  // 依次校验所有可见区块
  const forms: (FormInstance | undefined)[] = [
    formRef.value,
    orientationFormRef.value,
    materialFormRef.value,
    nativeFormRef.value,
  ];
  for (const f of forms) {
    if (!f) continue;
    const ok = await f.validate().catch(() => false);
    if (!ok) return;
  }

  submitting.value = true;
  try {
    const payload = buildPayload();
    if (isEdit.value && props.editPlacement) {
      await request.put('/api/v1/console/placement/update', {
        placementId: props.editPlacement.placement_id,
        ...payload,
      });
    } else {
      await request.post('/api/v1/console/placement/create', payload);
    }
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
    emit('saved');
  } catch { /* ignore */ }
  finally { submitting.value = false; }
};
</script>
