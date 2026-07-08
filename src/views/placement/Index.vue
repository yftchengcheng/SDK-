<template>
  <div class="page-container">
    <div class="page-header">
      <h1>广告位管理</h1>
      <el-button type="primary" @click="openCreate">创建广告位</el-button>
    </div>
    <!-- Filter -->
    <div class="filter-card">
      <el-form :inline="true" :model="filter">
        <el-form-item label="应用">
          <el-select v-model="filter.appKey" placeholder="全部应用" clearable style="width: 200px" @change="fetchList">
            <el-option v-for="a in appList" :key="a.app_key" :label="a.app_name" :value="a.app_key" />
          </el-select>
        </el-form-item>
        <el-form-item label="广告形式">
          <el-select v-model="filter.format" placeholder="全部形式" clearable style="width: 140px" @change="fetchList">
            <el-option v-for="f in formatOptions" :key="f.value" :label="f.label" :value="f.value" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <!-- Table -->
    <div class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="placement_id" label="广告位TOKEN" min-width="200">
          <template #default="{ row }">
            <span class="text-primary">{{ row.placement_id }}</span>
            <el-icon class="copy-btn" @click="copyText(row.placement_id)"><CopyDocument /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="广告位名称" min-width="140" />
        <el-table-column prop="app_name" label="所属应用" min-width="120" />
        <el-table-column prop="format" label="广告形式" width="100">
          <template #default="{ row }">{{ formatLabel(row.format) }}</template>
        </el-table-column>
        <el-table-column prop="bidding_type" label="竞价类型" width="90">
          <template #default="{ row }">{{ biddingLabel(row.bidding_type) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link :type="row.status === 1 ? 'warning' : 'success'" size="small" @click="handleToggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next" @change="fetchList" />
      </div>
    </div>
    <!-- Dialog -->
    <el-dialog v-model="showDialog" :title="editForm.id ? '编辑广告位' : '创建广告位'" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="editForm" :rules="formRules" label-position="top" class="placement-form">
        <!-- 基础信息 -->
        <div class="placement-form-section">
          <div class="placement-form-section-title">基础信息</div>
          <el-form-item label="所属应用" prop="app_key">
            <el-select v-model="editForm.app_key" placeholder="请选择应用" style="width: 100%" :disabled="!!editForm.id" @change="onAppChange">
              <el-option v-for="a in appList" :key="a.app_key" :label="a.app_name" :value="a.app_key" />
            </el-select>
          </el-form-item>
          <el-form-item label="广告位名称" prop="name">
            <el-input v-model="editForm.name" :placeholder="namePlaceholder" />
            <span class="placement-form-tip">命名建议：媒体简称-应用名-系统-广告形式（如：新义-demo-iOS-信息流）</span>
          </el-form-item>
          <el-form-item label="广告形式" prop="format">
            <el-select v-model="editForm.format" placeholder="请选择广告形式" style="width: 100%" :disabled="!!editForm.id" @change="onFormatChange">
              <el-option v-for="f in formatOptions" :key="f.value" :label="f.label" :value="f.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="竞价类型" prop="bidding_type">
            <el-radio-group v-model="editForm.bidding_type">
              <el-radio-button :value="1">固价</el-radio-button>
              <el-radio-button :value="2">竞价</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>

        <!-- 屏幕方向：插屏 / 原生 / 视频 + SDK 接入 -->
        <div v-if="showOrientation" class="placement-form-section">
          <div class="placement-form-section-title">展示设置</div>
          <el-form-item label="屏幕方向" prop="screen_orientation">
            <el-radio-group v-model="editForm.screen_orientation">
              <el-radio-button :value="1">横屏</el-radio-button>
              <el-radio-button :value="2">竖屏</el-radio-button>
              <el-radio-button :value="3">横竖兼容</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>

        <!-- 广告展示大小：仅插屏 -->
        <div v-if="showAdSize" class="placement-form-section">
          <el-form-item label="广告展示大小" prop="ad_size">
            <el-radio-group v-model="editForm.ad_size">
              <el-radio-button :value="1">半屏</el-radio-button>
              <el-radio-button :value="2">全屏</el-radio-button>
              <el-radio-button :value="3">优选</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>

        <!-- 素材形式：插屏 / 原生 -->
        <div v-if="showMaterial" class="placement-form-section">
          <el-form-item label="素材形式" prop="material_type">
            <el-radio-group v-model="editForm.material_type">
              <el-radio-button :value="1">图片</el-radio-button>
              <el-radio-button :value="2">视频</el-radio-button>
              <el-radio-button :value="3">视频+图片</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>

        <!-- 原生专属：视频静音 / 自动播放 / 模版样式 -->
        <div v-if="showNativeFields" class="placement-form-section">
          <div class="placement-form-section-title">原生样式</div>
          <el-form-item v-if="showVideoMute" label="视频静音" prop="video_mute">
            <el-radio-group v-model="editForm.video_mute">
              <el-radio-button :value="0">否</el-radio-button>
              <el-radio-button :value="1">是</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="showAutoPlay" label="自动播放" prop="auto_play">
            <el-radio-group v-model="editForm.auto_play">
              <el-radio-button :value="1">总是</el-radio-button>
              <el-radio-button :value="2">仅WIFI</el-radio-button>
              <el-radio-button :value="3">点击播放</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="模版样式" prop="template_style">
            <el-select v-model="editForm.template_style" placeholder="请选择模版样式" style="width: 100%">
              <el-option v-for="t in templateOptions" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
          </el-form-item>
        </div>

        <!-- API 接入时提示 -->
        <div v-if="!isSDK" class="placement-form-section placement-form-section--api">
          <el-alert type="info" :closable="false" show-icon>
            <template #title>
              当前为 API 接入，屏幕方向 / 视频静音 / 自动播放 字段不适用。
            </template>
          </el-alert>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import request from '../../utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import dayjs from 'dayjs';
