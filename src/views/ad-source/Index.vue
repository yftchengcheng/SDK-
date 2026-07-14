<template>
  <div class="adsource-shell" data-hmr="v3-placement-fix-2026">
    <!-- 左侧：广告平台 + 应用列表 -->
    <aside class="adsource-side">
      <div class="adsource-side-platform">
        <div class="adsource-side-platform-row">
          <div class="adsource-side-platform-icon" :class="{ 'adsource-side-platform-icon--custom': entryMode === 'custom' }">
            <el-icon :size="18" color="#fff"><Connection /></el-icon>
          </div>
          <div class="adsource-side-platform-info">
            <div class="adsource-side-platform-name">{{ platformName || '广告源管理' }}</div>
            <div class="adsource-side-platform-sub">
              {{ entryMode === 'custom' ? '自定义广告平台' : '标准广告平台' }}
            </div>
          </div>
        </div>
      </div>

      <div class="adsource-side-apps">
        <div class="adsource-side-apps-title">应用列表</div>
        <el-input
          v-model="appSearch"
          placeholder="搜索应用名称/ID"
          clearable
          size="small"
          class="adsource-side-apps-search"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <div class="adsource-side-apps-list" v-loading="appsLoading">
          <div
            v-for="app in filteredApps"
            :key="app.id"
            class="adsource-side-app"
            :class="{ 'adsource-side-app--active': app.id === selectedAppId }"
            @click="onAppSelect(app)"
          >
            <div class="adsource-side-app-icon">
              <img v-if="app.iconUrlResolved" :src="app.iconUrlResolved" :alt="app.app_name" @error="onAppIconError($event)" />
              <el-icon v-else :size="16" color="#94A3B8"><Cellphone /></el-icon>
            </div>
            <div class="adsource-side-app-name">{{ app.app_name }}</div>
          </div>
          <div v-if="!appsLoading && filteredApps.length === 0" class="adsource-side-app--empty">
            暂无应用
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧：主区域 -->
    <main class="adsource-main">
      <header class="adsource-main-header">
        <div class="adsource-main-header-left">
          <div class="adsource-main-app">
            <span class="adsource-main-app-name">{{ selectedAppName || '请选择应用' }}</span>
            <el-button v-if="selectedAppId" link type="primary" size="small">
              <el-icon><Edit /></el-icon>
            </el-button>
          </div>
          <div v-if="entryMode === 'custom' && selectedNetworkId" class="adsource-main-context">
            <el-tag size="small" type="primary" effect="light">
              <el-icon><Filter /></el-icon>
              <span style="margin-left: 4px;">{{ platformName || '自定义广告平台' }}</span>
              <el-button link size="small" type="primary" style="margin-left: 6px;" @click="clearNetworkFilter">清除</el-button>
            </el-tag>
          </div>
        </div>
        <div class="adsource-main-header-right">
          <el-select
            v-model="selectedPlacementId"
            placeholder="请选择广告位"
            clearable
            filterable
            style="width: 200px"
            :disabled="!selectedAppId"
            @change="onPlacementChange"
          >
            <el-option
              v-for="p in placements"
              :key="p.id"
              :label="`${p.name}（${formatPlacementType(p.format)}）`"
              :value="p.id"
            />
          </el-select>
          <el-button type="primary" :icon="Plus" :disabled="!selectedAppId" @click="openCreate">
            添加广告源
          </el-button>
        </div>
      </header>

      <div class="adsource-main-toolbar">
        <div class="adsource-main-toolbar-left">
          <el-dropdown @command="onBatchCommand" :disabled="!selectedRowIds.length">
            <el-button :disabled="!selectedRowIds.length">
              批量操作
              <el-icon style="margin-left: 4px"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="enable">启用</el-dropdown-item>
                <el-dropdown-item command="disable">禁用</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span v-if="selectedRowIds.length" class="adsource-main-toolbar-tip">已选 {{ selectedRowIds.length }} 项</span>
        </div>
        <div class="adsource-main-toolbar-right">
          <el-input
            v-model="filter.keyword"
            placeholder="搜索广告源ID或广告单元ID"
            clearable
            size="small"
            style="width: 240px"
            @keyup.enter="onSearch"
            @clear="onSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>
      </div>

      <div class="adsource-main-table">
        <el-table
          :data="tableData"
          v-loading="loading"
          stripe
          @selection-change="onSelectionChange"
          style="width: 100%"
        >
          <el-table-column type="selection" width="48" />
          <el-table-column prop="id" label="广告源ID" min-width="100" />
          <el-table-column prop="source_name" label="广告源名称" min-width="160" />
          <el-table-column label="参数" min-width="220">
            <template #default="{ row }">
              <code class="adsource-cell-json">{{ formatExtra(row) }}</code>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <span class="status-tag" :class="row.status === 1 ? 'status-tag--active' : 'status-tag--paused'">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="adsource-main-pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @current-change="fetchList"
            @size-change="fetchList"
          />
        </div>
      </div>
    </main>

    <!-- 创建/编辑抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      :size="drawerSize"
      :with-header="false"
      :destroy-on-close="false"
      :append-to-body="true"
      class="page-form-drawer"
    >
      <div class="page-form-shell page-form-drawer-shell">
        <header class="page-form-header">
          <div class="page-form-header-titles">
            <h1 class="page-form-header-title">
              <el-icon :size="20" style="color: var(--color-primary-500, #2563EB)">
                <component :is="isEdit ? Edit : Plus" />
              </el-icon>
              <span>{{ isEdit ? '编辑广告源' : '添加广告源' }}</span>
            </h1>
            <p class="page-form-header-subtitle">
              {{ isEdit ? '修改广告源信息，保存后立即生效' : '为当前应用与广告位添加广告源' }}
            </p>
          </div>
          <div class="page-form-header-actions">
            <el-button :icon="RefreshLeft" @click="onFormReset">重置</el-button>
            <el-button :icon="Close" circle plain @click="closeDrawer" />
          </div>
        </header>

        <div class="page-form-body">
          <el-form
            ref="formRef"
            :model="editForm"
            :rules="formRules"
            label-position="top"
            @submit.prevent
          >
            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title"><el-icon><InfoFilled /></el-icon><span>基础信息</span></h2>
              </div>
              <div class="page-form-grid">
                <el-form-item label="广告源名称" prop="source_name" class="span-2">
                  <template #label><span class="required-mark">*</span><span>广告源名称</span></template>
                  <el-input v-model="editForm.source_name" placeholder="如：穿山甲-激励视频-主" />
                </el-form-item>
                <el-form-item label="广告平台" prop="networkDefId" class="span-2">
                  <template #label>
                    <span v-if="entryMode === 'standard'" class="required-mark">*</span>
                    <span>广告平台</span>
                  </template>
                  <el-input
                    v-if="entryMode === 'custom'"
                    :value="platformName || '自定义广告平台'"
                    disabled
                    placeholder="从「广告平台 → 操作项 → 广告源」进入时自动锁定"
                  >
                    <template #prefix>
                      <el-icon style="color: var(--color-primary-500, #2563EB)"><Connection /></el-icon>
                    </template>
                  </el-input>
                  <el-select
                    v-else
                    v-model="editForm.networkDefId"
                    placeholder="请选择广告平台"
                    filterable
                    :loading="customNetworksLoading"
                    @visible-change="onCustomNetworkDropdownToggle"
                    @change="onNetworkSelect"
                  >
                    <el-option
                      v-for="n in customNetworks"
                      :key="n.id"
                      :label="n.network_name"
                      :value="n.id"
                    >
                      <span style="float: left">{{ n.network_name }}</span>
                      <span style="float: right; color: #94A3B8; font-size: 12px;">{{ n.network_code }}</span>
                    </el-option>
                    <template #empty>
                      <div style="text-align: center; color: #94A3B8; padding: 12px 0;">
                        暂无可用广告平台
                      </div>
                    </template>
                  </el-select>
                </el-form-item>
                <el-form-item label="所属应用" class="span-2">
                  <el-input :value="selectedAppName" disabled />
                </el-form-item>
                <el-form-item label="所属广告位" class="span-2">
                  <el-input :value="selectedPlacementName" disabled />
                </el-form-item>
              </div>
            </section>

            <section class="page-form-section">
              <div class="page-form-section-header">
                <h2 class="page-form-section-title"><el-icon><Connection /></el-icon><span>广告平台凭证</span></h2>
              </div>
              <p class="page-form-section-desc">当前所属：{{ platformName || '自定义广告平台' }}</p>
              <div class="page-form-grid">
                <el-form-item label="三方 App ID" prop="third_app_id" class="span-2">
                  <template #label><span class="required-mark">*</span><span>三方 App ID</span></template>
                  <el-input v-model="editForm.third_app_id" placeholder="在广告平台注册的应用ID" />
                </el-form-item>
                <el-form-item label="三方代码位 ID" prop="third_placement_id" class="span-2">
                  <template #label><span class="required-mark">*</span><span>三方代码位 ID</span></template>
                  <el-input v-model="editForm.third_placement_id" placeholder="在广告平台申请的代码位ID" />
                </el-form-item>
                <el-form-item label="额外配置" class="span-2">
                  <el-input
                    v-model="editForm.extraText"
                    type="textarea"
                    :rows="5"
                    placeholder='支持各广告平台特有的高级参数，JSON 格式，例如：&#10;{&#10;  "slot_id": "your_slot_id",&#10;  "timeout": 5000,&#10;  "test_mode": false&#10;}'
                  />
                  <div class="form-help">各广告平台特有的高级参数，如穿山甲的 slot_id、优量汇的透传参数等，留空使用默认</div>
                </el-form-item>
              </div>
            </section>

            <section class="page-form-section">
              <header class="page-form-section-header">
                <span class="page-form-section-title">广告源维度参数</span>
                <span class="page-form-section-desc">key=value 模式的自定义参数，可与广告平台维度参数互补</span>
              </header>
              <div class="page-form-section-body">
                <el-form-item label="维度参数">
                  <div v-if="storeDimParams.length === 0" class="adsrc-kv-empty">
                    暂无参数，点击下方按钮添加
                  </div>
                  <div v-else class="adsrc-kv-list">
                    <div v-for="(p, idx) in storeDimParams" :key="idx" class="adsrc-kv-row">
                      <el-input
                        v-model="p.key"
                        placeholder="参数 key（如 slot_id）"
                        size="default"
                        class="adsrc-kv-key"
                      />
                      <span class="adsrc-kv-equals">=</span>
                      <el-input
                        v-model="p.value"
                        placeholder="参数 value"
                        size="default"
                        class="adsrc-kv-value"
                      />
                      <el-button
                        type="danger"
                        :icon="Delete"
                        circle
                        plain
                        size="small"
                        @click="removeStoreDimParam(idx)"
                        aria-label="删除"
                      />
                    </div>
                  </div>
                  <el-button
                    type="primary"
                    plain
                    :icon="Plus"
                    size="small"
                    class="adsrc-kv-add"
                    @click="addStoreDimParam"
                  >
                    添加参数
                  </el-button>
                </el-form-item>
              </div>
            </section>

            <section class="page-form-section">
              <header class="page-form-section-header">
                <span class="page-form-section-title">流量分组配置</span>
                <span class="page-form-section-desc">为该广告源绑定一个或多个流量分组，每个分组可独立配置状态/价格/限频</span>
              </header>
              <div class="page-form-section-body">
                <el-form-item label="流量分组">
                  <el-select
                    :model-value="trafficGroupBindings.map(b => b.trafficGroupId)"
                    multiple
                    filterable
                    collapse-tags
                    collapse-tags-tooltip
                    :max-collapse-tags="3"
                    :loading="trafficGroupsLoading"
                    :no-data-text="selectedPlacementId ? '该广告位下暂无流量分组' : '请先选择广告位'"
                    placeholder="请选择流量分组"
                    style="width: 100%"
                    @change="onTrafficGroupChange"
                    @visible-change="onTrafficGroupDropdownToggle"
                  >
                    <el-option
                      v-for="g in trafficGroups"
                      :key="g.id"
                      :label="g.group_name"
                      :value="g.id"
                    />
                  </el-select>
                </el-form-item>

                <template v-for="bind in trafficGroupBindings" :key="bind.trafficGroupId">
                  <el-form-item :label="bind.groupName" class="adsrc-tg-item">
                    <div class="adsrc-tg-config">
                      <div class="adsrc-tg-row">
                        <span class="adsrc-tg-label">状态</span>
                        <el-switch
                          v-model="bind.status"
                          :active-value="1"
                          :inactive-value="0"
                          inline-prompt
                          active-text="开启"
                          inactive-text="关闭"
                        />
                        <el-button
                          link
                          type="danger"
                          size="small"
                          style="margin-left: auto"
                          @click="removeBinding(bind.trafficGroupId)"
                        >移除</el-button>
                      </div>
                      <div class="adsrc-tg-row">
                        <span class="adsrc-tg-label">价格</span>
                        <el-input-number
                          v-model="bind.price"
                          :min="0"
                          :precision="4"
                          :step="0.01"
                          placeholder="¥"
                          size="default"
                          controls-position="right"
                        />
                        <span class="adsrc-tg-unit">¥</span>
                      </div>
                      <div class="adsrc-tg-row">
                        <span class="adsrc-tg-label">展示数上限（每小时）</span>
                        <el-input-number
                          v-model="bind.hourLimit"
                          :min="0"
                          :step="100"
                          placeholder="0 表示不限"
                          size="default"
                          controls-position="right"
                        />
                      </div>
                      <div class="adsrc-tg-row">
                        <span class="adsrc-tg-label">展示数上限（每天）</span>
                        <el-input-number
                          v-model="bind.dayLimit"
                          :min="0"
                          :step="1000"
                          placeholder="0 表示不限"
                          size="default"
                          controls-position="right"
                        />
                      </div>
                      <div class="adsrc-tg-row">
                        <span class="adsrc-tg-label">展示间隔（秒）</span>
                        <el-input-number
                          v-model="bind.intervalSec"
                          :min="0"
                          :step="1"
                          placeholder="0 表示不限制"
                          size="default"
                          controls-position="right"
                        />
                      </div>
                    </div>
                  </el-form-item>
                </template>
              </div>
            </section>
          </el-form>
        </div>

        <footer class="page-form-footer">
          <div class="page-form-footer-left">
            <el-icon><InfoFilled /></el-icon>
            <span>带 * 为必填项</span>
          </div>
          <div class="page-form-footer-right">
            <el-button :icon="Close" @click="closeDrawer">取消</el-button>
            <el-button type="primary" :loading="submitting" :icon="Check" @click="handleSubmit">
              {{ isEdit ? '保存修改' : '创建广告源' }}
            </el-button>
          </div>
        </footer>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import request from '../../utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  Plus, Connection, Search, InfoFilled, Edit, RefreshLeft, Close, Check,
  Delete, Filter, Cellphone, ArrowDown,
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

