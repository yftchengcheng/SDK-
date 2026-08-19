<template>
  <div class="page-shell">
    <!-- ============ 页面头部（与其他页面框架一致） ============ -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><Cellphone /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">应用管理</h1>
          <p class="page-header-subtitle">管理应用基础信息、广告位、广告平台与数据概览</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="DataLine" @click="goReport">数据报表</el-button>
        <el-button
          :icon="Download"
          :disabled="!currentAppKey"
          @click="openExportSdkPolicy"
        >导出SDK预置策略</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateApp">创建应用</el-button>
      </div>
    </div>

    <!-- ============ Master-Detail 主体 ============ -->
    <div class="app-master-detail">
      <!-- ============ 左侧：应用列表面板 ============ -->
      <aside class="app-master-panel">
      <div class="app-master-header">
        <div class="app-master-header-top">
          <h2 class="app-master-title">
            <el-icon><Cellphone /></el-icon>
            <span>我的应用</span>
            <el-tag size="small" effect="plain" round class="app-master-count">{{ appList.length }}</el-tag>
          </h2>
          <el-button type="primary" size="small" :icon="Plus" class="app-master-create-btn" @click="openCreateApp">创建</el-button>
        </div>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索应用名称 / ID"
          :prefix-icon="Search"
          clearable
          size="default"
        />
        <el-select v-model="sortBy" size="default" class="app-master-sort">
          <el-option label="按添加时间倒序" value="created_desc" />
          <el-option label="按添加时间正序" value="created_asc" />
          <el-option label="按名称 A→Z" value="name_asc" />
        </el-select>
      </div>
      <div class="app-master-list" v-loading="loading">
        <div
          v-for="app in filteredApps"
          :key="app.app_key"
          :class="['app-master-item', { active: app.app_key === currentAppKey }]"
          @click="selectApp(app.app_key)"
        >
          <div class="app-master-item-icon">
            <img v-if="app.icon_url" :src="app.icon_url" :alt="app.app_name" @error="onIconError($event, app)" />
            <el-icon v-else :size="22"><Cellphone /></el-icon>
          </div>
          <div class="app-master-item-body">
            <div class="app-master-item-name">
              <span class="app-master-item-name-text">{{ app.app_name }}</span>
              <EnumTag
                v-if="app.platform"
                dim="app.platform"
                :value="app.platform"
                effect="plain"
                :force-type="app.platform === 1 ? 'info' : 'success'"
              />
              <span
                v-if="app.access_type"
                :class="['access-tag', app.access_type === 1 ? 'access-tag--sdk' : 'access-tag--api']"
                style="font-size: 10px; line-height: 16px; padding: 0 6px;"
                :title="app.access_type === 1 ? 'SDK 接入' : 'API 接入'"
              >
                {{ app.access_type === 1 ? 'SDK' : 'API' }}
              </span>
            </div>
            <div class="app-master-item-token" @click.stop="copyText(app.app_key)" :title="app.app_key">
              <el-icon :size="10"><Key /></el-icon>
              <span class="app-master-item-token-text">{{ app.app_key }}</span>
            </div>
          </div>
          <div class="app-master-item-status" v-if="app.status !== 1">
            <el-icon :size="12" color="#94A3B8"><Lock /></el-icon>
          </div>
        </div>
        <el-empty v-if="!loading && filteredApps.length === 0" description="暂无应用" :image-size="60" />
      </div>
    </aside>

    <!-- ============ 右侧：应用详情区 ============ -->
    <main class="app-detail-panel">
      <template v-if="currentApp">
        <!-- 顶部标题区 -->
        <div class="app-detail-header">
          <div class="app-detail-header-left">
            <div class="app-detail-app-icon">
              <img v-if="currentApp.icon_url" :src="currentApp.icon_url" :alt="currentApp.app_name" @error="onIconError($event, currentApp)" />
              <el-icon v-else :size="24"><Cellphone /></el-icon>
            </div>
            <div class="app-detail-app-info">
              <div class="app-detail-app-name-row">
                <h1 class="app-detail-app-name">{{ currentApp.app_name }}</h1>
                <EnumTag
                  v-if="currentApp.platform"
                  dim="app.platform"
                  :value="currentApp.platform"
                  :force-type="currentApp.platform === 1 ? 'info' : 'success'"
                />
                <span
                  v-if="currentApp.access_type"
                  :class="['access-tag', currentApp.access_type === 1 ? 'access-tag--sdk' : 'access-tag--api']"
                  :title="`对接方式继承自所属开发者账号：${userStore.userInfo?.accessType === 1 ? 'SDK 接入' : 'API 接入'}`"
                >
                  {{ currentApp.access_type === 1 ? 'SDK 接入' : 'API 接入' }}
                </span>
                <EnumTag dim="app.status" :value="currentApp.status" />
                <el-tag v-if="currentApp.store_listed" effect="light" type="warning" size="small">已上架</el-tag>
              </div>
              <div class="app-detail-app-meta">
                <span class="app-detail-meta-item">
                  <span class="meta-label">包名</span>
                  <span class="meta-value">{{ currentApp.package_name || '—' }}</span>
                </span>
                <span class="app-detail-meta-divider"></span>
                <span class="app-detail-meta-item">
                  <span class="meta-label">应用 TOKEN</span>
                  <span class="meta-value cell-link" @click="copyText(currentApp.app_key)">
                    {{ currentApp.app_key }}
                    <el-icon class="copy-btn"><CopyDocument /></el-icon>
                  </span>
                </span>
                <span class="app-detail-meta-divider"></span>
                <span class="app-detail-meta-item">
                  <span class="meta-label">创建</span>
                  <span class="meta-value">{{ formatTime(currentApp.created_at) }}</span>
                </span>
              </div>
            </div>
          </div>
          <div class="app-detail-header-actions">
            <el-button :icon="Setting" @click="openFrequencyDrawer">频次设置</el-button>
            <el-button :icon="Cpu" @click="openExportSdkPolicy">SDK预置策略</el-button>
            <el-button type="primary" :icon="Edit" @click="openEditApp">编辑应用</el-button>
          </div>
        </div>

        <!-- Card 1: 数据预览 -->
        <section class="detail-card">
          <div class="detail-card-header">
            <h2 class="detail-card-title">
              <el-icon><DataLine /></el-icon>
              <span>数据预览</span>
              <span class="detail-card-sub">昨日关键指标</span>
            </h2>
            <a class="detail-card-link" @click="goReport">
              查看更多数据指标
              <el-icon :size="12"><ArrowRight /></el-icon>
            </a>
          </div>
          <div class="detail-card-body">
            <div class="metric-grid">
              <div class="metric-item" v-for="m in metrics" :key="m.key">
                <div class="metric-head">
                  <div class="metric-head-l">
                    <span class="metric-icon" :style="{ background: m.iconBg }">
                      <el-icon :size="14"><component :is="m.icon" /></el-icon>
                    </span>
                    <span class="metric-label">{{ m.label }}</span>
                    <el-tooltip :content="m.tip" placement="top">
                      <el-icon :size="11" class="metric-tip"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </div>
                <div class="metric-value-row">
                  <span class="metric-value">{{ m.value }}</span>
                  <span class="metric-unit" v-if="m.unit">{{ m.unit }}</span>
                </div>
                <div class="metric-spark" :class="['spark-' + m.trendDir, { 'metric-spark--empty': m.value === '-' }]">
                  <svg viewBox="0 0 100 24" preserveAspectRatio="none">
                    <polyline
                      v-if="m.value !== '-'"
                      points="0,18 15,14 30,16 45,10 60,12 75,7 90,9 100,5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <line
                      v-else
                      x1="0" y1="14" x2="100" y2="14"
                      stroke="#CBD5E1" stroke-width="1" stroke-dasharray="3 3"
                    />
                  </svg>
                  <span class="metric-spark-label">近 7 日</span>
                </div>
                <div class="metric-foot">
                  <span v-if="m.value !== '-'" class="metric-trend" :class="m.trendDir">
                    <el-icon :size="10"><CaretTop v-if="m.trendDir === 'up'" /><CaretBottom v-else /></el-icon>
                    {{ m.trend }}<span class="metric-trend-label">较前日</span>
                  </span>
                  <span v-else class="metric-trend-empty">较前日 --</span>
                  <span class="metric-dot">·</span>
                  <span class="metric-sub">较7日</span>
                  <span class="metric-sub-val">{{ m.value !== '-' ? '+8.2%' : '--' }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Card 2: 广告平台关联 -->
        <section class="detail-card">
          <div class="detail-card-header">
            <h2 class="detail-card-title">
              <el-icon><Connection /></el-icon>
              <span>广告平台关联</span>
              <span class="detail-card-sub">该应用已关联的广告平台与频次</span>
            </h2>
            <div class="detail-card-actions">
              <el-button type="primary" :icon="Plus" size="small" @click="openBindDrawer">关联广告平台</el-button>
            </div>
          </div>
          <div class="detail-card-body">
            <div v-if="boundNetworks.length === 0" class="empty-mini">
              <el-icon :size="20" color="#94A3B8"><Link /></el-icon>
              <span>暂未关联广告平台</span>
            </div>
            <div v-else class="network-grid">
              <div
                v-for="n in boundNetworks"
                :key="n.id"
                class="network-item network-item-clickable"
                role="button"
                tabindex="0"
                @click="openViewNetwork(n)"
                @keyup.enter="openViewNetwork(n)"
              >
                <div class="network-item-icon" :class="networkAvatarClass(n)">
                  <img
                    v-if="n.iconUrlResolved"
                    :src="n.iconUrlResolved"
                    :alt="n.network_name || n.network_code"
                    class="network-item-icon-img"
                    @error="onNetworkIconError($event)"
                  />
                  <span v-else>{{ networkAvatarText(n) }}</span>
                </div>
                <div class="network-item-info">
                  <div class="network-item-name-row">
                    <span class="network-item-name">{{ n.network_name || '—' }}</span>
                    <el-tag
                      v-if="n.is_preset === false"
                      size="small"
                      type="info"
                      effect="plain"
                      class="network-item-tag"
                    >自定义</el-tag>
                  </div>
                  <div class="network-item-meta">
                    <span class="meta-chip">{{ n.network_code || '—' }}</span>
                  </div>
                </div>
                <div class="network-item-actions" @click.stop>
                  <el-button link type="primary" size="small" @click="openViewNetwork(n)">查看</el-button>
                  <el-button link type="danger" size="small" @click="unbindNetwork(n)">解绑</el-button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Card 3: 广告位 -->
        <section class="detail-card">
          <div class="detail-card-header">
            <h2 class="detail-card-title">
              <el-icon><Histogram /></el-icon>
              <span>广告位管理</span>
              <span class="detail-card-sub">该应用下的广告位配置与数据</span>
            </h2>
            <div class="detail-card-actions">
              <el-button type="primary" :icon="Plus" size="small" @click="openCreatePlacement">创建广告位</el-button>
            </div>
          </div>
          <div class="detail-card-body">
            <!-- 筛选区 -->
            <div class="placement-filter">
              <el-select v-model="placementFilter.placementId" placeholder="广告位（全部）" clearable size="default" style="width: 160px" @change="fetchPlacements">
                <el-option v-for="p in placements" :key="p.placement_id" :label="p.name" :value="p.placement_id" />
              </el-select>
              <el-select v-model="placementFilter.format" placeholder="广告类型（全部）" clearable size="default" style="width: 140px" @change="fetchPlacements">
                <el-option v-for="f in formatOptions" :key="f.value" :label="f.label" :value="f.value" />
              </el-select>
              <el-select v-model="placementFilter.status" placeholder="状态（全部）" clearable size="default" style="width: 110px" @change="fetchPlacements">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
              <el-date-picker
                v-model="placementFilter.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="default"
                :shortcuts="dateShortcuts"
                value-format="YYYY-MM-DD"
                style="width: 240px"
                @change="fetchPlacements"
              />
              <div class="placement-filter-spacer"></div>
              <div class="placement-filter-meta">
                <span>共 <b>{{ placementTotal }}</b> 个广告位</span>
              </div>
            </div>

            <!-- 广告位表格 -->
            <div class="page-table-wrap">
              <el-table :data="placementList" v-loading="placementLoading" size="default" :cell-style="{ textAlign: 'center' }" :header-cell-style="{ textAlign: 'center', background: 'var(--color-slate-50, #F8FAFC)', color: 'var(--color-slate-700, #334155)', fontWeight: 600 }">
                <el-table-column prop="placement_id" label="广告位名称" min-width="240" align="left" header-align="left">
                  <template #default="{ row }">
                    <div class="cell-name">
                      <span class="cell-link" @click="copyText(row.placement_id)">{{ row.name }}</span>
                      <el-icon class="copy-btn" @click="copyText(row.placement_id)"><CopyDocument /></el-icon>
                    </div>
                    <div v-if="row.placement_id" class="placement-token" @click="copyText(row.placement_id)" :title="`点击复制 ${row.placement_id}`">
                      <el-icon :size="11"><Key /></el-icon>
                      <span class="placement-token__label">广告位TOKEN</span>
                      <span class="placement-token__sep">：</span>
                      <span class="placement-token__value">{{ row.placement_id }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="format" label="广告类型" width="110" align="center" header-align="center">
                  <template #default="{ row }">
                    <span class="status-tag status-tag--info">{{ formatLabel(row.format) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="bidding_type" label="竞价类型" width="100" align="center" header-align="center">
                  <template #default="{ row }">{{ biddingLabel(row.bidding_type) }}</template>
                </el-table-column>
                <el-table-column prop="access_type" label="对接方式" width="110" align="center" header-align="center">
                  <template #default="{ row }">
                    <span
                      v-if="row.access_type"
                      :class="['access-tag', row.access_type === 1 ? 'access-tag--sdk' : 'access-tag--api']"
                    >
                      {{ row.access_type === 1 ? 'SDK 接入' : 'API 接入' }}
                    </span>
                    <span v-else>—</span>
                  </template>
                </el-table-column>
                <el-table-column prop="screen_orientation" label="屏幕方向" width="110" align="center" header-align="center">
                  <template #default="{ row }">
                    <span class="orientation-tag" v-if="row.screen_orientation">
                      <el-icon :size="11"><component :is="orientationIcon(row.screen_orientation)" /></el-icon>
                      {{ orientationLabel(row.screen_orientation) }}
                    </span>
                    <span v-else>—</span>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100" align="center" header-align="center">
                  <template #default="{ row }">
                    <el-switch
                      :model-value="row.status === 1"
                      @change="(v: boolean | string | number) => togglePlacementStatus(row, v)"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="创建时间" width="180" align="center" header-align="center">
                  <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="160" fixed="right" align="center" header-align="center">
                  <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="editPlacement(row)">编辑</el-button>
                    <el-button link type="danger" size="small" @click="deletePlacement(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <TablePagination
        v-model:current-page="placementPage"
        v-model:page-size="placementPageSize"
        :total="placementTotal"
        @change="fetchPlacements"
      />
          </div>
        </section>
      </template>

      <!-- 空状态 -->
      <div v-else class="app-detail-empty">
        <el-empty description="从左侧选择一个应用查看详情" :image-size="120">
          <el-button type="primary" :icon="Plus" @click="openCreateApp">创建应用</el-button>
        </el-empty>
      </div>
    </main>
    </div>

    <!-- ============ 创建/编辑 应用 Drawer（复用原 /app 逻辑）============ -->
    <AppDrawer
      v-model:visible="appDrawerVisible"
      :edit-app="editAppPayload"
      @saved="onAppSaved"
    />

    <!-- ============ 创建/编辑 广告位 Drawer（复用 /placement 逻辑）============ -->
    <PlacementDrawer
      v-model:visible="placementDrawerVisible"
      :app-key="currentAppKey"
      :edit-placement="editPlacementPayload"
      @saved="onPlacementSaved"
    />

    <!-- ============ 频次设置 Drawer（Adtalos SDK v6.1.0+）============ -->
    <FrequencyDrawer
      v-model:visible="freqDrawerVisible"
      :app-key="currentAppKey"
    />

    <ExportSdkPolicyDialog
      v-model:visible="exportSdkDialogVisible"
      :app-key="currentAppKey"
    />

    <!-- ============ 关联广告平台 Drawer ============ -->
    <BindNetworkDrawer
      v-if="currentApp"
      v-model="bindDrawerVisible"
      :app-key="currentApp.app_key"
      :app-name="currentApp.app_name"
      @success="onBindSuccess"
    />

    <!-- ============ 广告平台配置详情 Drawer（只读）============ -->
    <ViewNetworkDrawer
      v-if="viewDrawerVisible && viewingBinding"
      :model-value="viewDrawerVisible"
      :binding="viewingBinding"
      @update:model-value="viewDrawerVisible = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../utils/request';
import {
  Plus, Search, Cellphone, Lock, Setting, Cpu, Edit,
  CopyDocument, DataLine, ArrowRight, QuestionFilled, Connection, Link,
  Histogram, Crop, TakeawayBox, Iphone, User, Money, TrendCharts, CaretTop, CaretBottom,
  Key, Download,
} from '@element-plus/icons-vue';
import { useUserStore } from '../../stores/user';
import AppDrawer from './components/AppDrawer.vue';
import PlacementDrawer from './components/PlacementDrawer.vue';
import FrequencyDrawer from './components/FrequencyDrawer.vue';
import ExportSdkPolicyDialog from './components/ExportSdkPolicyDialog.vue';
import EnumTag from '../../components/EnumTag.vue';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const appList = ref<any[]>([]);
const searchKeyword = ref('');
const sortBy = ref('created_desc');
const currentAppKey = ref('');

const filteredApps = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase();
  let list = appList.value.slice();
  if (kw) {
    list = list.filter(a =>
      String(a.app_name || '').toLowerCase().includes(kw) ||
      String(a.app_id || a.id || '').toLowerCase().includes(kw) ||
      String(a.package_name || '').toLowerCase().includes(kw)
    );
  }
  list.sort((a, b) => {
    if (sortBy.value === 'created_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy.value === 'created_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy.value === 'name_asc') return String(a.app_name || '').localeCompare(String(b.app_name || ''));
    return 0;
  });
  return list;
});

const currentApp = computed(() => appList.value.find(a => a.app_key === currentAppKey.value) || null);

const onIconError = (e: Event, _app: any) => {
  (e.target as HTMLImageElement).style.display = 'none';
};

const fetchApps = async () => {
  loading.value = true;
  try {
    const res: any = await request.get('/api/v1/console/app/list', { params: { pageSize: 200 } });
    appList.value = res.data?.list || [];
    // 默认选中第一个
    if (!currentAppKey.value && appList.value.length > 0) {
      currentAppKey.value = appList.value[0].app_key;
    }
  } catch { /* ignore */ } finally { loading.value = false; }
};

const selectApp = (key: string) => {
  if (currentAppKey.value === key) return;
  currentAppKey.value = key;
  // 重置 placement 筛选 + 分页
  placementFilter.placementId = '';
  placementFilter.format = null as any;
  placementFilter.status = null as any;
  placementFilter.dateRange = null as any;
  placementPage.value = 1;
};

const formatTime = (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '--';
const copyText = async (text: string) => {
  try { await navigator.clipboard.writeText(text); ElMessage.success('已复制'); }
  catch { ElMessage.warning('复制失败，请手动复制'); }
};

// ========== Card 1: 数据预览 ==========
interface Metric { key: string; label: string; tip: string; value: string; trend: string; trendDir: 'up' | 'down' | 'flat'; icon: string; iconBg: string; unit: string }
const metrics = ref<Metric[]>([
  { key: 'dau', label: '昨日 DAU', tip: '昨日活跃设备数', value: '-', trend: '-', trendDir: 'flat', icon: 'User', iconBg: 'rgba(37, 99, 235, 0.08)', unit: '' },
  { key: 'revenue', label: '昨日预估收益', tip: '昨日所有广告位预估总收益', value: '-', trend: '-', trendDir: 'flat', icon: 'Money', iconBg: 'rgba(16, 185, 129, 0.08)', unit: '¥' },
  { key: 'arpdau', label: '昨日预估 ARPDAU', tip: '昨日每 DAU 平均收益', value: '-', trend: '-', trendDir: 'flat', icon: 'TrendCharts', iconBg: 'rgba(168, 85, 247, 0.08)', unit: '¥' },
  { key: 'impression_dau', label: '昨日展示/DAU', tip: '昨日每 DAU 平均广告展示次数', value: '-', trend: '-', trendDir: 'flat', icon: 'DataLine', iconBg: 'rgba(245, 158, 11, 0.08)', unit: '' },
]);
const metricSub7d = ref<Record<string, string>>({ dau: '+8.2%', revenue: '+12.5%', arpdau: '-3.1%', impression_dau: '+5.7%' });

const fetchMetrics = async () => {
  if (!currentApp.value) return;
  try {
    const res: any = await request.get('/api/v1/console/dashboard/overview', {
      params: { appKey: currentAppKey.value },
    });
    const d = res.data || {};
    metrics.value = [
      { key: 'dau', label: '昨日 DAU', tip: '昨日活跃设备数', value: d.dau != null ? String(d.dau) : '-', trend: d.dau_trend || '-', trendDir: (d.dau_trend_dir || 'flat') as any, icon: 'User', iconBg: 'rgba(37, 99, 235, 0.08)', unit: '' },
      { key: 'revenue', label: '昨日预估收益', tip: '昨日所有广告位预估总收益', value: d.revenue != null ? `¥${d.revenue}` : '-', trend: d.revenue_trend || '-', trendDir: (d.revenue_trend_dir || 'flat') as any, icon: 'Money', iconBg: 'rgba(16, 185, 129, 0.08)', unit: '¥' },
      { key: 'arpdau', label: '昨日预估 ARPDAU', tip: '昨日每 DAU 平均收益', value: d.arpdau != null ? `¥${d.arpdau}` : '-', trend: d.arpdau_trend || '-', trendDir: (d.arpdau_trend_dir || 'flat') as any, icon: 'TrendCharts', iconBg: 'rgba(168, 85, 247, 0.08)', unit: '¥' },
      { key: 'impression_dau', label: '昨日展示/DAU', tip: '昨日每 DAU 平均广告展示次数', value: d.impression_dau != null ? String(d.impression_dau) : '-', trend: d.impression_dau_trend || '-', trendDir: (d.impression_dau_trend_dir || 'flat') as any, icon: 'DataLine', iconBg: 'rgba(245, 158, 11, 0.08)', unit: '' },
    ];
  } catch {
    // 接口不存在时保持 '-'
  }
};

// ========== Card 2: 广告平台关联 ==========
const boundNetworks = ref<any[]>([]);
const fetchBoundNetworks = async () => {
  if (!currentApp.value) { boundNetworks.value = []; return; }
  try {
    const res: any = await request.get('/api/v1/console/network/app/list', {
      params: { appKey: currentAppKey.value },
    });
    boundNetworks.value = res.data?.list || [];
  } catch {
    boundNetworks.value = [];
  }
};
const unbindNetwork = async (n: any) => {
  await ElMessageBox.confirm(`确定解绑广告平台「${n.network_name || n.network_code}」吗？`, '提示', { type: 'warning' });
  try {
    await request.post('/api/v1/console/network/app/unbind', { appKey: currentAppKey.value, networkDefId: n.network_def_id });
    ElMessage.success('已解绑');
    fetchBoundNetworks();
  } catch { /* ignore */ }
};
// 网络代码 → 字母 avatar 文本（无 icon_url，用首字母代替）
function networkAvatarText(n: any): string {
  const code = (n.network_code || '').toUpperCase();
  const name = (n.network_name || '').trim();
  if (!code && !name) return 'AD';
  // 优先用网络名的首字（中英文都 OK），否则用 code 首字母
  if (name) {
    // 取第一个可见字符
    const first = Array.from(name)[0];
    if (first) return first;
  }
  return code.slice(0, 1);
}
// 网络代码 → 配色 class（按 network_code 哈希到 5 个预设色）
function networkAvatarClass(n: any): string {
  const code = (n?.network_code || '').toUpperCase();
  if (!code) return 'nac-muted';
  const map: Record<string, string> = {
    CSJ: 'nac-blue',      // 穿山甲
    YLH: 'nac-green',     // 优量汇
    KS:  'nac-orange',    // 快手
    BD:  'nac-red',       // 百度
  };
  if (map[code]) return map[code];
  return 'nac-slate';
}
// icon 加载失败 → 回退到字母 avatar
function onNetworkIconError(ev: Event) {
  const img = ev.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent) parent.classList.add('nac-muted');
}
const goNetwork = () => router.push('/network');

// ========== 关联广告平台抽屉 ==========
import BindNetworkDrawer from './components/BindNetworkDrawer.vue';
import ViewNetworkDrawer from './components/ViewNetworkDrawer.vue';
const bindDrawerVisible = ref(false);
const openBindDrawer = () => {
  if (!currentApp.value?.app_key) {
    ElMessage.warning('请先选择应用');
    return;
  }
  bindDrawerVisible.value = true;
};
const onBindSuccess = () => {
  fetchBoundNetworks();
};

// ========== 广告平台配置详情（只读） ==========
const viewDrawerVisible = ref(false);
const viewingBinding = ref<any | null>(null);
const openViewNetwork = (binding: any) => {
  viewingBinding.value = binding;
  viewDrawerVisible.value = true;
};

// ========== Card 3: 广告位 ==========
const placementList = ref<any[]>([]);
const placementLoading = ref(false);
const placementTotal = ref(0);
const placementPage = ref(1);
const placementPageSize = ref(20);
const placementFilter = reactive<{ placementId: string; format: number | null; status: number | null; dateRange: [string, string] | null }>({
  placementId: '',
  format: null,
  status: null,
  dateRange: null,
});

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
const findLabel = (options: { value: number; label: string }[], v: number | null | undefined) =>
  options.find(o => o.value === v)?.label || '--';
const formatLabel = (v: number) => findLabel(formatOptions, v);
const biddingLabel = (v: number) => findLabel(biddingOptions, v);
const orientationLabel = (v: number) => findLabel(orientationOptions, v);
const orientationIcon = (v: number) => {
  if (v === 1) return Crop;
  if (v === 2) return Iphone;
  return TakeawayBox;
};

const dateShortcuts = [
  { text: '今天', value: () => [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] },
  { text: '昨天', value: () => [dayjs().subtract(1, 'day').format('YYYY-MM-DD'), dayjs().subtract(1, 'day').format('YYYY-MM-DD')] },
  { text: '近 7 天', value: () => [dayjs().subtract(6, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] },
  { text: '近 30 天', value: () => [dayjs().subtract(29, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] },
];

const fetchPlacements = async () => {
  if (!currentAppKey.value) { placementList.value = []; placementTotal.value = 0; return; }
  placementLoading.value = true;
  try {
    const params: any = {
      page: placementPage.value,
      pageSize: placementPageSize.value,
      appKey: currentAppKey.value,
    };
    if (placementFilter.placementId) params.placementId = placementFilter.placementId;
    if (placementFilter.format) params.format = placementFilter.format;
    if (placementFilter.status !== null) params.status = placementFilter.status;
    if (placementFilter.dateRange && placementFilter.dateRange.length === 2) {
      params.startDate = placementFilter.dateRange[0];
      params.endDate = placementFilter.dateRange[1];
    }
    const res: any = await request.get('/api/v1/console/placement/list', { params });
    placementList.value = res.data?.list || [];
    placementTotal.value = res.data?.total || 0;
  } catch { placementList.value = []; placementTotal.value = 0; }
  finally { placementLoading.value = false; }
};

const togglePlacementStatus = async (row: any, v: boolean | string | number) => {
  const newStatus = v ? 1 : 0;
  try {
    await request.put('/api/v1/console/placement/update', { placementId: row.placement_id, status: newStatus });
    ElMessage.success('操作成功');
    fetchPlacements();
  } catch { /* ignore */ }
};
const editPlacement = (row: any) => {
  editPlacementPayload.value = row;
  placementDrawerVisible.value = true;
};
const deletePlacement = async (row: any) => {
  await ElMessageBox.confirm(`确定删除广告位「${row.name}」吗？`, '警告', { type: 'error' });
  try {
    await request.delete(`/api/v1/console/placement/delete?placementId=${row.placement_id}`);
    ElMessage.success('删除成功');
    fetchPlacements();
  } catch { /* ignore */ }
};

// ========== Drawer 控制 ==========
const appDrawerVisible = ref(false);
const editAppPayload = ref<any>(null);
const openCreateApp = () => { editAppPayload.value = null; appDrawerVisible.value = true; };
const openEditApp = () => { editAppPayload.value = currentApp.value; appDrawerVisible.value = true; };
const openAppSettings = () => ElMessage.info('SDK 预置策略开发中');
const freqDrawerVisible = ref(false);
const openFrequencyDrawer = () => { freqDrawerVisible.value = true; };
const onAppSaved = () => { appDrawerVisible.value = false; fetchApps(); };

const placementDrawerVisible = ref(false);
const editPlacementPayload = ref<any>(null);
const openCreatePlacement = () => { editPlacementPayload.value = null; placementDrawerVisible.value = true; };
const onPlacementSaved = () => { placementDrawerVisible.value = false; fetchPlacements(); };

// ========== 导出 SDK 预置策略 ==========
const exportSdkDialogVisible = ref(false);
const openExportSdkPolicy = () => { exportSdkDialogVisible.value = true; };

// ========== 路由跳转 ==========
const goReport = () => router.push('/report');

watch(currentAppKey, () => {
  fetchMetrics();
  fetchBoundNetworks();
  fetchPlacements();
});

onMounted(() => { fetchApps(); });
</script>