import { useUserStore } from '../../stores/user';

const userStore = useUserStore();

// 广告形式：spec 顺序 = 横幅/插屏/开屏/原生/视频 → 1/2/3/4/5
const formatOptions = [
  { value: 1, label: '横幅' },
  { value: 2, label: '插屏' },
  { value: 3, label: '开屏' },
  { value: 4, label: '原生' },
  { value: 5, label: '视频' },
];

const biddingOptions = [
  { value: 1, label: '固价' },
  { value: 2, label: '竞价' },
];

const orientationOptions = [
  { value: 1, label: '横屏' },
  { value: 2, label: '竖屏' },
  { value: 3, label: '横竖兼容' },
];

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

const templateOptions = [
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

const findLabel = (options: { value: number; label: string }[], v: number | null | undefined) =>
  options.find(o => o.value === v)?.label || '--';

const formatLabel = (v: number) => findLabel(formatOptions, v);
const biddingLabel = (v: number) => findLabel(biddingOptions, v);
const formatTime = (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '--';
const copyText = (text: string) => navigator.clipboard.writeText(text).then(() => ElMessage.success('已复制'));

const loading = ref(false);
const tableData = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const appList = ref<any[]>([]);
const filter = reactive({ appKey: '', format: null as number | null });

const showDialog = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

// 当前开发者接入方式：1=SDK / 2=API
const isSDK = computed(() => (userStore.userInfo?.accessType ?? 1) !== 2);

// 当前选中的应用（用于广告位名称自动生成）
const currentApp = computed(() => appList.value.find(a => a.app_key === editForm.app_key) || null);

// 当前选中的广告形式
const currentFormat = computed(() => editForm.format);

// 媒体简称：优先取开发者公司简称（注册时填写）
const mediaShortName = computed(() => userStore.userInfo?.companyShortName || userStore.userInfo?.company || '媒体');

// 条件渲染 computed
const showOrientation = computed(() => {
  // 插屏(2) / 原生(4) / 视频(5) + SDK 接入
  if (!isSDK.value) return false;
  return [2, 4, 5].includes(currentFormat.value as number);
});

const showAdSize = computed(() => currentFormat.value === 2);
const showMaterial = computed(() => [2, 4].includes(currentFormat.value as number));
const showNativeFields = computed(() => currentFormat.value === 4);
const showVideoMute = computed(() => isSDK.value && currentFormat.value === 4);
const showAutoPlay = computed(() => isSDK.value && currentFormat.value === 4);

// 广告位名称 placeholder（自动生成建议）
const namePlaceholder = computed(() => {
  if (!currentApp.value) return '请输入广告位名称';
  const app = currentApp.value;
  const platformName =
    app.platform === 1 ? 'Android' :
    app.platform === 2 ? 'iOS' :
    '未知';
  const formatName = currentFormat.value
    ? formatLabel(currentFormat.value)
    : '广告形式';
  return `${mediaShortName.value}-${app.app_name || 'app'}-${platformName}-${formatName}`;
});

const defaultForm = () => ({
  id: 0,
  app_key: '',
  name: '',
  format: null as number | null,
  bidding_type: 1 as number,
  screen_orientation: null as number | null,
  ad_size: null as number | null,
  material_type: null as number | null,
  video_mute: 0 as number,
  auto_play: null as number | null,
  template_style: null as number | null,
});

const editForm = reactive(defaultForm());

const formRules: FormRules = {
  app_key: [{ required: true, message: '请选择应用', trigger: 'change' }],
  name: [{ required: true, message: '请输入广告位名称', trigger: 'blur' }],
  format: [{ required: true, message: '请选择广告形式', trigger: 'change' }],
  bidding_type: [{ required: true, message: '请选择竞价类型', trigger: 'change' }],
  screen_orientation: [{ required: true, message: '请选择屏幕方向', trigger: 'change' }],
  ad_size: [{ required: true, message: '请选择广告展示大小', trigger: 'change' }],
  material_type: [{ required: true, message: '请选择素材形式', trigger: 'change' }],
  video_mute: [{ required: true, message: '请选择视频静音', trigger: 'change' }],
  auto_play: [{ required: true, message: '请选择自动播放', trigger: 'change' }],
  template_style: [{ required: true, message: '请选择模版样式', trigger: 'change' }],
};

const fetchApps = async () => {
  try { const res: any = await request.get('/api/v1/console/app/list', { params: { pageSize: 200 } }); appList.value = res.data?.list || []; } catch { /* ignore */ }
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (filter.appKey) params.appKey = filter.appKey;
    if (filter.format) params.format = filter.format;
    const res: any = await request.get('/api/v1/console/placement/list', { params });
    tableData.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } catch { /* ignore */ } finally { loading.value = false; }
};

const onAppChange = () => {
  // 切换应用时清空广告位名称，避免遗留与新应用不匹配的内容
  editForm.name = '';
};

const onFormatChange = () => {
  // 切换广告形式时清空条件字段，避免遗留值绕过校验
  editForm.screen_orientation = null;
  editForm.ad_size = null;
  editForm.material_type = null;
  editForm.auto_play = null;
  editForm.template_style = null;
  // video_mute 保留默认 0
};

const openCreate = () => {
  Object.assign(editForm, defaultForm());
  showDialog.value = true;
};

const handleEdit = (row: any) => {
  // placement_id 是业务唯一 ID（pl_xxx 字符串），不是数据库自增 id（数字）。
  // 后端 /update 用 eq('placement_id', placementId) 过滤，必须传 placement_id。
  Object.assign(editForm, {
    id: row.placement_id,
    app_key: row.app_key,
    name: row.name,
    format: row.format,
    bidding_type: row.bidding_type ?? 1,
    screen_orientation: row.screen_orientation ?? null,
    ad_size: row.ad_size ?? null,
    material_type: row.material_type ?? null,
    video_mute: row.video_mute ?? 0,
    auto_play: row.auto_play ?? null,
    template_style: row.template_style ?? null,
  });
  showDialog.value = true;
};

const buildSubmitPayload = () => {
  // 始终发送基础字段；条件字段按可见性过滤（不可见就不发，后端不入库）
  const payload: Record<string, unknown> = {
    appKey: editForm.app_key,
    name: editForm.name,
    format: editForm.format,
    biddingType: editForm.bidding_type,
  };
  if (showOrientation.value && editForm.screen_orientation !== null) {
    payload.screenOrientation = editForm.screen_orientation;
  }
  if (showAdSize.value && editForm.ad_size !== null) {
    payload.adSize = editForm.ad_size;
  }
  if (showMaterial.value && editForm.material_type !== null) {
    payload.materialType = editForm.material_type;
  }
  if (showVideoMute.value && editForm.video_mute !== null) {
    payload.videoMute = editForm.video_mute;
  }
  if (showAutoPlay.value && editForm.auto_play !== null) {
    payload.autoPlay = editForm.auto_play;
  }
  if (showNativeFields.value && editForm.template_style !== null) {
    payload.templateStyle = editForm.template_style;
  }
  return payload;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    const payload = buildSubmitPayload();
    if (editForm.id) {
      await request.put('/api/v1/console/placement/update', { placementId: editForm.id, ...payload });
      ElMessage.success('更新成功');
    } else {
      await request.post('/api/v1/console/placement/create', payload);
      ElMessage.success('创建成功');
    }
    showDialog.value = false;
    fetchList();
  } catch { /* ignore */ } finally { submitting.value = false; }
};

const handleToggleStatus = async (row: any) => {
  const newStatus = row.status === 1 ? 2 : 1;
  await ElMessageBox.confirm(`确定${newStatus === 2 ? '禁用' : '启用'}广告位"${row.name}"吗？`, '提示', { type: 'warning' });
  try { await request.put('/api/v1/console/placement/update', { placementId: row.placement_id, status: newStatus }); ElMessage.success('操作成功'); fetchList(); } catch { /* ignore */ }
};

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定删除广告位"${row.name}"吗？`, '警告', { type: 'error' });
  try { await request.delete(`/api/v1/console/placement/delete?placementId=${row.placement_id}`); ElMessage.success('删除成功'); fetchList(); } catch { /* ignore */ }
};

onMounted(() => { fetchApps(); fetchList(); });
</script>