// 入口模式：custom 来自 /network 的「广告源」按钮；standard 直接访问
const entryMode = ref<'custom' | 'standard'>('standard');
const selectedNetworkId = ref<number | null>(null);
const platformName = ref<string>('');

const loading = ref(false);
const tableData = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const selectedRowIds = ref<number[]>([]);

const appList = ref<any[]>([]);
const appsLoading = ref(false);
const selectedAppId = ref<number | null>(null);

// 自定义广告平台列表（用于「添加广告源」drawer 的下拉选择）
const customNetworks = ref<any[]>([]);
const customNetworksLoading = ref(false);
const customNetworksLoaded = ref(false);

const fetchCustomNetworks = async () => {
  if (customNetworksLoaded.value) return;
  customNetworksLoading.value = true;
  try {
    const res: any = await request.get('/api/v1/console/network/custom/list', { params: { page: 1, pageSize: 200 } });
    customNetworks.value = res.data?.list || [];
    customNetworksLoaded.value = true;
  } catch { customNetworks.value = []; }
  finally { customNetworksLoading.value = false; }
};

const trafficGroups = ref<any[]>([]);
const trafficGroupsLoading = ref(false);
const trafficGroupsLoaded = ref(false);

const fetchTrafficGroups = async (placementId: number | null, force = false) => {
  if (!placementId) { trafficGroups.value = []; return; }
  if (trafficGroupsLoaded.value && !force) return;
  trafficGroupsLoading.value = true;
  try {
    const res: any = await request.get('/api/v1/console/traffic-group/list', { params: { placementId, page: 1, pageSize: 200 } });
    trafficGroups.value = res.data?.list || [];
    trafficGroupsLoaded.value = true;
  } catch { trafficGroups.value = []; }
  finally { trafficGroupsLoading.value = false; }
};
const resetTrafficGroupsCache = () => {
  trafficGroups.value = [];
  trafficGroupsLoaded.value = false;
  trafficGroupsLoading.value = false;
};

