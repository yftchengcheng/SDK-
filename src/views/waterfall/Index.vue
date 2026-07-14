<template>
  <div class="page-shell">
    <!-- ============ 页面头部（与其他页面框架一致） ============ -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><Operation /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">瀑布流配置</h1>
          <p class="page-header-subtitle">为每个广告位分层设置广告源优先级（头部竞价 / 标准价格 / 兜底层），系统按顺序逐层请求填充</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="Refresh" @click="onRefreshAll">刷新</el-button>
      </div>
    </div>

    <!-- ============ Master-Detail 主体 ============ -->
    <div class="app-master-detail">
      <!-- ============ 左侧：广告位列表面板 ============ -->
      <aside class="app-master-panel">
        <div class="app-master-header">
          <div class="app-master-header-top">
            <h2 class="app-master-title">
              <el-icon><Aim /></el-icon>
              <span>广告位</span>
              <el-tag size="small" effect="plain" round class="app-master-count">{{ filteredPlacements.length }}</el-tag>
            </h2>
          </div>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索广告位 / 所属应用"
            :prefix-icon="Search"
            clearable
            size="default"
          />
          <el-select v-model="formatFilter" size="default" class="app-master-sort" clearable placeholder="按广告形式过滤">
            <el-option label="全部形式" value="" />
            <el-option v-for="f in formatOptions" :key="f.value" :label="f.label" :value="f.value" />
          </el-select>
        </div>
        <div class="app-master-list" v-loading="loading">
          <template v-for="g in groupedFilteredPlacements" :key="g.appKey">
            <div class="wf-master-group-title">
              <span class="wf-master-group-name">{{ g.appName }}</span>
              <span class="wf-master-group-count">{{ g.items.length }} 个</span>
            </div>
            <div
              v-for="p in g.items"
              :key="p.id"
              :class="['app-master-item', { active: Number(p.id) === selectedPlacement }]"
              @click="selectPlacement(p.id)"
            >
              <div class="app-master-item-icon">
                <el-icon :size="18"><Aim /></el-icon>
              </div>
              <div class="app-master-item-body">
                <div class="app-master-item-name">
                  <span class="app-master-item-name-text">{{ p.name }}</span>
                  <el-tag size="small" effect="plain" :type="formatTagType(p.format)" class="platform-tag">
                    {{ formatLabel(p.format) }}
                  </el-tag>
                </div>
                <div class="app-master-item-token" :title="p.placement_id">
                  <el-icon :size="10"><Key /></el-icon>
                  <span class="app-master-item-token-text">{{ p.placement_id }}</span>
                </div>
              </div>
            </div>
          </template>
          <el-empty v-if="!loading && filteredPlacements.length === 0" description="暂无广告位" :image-size="60" />
        </div>
      </aside>

      <!-- ============ 右侧：详情区 ============ -->
      <main class="app-detail-panel">
        <!-- 当前选中的广告位未选择时的引导 -->
        <div v-if="!currentPlacement" class="wf-empty-detail">
          <div class="wf-empty-detail-icon">
            <el-icon :size="40"><Aim /></el-icon>
          </div>
          <h2 class="wf-empty-detail-title">请先选择左侧广告位</h2>
          <p class="wf-empty-detail-sub">选择广告位后，可配置三层广告源优先级</p>
          <div v-if="placementList.length === 0" class="wf-empty-detail-tip">
            未检测到广告位数据 · <router-link to="/placement" class="wf-empty-link">前往创建 →</router-link>
          </div>
        </div>

        <template v-else>
          <!-- 顶部广告位信息卡 -->
          <div class="app-detail-header">
            <div class="app-detail-header-left">
              <div class="app-detail-app-icon">
                <el-icon :size="22"><Aim /></el-icon>
              </div>
              <div class="app-detail-app-info">
                <div class="app-detail-app-name-row">
                  <h1 class="app-detail-app-name">{{ currentPlacement.name }}</h1>
                  <el-tag size="small" effect="light" :type="formatTagType(currentPlacement.format)">
                    {{ formatLabel(currentPlacement.format) }}
                  </el-tag>
                  <el-tag size="small" effect="light" type="info">
                    {{ layers.length }} 层配置
                  </el-tag>
                </div>
                <div class="app-detail-app-meta">
                  <span class="app-detail-meta-item">
                    <span class="meta-label">所属应用</span>
                    <span class="meta-value">{{ appMap[currentPlacement.app_key] || currentPlacement.app_key }}</span>
                  </span>
                  <span class="app-detail-meta-divider"></span>
                  <span class="app-detail-meta-item">
                    <span class="meta-label">广告位 ID</span>
                    <span class="meta-value cell-link" @click="copyText(currentPlacement.placement_id)">
                      {{ currentPlacement.placement_id }}
                      <el-icon class="copy-btn"><CopyDocument /></el-icon>
                    </span>
                  </span>
                  <span class="app-detail-meta-divider"></span>
                  <span class="app-detail-meta-item">
                    <span class="meta-label">已配置广告源</span>
                    <span class="meta-value">{{ totalSourceCount }} 个</span>
                  </span>
                </div>
              </div>
            </div>
            <div class="app-detail-header-actions">
              <el-select
                :model-value="selectedTrafficGroupId"
                @update:model-value="onTrafficGroupChange"
                placeholder="默认分组"
                size="default"
                class="wf-tg-selector"
                clearable
              >
                <template #prefix>
                  <el-icon class="wf-tg-prefix"><UserFilled /></el-icon>
                </template>
                <el-option label="默认分组（不区分流量）" :value="0">
                  <span style="display:flex;align-items:center;gap:6px;">
                    <el-icon><Folder /></el-icon>
                    <span>默认分组（不区分流量）</span>
                  </span>
                </el-option>
                <el-option
                  v-for="g in trafficGroupOptions"
                  :key="g.id"
                  :label="g.group_name"
                  :value="g.id"
                >
                  <span style="display:flex;align-items:center;gap:6px;">
                    <el-icon><UserFilled /></el-icon>
                    <span>{{ g.group_name }}</span>
                    <el-tag v-if="g.status === 0" size="small" type="info">已停用</el-tag>
                  </span>
                </el-option>
              </el-select>
              <el-button :icon="Refresh" @click="onRefreshAll">刷新</el-button>
              <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
            </div>
          </div>

          <!-- 流量分组配置列表 -->
          <section class="detail-card wf-config-list-card">
            <div class="detail-card-header">
              <h2 class="detail-card-title">
                <el-icon class="wf-layer-icon wf-layer-1"><Operation /></el-icon>
                <span>流量分组配置列表</span>
                <span class="detail-card-sub">
                  <span class="wf-layer-count">{{ configList.length }}</span> 个分组配置
                </span>
              </h2>
              <div class="detail-card-actions">
                <span class="wf-layer-tip">点击行切换编辑；当前编辑：
                  <el-tag v-if="selectedTrafficGroupId === 0" size="small" effect="plain">默认分组</el-tag>
                  <el-tag v-else size="small" type="primary" effect="plain">
                    {{ trafficGroupOptions.find(g => g.id === selectedTrafficGroupId)?.group_name || '#' + selectedTrafficGroupId }}
                  </el-tag>
                </span>
              </div>
            </div>
            <div class="detail-card-body">
              <el-table
                :data="configList"
                v-loading="configListLoading"
                empty-text="该广告位还没有任何流量分组配置，点击右上「保存配置」即可创建"
                :row-class-name="(args: any) => Number(args.row.traffic_group_id) === selectedTrafficGroupId ? 'wf-row-active' : ''"
                @row-click="(row: any) => onTrafficGroupChange(Number(row.traffic_group_id))"
              >
                <el-table-column label="流量分组" min-width="180">
                  <template #default="{ row }">
                    <div class="wf-config-group">
                      <el-icon v-if="row.traffic_group_id === 0" class="wf-config-group-icon wf-config-group-default"><Folder /></el-icon>
                      <el-icon v-else class="wf-config-group-icon"><UserFilled /></el-icon>
                      <span class="wf-config-group-name">{{ row.traffic_group_name }}</span>
                      <el-tag v-if="row.traffic_group_id === selectedTrafficGroupId" size="small" type="primary" effect="light">编辑中</el-tag>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="版本" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag size="small" effect="plain" type="info">v{{ row.version }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="广告源数" width="120" align="center">
                  <template #default="{ row }">
                    <span class="wf-config-count">{{ row.ad_source_count }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small" effect="light">
                      {{ row.status === 1 ? '启用' : '停用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="更新时间" min-width="180">
                  <template #default="{ row }">
                    <span class="wf-config-time">{{ formatTime(row.updated_at || row.created_at) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100" align="center" fixed="right">
                  <template #default="{ row }">
                    <el-button
                      link
                      type="primary"
                      size="small"
                      @click.stop="onTrafficGroupChange(Number(row.traffic_group_id))"
                    >加载</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </section>

          <!-- 三层配置卡 -->
          <section v-for="layer in layers" :key="layer.type" class="detail-card">
            <div class="detail-card-header">
              <h2 class="detail-card-title">
                <el-icon :class="`wf-layer-icon wf-layer-${layer.type}`"><component :is="layerIcon(layer.type)" /></el-icon>
                <span>{{ layer.label }}</span>
                <span class="detail-card-sub">
                  <span class="wf-layer-count">{{ layer.sources.length }}</span> 个广告源
                </span>
              </h2>
              <div class="detail-card-actions">
                <span class="wf-layer-tip">按住行首拖拽可调整优先级</span>
                <el-button type="primary" size="small" :icon="Plus" @click="addSource(layer.type)">添加代码位</el-button>
              </div>
            </div>
            <div class="detail-card-body">
              <el-table :data="layer.sources" stripe :ref="(el) => bindSortable(el as any, layer)" empty-text="该层暂无广告源，点击右上「添加代码位」配置">
                <el-table-column label="排序" width="70">
                  <template #default="{ $index }">
                    <span class="drag-handle" title="拖拽调整顺序">⋮⋮</span>
                    <span class="row-index">{{ $index + 1 }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="ad_source_id" label="广告源ID" width="100" />
                <el-table-column prop="network_code" label="广告平台" width="120">
                  <template #default="{ row }">
                    <el-tag size="small" effect="plain" type="info">{{ row.network_code || '—' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="sort_price" label="出价(元)" width="150">
                  <template #default="{ row }">
                    <el-input-number v-if="layer.type === 2" v-model="row.sort_price" :min="0" :precision="2" :controls="false" size="small" style="width: 110px" />
                    <span v-else class="wf-layer-na">—</span>
                  </template>
                </el-table-column>
                <el-table-column prop="timeout_ms" label="超时(ms)" width="150">
                  <template #default="{ row }">
                    <el-input-number v-model="row.timeout_ms" :min="500" :step="500" :controls="false" size="small" style="width: 110px" />
                  </template>
                </el-table-column>
                <el-table-column prop="priority" label="优先级" width="90">
                  <template #default="{ $index }">
                    <span class="row-index">{{ $index + 1 }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="90" fixed="right">
                  <template #default="{ $index }">
                    <el-button link type="danger" size="small" @click="layer.sources.splice($index, 1)">移除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </section>
        </template>
      </main>
    </div>

    <!-- Add Source Dialog -->
    <el-dialog v-model="showAddDialog" :title="`添加代码位 · ${currentLayerLabel}`" width="480px" destroy-on-close>
      <div class="dialog-section">
        <div class="dialog-section-title">
          <el-icon><Plus /></el-icon>
          <span>选择广告源</span>
          <span class="dialog-section-tag">{{ adSourceList.length }} 个可选 · 当前广告位</span>
        </div>
        <div class="dialog-form-row dialog-form-row--full">
          <el-form-item label="广告源" required>
            <el-select
              v-model="newSource.ad_source_id"
              :placeholder="adSourceList.length > 0 ? '请选择广告源' : '当前广告位下暂无可用广告源'"
              :disabled="adSourceList.length === 0"
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="s in adSourceList"
                :key="s.id"
                :label="`${s.source_name} · ${s.network_name || s.network_code || '自定义'}`"
                :value="s.id"
              />
            </el-select>
            <div class="dialog-form-help">
              列表已按当前广告位（<b>{{ currentPlacement?.name }}</b>）过滤，仅展示归属该广告位的广告源
            </div>
          </el-form-item>
        </div>
      </div>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="adding" @click="confirmAddSource">添加到当前层</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, onBeforeUnmount } from 'vue';
import request from '../../utils/request';
import { ElMessage } from 'element-plus';
import Sortable from 'sortablejs';
import dayjs from 'dayjs';
import { Operation, Refresh, Plus, Aim, Key, CopyDocument, Top, PriceTag, Bottom, Search, Folder, UserFilled } from '@element-plus/icons-vue';

const formatTime = (t: string | number | Date | null | undefined) => {
  if (!t) return '-';
  const d = dayjs(t);
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : '-';
};

const selectedPlacement = ref<number | null>(null);
const placementList = ref<any[]>([]);
const appList = ref<any[]>([]);
const adSourceList = ref<any[]>([]);
const saving = ref(false);
const adding = ref(false);
const showAddDialog = ref(false);
const currentLayerType = ref(1);
const newSource = reactive({ ad_source_id: null as number | null });
const searchKeyword = ref('');
const formatFilter = ref<number | ''>('');
const loading = ref(false);

// 当前 placement 的所有 traffic_group 配置列表
const configList = ref<any[]>([]);
const configListLoading = ref(false);
const selectedTrafficGroupId = ref<number>(0);
const trafficGroupOptions = ref<Array<{ id: number; group_name: string; status: number }>>([]);

const currentLayerLabel = computed(() => {
  const l = layers.find(x => x.type === currentLayerType.value);
  return l ? l.label : '';
});

// 三层
const layers = reactive([
  { type: 1, shortLabel: 'BIDDING', label: 'Bidding层（并行竞价，相同价位同时请求）', sources: [] as any[] },
  { type: 2, shortLabel: 'STANDARD', label: 'Standard层（标准价格，按出价倒序请求）', sources: [] as any[] },
  { type: 3, shortLabel: 'FALLBACK', label: 'Fallback层（兜底，全部失败时按顺序请求）', sources: [] as any[] },
]);

// AppKey → AppName 映射
const appMap = computed(() => {
  const m: Record<string, string> = {};
  for (const a of appList.value) m[a.app_key] = a.app_name;
  return m;
});

// 当前选中的广告位对象
const currentPlacement = computed(() => placementList.value.find((p) => Number(p.id) === Number(selectedPlacement.value)) || null);

// 过滤后广告位
const filteredPlacements = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase();
  return placementList.value.filter((p) => {
    if (formatFilter.value && Number(p.format) !== Number(formatFilter.value)) return false;
    if (!kw) return true;
    const appName = (appMap.value[p.app_key] || '').toLowerCase();
    return (p.name || '').toLowerCase().includes(kw)
      || (p.placement_id || '').toLowerCase().includes(kw)
      || appName.includes(kw);
  });
});

// 按 app_key 分组（过滤后）
const groupedFilteredPlacements = computed(() => {
  const map = new Map<string, { appKey: string; appName: string; items: any[] }>();
  for (const p of filteredPlacements.value) {
    const k = p.app_key || '_unbound';
    if (!map.has(k)) map.set(k, { appKey: k, appName: appMap.value[k] || k, items: [] });
    map.get(k)!.items.push(p);
  }
  return Array.from(map.values());
});

const formatOptions = [
  { value: 1, label: '横幅' },
  { value: 2, label: '插屏' },
  { value: 3, label: '激励视频' },
  { value: 4, label: '开屏' },
  { value: 5, label: '原生' },
];

// 广告形式 → 中文 + 标签类型
const formatLabel = (f: number | string) => {
  const map: Record<string, string> = { 1: '横幅', 2: '插屏', 3: '激励视频', 4: '开屏', 5: '原生' };
  return map[String(f)] || `形式${f}`;
};
const formatTagType = (f: number | string) => {
  const map: Record<string, '' | 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    1: 'info', 2: 'warning', 3: 'primary', 4: 'success', 5: 'danger',
  };
  return map[String(f)] || '';
};

const layerIcon = (t: number) => {
  if (t === 1) return Top;
  if (t === 2) return PriceTag;
  return Bottom;
};

const totalSourceCount = computed(() => layers.reduce((s, l) => s + l.sources.length, 0));

const copyText = async (text: string) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('已复制');
  } catch {
    ElMessage.warning('复制失败');
  }
};

const sortableInstances: Sortable[] = [];

const fetchPlacements = async () => {
  try { const res: any = await request.get('/api/v1/console/placement/list', { params: { pageSize: 200 } }); placementList.value = res.data?.list || []; } catch { /* ignore */ }
};
const fetchApps = async () => {
  try { const res: any = await request.get('/api/v1/console/app/list', { params: { pageSize: 200 } }); appList.value = res.data?.list || []; } catch { /* ignore */ }
};

const fetchAdSources = async (placementId?: string | number | null) => {
  try {
    const params: Record<string, unknown> = { pageSize: 200 };
    if (placementId) params.placementId = placementId;
    const res: any = await request.get('/api/v1/console/ad-source/list', { params });
    adSourceList.value = res.data?.list || [];
  } catch { adSourceList.value = []; }
};

// 当前 placement 的可选广告源数量（只统计该 placement 下的）
const availableSourceCount = computed(() => adSourceList.value.length);

const fetchConfig = async (groupId: number = 0) => {
  if (!selectedPlacement.value) return;
  try {
    const res: any = await request.get('/api/v1/console/waterfall/get', {
      params: { placementId: selectedPlacement.value, trafficGroupId: groupId || 0 },
    });
    const config = res.data?.config;
    if (config?.layers) {
      layers[0].sources = config.layers.filter((l: any) => l.layer_type === 1);
      layers[1].sources = config.layers.filter((l: any) => l.layer_type === 2);
      layers[2].sources = config.layers.filter((l: any) => l.layer_type === 3);
    } else {
      layers.forEach(l => l.sources = []);
    }
  } catch { layers.forEach(l => l.sources = []); }
};

// 列出当前 placement 的所有 traffic_group 配置
const fetchConfigList = async () => {
  if (!selectedPlacement.value) { configList.value = []; return; }
  configListLoading.value = true;
  try {
    const res: any = await request.get('/api/v1/console/waterfall/list', {
      params: { placementId: selectedPlacement.value },
    });
    configList.value = res.data?.items || [];
  } catch { configList.value = []; } finally { configListLoading.value = false; }
};

// 加载当前 developer 下的所有 traffic_group（供下拉新建配置用）
const fetchTrafficGroups = async () => {
  try {
    const res: any = await request.get('/api/v1/console/traffic-group/list', { params: { pageSize: 200 } });
    const raw = res.data?.list || res.data?.items || res.data || [];
    trafficGroupOptions.value = (raw || []).map((g: any) => ({
      id: Number(g.id),
      group_name: g.group_name,
      status: g.status ?? 1,
    }));
  } catch { trafficGroupOptions.value = []; }
};

const onTrafficGroupChange = async (groupId: number) => {
  selectedTrafficGroupId.value = groupId;
  await fetchConfig(groupId);
};

const addSource = async (type: number) => {
  currentLayerType.value = type;
  newSource.ad_source_id = null;
  // 兜底：若 adSourceList 尚未按当前 placement 过滤，强制重拉一次
  if (selectedPlacement.value) {
    const needsReload = adSourceList.value.length === 0
      || adSourceList.value.some((s: any) => Number(s.placement_id) !== Number(selectedPlacement.value));
    if (needsReload) await fetchAdSources(selectedPlacement.value);
  }
  showAddDialog.value = true;
};

const confirmAddSource = () => {
  if (!newSource.ad_source_id) return ElMessage.warning('请选择广告源');
  const src = adSourceList.value.find((s: any) => s.id === newSource.ad_source_id);
  if (!src) return;
  const layer = layers.find(l => l.type === currentLayerType.value);
  if (layer) {
    layer.sources.push({
      ad_source_id: src.id,
      network_code: src.network_code,
      sort_price: currentLayerType.value === 2 ? 0 : 0,
      timeout_ms: 3000,
      priority: layer.sources.length,
    });
  }
  showAddDialog.value = false;
  newSource.ad_source_id = null;
  ElMessage.success('已添加到当前层，记得点击「保存」');
};

const onRefreshAll = async () => {
  await fetchPlacements();
  if (selectedPlacement.value) {
    await Promise.all([
      fetchAdSources(selectedPlacement.value),
      fetchConfig(selectedTrafficGroupId.value),
      fetchConfigList(),
      fetchTrafficGroups(),
    ]);
  } else {
    adSourceList.value = [];
  }
  ElMessage.success('已刷新');
};

const saveConfig = async () => {
  if (!selectedPlacement.value) { ElMessage.warning('请先选择广告位'); return; }
  saving.value = true;
  try {
    // 重新按当前数组顺序分配 priority，保证落库与 UI 同步
    layers.forEach((l) => {
      l.sources.forEach((s, idx) => {
        s.priority = idx;
      });
    });
    const allSources = layers.flatMap(l => l.sources.map(s => ({ ...s, layer_type: l.type })));
    await request.post('/api/v1/console/waterfall/update', {
      placementId: selectedPlacement.value,
      trafficGroupId: selectedTrafficGroupId.value || 0,
      layers: allSources,
    });
    ElMessage.success(selectedTrafficGroupId.value === 0 ? '默认分组配置已保存' : `流量分组 #${selectedTrafficGroupId.value} 配置已保存`);
    await Promise.all([fetchConfig(selectedTrafficGroupId.value), fetchConfigList()]);
  } catch { /* ignore */ } finally { saving.value = false; }
};

// 拖拽绑定：每次 sources 变化时重新挂载 Sortable
const bindSortable = async (el: any, layer: { sources: any[]; type: number }) => {
  if (!el?.$el) return;
  await nextTick();
  const tbody = el.$el.querySelector('tbody');
  if (!tbody) return;
  const oldIdx = sortableInstances.findIndex((s) => (s as any).__layerType === layer.type);
  if (oldIdx >= 0) {
    sortableInstances[oldIdx].destroy();
    sortableInstances.splice(oldIdx, 1);
  }
  const sortable = Sortable.create(tbody, {
    handle: '.drag-handle',
    animation: 180,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onEnd: (evt) => {
      if (evt.oldIndex === evt.newIndex) return;
      const { sources } = layer;
      const moved = sources.splice(evt.oldIndex, 1)[0];
      sources.splice(evt.newIndex, 0, moved);
    },
  });
  (sortable as any).__layerType = layer.type;
  sortableInstances.push(sortable);
};

onBeforeUnmount(() => {
  sortableInstances.forEach((s) => s.destroy());
  sortableInstances.length = 0;
});

onMounted(() => {
  loading.value = true;
  Promise.all([fetchPlacements(), fetchApps()]).finally(() => { loading.value = false; });
});

const selectPlacement = (id: number) => {
  if (Number(id) === selectedPlacement.value) return;
  selectedPlacement.value = Number(id);
  // 触发 effect
  onPlacementChange();
};
const onPlacementChange = async () => {
  if (selectedPlacement.value) {
    selectedTrafficGroupId.value = 0;
    await Promise.all([
      fetchConfig(0),
      fetchAdSources(selectedPlacement.value),
      fetchConfigList(),
      fetchTrafficGroups(),
    ]);
  } else {
    adSourceList.value = [];
    for (const l of layers) l.sources = [];
    configList.value = [];
    trafficGroupOptions.value = [];
    selectedTrafficGroupId.value = 0;
  }
};
const clearPlacement = () => {
  selectedPlacement.value = null;
  for (const l of layers) l.sources = [];
  configList.value = [];
  trafficGroupOptions.value = [];
  selectedTrafficGroupId.value = 0;
  destroySortables();
};
const destroySortables = () => {
  sortableInstances.forEach((s) => s.destroy());
  sortableInstances.length = 0;
};
</script>


