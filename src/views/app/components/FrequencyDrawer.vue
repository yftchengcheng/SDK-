<template>
  <el-drawer
    v-model="visible"
    title="频次设置"
    size="560px"
    direction="rtl"
    :close-on-click-modal="false"
    :destroy-on-close="true"
  >
    <div class="fd-body" v-loading="loading">
      <div class="fd-tips">
        <el-icon><InfoFilled /></el-icon>
        <span>Adtalos SDK v6.1.0 及以上版本，支持在 APP 维度设置每台设备上的广告平台或广告样式频次</span>
      </div>

      <template v-for="(module, mi) in modules" :key="module.key">
        <section class="fd-module">
          <header class="fd-module-head">
            <div class="fd-module-head-left">
              <el-icon><component :is="module.icon" /></el-icon>
              <span class="fd-module-title">{{ module.title }}</span>
            </div>
            <el-button
              v-if="rules[module.key].length > 1"
              link
              type="danger"
              :icon="Close"
              class="fd-module-remove-all"
              @click="clearModule(module.key)"
            >清空</el-button>
          </header>

          <div
            v-for="(rule, ri) in rules[module.key]"
            :key="rule._key"
            class="fd-rule"
          >
            <div class="fd-rule-head">
              <span class="fd-rule-index">规则 {{ ri + 1 }}</span>
              <el-button
                v-if="rules[module.key].length > 1"
                link
                :icon="Close"
                class="fd-rule-remove"
                @click="removeRule(module.key, ri)"
              />
            </div>

            <div class="fd-rule-row">
              <span class="fd-rule-label">数值{{ module.unitLabel }}</span>
              <div class="fd-rule-control">
                <el-select v-model="rule.unlimited" class="fd-rule-toggle" size="default">
                  <el-option label="不限" :value="true" />
                  <el-option label="指定" :value="false" />
                </el-select>
                <el-input-number
                  v-model="rule.count"
                  :min="0"
                  :max="9999"
                  :step="1"
                  :disabled="rule.unlimited"
                  controls-position="right"
                  class="fd-rule-input"
                />
                <span class="fd-rule-unit">{{ module.unit }}</span>
              </div>
            </div>

            <div v-if="module.key === 'requestCap'" class="fd-rule-row">
              <span class="fd-rule-label">每</span>
              <div class="fd-rule-control">
                <el-input-number
                  v-model="(rule as any).timeWindow"
                  :min="1"
                  :max="86400"
                  :step="1"
                  controls-position="right"
                  class="fd-rule-input"
                />
                <span class="fd-rule-unit">秒</span>
              </div>
            </div>

            <div class="fd-rule-row">
              <span class="fd-rule-label">广告平台</span>
              <div class="fd-rule-control">
                <el-select
                  v-model="rule.platforms"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  placeholder="全部"
                  class="fd-rule-select"
                  clearable
                >
                  <el-option label="全部" value="all" />
                  <el-option
                    v-for="p in platformOptions"
                    :key="p.value"
                    :label="p.label"
                    :value="p.value"
                  />
                </el-select>
              </div>
            </div>

            <div class="fd-rule-row">
              <span class="fd-rule-label">广告类型</span>
              <div class="fd-rule-control">
                <el-select
                  v-model="rule.adTypes"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  placeholder="全部"
                  class="fd-rule-select"
                  clearable
                >
                  <el-option label="全部" value="all" />
                  <el-option
                    v-for="t in adTypeOptions"
                    :key="t.value"
                    :label="t.label"
                    :value="t.value"
                  />
                </el-select>
              </div>
            </div>
          </div>

          <el-button
            link
            type="primary"
            :icon="Plus"
            class="fd-add-rule"
            @click="addRule(module.key)"
          >添加规则</el-button>

          <p class="fd-hint">
            <el-icon><InfoFilled /></el-icon>
            <span>{{ describeModule(module.key) }}</span>
          </p>
        </section>
      </template>
    </div>

    <template #footer>
      <div class="fd-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage, type FormInstance } from 'element-plus';
import request from '../../../utils/request';
import {
  InfoFilled, Close, Plus, Calendar, Clock, Timer, Histogram,
} from '@element-plus/icons-vue';

interface FrequencyRule {
  _key: string;
  count: number | null;
  unlimited: boolean;
  platforms: string[];
  adTypes: string[];
  timeWindow?: number | null;
}

type ModuleKey = 'impressionCapDay' | 'impressionCapHour' | 'impressionInterval' | 'requestCap';

const props = defineProps<{
  visible: boolean;
  app: any | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'saved'): void;
}>();

const visible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
});

const loading = ref(false);
const submitting = ref(false);

const platformOptions = [
  { label: '穿山甲', value: 'pangaea' },
  { label: '优量汇', value: 'gdt' },
  { label: '快手', value: 'kuaishou' },
  { label: '百度', value: 'baidu' },
  { label: '自定义平台', value: 'custom' },
];

const adTypeOptions = [
  { label: '横幅', value: 'banner' },
  { label: '插屏', value: 'interstitial' },
  { label: '开屏', value: 'splash' },
  { label: '原生', value: 'native' },
  { label: '视频', value: 'video' },
  { label: '激励视频', value: 'rewarded' },
];

