<template>
  <el-drawer
    v-model="visible"
    :title="isEdit ? '编辑应用' : '创建应用'"
    size="760px"
    direction="rtl"
    :close-on-click-modal="false"
  >
    <div class="ad-body" v-loading="loading">
      <!-- 平台与上架 -->
      <section class="ad-section">
        <div class="ad-section-head">
          <el-icon><Cellphone /></el-icon>
          <span>平台与上架</span>
          <span class="ad-section-sub">应用所属系统与商店上架状态</span>
        </div>
        <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="ad-form">
          <el-form-item label="系统平台" prop="platform">
            <el-radio-group v-model="form.platform" :disabled="isEdit">
              <el-radio-button :value="1">Android</el-radio-button>
              <el-radio-button :value="2">iOS</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="应用商店上架" prop="storeListed">
            <el-radio-group v-model="form.storeListed">
              <el-radio-button :value="true">是</el-radio-button>
              <el-radio-button :value="false">否</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="form.storeListed" label="应用商店" prop="storeName">
            <el-select v-model="form.storeName" placeholder="请选择应用商店" style="width: 100%">
              <el-option v-for="s in storeOptionsForPlatform" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.storeListed" label="应用商店链接" prop="storeUrl">
            <div class="ad-input-with-button">
              <el-input v-model="form.storeUrl" placeholder="请输入应用商店链接" />
              <el-button :icon="Search" plain @click="searchInStore">搜索</el-button>
            </div>
          </el-form-item>
          <el-form-item v-if="!form.storeListed" label="下载链接" prop="downloadUrl">
            <el-input v-model="form.downloadUrl" placeholder="请输入下载链接（APK / TestFlight）" />
            <el-alert type="warning" :closable="false" show-icon class="ad-inline-alert">
              <template #title>未上架提示</template>
              <span>未上架应用无法在应用商店搜索到，请通过下载链接分发</span>
            </el-alert>
          </el-form-item>
        </el-form>
      </section>

      <!-- 基础信息 -->
      <section class="ad-section">
        <div class="ad-section-head">
          <el-icon><Document /></el-icon>
          <span>基础信息</span>
          <span class="ad-section-sub">应用展示与身份标识</span>
          <span class="ad-required-hint">
            已填 <b>{{ requiredBasicCount }}</b> / 共 <b>4</b> 项必填
          </span>
        </div>
        <el-form :model="form" label-position="top" class="ad-form">
          <el-form-item label="App Icon">
            <div class="ad-icon-uploader">
              <div class="ad-icon-box">
                <img v-if="form.iconUrl" :src="form.iconUrl" :alt="form.appName" @error="onIconError" />
                <el-icon v-else :size="32"><Picture /></el-icon>
              </div>
              <input ref="fileInput" type="file" accept="image/png,image/jpeg" @change="onFileChange" hidden />
              <div class="ad-icon-actions">
                <el-button :icon="Upload" plain size="small" @click="triggerUpload">点击上传</el-button>
                <el-button v-if="form.iconUrl" link size="small" type="danger" @click="form.iconUrl = ''">移除</el-button>
              </div>
            </div>
            <div class="ad-icon-hint">
              <span class="ad-icon-chip">
                <el-icon><Picture /></el-icon>
                PNG / JPG / JPEG
              </span>
              <span class="ad-icon-chip">
                <el-icon><FullScreen /></el-icon>
                512×512px
              </span>
              <span class="ad-icon-chip">
                <el-icon><Files /></el-icon>
                ≤ 1MB
              </span>
            </div>
          </el-form-item>
          <el-form-item label="应用域名" prop="appDomain">
            <el-input v-model="form.appDomain" placeholder="例如 example.com" />
            <div class="ad-form-help">与您的应用在应用商店所配置的开发者网站的域</div>
          </el-form-item>
          <el-form-item label="应用名称" prop="appName">
            <el-input v-model="form.appName" placeholder="请输入应用名称" maxlength="30" show-word-limit />
          </el-form-item>
          <el-form-item label="应用分类" prop="category">
            <el-cascader
              v-model="form.category"
              :options="categoryOptions"
              :props="{ value: 'key', label: 'name', children: 'list' }"
              placeholder="请选择分类（先选大类，再选子类）"
              style="width: 100%"
              clearable
            />
          </el-form-item>
          <el-form-item label="授权子账号">
            <el-input v-model="form.authSubaccount" placeholder="可选" />
          </el-form-item>
          <el-form-item label="应用包名 / Bundle ID" prop="packageName">
            <el-input v-model="form.packageName" :placeholder="form.platform === 2 ? 'com.company.app' : 'com.example.app'" />
          </el-form-item>
          <el-form-item label="应用屏幕方向" prop="orientation">
            <el-radio-group v-model="form.orientation">
              <el-radio-button :value="1">横屏</el-radio-button>
              <el-radio-button :value="2">竖屏</el-radio-button>
              <el-radio-button :value="3">横竖兼容</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </section>

      <!-- 高级设置 -->
      <section class="ad-section">
        <div class="ad-section-head ad-section-head--collapsible" @click="advancedOpen = !advancedOpen">
          <el-icon><Tools /></el-icon>
          <span>高级设置</span>
          <span class="ad-section-sub">对接方式与法规合规（可选）</span>
          <el-icon class="ad-collapse-icon" :class="{ rotated: advancedOpen }"><ArrowDown /></el-icon>
        </div>
        <el-form v-show="advancedOpen" :model="form" label-position="top" class="ad-form">
          <el-form-item label="对接方式">
            <el-radio-group v-model="form.accessType">
              <el-radio-button :value="1">SDK 对接</el-radio-button>
              <el-radio-button :value="2">API 对接</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="请求超时（毫秒）">
            <el-input-number v-model="form.requestTimeout" :min="500" :max="10000" :step="500" />
          </el-form-item>
          <el-form-item v-if="form.accessType === 1" label="微信 App ID">
            <el-input v-model="form.wechatAppId" placeholder="可选" />
          </el-form-item>
          <el-form-item v-if="form.accessType === 1 && form.platform === 2" label="微信开放平台 Universal Link">
            <el-input v-model="form.wechatUniversalLink" placeholder="https://yourdomain.com/uni-link/" />
          </el-form-item>
          <el-form-item label="遵守美国 COPPA">
            <el-radio-group v-model="form.coppaCompliant">
              <el-radio :value="true">是</el-radio>
              <el-radio :value="false">否</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="遵守美国 CCPA">
            <el-radio-group v-model="form.ccpaCompliant">
              <el-radio :value="true">是</el-radio>
              <el-radio :value="false">否</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </section>
    </div>

    <template #footer>
      <div class="ad-footer">
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
  Cellphone, Search, Document, Picture, Upload, FullScreen, Files,
  Tools, ArrowDown,
} from '@element-plus/icons-vue';

