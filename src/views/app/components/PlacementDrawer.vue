<template>
  <el-drawer
    v-model="visible"
    :title="isEdit ? '编辑广告位' : '创建广告位'"
    size="720px"
    direction="rtl"
    :close-on-click-modal="false"
  >
    <div class="pd-body" v-loading="loading">
      <!-- 基础信息 -->
      <section class="pd-section">
        <div class="pd-section-head">
          <el-icon><InfoFilled /></el-icon>
          <span>基础信息</span>
          <span class="pd-section-sub">广告位归属与展示标识</span>
          <span class="pd-required-hint">
            已填 <b>{{ requiredBasicCount }}</b> / 共 <b>{{ requiredBasicTotal }}</b> 项必填
          </span>
        </div>
        <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="pd-form">
          <el-form-item label="所属应用" prop="appKey">
            <el-input :model-value="appKey" disabled>
              <template #prefix><el-icon><Cellphone /></el-icon></template>
            </el-input>
            <div class="pd-form-help">广告位将自动归属至当前应用，不可修改</div>
          </el-form-item>
          <el-form-item label="广告位名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入广告位名称" maxlength="40" show-word-limit />
          </el-form-item>
          <el-form-item label="广告类型" prop="format">
            <el-radio-group v-model="form.format" class="pd-format-grid" :disabled="isEdit">
              <el-radio-button v-for="f in formatOptions" :key="f.value" :value="f.value">{{ f.label }}</el-radio-button>
            </el-radio-group>
            <div class="pd-form-help">{{ formatHelpText }}</div>
          </el-form-item>
          <el-form-item label="竞价类型" prop="biddingType">
            <el-radio-group v-model="form.biddingType" :disabled="isEdit">
              <el-radio-button :value="1">固价</el-radio-button>
              <el-radio-button :value="2">竞价</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </section>

      <!-- 展示设置（仅 SDK + 部分格式） -->
      <section v-if="form.format && SDK_FORMAT_TYPES.includes(form.format)" class="pd-section">
        <div class="pd-section-head">
          <el-icon><Crop /></el-icon>
          <span>展示设置</span>
          <span class="pd-section-sub">SDK 接入时生效</span>
        </div>
        <el-form :model="form" label-position="top" class="pd-form">
          <!-- 屏幕方向：继承自应用，只读显示 -->
          <el-form-item label="屏幕方向" prop="screenOrientation">
            <div class="pd-inherit-wrap">
              <el-radio-group v-model="form.screenOrientation" :disabled="true">
                <el-radio-button v-for="o in orientationOptions" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
              </el-radio-group>
              <div class="pd-inherit-tag">
                <el-icon><Connection /></el-icon>
                <span>继承自应用「{{ inheritAppOrientationLabel }}」</span>
              </div>
            </div>
            <div class="pd-form-help">广告位的屏幕方向自动跟随所属应用，应用变更后广告位同步更新</div>
          </el-form-item>

          <!-- 插屏：广告尺寸 -->
          <el-form-item v-if="form.format === 2" label="广告尺寸" prop="adSize">
            <el-radio-group v-model="form.adSize">
              <el-radio-button :value="1">自适应</el-radio-button>
              <el-radio-button :value="2">指定尺寸</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 插屏/原生：素材类型 -->
          <el-form-item v-if="form.format === 2 || form.format === 4" label="素材类型" prop="materialType">
            <el-radio-group v-model="form.materialType">
              <el-radio-button :value="1">仅图片</el-radio-button>
              <el-radio-button :value="2">仅视频</el-radio-button>
              <el-radio-button :value="3">图片+视频</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 原生：模板样式 -->
          <el-form-item v-if="form.format === 4" label="模板样式" prop="templateStyle">
            <el-radio-group v-model="form.templateStyle">
              <el-radio-button :value="1">大图</el-radio-button>
              <el-radio-button :value="2">小图</el-radio-button>
              <el-radio-button :value="3">组图</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 视频：静音、自动播放 -->
          <el-form-item v-if="form.format === 4 || form.format === 5" label="视频设置">
            <div class="pd-inline">
              <el-checkbox v-model="form.videoMute">默认静音</el-checkbox>
              <el-checkbox v-model="form.autoPlay">自动播放</el-checkbox>
            </div>
          </el-form-item>
        </el-form>
      </section>

      <!-- API 接入说明 -->
      <section v-if="form.format && !SDK_FORMAT_TYPES.includes(form.format)" class="pd-section">
        <div class="pd-section-head">
          <el-icon><Promotion /></el-icon>
          <span>API 接入</span>
        </div>
        <el-alert type="info" :closable="false" show-icon>
          <template #title>API 接入模式</template>
          <p style="margin: 4px 0 0; line-height: 1.6;">
            API 模式下屏幕方向、素材类型等展示设置由接入方自行控制，此处无需配置。
          </p>
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
import { ElMessage, type FormInstance } from 'element-plus';
import request from '../../../utils/request';
import {
  InfoFilled, Cellphone, Crop, Connection, Promotion,
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

const isEdit = computed(() => !!props.editPlacement);
const loading = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

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
const SDK_FORMAT_TYPES = [1, 2, 3, 4, 5]; // 横幅/插屏/开屏/原生/视频都需要展示设置（屏幕方向继承应用）

const inheritAppOrientation = ref<number>(2); // 默认竖屏
const inheritAppOrientationLabel = computed(() =>
  orientationOptions.find(o => o.value === inheritAppOrientation.value)?.label || '竖屏'
);

const findLabel = (options: { value: number; label: string }[], v: number) =>
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

interface FormState {
  appKey: string;
  name: string;
  format: number;
  biddingType: number;
  screenOrientation: number;
  adSize: number;
  materialType: number;
  templateStyle: number;
  videoMute: boolean;
  autoPlay: boolean;
}

const form = reactive<FormState>({
  appKey: '',
  name: '',
  format: 1,
  biddingType: 1,
  screenOrientation: 2,
  adSize: 1,
  materialType: 1,
  templateStyle: 1,
  videoMute: true,
  autoPlay: false,
});

const rules = {
  name: [{ required: true, message: '请输入广告位名称', trigger: 'blur' }],
  format: [{ required: true, message: '请选择广告类型', trigger: 'change' }],
  biddingType: [{ required: true, message: '请选择竞价类型', trigger: 'change' }],
};

const requiredBasicTotal = 3;
const requiredBasicCount = computed(() => {
  let n = 0;
  if (form.appKey) n++;
  if (form.name.trim()) n++;
  if (form.format) n++;
  return n;
});

// ========== 加载应用 orientation（继承来源） ==========
const fetchAppOrientation = async () => {
  if (!props.appKey) { inheritAppOrientation.value = 2; return; }
  try {
    const res: any = await request.get('/api/v1/console/app/list', {
      params: { pageSize: 200, appKey: props.appKey },
    });
    const app = (res.data?.list || []).find((a: any) => a.app_key === props.appKey);
    if (app) {
      inheritAppOrientation.value = app.orientation || 2;
      form.screenOrientation = inheritAppOrientation.value;
    }
  } catch { /* ignore */ }
};

// ========== 打开/关闭 ==========
const resetForm = () => {
  form.appKey = props.appKey;
  form.name = '';
  form.format = 1;
  form.biddingType = 1;
  form.screenOrientation = inheritAppOrientation.value || 2;
  form.adSize = 1;
  form.materialType = 1;
  form.templateStyle = 1;
  form.videoMute = true;
  form.autoPlay = false;
};

const fillFromEdit = (row: any) => {
  form.appKey = props.appKey;
  form.name = row.name || '';
  form.format = row.format || 1;
  form.biddingType = row.bidding_type || 1;
  form.screenOrientation = row.screen_orientation || inheritAppOrientation.value || 2;
  form.adSize = row.ad_size || 1;
  form.materialType = row.material_type || 1;
  form.templateStyle = row.template_style || 1;
  form.videoMute = row.video_mute !== false;
  form.autoPlay = !!row.auto_play;
};

watch(() => props.visible, async (v) => {
  if (v) {
    loading.value = true;
    await fetchAppOrientation();
    await nextTick();
    if (props.editPlacement) {
      fillFromEdit(props.editPlacement);
    } else {
      resetForm();
    }
    loading.value = false;
  }
});

// appKey 变化时（比如父级切换应用），重新同步屏幕方向
watch(() => props.appKey, async (v) => {
  if (!v) return;
  await fetchAppOrientation();
  if (!isEdit.value) {
    form.screenOrientation = inheritAppOrientation.value;
  }
});

const submit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();
  submitting.value = true;
  try {
    const payload: any = {
      appKey: props.appKey,
      name: form.name.trim(),
      format: form.format,
      biddingType: form.biddingType,
      screenOrientation: form.screenOrientation, // 永远带，继承自应用
    };
    // SDK 模式才带展示设置
    if (SDK_FORMAT_TYPES.includes(form.format)) {
      if (form.format === 2) payload.adSize = form.adSize;
      if (form.format === 2 || form.format === 4) payload.materialType = form.materialType;
      if (form.format === 4) payload.templateStyle = form.templateStyle;
      if (form.format === 4 || form.format === 5) {
        payload.videoMute = form.videoMute;
        payload.autoPlay = form.autoPlay;
      }
    }
    if (isEdit.value && props.editPlacement) {
      payload.placementId = props.editPlacement.placement_id;
      await request.put('/api/v1/console/placement/update', payload);
    } else {
      await request.post('/api/v1/console/placement/create', payload);
    }
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
    emit('saved');
  } catch { /* ignore */ }
  finally { submitting.value = false; }
};
</script>

