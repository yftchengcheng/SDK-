<template>
  <div class="page-container">
    <div class="page-header">
      <h1>瀑布流配置</h1>
    </div>
    <!-- Select placement -->
    <div class="filter-card">
      <el-form :inline="true">
        <el-form-item label="选择广告位">
          <el-select v-model="selectedPlacement" placeholder="请选择广告位" style="width: 280px" @change="fetchConfig">
            <el-option v-for="p in placementList" :key="p.placement_id" :label="`${p.name} (${p.placement_id})`" :value="p.placement_id" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <template v-if="selectedPlacement">
      <!-- Layers -->
      <div v-for="layer in layers" :key="layer.type" class="table-card mb-base">
        <div class="card-header">
          <span class="card-title">{{ layer.label }}</span>
          <el-button type="primary" size="small" @click="addSource(layer.type)">添加代码位</el-button>
        </div>
        <el-table :data="layer.sources" stripe style="width: 100%">
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
          <el-table-column prop="priority" label="优先级" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.priority" :min="0" :controls="false" size="small" style="width: 80px" />
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

    <el-empty v-else description="请选择广告位查看瀑布流配置" />

    <!-- Add Source Dialog -->
    <el-dialog v-model="showAddDialog" title="添加代码位" width="480px" destroy-on-close>
      <el-form :model="newSource" label-position="top">
        <el-form-item label="选择广告源">
          <el-select v-model="newSource.ad_source_id" placeholder="请选择广告源" style="width: 100%">
            <el-option v-for="s in adSourceList" :key="s.id" :label="`${s.source_name} (${s.network_name})`" :value="s.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddSource">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import request from '../../utils/request';
import { ElMessage } from 'element-plus';

const selectedPlacement = ref('');
const placementList = ref<any[]>([]);
const adSourceList = ref<any[]>([]);
const saving = ref(false);
const showAddDialog = ref(false);
const currentLayerType = ref(1);
const newSource = reactive({ ad_source_id: null as number | null });

const layers = reactive([
  { type: 1, label: 'Bidding层（并行竞价）', sources: [] as any[] },
  { type: 2, label: 'Standard层（标准价格）', sources: [] as any[] },
  { type: 3, label: 'Fallback层（兜底）', sources: [] as any[] },
]);

const fetchPlacements = async () => {
  try { const res: any = await request.get('/api/v1/console/placement/list', { params: { pageSize: 200 } }); placementList.value = res.data?.list || []; } catch { /* ignore */ }
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
};

const saveConfig = async () => {
  saving.value = true;
  try {
    const allSources = layers.flatMap(l => l.sources.map(s => ({ ...s, layer_type: l.type })));
    await request.post('/api/v1/console/waterfall/update', {
      placementId: selectedPlacement.value,
      layers: allSources,
    });
    ElMessage.success('保存成功');
    fetchConfig();
  } catch { /* ignore */ } finally { saving.value = false; }
};

onMounted(() => { fetchPlacements(); fetchAdSources(); });
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.card-title {
  font: var(--fs-section-title);
  color: #111827;
}
</style>