const props = defineProps<{
  visible: boolean;
  editApp: any | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'saved'): void;
}>();

const visible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
});

const isEdit = computed(() => !!props.editApp);
const loading = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const advancedOpen = ref(false);

const storeOptionsAll = [
  { value: 'google-play', label: 'Google Play', platform: 1 },
  { value: 'huawei', label: '华为应用市场', platform: 1 },
  { value: 'xiaomi', label: '小米应用商店', platform: 1 },
  { value: 'oppo', label: 'OPPO 软件商店', platform: 1 },
  { value: 'vivo', label: 'vivo 应用商店', platform: 1 },
  { value: 'tencent', label: '腾讯应用宝', platform: 1 },
  { value: 'app-store', label: 'App Store', platform: 2 },
];
const storeOptionsForPlatform = computed(() =>
  storeOptionsAll.filter(s => s.platform === form.platform)
);

interface FormState {
  platform: number;
  storeListed: boolean;
  storeName: string;
  storeUrl: string;
  downloadUrl: string;
  iconUrl: string;
  appDomain: string;
  appName: string;
  category: string[];
  authSubaccount: string;
  packageName: string;
  orientation: number;
  accessType: number;
  requestTimeout: number;
  wechatAppId: string;
  wechatUniversalLink: string;
  coppaCompliant: boolean;
  ccpaCompliant: boolean;
}