const onCustomNetworkDropdownToggle = (open: boolean) => {
  if (open) fetchCustomNetworks();
};

const onTrafficGroupDropdownToggle = (open: boolean) => {
  if (open && selectedPlacementId.value) fetchTrafficGroups(selectedPlacementId.value, true);
};

const onNetworkSelect = (id: number) => {
  const found = customNetworks.value.find((n: any) => n.id === id);
  if (found) {
    editForm.networkCode = found.network_code;
    editForm.networkName = found.network_name;
  }
};
const appSearch = ref('');

const placements = ref<any[]>([]);
const selectedPlacementId = ref<number | null>(null);

const filter = reactive({ keyword: '' });

const drawerVisible = ref(false);
const drawerSize = '720px';
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

const defaultForm = {
  id: 0 as number,
  source_name: '',
  networkDefId: null as number | null,
  networkCode: '',
  networkName: '',
  third_app_id: '',
  third_placement_id: '',
  extraText: '',
};
const editForm = reactive({ ...defaultForm });

// 广告源维度参数（key=value 模式）
const storeDimParams = ref<Array<{ key: string; value: string }>>([]);
// 流量分组多选 + 每分组独立配置
const trafficGroupBindings = ref<Array<{
  trafficGroupId: number;
  groupName: string;
  status: number;
  price: number | null;
  hourLimit: number | null;
  dayLimit: number | null;
  intervalSec: number | null;
}>>([]);