const modules = [
  { key: 'impressionCapDay' as ModuleKey, title: '展示上限（天）', unit: '次', unitLabel: '', icon: Calendar },
  { key: 'impressionCapHour' as ModuleKey, title: '展示上限（小时）', unit: '次', unitLabel: '', icon: Clock },
  { key: 'impressionInterval' as ModuleKey, title: '展示间隔（秒）', unit: '秒', unitLabel: '', icon: Timer },
  { key: 'requestCap' as ModuleKey, title: '请求上限', unit: '次', unitLabel: '', icon: Histogram },
];

const rules = reactive<Record<ModuleKey, FrequencyRule[]>>({
  impressionCapDay: [emptyRule()],
  impressionCapHour: [emptyRule()],
  impressionInterval: [emptyRule()],
  requestCap: [{ ...emptyRule(), timeWindow: 60 }],
});

function emptyRule(): FrequencyRule {
  return {
    _key: `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    count: null,
    unlimited: true,
    platforms: ['all'],
    adTypes: ['all'],
  };
}

function addRule(key: ModuleKey) {
  const base = emptyRule();
  if (key === 'requestCap') base.timeWindow = 60;
  rules[key].push(base);
}

function removeRule(key: ModuleKey, idx: number) {
  if (rules[key].length <= 1) return;
  rules[key].splice(idx, 1);
}

function clearModule(key: ModuleKey) {
  rules[key] = [emptyRule()];
  if (key === 'requestCap') rules[key][0].timeWindow = 60;
}

function describeModule(key: ModuleKey): string {
  const module = modules.find(m => m.key === key)!;
  const rs = rules[key];
  const hasUnlimited = rs.some(r => r.unlimited);
  if (hasUnlimited && rs.every(r => r.unlimited)) {
    if (key === 'impressionInterval') return `广告展示间隔为不限制`;
    if (key === 'requestCap') return `广告请求上限为不限制`;
    return `广告展示上限为不限制`;
  }
  const sample = rs.find(r => !r.unlimited);
  if (sample) {
    if (key === 'impressionInterval') return `广告展示间隔最小为 ${sample.count} ${module.unit}`;
    if (key === 'requestCap') return `广告请求上限为每 ${sample.timeWindow ?? 60} ${module.unit} ${sample.count ?? 0} ${module.unit}`;
    return `广告展示上限为 ${sample.count ?? 0} ${module.unit}`;
  }
  if (key === 'impressionInterval') return `广告展示间隔为不限制`;
  if (key === 'requestCap') return `广告请求上限为不限制`;
  return `广告展示上限为不限制`;
}

watch(
  () => props.visible,
  (v) => {
    if (v && props.app) {
      loadConfig();
    }
  },
);

async function loadConfig() {
  loading.value = true;
  try {
    const { data } = await request.get(`/api/v1/console/app/${props.app.app_id || props.app.id}/frequency`);
    const cfg = data?.config || {};
    rules.impressionCapDay = (cfg.impressionCapDay && cfg.impressionCapDay.length) ? cfg.impressionCapDay.map(toRule) : [emptyRule()];
    rules.impressionCapHour = (cfg.impressionCapHour && cfg.impressionCapHour.length) ? cfg.impressionCapHour.map(toRule) : [emptyRule()];
    rules.impressionInterval = (cfg.impressionInterval && cfg.impressionInterval.length) ? cfg.impressionInterval.map(toRule) : [emptyRule()];
    rules.requestCap = (cfg.requestCap && cfg.requestCap.length) ? cfg.requestCap.map(toRule) : [{ ...emptyRule(), timeWindow: 60 }];
  } catch (e) {
    // 失败时保持默认
  } finally {
    loading.value = false;
  }
}

function toRule(r: any): FrequencyRule {
  return {
    _key: `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    count: r.count ?? null,
    unlimited: r.unlimited ?? true,
    platforms: r.platforms?.length ? r.platforms : ['all'],
    adTypes: r.adTypes?.length ? r.adTypes : ['all'],
    timeWindow: r.timeWindow ?? null,
  };
}

function validate(): string | null {
  for (const m of modules) {
    const rs = rules[m.key];
    for (let i = 0; i < rs.length; i++) {
      const r = rs[i];
      if (!r.unlimited) {
        if (r.count == null || r.count < 0) {
          return `${m.title} 规则 ${i + 1}：数值必须 ≥ 0`;
        }
      }
      if (m.key === 'requestCap') {
        if (!r.timeWindow || r.timeWindow < 1) {
          return `${m.title} 规则 ${i + 1}：时间窗口必须 ≥ 1 秒`;
        }
      }
    }
  }
  return null;
}

async function submit() {
  const err = validate();
  if (err) {
    ElMessage.warning(err);
    return;
  }
  submitting.value = true;
  try {
    const payload = {
      config: {
        impressionCapDay: rules.impressionCapDay.map(stripKey),
        impressionCapHour: rules.impressionCapHour.map(stripKey),
        impressionInterval: rules.impressionInterval.map(stripKey),
        requestCap: rules.requestCap.map(stripKey),
      },
    };
    await request.put(`/api/v1/console/app/${props.app.app_id || props.app.id}/frequency`, payload);
    ElMessage.success('频次设置已保存');
    visible.value = false;
    emit('saved');
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  } finally {
    submitting.value = false;
  }
}

function stripKey(r: FrequencyRule) {
  const { _key, ...rest } = r;
  return rest;
}
</script>
