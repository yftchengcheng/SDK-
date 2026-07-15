<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Plus, Delete, ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import {
  DIMENSIONS,
  NETWORK_TYPES,
  DEVICE_TYPES,
  IDFA_STATUS,
  WEEKDAYS,
  INSTALL_UNITS,
  TIMEZONES,
  CUSTOM_ATTR_TYPES,
  getDimensionMeta,
  type Rule,
  type RuleDimension
} from '@/shared/rule-dimensions';
import { CHINA_CASCADER_OPTIONS } from '@/shared/china-regions';
import { GLOBAL_TIERS, GLOBAL_CONTINENTS } from '@/shared/global-regions';
import { DEVICE_BRANDS, DEVICE_MODELS } from '@/shared/device-data';

interface Props {
  modelValue: Rule[];
}
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:modelValue', v: Rule[]): void }>();

const rules = computed({
  get: () => props.modelValue || [],
  set: (v) => emit('update:modelValue', v)
});

const showAddDialog = ref(false);
const pendingDimension = ref<RuleDimension | null>(null);

function uuid(): string {
  return 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function addRule() {
  showAddDialog.value = true;
  pendingDimension.value = null;
}

function confirmAdd() {
  if (!pendingDimension.value) return;
  const meta = getDimensionMeta(pendingDimension.value);
  if (!meta) return;
  const defaultValue: any = getDefaultValue(meta.ui);
  const rule: Rule = {
    id: uuid(),
    dimension: meta.value,
    operator: meta.defaultOperator,
    value: defaultValue,
    timezone: meta.withTimezone ? 'UTC+8' : undefined,
    regionScope: meta.withScope ? 'china' : undefined,
    installUnit: meta.ui === 'number-unit' ? 'hour' : undefined,
    customAttrName: meta.ui === 'custom-attr' ? '' : undefined,
    customAttrType: meta.ui === 'custom-attr' ? 'string' : undefined
  };
  rules.value = [...rules.value, rule];
  showAddDialog.value = false;
  pendingDimension.value = null;
}

function getDefaultValue(ui: string): any {
  switch (ui) {
    case 'text-list':
      return [];
    case 'multi-select':
      return [];
    case 'single-select':
      return '';
    case 'number':
      return 0;
    case 'number-unit':
      return 0;
    case 'date-range':
      return ['', ''];
    case 'weekday-pick':
      return [];
    case 'hour-range':
      return [[0, 23]];
    case 'ecpm-range':
      return [0, 0];
    case 'region-china':
      return [];
    case 'region-global':
      return { tier: 'TOP', continent: '', countries: [] };
    case 'custom-attr':
      return '';
    default:
      return '';
  }
}

function removeRule(id: string) {
  rules.value = rules.value.filter((r) => r.id !== id);
}

function moveUp(idx: number) {
  if (idx <= 0) return;
  const arr = [...rules.value];
  [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
  rules.value = arr;
}

function moveDown(idx: number) {
  if (idx >= rules.value.length - 1) return;
  const arr = [...rules.value];
  [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
  rules.value = arr;
}

function changeDimension(rule: Rule, dim: RuleDimension) {
  const meta = getDimensionMeta(dim);
  if (!meta) return;
  rule.dimension = dim;
  rule.operator = meta.defaultOperator;
  rule.value = getDefaultValue(meta.ui);
  rule.timezone = meta.withTimezone ? 'UTC+8' : undefined;
  rule.regionScope = meta.withScope ? 'china' : undefined;
  rule.installUnit = meta.ui === 'number-unit' ? 'hour' : undefined;
  rule.customAttrName = meta.ui === 'custom-attr' ? '' : undefined;
  rule.customAttrType = meta.ui === 'custom-attr' ? 'string' : undefined;
}

function getRuleLabel(dim: RuleDimension): string {
  return getDimensionMeta(dim)?.label || dim;
}

// 设备型号：联动筛选（按已选品牌）
function getFilteredModels(rule: Rule): { value: string; label: string }[] {
  const selBrands = (rule.value || []) as string[];
  if (!selBrands || selBrands.length === 0) {
    return DEVICE_MODELS;
  }
  return DEVICE_MODELS.filter((m) => selBrands.includes(m.brand));
}

// 字符串数组互转
function textToList(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}
function listToText(arr: string[]): string {
  return (arr || []).join('\n');
}

// text-list 缓存
const textListDisplay = ref<Record<string, string>>({});
function getTextListDisplay(rule: Rule): string {
  if (textListDisplay.value[rule.id] !== undefined) {
    return textListDisplay.value[rule.id];
  }
  return listToText(rule.value || []);
}
function setTextListDisplay(rule: Rule, text: string) {
  textListDisplay.value[rule.id] = text;
  rule.value = textToList(text);
}

// eCPM 范围
function getEcpmMin(rule: Rule): number {
  return (Array.isArray(rule.value) ? rule.value[0] : 0) || 0;
}
function getEcpmMax(rule: Rule): number {
  return (Array.isArray(rule.value) ? rule.value[1] : 0) || 0;
}
function setEcpmMin(rule: Rule, v: number) {
  const cur = Array.isArray(rule.value) ? rule.value : [0, 0];
  rule.value = [v, cur[1] ?? 0];
}
function setEcpmMax(rule: Rule, v: number) {
  const cur = Array.isArray(rule.value) ? rule.value : [0, 0];
  rule.value = [cur[0] ?? 0, v];
}

// 小时范围（支持多时段）
function getHourRanges(rule: Rule): number[][] {
  const v = rule.value;
  if (Array.isArray(v) && v.length > 0 && Array.isArray(v[0])) {
    return v as number[][];
  }
  // 兼容旧格式 [min, max] → [[min, max]]
  if (Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number')) {
    return [[v[0] as number, v[1] as number]];
  }
  return [[0, 23]];
}
function setHourRangeMin(rule: Rule, idx: number, v: number) {
  const ranges = getHourRanges(rule).map((r) => [...r]);
  ranges[idx] = [v, ranges[idx]?.[1] ?? 23];
  rule.value = ranges;
}
function setHourRangeMax(rule: Rule, idx: number, v: number) {
  const ranges = getHourRanges(rule).map((r) => [...r]);
  ranges[idx] = [ranges[idx]?.[0] ?? 0, v];
  rule.value = ranges;
}
function addHourRange(rule: Rule) {
  const ranges = getHourRanges(rule);
  rule.value = [...ranges, [0, 23]];
}
function removeHourRange(rule: Rule, idx: number) {
  const ranges = getHourRanges(rule);
  if (ranges.length <= 1) return; // 至少保留一个
  rule.value = ranges.filter((_, i) => i !== idx);
}

// 日期范围
function getDateRange(rule: Rule): [string, string] {
  if (Array.isArray(rule.value) && rule.value.length === 2) return rule.value;
  return ['', ''];
}
function setDateRange(rule: Rule, v: [string, string] | null) {
  const newVal = v || ['', ''];
  if (rule.value && Array.isArray(rule.value) && rule.value[0] === newVal[0] && rule.value[1] === newVal[1]) return;
  // 深拷贝每条规则，触发整体 rules 更新（让父组件响应式拿到变化）
  rules.value = rules.value.map((r) => (r.id === rule.id ? { ...r, value: newVal } : r));
}

// 地区（全球）子对象
function getGlobalRegion(rule: Rule): { tier: string; continent: string; countries: string[] } {
  if (rule.value && typeof rule.value === 'object' && !Array.isArray(rule.value)) {
    return rule.value as { tier: string; continent: string; countries: string[] };
  }
  return { tier: 'TOP', continent: '', countries: [] };
}
function setGlobalRegionTier(rule: Rule, v: string) {
  const cur = getGlobalRegion(rule);
  rule.value = { ...cur, tier: v, continent: '', countries: [] };
}
function setGlobalRegionContinent(rule: Rule, v: string) {
  const cur = getGlobalRegion(rule);
  rule.value = { ...cur, continent: v, countries: [] };
}
function setGlobalRegionCountries(rule: Rule, v: string[]) {
  const cur = getGlobalRegion(rule);
  rule.value = { ...cur, countries: v };
}

function getGlobalRegionOptions(rule: Rule) {
  const cur = getGlobalRegion(rule);
  if (cur.tier === 'CONTINENT') {
    return GLOBAL_CONTINENTS.map((c) => ({ value: c.code, label: c.name }));
  }
  const tierMap: Record<string, string> = { TOP: 'top', T1: 't1', T2: 't2', T3: 't3' };
  const tierKey = tierMap[cur.tier] || 'top';
  const countries = cur.continent ? GLOBAL_TIERS[cur.continent]?.[tierKey] || [] : [];
  return countries.map((c: string) => ({ value: c, label: c }));
}

function getGlobalRegionLabel(rule: Rule): string {
  const cur = getGlobalRegion(rule);
  if (cur.tier === 'CONTINENT') {
    const c = GLOBAL_CONTINENTS.find((g) => g.code === cur.continent);
    return c?.name || cur.continent;
  }
  return `${cur.tier} - ${cur.continent}`;
}

// 监听：rule 列表变化时清掉 textListDisplay 中的孤儿缓存
watch(
  () => rules.value.map((r) => r.id),
  (ids) => {
    Object.keys(textListDisplay.value).forEach((k) => {
      if (!ids.includes(k)) delete textListDisplay.value[k];
    });
  }
);
</script>

<template>
  <div class="rule-editor">
    <div v-if="rules.length === 0" class="rule-editor-empty">
      <el-button :icon="Plus" type="primary" plain class="rule-add-btn" @click="addRule">点击添加规则</el-button>
      <span class="rule-editor-hint">支持 18 个维度，可逐个添加</span>
    </div>

    <div v-else class="rule-editor-list">
      <div
        v-for="(rule, idx) in rules"
        :key="rule.id"
        class="rule-editor-item"
      >
        <div class="rule-editor-item-header">
          <span class="rule-editor-item-dim">{{ getRuleLabel(rule.dimension) }}</span>
          <div class="rule-editor-item-actions">
            <el-button link size="small" :icon="ArrowUp" :disabled="idx === 0" @click="moveUp(idx)" />
            <el-button link size="small" :icon="ArrowDown" :disabled="idx === rules.length - 1" @click="moveDown(idx)" />
            <el-button link size="small" type="danger" :icon="Delete" @click="removeRule(rule.id)">删除</el-button>
          </div>
        </div>

        <div class="rule-editor-item-row">
          <!-- 维度切换（允许把已添加的规则换成其他维度） -->
          <el-select
            :model-value="rule.dimension"
            placeholder="维度"
            style="width: 140px"
            @change="(v: RuleDimension) => changeDimension(rule, v)"
          >
            <el-option v-for="dim in DIMENSIONS" :key="dim.value" :value="dim.value" :label="dim.label" />
          </el-select>

          <!-- 关系符 -->
          <el-select
            v-model="rule.operator"
            placeholder="关系符"
            style="width: 110px"
          >
            <el-option
              v-for="op in (getDimensionMeta(rule.dimension)?.operators || [])"
              :key="op.value"
              :value="op.value"
              :label="op.label"
            />
          </el-select>

          <!-- 值（按 ui 渲染） -->
          <template v-if="rule.dimension === 'region' && rule.regionScope === 'china'">
            <el-cascader
              v-model="(rule.value as string[][])"
              :options="CHINA_CASCADER_OPTIONS"
              :props="{ multiple: true, checkStrictly: false, value: 'value', label: 'label', children: 'children' }"
              placeholder="选择省/市（可多选）"
              style="min-width: 280px; flex: 1"
              collapse-tags
              collapse-tags-tooltip
              clearable
            />
          </template>

          <template v-else-if="rule.dimension === 'region' && rule.regionScope === 'global'">
            <el-select
              :model-value="getGlobalRegion(rule).tier"
              placeholder="Tier"
              style="width: 110px"
              @change="(v: string) => setGlobalRegionTier(rule, v)"
            >
              <el-option value="TOP" label="TOP" />
              <el-option value="T1" label="T1" />
              <el-option value="T2" label="T2" />
              <el-option value="T3" label="T3" />
              <el-option value="CONTINENT" label="大洲" />
            </el-select>
            <el-select
              v-if="getGlobalRegion(rule).tier === 'CONTINENT'"
              :model-value="getGlobalRegion(rule).continent"
              placeholder="选择大洲"
              style="width: 140px"
              @change="(v: string) => setGlobalRegionContinent(rule, v)"
            >
              <el-option v-for="c in GLOBAL_CONTINENTS" :key="c.code" :value="c.code" :label="c.name" />
            </el-select>
            <el-select
              v-else
              :model-value="getGlobalRegion(rule).continent"
              placeholder="大洲"
              style="width: 140px"
              @change="(v: string) => setGlobalRegionContinent(rule, v)"
            >
              <el-option v-for="c in GLOBAL_CONTINENTS" :key="c.code" :value="c.code" :label="c.name" />
            </el-select>
            <el-select
              v-if="getGlobalRegion(rule).tier !== 'CONTINENT' && getGlobalRegion(rule).continent"
              :model-value="getGlobalRegion(rule).countries"
              placeholder="国家（可多选）"
              multiple
              filterable
              style="min-width: 240px; flex: 1"
              @change="(v: string[]) => setGlobalRegionCountries(rule, v)"
            >
              <el-option v-for="opt in getGlobalRegionOptions(rule)" :key="opt.value" :value="opt.value" :label="opt.label" />
            </el-select>
            <el-input
              v-else-if="getGlobalRegion(rule).tier === 'CONTINENT' && getGlobalRegion(rule).continent"
              :model-value="getGlobalRegion(rule).continent"
              disabled
              style="width: 200px"
            />
          </template>

          <template v-else-if="rule.dimension === 'date'">
            <el-date-picker
              :model-value="getDateRange(rule)"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="min-width: 360px; flex: 1"
              @update:model-value="(v) => setDateRange(rule, v as [string, string] | null)"
            />
          </template>

          <template v-else-if="rule.dimension === 'weekday'">
            <el-checkbox-group v-model="(rule.value as number[])">
              <el-checkbox v-for="w in WEEKDAYS" :key="w.value" :value="w.value">{{ w.label }}</el-checkbox>
            </el-checkbox-group>
          </template>

          <template v-else-if="rule.dimension === 'hour'">
            <div
              v-for="(range, idx) in getHourRanges(rule)"
              :key="idx"
              class="rule-editor-hour-row"
            >
              <el-input-number
                :model-value="range[0]"
                :min="0" :max="23"
                @change="(v: number) => setHourRangeMin(rule, idx, v || 0)"
              />
              <span class="rule-editor-sep">至</span>
              <el-input-number
                :model-value="range[1]"
                :min="0" :max="23"
                @change="(v: number) => setHourRangeMax(rule, idx, v || 0)"
              />
              <span class="rule-editor-hint">点</span>
              <el-button
                v-if="getHourRanges(rule).length > 1"
                :icon="Delete"
                circle
                plain
                size="small"
                class="rule-editor-hour-remove"
                @click="removeHourRange(rule, idx)"
              />
            </div>
            <el-button
              :icon="Plus"
              size="small"
              plain
              class="rule-editor-hour-add"
              @click="addHourRange(rule)"
            >
              添加时段
            </el-button>
          </template>

          <template v-else-if="rule.dimension === 'install_time'">
            <el-input-number
              v-model="(rule.value as number)"
              :min="0"
              :precision="0"
              style="width: 140px"
            />
            <el-select v-model="rule.installUnit" style="width: 120px">
              <el-option v-for="u in INSTALL_UNITS" :key="u.value" :value="u.value" :label="u.label" />
            </el-select>
          </template>

          <template v-else-if="rule.dimension === 'network_type'">
            <el-checkbox-group v-model="(rule.value as string[])">
              <el-checkbox v-for="n in NETWORK_TYPES" :key="n.value" :value="n.value">{{ n.label }}</el-checkbox>
            </el-checkbox-group>
          </template>

          <template v-else-if="rule.dimension === 'device_type'">
            <el-checkbox-group v-model="(rule.value as string[])">
              <el-checkbox v-for="d in DEVICE_TYPES" :key="d.value" :value="d.value">{{ d.label }}</el-checkbox>
            </el-checkbox-group>
          </template>

          <template v-else-if="rule.dimension === 'device_brand'">
            <el-select
              :model-value="(rule.value as string[])"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择品牌（可多选）"
              style="min-width: 280px; flex: 1"
              @change="(v: string[]) => (rule.value = v)"
            >
              <el-option v-for="b in DEVICE_BRANDS" :key="b.value" :value="b.value" :label="b.label" />
            </el-select>
          </template>

          <template v-else-if="rule.dimension === 'device_model'">
            <el-select
              :model-value="(rule.value as string[])"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择型号（可多选）"
              style="min-width: 280px; flex: 1"
              @change="(v: string[]) => (rule.value = v)"
            >
              <el-option
                v-for="m in getFilteredModels(rule)"
                :key="m.value"
                :value="m.value"
                :label="m.label"
              />
            </el-select>
            <span v-if="(rule.value as string[]).length === 0" class="rule-editor-hint">未选型号时显示全部</span>
          </template>

          <template v-else-if="rule.dimension === 'idfa_status'">
            <el-select v-model="(rule.value as string)" placeholder="选择状态" style="width: 140px">
              <el-option v-for="s in IDFA_STATUS" :key="s.value" :value="s.value" :label="s.label" />
            </el-select>
          </template>

          <template v-else-if="rule.dimension === 'user_value'">
            <el-input-number
              :model-value="getEcpmMin(rule)"
              :min="0" :precision="2" :step="1"
              @change="(v: number) => setEcpmMin(rule, v || 0)"
            />
            <span class="rule-editor-sep">≤ eCPM ＜</span>
            <el-input-number
              :model-value="getEcpmMax(rule)"
              :min="0" :precision="2" :step="1"
              @change="(v: number) => setEcpmMax(rule, v || 0)"
            />
          </template>

          <template v-else-if="rule.dimension === 'custom'">
            <el-input
              v-model="rule.customAttrName"
              placeholder="属性名"
              style="width: 160px"
            />
            <el-select v-model="rule.customAttrType" style="width: 110px">
              <el-option v-for="t in CUSTOM_ATTR_TYPES" :key="t.value" :value="t.value" :label="t.label" />
            </el-select>
            <el-input
              v-model="(rule.value as string)"
              placeholder="属性值"
              style="flex: 1; min-width: 200px"
            />
          </template>

          <template v-else-if="['app_version_name','app_version_code','sdk_version','os_version','device_id','channel'].includes(rule.dimension)">
            <el-input
              type="textarea"
              :rows="3"
              :model-value="getTextListDisplay(rule)"
              :placeholder="getDimensionMeta(rule.dimension)?.placeholder || '一行一个'"
              @update:model-value="(v: string) => setTextListDisplay(rule, v)"
              style="flex: 1; min-width: 280px"
            />
          </template>

          <!-- 时区（日期/星期/小时 维度） -->
          <el-select
            v-if="['date','weekday','hour'].includes(rule.dimension)"
            v-model="rule.timezone"
            placeholder="时区"
            style="width: 220px"
          >
            <el-option v-for="tz in TIMEZONES" :key="tz.value" :value="tz.value" :label="tz.label" />
          </el-select>
        </div>

        <!-- 地区维度的范围切换 -->
        <div v-if="rule.dimension === 'region'" class="rule-editor-item-subrow">
          <el-radio-group v-model="rule.regionScope" size="small">
            <el-radio-button value="china">中国（到城市）</el-radio-button>
            <el-radio-button value="global">全球（到国家）</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <el-button :icon="Plus" type="primary" plain @click="addRule">继续添加规则</el-button>
    </div>

    <el-dialog
      v-model="showAddDialog"
      title="选择规则维度"
      width="640px"
      :close-on-click-modal="false"
    >
      <div class="rule-editor-pick-grid">
        <el-button
          v-for="dim in DIMENSIONS"
          :key="dim.value"
          :type="pendingDimension === dim.value ? 'primary' : 'default'"
          @click="pendingDimension = dim.value"
          class="rule-editor-pick-btn"
        >
          {{ dim.label }}
        </el-button>
      </div>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!pendingDimension" @click="confirmAdd">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