const addStoreDimParam = () => {
  storeDimParams.value.push({ key: '', value: '' });
};
const removeStoreDimParam = (idx: number) => {
  storeDimParams.value.splice(idx, 1);
};

const onTrafficGroupChange = (vals: number[]) => {
  // 选中的 trafficGroupId 列表，diff 现有的 binding，新加的补默认，移除的删
  const existing = new Map(trafficGroupBindings.value.map(b => [b.trafficGroupId, b]));
  const next: typeof trafficGroupBindings.value = [];
  for (const id of vals) {
    if (existing.has(id)) {
      next.push(existing.get(id)!);
    } else {
      const g = trafficGroups.value.find(x => x.id === id);
      next.push({
        trafficGroupId: id,
        groupName: g?.group_name || g?.name || `分组${id}`,
        status: 1,
        price: null,
        hourLimit: null,
        dayLimit: null,
        intervalSec: null,
      });
    }
  }
  trafficGroupBindings.value = next;
};

const removeBinding = (id: number) => {
  trafficGroupBindings.value = trafficGroupBindings.value.filter(b => b.trafficGroupId !== id);
};

const formRules: FormRules = {
  source_name: [{ required: true, message: '请输入广告源名称', trigger: 'blur' }],
  networkDefId: [
    {
      validator: (_rule, value, callback) => {
        if (entryMode.value === 'standard' && (!value || Number(value) <= 0)) {
          callback(new Error('请选择广告平台'));
        } else {
          callback();
        }
      },
      trigger: 'change',
    },
  ],
  third_app_id: [{ required: true, message: '请输入三方App ID', trigger: 'blur' }],
  third_placement_id: [{ required: true, message: '请输入三方代码位ID', trigger: 'blur' }],
};

