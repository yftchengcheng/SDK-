<template>
  <div class="page-shell">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <el-icon :size="18"><Cellphone /></el-icon>
        </div>
        <div class="page-header-titles">
          <h1 class="page-header-title">应用管理</h1>
          <p class="page-header-subtitle">管理你的 SDK 接入应用，应用创建后用于广告位与数据上报的关联</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button type="primary" :icon="Plus" @click="openCreate">创建应用</el-button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="page-filter">
      <el-form :inline="true" class="page-filter-form" @submit.prevent>
        <el-form-item label="应用名称">
          <el-input v-model="filters.keyword" placeholder="搜索应用名称 / 包名 / AppKey" clearable @keyup.enter="onSearch" />
        </el-form-item>
        <el-form-item label="系统">
          <el-select v-model="filters.platform" placeholder="全部" clearable>
            <el-option label="Android" :value="1" />
            <el-option label="iOS" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
          <el-button :icon="RefreshLeft" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- Table Card -->
    <div class="page-card">
      <el-table v-loading="loading" :data="pagedData" border stripe row-key="appKey">
        <el-table-column prop="appName" label="应用名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="app-cell">
              <img v-if="row.iconUrlResolved || row.icon_url" :src="row.iconUrlResolved || row.icon_url" class="app-cell-icon" alt="" @error="($event.target as HTMLImageElement).style.display='none'" />
              <div v-else class="app-cell-icon-fallback">
                <el-icon :size="16"><Cellphone /></el-icon>
              </div>
              <div class="app-cell-text">
                <div class="app-cell-name">{{ row.appName || row.app_name }}</div>
                <div class="app-cell-key">{{ row.appKey || row.app_key }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="platform" label="平台" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="(row.platform === 1) ? 'primary' : 'success'" effect="light" size="small">
              {{ (row.platform === 1) ? 'Android' : 'iOS' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="packageName" label="包名" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="font-family: 'Fira Code', monospace; font-size: 12px;">{{ row.packageName || row.package_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="160" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" round>{{ categoryFullName(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="(row.status === 1) ? 'success' : 'info'" effect="light" size="small">
              {{ (row.status === 1) ? '已启用' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170" align="center">
          <template #default="{ row }">
            <span class="text-muted">{{ formatTime(row.createdAt || row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="onCopy(row.appKey || row.app_key)">复制 AppKey</el-button>
            <el-button :type="(row.status === 1) ? 'danger' : 'success'" link size="small" @click="onToggleStatus(row)">
              {{ (row.status === 1) ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无应用数据，点击右上角“创建应用”开始接入" />
        </template>
      </el-table>

      <div class="page-pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <!-- Drawer: Create / Edit App（侧边抽屉，保留列表上下文） -->
    <el-drawer
      v-model="drawerVisible"
      :direction="direction"
      :size="drawerSize"
      :with-header="false"
      :destroy-on-close="false"
      :append-to-body="true"
      :modal="true"
      :modal-class="'app-form-drawer-mask'"
      class="app-form-drawer"
    >
      <div class="page-form-shell page-form-drawer-shell">
        <!-- Drawer Header（sticky 顶部） -->
        <header class="page-form-header">
          <div class="page-form-header-titles">
            <h1 class="page-form-header-title">
              <el-icon :size="20" style="color: var(--color-primary-500, #2563EB);">
                <component :is="isEdit ? Edit : Plus" />
              </el-icon>
              <span>{{ isEdit ? '编辑应用' : '创建应用' }}</span>
              <el-tag v-if="isEdit" type="warning" effect="light" size="small">编辑模式</el-tag>
            </h1>
            <p class="page-form-header-subtitle">
              {{ isEdit ? '修改应用信息，保存后立即生效' : '填写以下信息以创建一个新应用' }}
            </p>
          </div>
          <div class="page-form-header-actions">
            <el-button :icon="RefreshLeft" @click="onFormReset">重置</el-button>
            <el-button :icon="Close" circle plain @click="closeDrawer" />
          </div>
        </header>

        <!-- Drawer Body -->
        <div class="page-form-body">
          <el-form
            ref="formRef"
            :model="form"
            :rules="formRules"
            label-position="top"
            @submit.prevent
          >
            <!-- 区块 1：平台与上架 -->
            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title">
                  <el-icon><Cellphone /></el-icon>
                  <span>平台与上架</span>
                </h2>
              </div>
              <p class="page-form-section-desc">选择系统平台，并配置应用商店上架状态</p>

              <div class="page-form-grid">
                <el-form-item label="系统平台" prop="platform">
                  <template #label>
                    <span class="required-mark">*</span>
                    <span>系统平台</span>
                  </template>
                  <el-radio-group v-model="form.platform" :disabled="isEdit">
                    <el-radio-button :value="1">Android</el-radio-button>
                    <el-radio-button :value="2">iOS</el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="应用商店上架" prop="storeListed">
                  <template #label>
                    <span class="required-mark">*</span>
                    <span>应用商店上架</span>
                  </template>
                  <el-radio-group v-model="form.storeListed">
                    <el-radio-button :value="true">是</el-radio-button>
                    <el-radio-button :value="false">否</el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <!-- 联动分支：未上架 → 下载链接（选填）+ 警告 -->
                <template v-if="!form.storeListed">
                  <el-form-item label="下载链接" prop="downloadUrl" class="span-2">
                    <el-input v-model="form.downloadUrl" placeholder="请输入应用下载链接（选填）" clearable />
                    <div class="form-warning">
                      <el-icon :size="12"><WarningFilled /></el-icon>
                      <span>建议您填写应用的下载链接，否则有可能会影响竞价广告平台的广告填充</span>
                    </div>
                  </el-form-item>
                </template>

                <!-- 联动分支：已上架 → 应用商店 + 商店链接（必填）+ 搜索 -->
                <template v-else>
                  <el-form-item label="应用商店" prop="storeName">
                    <template #label>
                      <span class="required-mark">*</span>
                      <span>应用商店</span>
                    </template>
                    <el-select v-model="form.storeName" placeholder="请选择应用商店" clearable style="width: 100%">
                      <el-option v-for="s in storeOptions" :key="s.value" :label="s.label" :value="s.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="应用商店链接" prop="storeUrl" class="span-2">
                    <template #label>
                      <span class="required-mark">*</span>
                      <span>应用商店链接</span>
                    </template>
                    <el-input v-model="form.storeUrl" placeholder="示例：https://apps.apple.com/cn/app/xxx" clearable>
                      <template #append>
                        <el-button :icon="Search" @click="searchInStore">搜索</el-button>
                      </template>
                    </el-input>
                  </el-form-item>
                </template>
              </div>
            </section>

            <!-- 区块 2：基础信息 -->
            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title">
                  <el-icon><InfoFilled /></el-icon>
                  <span>基础信息</span>
                  <span class="page-form-section-count">({{ requiredBasicCount }} 项必填)</span>
                </h2>
              </div>
              <p class="page-form-section-desc">应用的基本资料，包括名称、包名、图标和分类</p>

              <div class="page-form-grid">
                <el-form-item label="App Icon" class="span-2">
                  <div class="app-icon-uploader">
                    <div class="app-icon-box" :class="{ 'has-icon': !!form.iconUrl, 'is-error': !!iconError }">
                      <img v-if="form.iconUrl" :src="form.iconUrl" alt="icon" class="app-icon-image" @error="onIconPreviewError" />
                      <div v-else class="app-icon-empty">
                        <el-icon :size="24"><Picture /></el-icon>
                      </div>
                    </div>
                    <input
                      ref="fileInputRef"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      style="display:none"
                      @change="onFileInputChange"
                    />
                    <div class="app-icon-actions">
                      <el-button type="primary" plain @click="triggerFilePicker">
                        <el-icon :size="14"><Upload /></el-icon>
                        <span style="margin-left:4px">{{ form.iconUrl ? '更换图标' : '点击上传' }}</span>
                      </el-button>
                      <el-button v-if="form.iconUrl" link type="danger" @click="clearIcon">
                        <el-icon :size="14"><Delete /></el-icon>
                        <span style="margin-left:4px">移除</span>
                      </el-button>
                      <div class="app-icon-hint">
                        <span class="app-icon-chip"><el-icon :size="11"><Picture /></el-icon>PNG / JPG / JPEG</span>
                        <span class="app-icon-chip"><el-icon :size="11"><FullScreen /></el-icon>512×512px</span>
                        <span class="app-icon-chip"><el-icon :size="11"><Files /></el-icon>≤ 1MB</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="iconError" class="form-error">
                    <el-icon :size="12"><WarningFilled /></el-icon>
                    <span>{{ iconError }}</span>
                  </div>
                </el-form-item>

                <el-form-item label="应用域名" prop="appDomain" class="span-2">
                  <el-input v-model="form.appDomain" placeholder="与您的应用在应用商店所配置的开发者网站的域。例如 takuad.cc" clearable>
                    <template #prefix>
                      <el-tooltip content="您的应用在应用商店所配置的开发者网站的域" placement="top">
                        <el-icon><InfoFilled /></el-icon>
                      </el-tooltip>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item label="应用名称" prop="appName">
                  <template #label>
                    <span class="required-mark">*</span>
                    <span>应用名称</span>
                  </template>
                  <el-input v-model="form.appName" placeholder="请输入应用名称" maxlength="100" show-word-limit clearable />
                </el-form-item>

                <el-form-item label="应用分类" prop="category">
                  <template #label>
                    <span class="required-mark">*</span>
                    <span>应用分类</span>
                  </template>
                  <el-cascader
                    v-model="form.category"
                    :options="categories"
                    :props="{ checkStrictly: false, expandTrigger: 'hover' }"
                    placeholder="请选择分类（先选大类，再选子类）"
                    clearable
                    style="width: 100%"
                  />
                </el-form-item>

                <el-form-item label="授权子账号" prop="authSubaccount" class="span-2">
                  <el-select v-model="form.authSubaccount" placeholder="请选择授权子账号（选填）" clearable style="width: 100%">
                    <el-option label="子账号 A" value="sub_a" />
                    <el-option label="子账号 B" value="sub_b" />
                  </el-select>
                </el-form-item>

                <el-form-item :label="form.platform === 1 ? '应用包名' : 'Bundle ID'" prop="packageName" class="span-2">
                  <template #label>
                    <span class="required-mark">*</span>
                    <span>{{ form.platform === 1 ? '应用包名' : 'Bundle ID' }}</span>
                  </template>
                  <el-input
                    v-model="form.packageName"
                    :placeholder="form.platform === 1 ? 'Android：com.xxx.app' : 'iOS：com.Taku.app'"
                    clearable
                  />
                </el-form-item>

                <el-form-item label="应用屏幕方向" prop="orientation" class="span-2">
                  <template #label>
                    <span class="required-mark">*</span>
                    <span>应用屏幕方向</span>
                  </template>
                  <el-radio-group v-model="form.orientation">
                    <el-radio-button v-for="o in orientationOptions" :key="o.value" :value="o.value">
                      {{ o.label }}
                    </el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </div>
            </section>

            <!-- 区块 3：高级设置（可折叠） -->
            <section class="page-form-section page-form-section--collapsible">
              <div class="page-form-section-header" @click="advancedExpanded = !advancedExpanded">
                <h2 class="page-form-section-title">
                  <el-icon><Setting /></el-icon>
                  <span>高级设置</span>
                </h2>
                <span class="page-form-section-toggle">
                  {{ advancedExpanded ? '收起' : '展开' }}
                  <el-icon :size="14">
                    <component :is="advancedExpanded ? ArrowUp : ArrowDown" />
                  </el-icon>
                </span>
              </div>

              <transition name="collapse">
                <div v-show="advancedExpanded" class="page-form-grid">
                  <el-form-item label="对接方式">
                    <div class="locked-access-type">
                      <el-tag :type="form.accessType === 1 ? 'primary' : 'success'" size="default" effect="light">
                        {{ form.accessType === 1 ? 'SDK 对接' : 'API 对接' }}
                      </el-tag>
                      <span class="locked-tip">注册时已锁定</span>
                    </div>
                  </el-form-item>
                  <el-form-item label="请求超时（ms）" prop="timeoutMs">
                    <el-input-number v-model="form.timeoutMs" :min="100" :max="60000" :step="100" style="width: 100%" controls-position="right" />
                  </el-form-item>

                  <el-form-item v-if="form.accessType === 1" label="微信开放平台 App ID" prop="wechatAppId">
                    <el-input v-model="form.wechatAppId" placeholder="请输入微信开放平台申请的 App ID" maxlength="32" show-word-limit clearable>
                      <template #prefix>
                        <el-tooltip content="在微信开放平台申请的应用标识" placement="top">
                          <el-icon><InfoFilled /></el-icon>
                        </el-tooltip>
                      </template>
                    </el-input>
                  </el-form-item>
                  <el-form-item v-if="form.accessType === 1 && form.platform === 2" label="微信开放平台 Universal Link" prop="wechatUniversalLink" class="span-2">
                    <el-input v-model="form.wechatUniversalLink" placeholder="https://yourdomain.com/uni-link/" clearable>
                      <template #prefix>
                        <el-tooltip content="iOS 微信分享必填，需以 https:// 开头" placement="top">
                          <el-icon><InfoFilled /></el-icon>
                        </el-tooltip>
                      </template>
                    </el-input>
                  </el-form-item>

                  <el-form-item label="遵守美国 COPPA" class="span-2">
                    <template #label>
                      <span>遵守美国 COPPA</span>
                      <el-tooltip content="Children's Online Privacy Protection Act，美国儿童在线隐私保护法" placement="top">
                        <el-icon class="form-label-icon"><InfoFilled /></el-icon>
                      </el-tooltip>
                    </template>
                    <el-radio-group v-model="form.coppaCompliant">
                      <el-radio :value="true">是</el-radio>
                      <el-radio :value="false">否</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item label="遵守美国 CCPA" class="span-2">
                    <template #label>
                      <span>遵守美国 CCPA</span>
                      <el-tooltip content="California Consumer Privacy Act，加州消费者隐私法案" placement="top">
                        <el-icon class="form-label-icon"><InfoFilled /></el-icon>
                      </el-tooltip>
                    </template>
                    <el-radio-group v-model="form.ccpaCompliant">
                      <el-radio :value="true">是</el-radio>
                      <el-radio :value="false">否</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </div>
              </transition>
            </section>
          </el-form>
        </div>

        <!-- Drawer Footer（sticky 底部） -->
        <footer class="page-form-footer">
          <div class="page-form-footer-left">
            <el-icon><InfoFilled /></el-icon>
            <span>带 * 为必填项</span>
          </div>
          <div class="page-form-footer-right">
            <el-button :icon="Close" @click="closeDrawer">取消</el-button>
            <el-button type="primary" :loading="submitting" :icon="Check" @click="handleSubmit">
              {{ isEdit ? '保存修改' : '创建应用' }}
            </el-button>
          </div>
        </footer>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import request from '../../utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  Cellphone, CopyDocument, Plus, Search, RefreshLeft,
  Edit, InfoFilled, Setting, ChatDotRound, Picture, Delete,
  Upload, WarningFilled, Close, Check, ArrowUp, ArrowDown
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const loading = ref(false);
const tableData = ref<any[]>([]);
const pagedData = computed(() => tableData.value);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const filters = reactive<{ keyword: string; platform: number | null }>({ keyword: '', platform: null });

// iOS App Store 标准二级分类（Game / App）
interface SubCategory { value: string; label: string }
interface TopCategory { value: string; label: string; children: SubCategory[] }
const categories: TopCategory[] = [
  {
    value: 'Game', label: '游戏', children: [
      { value: 'Action', label: '动作' },
      { value: 'Adventure', label: '冒险' },
      { value: 'Arcade', label: '街机' },
      { value: 'Board', label: '棋类' },
      { value: 'Card', label: '卡牌' },
      { value: 'Casino', label: '博彩' },
      { value: 'Dice', label: '掷骰游戏' },
      { value: 'Educational', label: '教育' },
      { value: 'Family', label: '家庭' },
      { value: 'Music', label: '音乐' },
      { value: 'Puzzle', label: '益智' },
      { value: 'Racing', label: '赛车' },
      { value: 'Role Playing', label: '角色扮演' },
      { value: 'Simulation', label: '模拟' },
      { value: 'Sports', label: '运动' },
      { value: 'Strategy', label: '策略' },
      { value: 'Trivia', label: '知识问答' },
      { value: 'Word', label: '文字' },
    ],
  },
  {
    value: 'App', label: '应用', children: [
      { value: 'Books', label: '图书' },
      { value: 'Business', label: '公司' },
      { value: 'Catalogs', label: '目录' },
      { value: 'Education', label: '教育' },
      { value: 'Entertainment', label: '娱乐' },
      { value: 'Finance', label: '财务' },
      { value: 'Food & Drink', label: '餐饮美食' },
      { value: 'Health & Fitness', label: '健康与健身' },
      { value: 'Lifestyle', label: '生活时尚' },
      { value: 'Magazines & Newspapers', label: '新闻杂志' },
      { value: 'Medical', label: '医疗' },
      { value: 'Music', label: '音乐' },
      { value: 'Navigation', label: '导航' },
      { value: 'News', label: '新闻' },
      { value: 'Photo & Video', label: '照片与视频' },
      { value: 'Productivity', label: '商务办公' },
      { value: 'Reference', label: '工具书' },
      { value: 'Shopping', label: '购物' },
      { value: 'Social Networking', label: '社交网络' },
      { value: 'Sports', label: '运动' },
      { value: 'Stickers', label: '贴纸' },
      { value: 'Travel', label: '旅游' },
      { value: 'Utilities', label: '效率' },
      { value: 'Weather', label: '天气' },
    ],
  },
];

// 路径 → 中文名（用于列表展示）
const categoryNameOf = (key: string): string => {
  for (const top of categories) {
    for (const sub of top.children) {
      if (sub.value === key) return sub.label;
    }
  }
  return key;
};
const categoryFullName = (raw: string | null | undefined): string => {
  if (!raw) return '—';
  // 兼容历史短字符串（"工具"等）
  if (!raw.includes('/')) return raw;
  const [top, sub] = raw.split('/');
  const t = categories.find(c => c.value === top);
  if (!t) return raw;
  if (!sub) return t.label;
  return `${t.label} - ${categoryNameOf(sub)}`;
};

const accessType = 1; // 默认 SDK 对接（实际从 userStore 取）

// ========== 抽屉 + 表单状态 ==========
const drawerVisible = ref(false);
const direction = 'rtl';
const drawerSize = '720px';
const isEdit = ref(false);
const submitting = ref(false);
const iconError = ref('');
const formRef = ref<FormInstance | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// 应用商店选项（按平台）
const storeOptions = computed(() => form.platform === 1
  ? [
      { value: 'google_play', label: 'Google Play' },
      { value: 'huawei', label: '华为应用市场' },
      { value: 'xiaomi', label: '小米应用商店' },
      { value: 'oppo', label: 'OPPO 软件商店' },
      { value: 'vivo', label: 'vivo 应用商店' },
      { value: 'tencent', label: '腾讯应用宝' },
    ]
  : [
      { value: 'app_store', label: 'App Store' },
      { value: 'testflight', label: 'TestFlight' },
    ],
);

// 屏幕方向选项
const orientationOptions = [
  { value: 1, label: '竖屏' },
  { value: 2, label: '横屏' },
  { value: 3, label: '横/竖屏自适应' },
];

const searchInStore = () => {
  if (!form.storeUrl) {
    ElMessage.warning('请先填写应用商店链接');
    return;
  }
  window.open(form.storeUrl, '_blank');
  ElMessage.success('正在跳转应用商店...');
};

const requiredBasicCount = computed(() => {
  const arr = [form.appName, form.packageName, form.platform, form.category.length >= 2, form.orientation];
  if (form.storeListed) arr.push(form.storeName, form.storeUrl);
  return arr.filter(Boolean).length;
});

const form = reactive({
  // 基础信息
  appName: '',
  packageName: '',
  // 平台与上架
  platform: 1 as number,
  storeListed: true,        // 是否上架
  storeName: 'google_play', // 应用商店
  storeUrl: '',             // 应用商店链接
  downloadUrl: '',          // 下载链接（未上架时）
  // 基础信息
  appDomain: '',            // 应用域名
  category: [] as string[],       // 应用分类 [大类, 子类]，如 ['Game','Action']
  authSubaccount: '',       // 授权子账号
  orientation: 1 as number, // 屏幕方向
  // 业务
  timeoutMs: 5000,
  iconUrl: '',
  wechatAppId: '',
  wechatUniversalLink: '',
  // 合规
  coppaCompliant: false,
  ccpaCompliant: false,
  // 系统
  appKey: '',
  accessType: 1 as number,
  accessTypeLocked: false,
});

// 高级设置是否展开
const advancedExpanded = ref(true);

// 监听平台变化自动设置应用商店
watch(() => form.platform, (val) => {
  if (val === 1) form.storeName = 'google-play';
  else if (val === 2) form.storeName = 'app-store';
});

const formRules: FormRules = {
  appName: [
    { required: true, message: '请输入应用名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度 2-100 字符', trigger: 'blur' },
  ],
  packageName: [
    { required: true, message: '请输入应用包名 / Bundle ID', trigger: 'blur' },
    {
      validator: (_rule, value, cb) => {
        if (!value) return cb();
        // Android: com.xxx.app
        // iOS: com.xxx.app
        if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(value)) {
          return cb(new Error('请输入合法的包名格式（如 com.xxx.app）'));
        }
        cb();
      },
      trigger: 'blur',
    },
  ],
  platform: [
    { required: true, message: '请选择系统平台', trigger: 'change' },
  ],
  category: [
    {
      required: true,
      validator: (_: unknown, val: string[], cb: (err?: Error) => void) => {
        if (!val || val.length < 2) cb(new Error('请选择应用分类（需选到子类）'));
        else cb();
      },
      trigger: 'change',
    },
  ],
  storeListed: [
    { required: true, message: '请选择是否上架', trigger: 'change' },
  ],
  storeName: [
    {
      validator: (_rule, value, cb) => {
        if (form.storeListed && !value) {
          return cb(new Error('请选择应用商店'));
        }
        cb();
      },
      trigger: 'change',
    },
  ],
  storeUrl: [
    {
      validator: (_rule, value, cb) => {
        if (form.storeListed && !value) {
          return cb(new Error('请填写应用商店链接'));
        }
        if (value && !/^https?:\/\/.+/.test(value)) {
          return cb(new Error('请输入正确的 URL，以 http:// 或 https:// 开头'));
        }
        cb();
      },
      trigger: 'blur',
    },
  ],
  orientation: [
    { required: true, message: '请选择应用屏幕方向', trigger: 'change' },
  ],
};

// ========== 列表加载 ==========
const fetchList = async (): Promise<void> => {
  loading.value = true;
  try {
    const res: any = await request.get('/api/v1/console/app/list', {
      params: { page: page.value, pageSize: pageSize.value, ...filters },
    });
    if (res.code === 0) {
      tableData.value = res.data?.list || [];
      total.value = res.data?.total || 0;
    } else {
      ElMessage.error(res.message || '加载失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败');
  } finally {
    loading.value = false;
  }
};

const onSearch = (): void => {
  page.value = 1;
  fetchList();
};

const onReset = (): void => {
  filters.keyword = '';
  filters.platform = null;
  page.value = 1;
  fetchList();
};

const onCopy = async (key: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(key);
    ElMessage.success('AppKey 已复制');
  } catch {
    ElMessage.warning('复制失败，请手动复制');
  }
};

const onToggleStatus = async (row: any): Promise<void> => {
  const newStatus = row.status === 1 ? 0 : 1;
  try {
    await ElMessageBox.confirm(
      `确定要${newStatus === 1 ? '启用' : '禁用'}应用「${row.appName || row.app_name}」吗？`,
      '提示',
      { type: 'warning' }
    );
    const res: any = await request.put('/api/v1/console/app/update', { appKey: row.appKey || row.app_key, status: newStatus });
    if (res.code === 0) {
      ElMessage.success('操作成功');
      fetchList();
    } else {
      ElMessage.error(res.message || '操作失败');
    }
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) ElMessage.error(e.message);
  }
};

const formatTime = (ts: number | string | undefined | null): string => {
  if (!ts) return '-';
  const d = new Date(typeof ts === 'number' ? ts * (ts.toString().length <= 10 ? 1000 : 1) : ts);
  if (isNaN(d.getTime())) return '-';
  return dayjs(d).format('YYYY-MM-DD HH:mm');
};

// ========== 抽屉操作 ==========
const openCreate = (): void => {
  isEdit.value = false;
  resetForm();
  drawerVisible.value = true;
};

const openEdit = async (row: any): Promise<void> => {
  isEdit.value = true;
  resetForm();
  drawerVisible.value = true;
  // 加载详情
  try {
    const res: any = await request.get('/api/v1/console/app/detail', { params: { appKey: row.appKey || row.app_key } });
    if (res.code === 0) {
      const d = res.data;
      form.storeListed = d.store_listed ?? d.storeListed ?? true;
      if (form.storeListed) {
        form.storeName = d.store_name || d.storeName || '';
        form.storeUrl = d.store_url || d.storeUrl || '';
        form.downloadUrl = '';
      } else {
        form.downloadUrl = d.download_url || d.downloadUrl || '';
        form.storeName = '';
        form.storeUrl = '';
      }
      form.appName = d.app_name || d.appName || '';
      form.packageName = d.package_name || d.packageName || '';
      form.platform = d.platform ?? 1;
      form.category = Array.isArray(d.category) ? d.category : (typeof d.category === 'string' && d.category.includes('/') ? d.category.split('/') : (d.category ? [d.category] : []));
      form.timeoutMs = d.timeout_ms ?? d.timeoutMs ?? 5000;
      form.iconUrl = d.iconUrlResolved || d.icon_url || '';
      form.appDomain = d.app_domain || d.appDomain || '';
      form.authSubaccount = d.auth_subaccount || d.authSubaccount || '';
      form.orientation = d.orientation ?? 1;
      form.wechatAppId = d.wechat_app_id || d.wechatAppId || '';
      form.wechatUniversalLink = d.wechat_universal_link || d.wechatUniversalLink || '';
      form.coppaCompliant = d.coppa_compliant ?? d.coppaCompliant ?? false;
      form.ccpaCompliant = d.ccpa_compliant ?? d.ccpaCompliant ?? false;
      form.appKey = d.app_key || d.appKey || '';
      await nextTick();
      formRef.value?.clearValidate();
    } else {
      ElMessage.error(res.message || '加载详情失败');
      drawerVisible.value = false;
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载详情失败');
    drawerVisible.value = false;
  }
};

const closeDrawer = (): void => {
  drawerVisible.value = false;
};

const resetForm = (): void => {
  form.appName = '';
  form.packageName = '';
  form.platform = 1;
  form.category = [];
  form.timeoutMs = 5000;
  form.storeListed = true;
  form.storeName = 'google-play';
  form.storeUrl = '';
  form.downloadUrl = '';
  form.appDomain = '';
  form.authSubaccount = '';
  form.orientation = 1;
  form.coppaCompliant = false;
  form.ccpaCompliant = false;
  form.iconUrl = '';
  form.wechatAppId = '';
  form.wechatUniversalLink = '';
  form.appKey = '';
  iconError.value = '';
  nextTick(() => formRef.value?.clearValidate());
};

const onFormReset = (): void => {
  if (isEdit.value) {
    // 重新加载当前编辑的应用
    const row = tableData.value.find(r => (r.appKey || r.app_key) === form.appKey);
    if (row) openEdit(row);
  } else {
    resetForm();
  }
};

// ========== 图标上传 ==========
const triggerFilePicker = (): void => fileInputRef.value?.click();
const onFileInputChange = (e: Event): void => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  if (file.size > 200 * 1024) {
    iconError.value = '图标大小不能超过 200KB';
    target.value = '';
    return;
  }
  iconError.value = '';
  const reader = new FileReader();
  reader.onload = () => { form.iconUrl = reader.result as string; };
  reader.readAsDataURL(file);
  target.value = '';
};
const clearIcon = (): void => { form.iconUrl = ''; };
const onIconPreviewError = (): void => { iconError.value = '图标预览失败'; };

// ========== 提交 ==========
const handleSubmit = async (): Promise<void> => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    const payload: any = {
      appName: form.appName,
      packageName: form.packageName,
      platform: form.platform,
      category: Array.isArray(form.category) ? form.category.join('/') : (form.category || ''),
      timeoutMs: form.timeoutMs,
      storeListed: form.storeListed,
      storeName: form.storeListed ? form.storeName : '',
      storeUrl: form.storeListed ? form.storeUrl : '',
      downloadUrl: !form.storeListed ? form.downloadUrl : '',
      appDomain: form.appDomain,
      authSubaccount: form.authSubaccount,
      orientation: form.orientation,
      iconUrl: form.iconUrl,
      wechatAppId: form.wechatAppId,
      wechatUniversalLink: form.wechatUniversalLink,
      coppaCompliant: form.coppaCompliant,
      ccpaCompliant: form.ccpaCompliant,
    };
    let res: any;
    if (isEdit.value) {
      payload.appKey = form.appKey;
      res = await request.put('/api/v1/console/app/update', payload);
    } else {
      res = await request.post('/api/v1/console/app/create', payload);
    }
    if (res.code === 0) {
      ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
      drawerVisible.value = false;
      fetchList();
    } else {
      ElMessage.error(res.message || '操作失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

onMounted(fetchList);
</script>
