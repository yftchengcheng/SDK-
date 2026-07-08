<template>
  <div class="page-shell">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <el-icon><Operation /></el-icon>
        </div>
        <div class="page-header-titles">
          <h1 class="page-header-title">瀑布流配置</h1>
          <p class="page-header-subtitle">为每个广告位分层设置广告源优先级（头部竞价 / 标准价格 / 兜底层），系统按顺序逐层请求填充</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="Refresh" @click="onRefreshAll">刷新</el-button>
      </div>
    </div>

    <!-- ===== 控制面板：步骤 + 选择器 + 摘要 合一 ===== -->
    <section class="wf-panel">

      <ol class="wf-stepper" aria-label="操作步骤">
        <li :class="['wf-step', 'wf-step-active']">
          <span class="wf-step-bubble">1</span><span class="wf-step-label">选择广告位</span>
        </li>
        <li class="wf-step-divider"></li>
        <li :class="['wf-step', { 'wf-step-active': !!selectedPlacement }]">
          <span class="wf-step-bubble">2</span><span class="wf-step-label">配置广告源</span>
        </li>
        <li class="wf-step-divider"></li>
        <li :class="['wf-step', { 'wf-step-active': !!selectedPlacement }]">
          <span class="wf-step-bubble">3</span><span class="wf-step-label">保存生效</span>
        </li>
      </ol>

      <div class="wf-panel-divider"></div>

      <!-- 主体：选择器 + 摘要 -->
      <div class="wf-panel-body">
        <!-- 左侧：选择器 -->
        <div class="wf-selector">
          <div class="wf-selector-head">
            <span class="wf-selector-label">选择广告位</span>
            <span class="wf-selector-required">*</span>
            <span v-if="placementList.length > 0" class="wf-selector-count">
              可选 <b>{{ placementList.length }}</b> 个
            </span>
          </div>
          <el-select
            v-model="selectedPlacement"
            placeholder="点击下拉框选择广告位"
            class="wf-select"
            filterable
            clearable
            :disabled="placementList.length === 0"
            @change="onPlacementChange"
            @visible-change="onSelectVisible"
          >
            <el-option v-if="placementList.length === 0" :value="''" disabled>
              <div class="wf-empty-option">暂无可配置的广告位 · 请先到「广告位管理」创建</div>
            </el-option>
            <el-option-group
              v-for="g in groupedPlacements"
              :key="g.appKey"
              :label="`${g.appName} · ${g.items.length} 个广告位`"
            >
              <el-option
                v-for="p in g.items"
                :key="p.placement_id"
                :label="`${p.name} · ${formatLabel(p.format)}`"
                :value="p.placement_id"
              >
                <div class="wf-opt-row">
                  <span class="wf-opt-name">{{ p.name }}</span>
                  <el-tag size="small" :type="formatTagType(p.format)" effect="plain" class="wf-opt-tag">
                    {{ formatLabel(p.format) }}
                  </el-tag>
                  <span class="wf-opt-id">{{ p.placement_id }}</span>
                </div>
              </el-option>
            </el-option-group>
          </el-select>
          <div v-if="placementList.length === 0" class="wf-empty-tip">
            <span>未检测到广告位数据</span>
            <router-link to="/placement" class="wf-empty-link">前往创建 →</router-link>
          </div>
        </div>

        <!-- 右侧：当前选中信息（仅在选中后出现） -->
        <aside v-if="currentPlacement" class="wf-current">
          <div class="wf-current-head">
            <span class="wf-current-dot"></span>
            <span class="wf-current-title">当前编辑</span>
            <button class="wf-current-clear" @click="clearPlacement" type="button">重新选择</button>
          </div>
          <div class="wf-current-body">
            <div class="wf-current-row">
              <span class="wf-current-key">广告位</span>
              <span class="wf-current-val wf-current-val--lg">{{ currentPlacement.name }}</span>
            </div>
            <div class="wf-current-row">
              <span class="wf-current-key">所属应用</span>
              <span class="wf-current-val">{{ appMap[currentPlacement.app_key] || currentPlacement.app_key }}</span>
            </div>
            <div class="wf-current-row">
              <span class="wf-current-key">广告形式</span>
              <el-tag size="small" :type="formatTagType(currentPlacement.format)" effect="plain">
                {{ formatLabel(currentPlacement.format) }}
              </el-tag>
            </div>
            <div class="wf-current-row">
              <span class="wf-current-key">TOKEN</span>
              <code class="wf-current-mono">{{ currentPlacement.placement_id }}</code>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <template v-if="currentPlacement">
      <!-- Layers -->
      <div v-for="layer in layers" :key="layer.type" class="table-card mb-base">
        <div class="card-header">
          <span class="card-title">
            <span class="wf-layer-tag" :class="`wf-layer-${layer.type}`">{{ layer.shortLabel }}</span>
            {{ layer.label }}
          </span>
          <div class="card-header-right">
            <span class="layer-tip">按住行首拖拽可调整优先级</span>
            <el-button type="primary" size="small" @click="addSource(layer.type)">添加代码位</el-button>
          </div>
        </div>
        <el-table :data="layer.sources" stripe style="width: 100%" row-class-name="waterfall-row" :ref="(el) => bindSortable(el as any, layer)">
          <el-table-column label="排序" width="60">
            <template #default="{ $index }">
              <span class="drag-handle" title="拖拽调整顺序">⋮⋮</span>
              <span class="row-index">{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="ad_source_id" label="广告源ID" width="100" />
          <el-table-column prop="network_code" label="广告网络" width="120" />
          <el-table-column prop="sort_price" label="排序价格(元)" width="140">
            <template #default="{ row }">
              <template v-if="layer.type === 2">
                <el-input-number v-model="row.sort_price" :min="0" :precision="2" :controls="false" size="small" style="width: 100px" />
              </template>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column prop="timeout_ms" label="超时(ms)" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.timeout_ms" :min="500" :step="500" :controls="false" size="small" style="width: 100px" />
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="90">
            <template #default="{ $index }">
              <span class="row-index">{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="layer.sources.splice($index, 1)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div style="text-align: right">
        <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
      </div>
    </template>

    <el-empty v-else description="请先选择上方的广告位">
      <template #image>
        <div style="font-size: 48px; color: #CBD5E1">☷</div>
      </template>
    </el-empty>

    <!-- Add Source Dialog -->
    <el-dialog v-model="showAddDialog" :title="`添加代码位 · ${currentLayerLabel}`" width="480px" destroy-on-close>
      <div class="dialog-section">
        <div class="dialog-section-title">
          <el-icon><Plus /></el-icon>
          <span>选择广告源</span>
          <span class="dialog-section-tag">{{ adSourceList.length }} 个可选</span>
        </div>
        <div class="dialog-form-row dialog-form-row--full">
          <el-form-item label="广告源" required>
            <el-select v-model="newSource.ad_source_id" placeholder="请选择广告源" filterable style="width: 100%">
              <el-option
                v-for="s in adSourceList"
                :key="s.id"
                :label="`${s.source_name} (${s.network_name})`"
                :value="s.id"
              />
            </el-select>
            <div class="dialog-form-help">将按当前层类型添加，Bidding 层为并行，Standard/Fallback 层为顺序</div>
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
import { Operation, Refresh, Plus } from '@element-plus/icons-vue';

const selectedPlacement = ref('');
const placementList = ref<any[]>([]);
const appList = ref<any[]>([]);
const adSourceList = ref<any[]>([]);
const saving = ref(false);
const adding = ref(false);
const showAddDialog = ref(false);
const currentLayerType = ref(1);
const newSource = reactive({ ad_source_id: null as number | null });

const currentLayerLabel = computed(() => {
  const l = layers.find(x => x.type === currentLayerType.value);
  return l ? l.label : '';
});

const layers = reactive([
  { type: 1, shortLabel: 'BIDDING', label: 'Bidding层（并行竞价，相同价位同时请求）', sources: [] as any[] },
  { type: 2, shortLabel: 'STANDARD', label: 'Standard层（标准价格，按 sort_price 倒序请求）', sources: [] as any[] },
  { type: 3, shortLabel: 'FALLBACK', label: 'Fallback层（兜底，全部失败时按顺序请求）', sources: [] as any[] },
]);

// AppKey → AppName 映射
const appMap = computed(() => {
  const m: Record<string, string> = {};
  for (const a of appList.value) m[a.app_key] = a.app_name;
  return m;
});

// 当前选中的广告位对象
const currentPlacement = computed(() => placementList.value.find((p) => p.placement_id === selectedPlacement.value) || null);

// 分组：按 app_key 分桶（视觉分组用 el-option label = appName 配合 items.length）
const groupedPlacements = computed(() => {
  const map = new Map<string, { appKey: string; appName: string; items: any[] }>();
  for (const p of placementList.value) {
    const k = p.app_key || '_unbound';
    if (!map.has(k)) map.set(k, { appKey: k, appName: appMap.value[k] || k, items: [] });
    map.get(k)!.items.push(p);
  }
  return Array.from(map.values());
});

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

const sortableInstances: Sortable[] = [];

const fetchPlacements = async () => {
  try { const res: any = await request.get('/api/v1/console/placement/list', { params: { pageSize: 200 } }); placementList.value = res.data?.list || []; } catch { /* ignore */ }
};
const fetchApps = async () => {
  try { const res: any = await request.get('/api/v1/console/app/list', { params: { pageSize: 200 } }); appList.value = res.data?.list || []; } catch { /* ignore */ }
};

const fetchAdSources = async () => {
  try { const res: any = await request.get('/api/v1/console/ad-source/list', { params: { pageSize: 200 } }); adSourceList.value = res.data?.list || []; } catch { /* ignore */ }
};

const fetchConfig = async () => {
  if (!selectedPlacement.value) return;
  try {
    const res: any = await request.get('/api/v1/console/waterfall/get', { params: { placementId: selectedPlacement.value } });
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

const addSource = (type: number) => {
  currentLayerType.value = type;
  newSource.ad_source_id = null;
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
  await Promise.all([fetchPlacements(), fetchAdSources()]);
  if (selectedPlacement.value) await loadLayers(selectedPlacement.value);
  ElMessage.success('已刷新');
};

const saveConfig = async () => {
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
      layers: allSources,
    });
    ElMessage.success('保存成功');
    fetchConfig();
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

onMounted(() => { fetchPlacements(); fetchAdSources(); });

// === UI 辅助：把 placement 渲染成带 App/Format/Name/ID 的清晰标签 ===
const onSelectVisible = (visible: boolean) => {
  if (visible && placementList.value.length === 0) {
    fetchPlacements();
    fetchApps();
  }
};
const onPlacementChange = () => {
  if (selectedPlacement.value) fetchConfig();
};
const clearPlacement = () => {
  selectedPlacement.value = '';
  for (const l of layers) l.sources = [];
  destroySortables();
};
const destroySortables = () => {
  sortableInstances.forEach((s) => s.destroy());
  sortableInstances.length = 0;
};
</script>