const filteredApps = computed(() => {
  const kw = appSearch.value.trim().toLowerCase();
  if (!kw) return appList.value;
  return appList.value.filter(a =>
    String(a.app_name || '').toLowerCase().includes(kw) ||
    String(a.app_key || '').toLowerCase().includes(kw) ||
    String(a.id).includes(kw),
  );
});

const selectedAppName = computed(() => {
  const a = appList.value.find(x => x.id === selectedAppId.value);
  return a ? a.app_name : '';
});

const selectedPlacementName = computed(() => {
  const p = placements.value.find(x => x.id === selectedPlacementId.value);
  return p ? p.name : '';
});

const formatPlacementType = (t: number | string) => {
  const map: Record<string, string> = { 1: '横幅', 2: '插屏', 3: '激励视频', 4: '开屏', 5: '原生' };
  return map[String(t)] || `类型${t}`;
};

const formatExtra = (row: any) => {
  if (!row) return '';
  if (row.extra && typeof row.extra === 'object') {
    return JSON.stringify(row.extra);
  }
  if (typeof row.extra === 'string' && row.extra) {
    try { return JSON.stringify(JSON.parse(row.extra)); } catch { return row.extra; }
  }
  return '';
};

const onAppIconError = (e: Event) => {
  (e.target as HTMLImageElement).style.display = 'none';
};

