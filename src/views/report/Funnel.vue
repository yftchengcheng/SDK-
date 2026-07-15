<!--
  Funnel.vue - 漏斗分析
  左：漏斗指标列表（11 步）
  中：漏斗图（11 步骤可视化 + 转化率）
  右：5 个转化率侧栏 + 自定义公式
-->
<template>
  <div class="page-shell funnel-page">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><DataLine /></el-icon></div>
        <div class="page-header-titles">
          <h1 class="page-header-title">漏斗分析</h1>
          <p class="page-header-subtitle">12 步用户行为漏斗，10 个核心转化率，支持自定义公式（白名单：除/减）</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="Refresh" @click="loadFunnel">刷新</el-button>
        <el-button :icon="Download" @click="exportFunnel">导出</el-button>
      </div>
    </div>

    <div class="funnel-master-detail">
      <!-- 左侧：漏斗步骤列表 -->
      <aside class="funnel-master-panel">
        <div class="funnel-master-header">
          <h2 class="funnel-master-title">
            <el-icon><Aim /></el-icon>
            <span>漏斗步骤</span>
            <el-tag size="small" type="primary" effect="plain" round>{{ selectedSteps.length }}/{{ funnelDefinition.length }}</el-tag>
          </h2>
          <el-button-group class="funnel-master-actions">
            <el-button size="small" @click="selectAllSteps">全选</el-button>
            <el-button size="small" @click="deselectAllSteps">清空</el-button>
          </el-button-group>
        </div>
        <div class="funnel-master-list">
          <div
            v-for="(step, idx) in funnelDefinition"
            :key="step.code"
            :class="['funnel-master-item', { active: selectedSteps.includes(step.code) }]"
            @click="toggleStep(step.code)"
          >
            <div class="funnel-master-item-order">{{ step.order }}</div>
            <div class="funnel-master-item-body">
              <div class="funnel-master-item-name">{{ step.name }}</div>
              <div class="funnel-master-item-code">{{ step.code }}</div>
            </div>
            <el-icon v-if="selectedSteps.includes(step.code)" class="funnel-master-item-check"><Check /></el-icon>
            <span v-else class="funnel-master-item-index">#{{ idx + 1 }}</span>
          </div>
        </div>
      </aside>

      <!-- 中间：漏斗图 + 自定义公式 -->
      <main class="funnel-detail-panel">
        <!-- 筛选器 -->
        <div class="funnel-toolbar">
          <ReportFilter v-model="filter" @change="loadFunnel" />
        </div>

        <!-- 漏斗图 -->
        <div class="funnel-chart-card" v-loading="loading">
          <div class="funnel-chart-header">
            <h3 class="funnel-chart-title">漏斗可视化</h3>
            <el-tag size="small" effect="plain" type="info">共 {{ stepRows.length }} 步 · 起始 {{ firstStepValue.toLocaleString() }} · 结束 {{ lastStepValue.toLocaleString() }} · 整体转化 {{ overallRate }}%</el-tag>
          </div>
          <div v-if="stepRows.length === 0" class="funnel-empty">
            <el-empty description="请选择至少 1 个漏斗步骤" />
          </div>
          <div v-else class="funnel-chart-body">
            <div
              v-for="(row, idx) in stepRows"
              :key="row.code"
              :class="['funnel-step', { 'is-first': idx === 0, 'is-last': idx === stepRows.length - 1 }]"
            >
              <div class="funnel-step-meta">
                <div class="funnel-step-order">{{ row.order }}</div>
                <div class="funnel-step-name">{{ row.name }}</div>
              </div>
              <div class="funnel-step-bar-wrap">
                <div
                  class="funnel-step-bar"
                  :style="{ width: stepBarWidth(row, idx) + '%' }"
                >
                  <span class="funnel-step-value">{{ row.value.toLocaleString() }}</span>
                </div>
                <span v-if="idx > 0" class="funnel-step-rate">
                  转化率：{{ stepRate(idx) }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 自定义公式 -->
        <div class="funnel-formula-card">
          <div class="funnel-formula-header">
            <h3 class="funnel-formula-title">
              <el-icon><MagicStick /></el-icon>
              <span>自定义指标（公式白名单）</span>
            </h3>
            <el-tag size="small" effect="plain" type="warning">仅支持 event_a / event_b 或 event_a - event_b</el-tag>
          </div>
          <div class="funnel-formula-body">
            <el-input
              v-model="formula"
              placeholder="例如 step_4_click / step_1_impression"
              clearable
              @blur="validateAndCompute"
              @keyup.enter="validateAndCompute"
            >
              <template #prepend>
                <el-select v-model="formulaType" style="width: 100px">
                  <el-option label="除法" value="div" />
                  <el-option label="减法" value="sub" />
                </el-select>
              </template>
              <template #append>
                <el-button type="primary" @click="validateAndCompute">计算</el-button>
              </template>
            </el-input>
            <div v-if="formulaError" class="funnel-formula-msg error">
              <el-icon><CircleClose /></el-icon> {{ formulaError }}
            </div>
            <div v-else-if="formulaValue !== null" class="funnel-formula-msg success">
              <el-icon><CircleCheck /></el-icon> 计算结果：<strong>{{ formulaValue }}</strong>
            </div>
            <div class="funnel-formula-hint">
              <span>可用指标：</span>
              <el-tag
                v-for="s in stepRows"
                :key="s.code"
                size="small"
                type="info"
                effect="plain"
                class="funnel-formula-tag"
                @click="insertMetric(s.code)"
              >{{ s.code }} ({{ s.name }})</el-tag>
            </div>
          </div>
        </div>
      </main>

      <!-- 右侧：5 个转化率 -->
      <aside class="funnel-rate-panel">
        <div class="funnel-rate-header">
          <h2 class="funnel-rate-title">
            <el-icon><TrendCharts /></el-icon>
            <span>转化率</span>
          </h2>
        </div>
        <div class="funnel-rate-list">
          <div
            v-for="r in rateRows"
            :key="r.code"
            :class="['funnel-rate-item', rateToneClass(r.rate)]"
          >
            <div class="funnel-rate-item-name">{{ r.name }}</div>
            <div class="funnel-rate-item-value">
              <span class="funnel-rate-item-pct">{{ r.rate }}%</span>
              <el-icon class="funnel-rate-item-arrow"><TopRight /></el-icon>
            </div>
            <div class="funnel-rate-item-detail">
              <span>{{ r.from_value.toLocaleString() }}</span>
              <el-icon><Right /></el-icon>
              <span>{{ r.to_value.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Refresh, Download, DataLine, Aim, Check, MagicStick, CircleCheck, CircleClose,
  TrendCharts, TopRight, Right,
} from '@element-plus/icons-vue';
import request from '@/utils/request';
import ReportFilter, { type ReportFilter as Filter } from '@/components/report/ReportFilter.vue';

interface FunnelStep {
  code: string;
  name: string;
  order: number;
}
interface FunnelRow extends FunnelStep {
  value: number;
}
interface FunnelRate {
  code: string;
  name: string;
  from_value: number;
  to_value: number;
  rate: number;
}

const funnelDefinition = ref<FunnelStep[]>([]);
const stepRows = ref<FunnelRow[]>([]);
const rateRows = ref<FunnelRate[]>([]);
const selectedSteps = ref<string[]>([]);
const loading = ref(false);

const formula = ref('step_4_click / step_1_impression');
const formulaType = ref<'div' | 'sub'>('div');
const formulaValue = ref<number | null>(null);
const formulaError = ref<string>('');

const filter = ref<Filter>({ dateRange: '7d', appIds: [], placementIds: [], adSourceIds: [], formats: [], country: [], osList: [], platform: '' });

const firstStepValue = computed(() => stepRows.value[0]?.value || 0);
const lastStepValue = computed(() => stepRows.value[stepRows.value.length - 1]?.value || 0);
const overallRate = computed(() => {
  if (!firstStepValue.value) return '0.00';
  return ((lastStepValue.value / firstStepValue.value) * 100).toFixed(2);
});

const stepBarWidth = (row: FunnelRow, idx: number) => {
  if (idx === 0) return 100;
  if (firstStepValue.value === 0) return 0;
  return Math.max(2, (row.value / firstStepValue.value) * 100);
};

const stepRate = (idx: number) => {
  if (idx === 0) return '100.00';
  const prev = stepRows.value[idx - 1]?.value || 0;
  const cur = stepRows.value[idx]?.value || 0;
  if (prev === 0) return '0.00';
  return ((cur / prev) * 100).toFixed(2);
};

const rateToneClass = (rate: number) => {
  if (rate >= 50) return 'tone-good';
  if (rate >= 20) return 'tone-warn';
  return 'tone-bad';
};

const loadDefinition = async () => {
  try {
    const res: any = await request.get('/api/v1/console/report/funnel/definition');
    if (res.code === 0) {
      funnelDefinition.value = res.data.steps || [];
      // 默认选中全部 12 步（按截图）
      selectedSteps.value = funnelDefinition.value.map((s: FunnelStep) => s.code);
    }
  } catch (e: any) {
    ElMessage.error('加载漏斗定义失败：' + (e?.message || ''));
  }
};

const loadFunnel = async () => {
  loading.value = true;
  try {
    const res: any = await request.post('/api/v1/console/report/aggregate', {
      report_type: 'funnel',
      steps: selectedSteps.value,
      formula: formula.value,
      filters: filter.value,
    });
    if (res.code === 0) {
      stepRows.value = res.data.rows || [];
      rateRows.value = res.data.rates || [];
      formulaValue.value = res.data.formula_value;
      formulaError.value = res.data.formula_error || '';
    }
  } catch (e: any) {
    ElMessage.error('加载漏斗数据失败：' + (e?.message || ''));
  } finally {
    loading.value = false;
  }
};

const validateAndCompute = async () => {
  if (!formula.value) {
    formulaValue.value = null;
    formulaError.value = '';
    return;
  }
  await loadFunnel();
};

const toggleStep = (code: string) => {
  if (selectedSteps.value.includes(code)) {
    selectedSteps.value = selectedSteps.value.filter((c) => c !== code);
  } else {
    selectedSteps.value = [...selectedSteps.value, code];
  }
  loadFunnel();
};

const selectAllSteps = () => {
  selectedSteps.value = funnelDefinition.value.map((s) => s.code);
  loadFunnel();
};
const deselectAllSteps = () => {
  selectedSteps.value = [];
  loadFunnel();
};

const insertMetric = (code: string) => {
  if (formulaType.value === 'div') {
    formula.value = `${code} / step_1_impression`;
  } else {
    formula.value = `${code} - step_1_impression`;
  }
  validateAndCompute();
};

const exportFunnel = async () => {
  try {
    const res: any = await request.post('/api/v1/console/report/export/csv', {
      report_type: 'funnel',
      steps: selectedSteps.value,
      formula: formula.value,
      filters: filter.value,
    }, { responseType: 'blob' });
    const blob = new Blob([res], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funnel_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e: any) {
    ElMessage.error('导出失败：' + (e?.message || ''));
  }
};

watch(formulaType, (t) => {
  // 切换除/减时尝试替换公式中间的符号
  if (formula.value.includes('/') && t === 'sub') {
    formula.value = formula.value.replace(/\s*\/\s*/, ' - ');
  } else if (formula.value.includes('-') && t === 'div') {
    formula.value = formula.value.replace(/\s*-\s*/, ' / ');
  }
  validateAndCompute();
});

onMounted(async () => {
  await loadDefinition();
  await loadFunnel();
});
</script>