const form = reactive<FormState>({
  platform: 1,
  storeListed: true,
  storeName: 'google-play',
  storeUrl: '',
  downloadUrl: '',
  iconUrl: '',
  appDomain: '',
  appName: '',
  category: [],
  authSubaccount: '',
  packageName: '',
  orientation: 2,
  accessType: 1,
  requestTimeout: 5000,
  wechatAppId: '',
  wechatUniversalLink: '',
  coppaCompliant: false,
  ccpaCompliant: false,
});

const categoryOptions = [
  { key: 'Game', name: '游戏', list: [
    { key: 'Action', name: '动作' }, { key: 'Adventure', name: '冒险' }, { key: 'Arcade', name: '街机' },
    { key: 'Board', name: '棋类' }, { key: 'Card', name: '卡牌' }, { key: 'Casino', name: '博彩' },
    { key: 'Dice', name: '掷骰游戏' }, { key: 'Educational', name: '教育' }, { key: 'Family', name: '家庭' },
    { key: 'Music', name: '音乐' }, { key: 'Puzzle', name: '益智' }, { key: 'Racing', name: '赛车' },
    { key: 'Role Playing', name: '角色扮演' }, { key: 'Simulation', name: '模拟' }, { key: 'Sports', name: '运动' },
    { key: 'Strategy', name: '策略' }, { key: 'Trivia', name: '知识问答' }, { key: 'Word', name: '文字' },
  ]},
  { key: 'App', name: '应用', list: [
    { key: 'Books', name: '图书' }, { key: 'Business', name: '公司' }, { key: 'Catalogs', name: '目录' },
    { key: 'Education', name: '教育' }, { key: 'Entertainment', name: '娱乐' }, { key: 'Finance', name: '财务' },
    { key: 'Food & Drink', name: '餐饮美食' }, { key: 'Health & Fitness', name: '健康与健身' },
    { key: 'Lifestyle', name: '生活时尚' }, { key: 'Magazines & Newspapers', name: '新闻杂志' },
    { key: 'Medical', name: '医疗' }, { key: 'Music', name: '音乐' }, { key: 'Navigation', name: '导航' },
    { key: 'News', name: '新闻' }, { key: 'Photo & Video', name: '照片与视频' }, { key: 'Productivity', name: '商务办公' },
    { key: 'Reference', name: '工具书' }, { key: 'Shopping', name: '购物' }, { key: 'Social Networking', name: '社交网络' },
    { key: 'Sports', name: '运动' }, { key: 'Stickers', name: '贴纸' }, { key: 'Travel', name: '旅游' },
    { key: 'Utilities', name: '效率' }, { key: 'Weather', name: '天气' },
  ]},
];

const rules = computed(() => ({
  platform: [{ required: true, message: '请选择系统平台', trigger: 'change' }],
  storeListed: [{ required: true, message: '请选择是否上架', trigger: 'change' }],
  storeName: form.storeListed ? [{ required: true, message: '请选择应用商店', trigger: 'change' }] : [],
  storeUrl: form.storeListed ? [{ required: true, message: '请输入应用商店链接', trigger: 'blur' }] : [],
  downloadUrl: !form.storeListed ? [{ required: true, message: '请输入下载链接', trigger: 'blur' }] : [],
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  category: [{
    validator: (_r: any, v: any, cb: any) => v && v.length >= 2 ? cb() : cb(new Error('请选择应用分类（需选到子类）')),
    trigger: 'change',
  }],
  packageName: [{ required: true, message: '请输入包名 / Bundle ID', trigger: 'blur' }],
  orientation: [{ required: true, message: '请选择屏幕方向', trigger: 'change' }],
}));

const requiredBasicCount = computed(() => {
  let n = 0;
  if (form.appDomain) n++;
  if (form.appName.trim()) n++;
  if (form.category && form.category.length >= 2) n++;
  if (form.packageName.trim()) n++;
  return n;
});

const onIconError = (e: Event) => { (e.target as HTMLImageElement).style.display = 'none'; };
const fileInput = ref<HTMLInputElement>();
const triggerUpload = () => fileInput.value?.click();
const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.size > 1024 * 1024) { ElMessage.error('图标不能超过 1MB'); return; }
  const reader = new FileReader();
  reader.onload = ev => { form.iconUrl = String(ev.target?.result || ''); };
  reader.readAsDataURL(file);
};