const fetchApps = async () => {
  appsLoading.value = true;
  try {
    const res: any = await request.get('/api/v1/console/app/list', { params: { page: 1, pageSize: 200 } });
    appList.value = res.data?.list || [];
  } catch { /* ignore */ } finally { appsLoading.value = false; }
};

const fetchPlacements = async (appId: number) => {
  if (!appId) { placements.value = []; selectedPlacementId.value = null; return; }
  try {
    const res: any = await request.get('/api/v1/console/placement/list', { params: { appId, page: 1, pageSize: 200 } });
    placements.value = res.data?.list || [];
  } catch { placements.value = []; }
};

const fetchPlatformInfo = async (networkId: number) => {
  try {
    // /network/custom/detail 走 authMiddleware ?id=...; 预设网络可能不在 custom 表，走 list 兜底
    let res: any;
    try {
      res = await request.get('/api/v1/console/network/custom/detail', { params: { id: networkId } });
    } catch {
      res = await request.get('/api/v1/console/network/list', { params: { page: 1, pageSize: 200 } });
      const row = (res.data?.list || []).find((n: any) => n.id === networkId);
      if (row) res = { data: row };
    }
    if (res?.data) {
      platformName.value = res.data.network_name || '';
    }
  } catch { /* ignore */ }
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (selectedNetworkId.value) params.networkDefId = selectedNetworkId.value;
    if (selectedAppId.value) params.appId = selectedAppId.value;
    if (selectedPlacementId.value) params.placementId = selectedPlacementId.value;
    const res: any = await request.get('/api/v1/console/ad-source/list', { params });
    tableData.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } catch { /* ignore */ } finally { loading.value = false; }
};

const onSearch = () => {
  page.value = 1;
  fetchList();
};

const onAppSelect = (app: any) => {
  selectedAppId.value = app.id;
  selectedPlacementId.value = null;
  fetchPlacements(app.id);
  fetchList();
};

const onPlacementChange = () => {
  page.value = 1;
  fetchList();
  // 触发流量分组加载
  if (selectedPlacementId.value) fetchTrafficGroups(selectedPlacementId.value, true);
};

const clearNetworkFilter = () => {
  selectedNetworkId.value = null;
  platformName.value = '';
  entryMode.value = 'standard';
  router.replace({ path: '/ad-source' });
  fetchList();
};

const onSelectionChange = (rows: any[]) => {
  selectedRowIds.value = rows.map(r => r.id);
};

const onBatchCommand = async (cmd: string) => {
  if (!selectedRowIds.value.length) return;
  if (cmd === 'delete') {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedRowIds.value.length} 个广告源吗？`, '警告', { type: 'error' });
    try {
      await Promise.all(selectedRowIds.value.map(id => request.delete(`/api/v1/console/ad-source/${id}`)));
      ElMessage.success('删除成功');
      fetchList();
    } catch { /* ignore */ }
    return;
  }
  const status = cmd === 'enable' ? 1 : 0;
  try {
    await Promise.all(selectedRowIds.value.map(id => request.put(`/api/v1/console/ad-source/${id}`, { status })));
    ElMessage.success('更新成功');
    fetchList();
  } catch { /* ignore */ }
};

const openCreate = () => {
  if (!selectedAppId.value) {
    ElMessage.warning('请先选择左侧应用');
    return;
  }
  isEdit.value = false;
  Object.assign(editForm, defaultForm);
  storeDimParams.value = [];
  trafficGroupBindings.value = [];
  // 自定义广告平台入口：从 route.query 锁定 platform（不可改）
  if (entryMode.value === 'custom' && selectedNetworkId.value) {
    editForm.networkDefId = selectedNetworkId.value;
    editForm.networkCode = `custom_${selectedNetworkId.value}`;
    editForm.networkName = platformName.value || '自定义广告平台';
  } else {
    // 标准入口：打开下拉时按需加载
    fetchCustomNetworks();
  }
  // 预加载流量分组（如果有选中的广告位）
  if (selectedPlacementId.value) fetchTrafficGroups(selectedPlacementId.value, true);
  drawerVisible.value = true;
};

const closeDrawer = () => { drawerVisible.value = false; };
const onFormReset = () => { Object.assign(editForm, defaultForm); };

const handleEdit = async (row: any) => {
  isEdit.value = true;
  // 先确保 customNetworks 列表已加载，否则 el-select 找不到 option 会把 v-model "329" 原样渲染
  await fetchCustomNetworks();
  // 如果 row.network_def_id 不在列表里（极端情况：刚新建的还没同步到列表），用 row 自身字段兜底
  const netId = row.network_def_id ?? null;
  const found = customNetworks.value.find((n: any) => n.id === netId);
  const networkCode = found?.network_code ?? row.network_code ?? '';
  const networkName = found?.network_name ?? row.network_name ?? '';
  // 同步顶部 selectedAppId / selectedPlacementId，让「所属应用」「所属广告位」disabled input 在编辑时正确回显
  if (row.app_id) {
    selectedAppId.value = row.app_id;
    if (row.placement_id) {
      await fetchPlacements(row.app_id);
      selectedPlacementId.value = row.placement_id;
    } else {
      selectedPlacementId.value = null;
    }
  }
  // 加载流量分组
  if (selectedPlacementId.value) await fetchTrafficGroups(selectedPlacementId.value, true);
  // 回填 storeDimParams / trafficGroupBindings
  const rawDims = row.store_dim_params;
  if (Array.isArray(rawDims)) {
    storeDimParams.value = rawDims.map((d: any) => ({ key: String(d.key || ''), value: String(d.value ?? '') }));
  } else if (rawDims && typeof rawDims === 'object') {
    storeDimParams.value = Object.entries(rawDims).map(([key, value]) => ({ key, value: String(value ?? '') }));
  } else {
    storeDimParams.value = [];
  }
  const rawBindings = row.traffic_group_bindings || [];
  trafficGroupBindings.value = rawBindings.map((b: any) => ({
    trafficGroupId: b.traffic_group_id,
    groupName: b.group_name || '',
    status: b.status ?? 1,
    price: b.price ?? null,
    hourLimit: b.hour_limit ?? null,
    dayLimit: b.day_limit ?? null,
    intervalSec: b.interval_sec ?? null,
  }));
  Object.assign(editForm, {
    id: row.id,
    source_name: row.source_name,
    networkDefId: netId,
    networkCode,
    networkName,
    third_app_id: row.third_app_id,
    third_placement_id: row.third_placement_id,
    extraText: row.extra ? (typeof row.extra === 'string' ? row.extra : JSON.stringify(row.extra)) : '',
  });
  drawerVisible.value = true;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    let extraVal: any = {};
    if (editForm.extraText && editForm.extraText.trim()) {
      try { extraVal = JSON.parse(editForm.extraText); }
      catch { ElMessage.error('额外配置 JSON 格式错误'); submitting.value = false; return; }
    }
    const payload: any = {
      sourceName: editForm.source_name,
      thirdAppId: editForm.third_app_id,
      thirdPlacementId: editForm.third_placement_id,
      extra: extraVal,
      appId: selectedAppId.value,
      placementId: selectedPlacementId.value,
    };
    // 维度参数：过滤空 key 后打平为对象
    const validDims = storeDimParams.value.filter(d => d.key && d.key.trim());
    if (validDims.length) {
      payload.storeDimParams = validDims.map(d => ({ key: d.key.trim(), value: d.value }));
    }
    // 流量分组绑定（后端 replaceTrafficGroupBindings 读 b.traffic_group_id）
    // 流量分组绑定（后端 replaceTrafficGroupBindings 读 b.traffic_group_id）
    if (trafficGroupBindings.value.length) {
      payload.trafficGroupBindings = trafficGroupBindings.value.map(b => ({
        traffic_group_id: b.trafficGroupId,
        status: b.status,
        price: b.price,
        hour_limit: b.hourLimit,
        day_limit: b.dayLimit,
        interval_sec: b.intervalSec,
      }));
    }
    console.log('[handleSubmit] payload=' + JSON.stringify(payload));
    const networkDefId = Number(editForm.networkDefId) || 0;
    if (networkDefId > 0) {
      // 自定义广告平台入口：调用 create-custom
      payload.networkDefId = networkDefId;
      if (isEdit.value) {
        await request.put(`/api/v1/console/ad-source/${editForm.id}`, { ...payload, network_code: editForm.networkCode || `custom_${networkDefId}`, network_name: editForm.networkName || '自定义广告平台' });
      } else {
        await request.post('/api/v1/console/ad-source/create-custom', { ...payload, network_name: editForm.networkName || '自定义广告平台' });
      }
    } else {
      // 标准入口：使用 form 中选择的 network_code
      if (isEdit.value) {
        await request.put(`/api/v1/console/ad-source/${editForm.id}`, { ...payload, network_code: editForm.networkCode, network_name: editForm.networkName });
      } else {
        if (!editForm.networkCode) {
          ElMessage.error('请先选择广告平台');
          submitting.value = false;
          return;
        }
        await request.post('/api/v1/console/ad-source/create', { ...payload, network_code: editForm.networkCode, network_name: editForm.networkName || '标准广告平台' });
      }
    }
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
    drawerVisible.value = false;
    fetchList();
  } catch { /* ignore */ } finally { submitting.value = false; }
};

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定删除广告源"${row.source_name}"吗？`, '警告', { type: 'error' });
  try {
    await request.delete(`/api/v1/console/ad-source/${row.id}`);
    ElMessage.success('删除成功');
    fetchList();
  } catch { /* ignore */ }
};

// 监听 route.query 变化
watch(() => route.query, (q) => {
  const nid = q.networkId ? Number(q.networkId) : null;
  if (nid) {
    selectedNetworkId.value = nid;
    entryMode.value = 'custom';
    platformName.value = String(q.networkName || '');
    fetchPlatformInfo(nid);
  } else {
    selectedNetworkId.value = null;
    entryMode.value = 'standard';
    platformName.value = '';
  }
  fetchList();
}, { immediate: true });

onMounted(async () => {
  await fetchApps();
  // 默认选中第一个应用
  if (appList.value.length && !selectedAppId.value) {
    const first = appList.value[0];
    selectedAppId.value = first.id;
    await fetchPlacements(first.id);
  }
});
</script>