const searchInStore = () => {
  if (!form.storeName) return ElMessage.warning('请先选择应用商店');
  if (!form.packageName) return ElMessage.warning('请先填写包名');
  const url = form.platform === 2
    ? `https://apps.apple.com/cn/app/_/id${encodeURIComponent(form.packageName)}`
    : `https://www.${form.storeName === 'google-play' ? 'play.google.com' : form.storeName + '.com'}/store/apps/details?id=${encodeURIComponent(form.packageName)}`;
  window.open(url, '_blank');
};

// 平台变化时切换默认 storeName
watch(() => form.platform, (val) => {
  if (val === 1) form.storeName = 'google-play';
  else if (val === 2) form.storeName = 'app-store';
});

const resetForm = () => {
  form.platform = 1;
  form.storeListed = true;
  form.storeName = 'google-play';
  form.storeUrl = '';
  form.downloadUrl = '';
  form.iconUrl = '';
  form.appDomain = '';
  form.appName = '';
  form.category = [];
  form.authSubaccount = '';
  form.packageName = '';
  form.orientation = 2;
  form.accessType = 1;
  form.requestTimeout = 5000;
  form.wechatAppId = '';
  form.wechatUniversalLink = '';
  form.coppaCompliant = false;
  form.ccpaCompliant = false;
  advancedOpen.value = false;
};

const fillFromEdit = (row: any) => {
  form.platform = row.platform || 1;
  form.storeListed = row.store_listed !== false;
  form.storeName = row.store_name || (form.platform === 1 ? 'google-play' : 'app-store');
  form.storeUrl = row.store_url || '';
  form.downloadUrl = row.download_url || '';
  form.iconUrl = row.icon_url || '';
  form.appDomain = row.app_domain || '';
  form.appName = row.app_name || '';
  form.category = row.category && typeof row.category === 'string' && row.category.includes('/')
    ? row.category.split('/')
    : (row.category ? [row.category] : []);
  form.authSubaccount = row.auth_subaccount || '';
  form.packageName = row.package_name || '';
  form.orientation = row.orientation || 2;
  form.accessType = row.access_type || 1;
  form.requestTimeout = row.timeout_ms || 5000;
  form.wechatAppId = row.wechat_app_id || '';
  form.wechatUniversalLink = row.wechat_universal_link || '';
  form.coppaCompliant = !!row.coppa_compliant;
  form.ccpaCompliant = !!row.ccpa_compliant;
  advancedOpen.value = !!(row.wechat_app_id || row.wechat_universal_link || row.coppa_compliant || row.ccpa_compliant);
};

watch(() => props.visible, async (v) => {
  if (v) {
    loading.value = true;
    await nextTick();
    if (props.editApp) {
      fillFromEdit(props.editApp);
    } else {
      resetForm();
    }
    loading.value = false;
  }
});

const submit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();
  submitting.value = true;
  try {
    const categoryVal = form.category && form.category.length >= 2
      ? form.category.join('/')
      : (form.category?.[0] || '');
    const payload: any = {
      name: form.appName,
      appName: form.appName,
      packageName: form.packageName,
      platform: form.platform,
      category: categoryVal,
      appDomain: form.appDomain,
      authSubaccount: form.authSubaccount,
      storeListed: form.storeListed,
      storeName: form.storeListed ? form.storeName : null,
      storeUrl: form.storeListed ? form.storeUrl : null,
      downloadUrl: !form.storeListed ? form.downloadUrl : null,
      orientation: form.orientation,
      accessType: form.accessType,
      requestTimeout: form.requestTimeout,
      wechatAppId: form.accessType === 1 ? form.wechatAppId : null,
      wechatUniversalLink: form.accessType === 1 && form.platform === 2 ? form.wechatUniversalLink : null,
      coppaCompliant: form.coppaCompliant,
      ccpaCompliant: form.ccpaCompliant,
      iconUrl: form.iconUrl,
    };
    if (isEdit.value && props.editApp) {
      payload.appKey = props.editApp.app_key;
      await request.put('/api/v1/console/app/update', payload);
    } else {
      await request.post('/api/v1/console/app/create', payload);
    }
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
    emit('saved');
  } catch { /* ignore */ }
  finally { submitting.value = false; }
};
</script>

