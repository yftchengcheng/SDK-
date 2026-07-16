/**
 * 指标字典：code → { name, format }
 * 集中加载 + 缓存（首次调用时拉取 /api/v1/console/report/metric/list）
 * 跨组件复用：MetricPicker / ReportTableView / SaveAsBoardDialog / 看版卡
 */
import { ref, computed } from 'vue';
import request from '@/utils/request';

export interface MetricDef {
  code: string;
  name: string;
  format?: string;
  unit?: string;
}

const _dict = ref<Record<string, MetricDef>>({});
const _loading = ref(false);
const _loaded = ref(false);
let _loadPromise: Promise<void> | null = null;

/** 触发一次加载（幂等，重复调用只发一次请求） */
export function loadMetricDict(): Promise<void> {
  if (_loaded.value) return Promise.resolve();
  if (_loadPromise) return _loadPromise;
  _loading.value = true;
  _loadPromise = request
    .get('/api/v1/console/report-metric/list', { params: { is_active: 'true' } })
    .then((raw) => {
      // request 拦截器返回的是 data 字段本身：{ code, data, message }
      const res = raw as unknown as { code: number; data?: Array<{ code: string; name: string; format?: string; unit?: string }> };
      console.log('[loadMetricDict] response:', res?.code, 'items:', res?.data?.length);
      if (res?.code === 0 && Array.isArray(res.data)) {
        const map: Record<string, MetricDef> = {};
        for (const m of res.data) {
          map[m.code] = { code: m.code, name: m.name, format: m.format, unit: m.unit };
        }
        _dict.value = map;
        console.log('[loadMetricDict] dict keys:', Object.keys(map).slice(0, 5), 'total:', Object.keys(map).length);
      } else {
        console.warn('[loadMetricDict] unexpected response shape:', JSON.stringify(res).slice(0, 200));
      }
      _loaded.value = true;
    })
    .catch((e) => {
      console.warn('[loadMetricDict] failed:', e);
      _loaded.value = true; // 标记已尝试，避免无限重试
    })
    .finally(() => {
      _loading.value = false;
    });
  return _loadPromise;
}

/** 全量 dict 响应式引用 */
export const metricDict = _dict;
export const metricDictLoading = _loading;
export const metricDictLoaded = _loaded;

/** 解析 code → 中文名（dict → 硬编码 fallback → code 三级回退） */
export function metricNameOf(code: string, fallback?: Record<string, string>): string {
  if (!code) return '';
  return (
    _dict.value[code]?.name ||
    fallback?.[code] ||
    FALLBACK_METRIC_LABELS[code] ||
    code
  );
}

/** 取 format（number/percent/currency，缺失回退 'number'） */
export function metricFormatOf(code: string): string {
  return _dict.value[code]?.format || FALLBACK_METRIC_FORMATS[code] || 'number';
}

/** 合并 dict + 额外 fallback 表为 code→name map，给 SaveAsBoardDialog 这类组件用 */
export function useMetricLabels(fallback?: Record<string, string>) {
  return computed<Record<string, string>>(() => {
    const out: Record<string, string> = { ...(fallback || {}) };
    for (const [code, def] of Object.entries(_dict.value)) {
      if (def?.name) out[code] = def.name;
    }
    return out;
  });
}

/**
 * 兜底映射：覆盖历史看版 config 中使用的旧 code（API dict 不会返回这些 code）
 * —— 任何时候 code 都没匹配到时，metricNameOf 会按这个表二次回退
 */
export const FALLBACK_METRIC_LABELS: Record<string, string> = {
  impressions: '展示数',
  clicks: '点击数',
  revenue_actual: '实际收益',
  ctr: '点击率',
  ecpm: 'eCPM',
  fill_rate: '填充率',
  show_rate: '展示率',
  click_rate: '点击率',
  impression_rate: '展示率',
  impression_ratio: '展示占比',
  start_dau: '启动 DAU',
  estimated_revenue_ratio: '预估收益占比',
  estimated_arpdeu: '预估 ARPDEU',
  dau: 'DAU',
  requests: '广告请求',
  fills: '广告填充',
  shows: '广告展示',
  scene_arrives: '广告场景到达',
  ready_queries: 'isReady 查询',
  try_shows: '广告触发',
  show_oks: '般发展示成功',
  show_apis: '展示 API',
  unique_users: '独立用户',
  session_count: '会话次数',
  duration_total: '总时长',
  // 兜底：历史/legacy 看版可能用 'revenue' 这种裸 code（DB 当前没有，
  // 但 metricNameOf 兜底链路 fallback 到 code 时会显示成英文 'revenue'，看起来像 bug）
  revenue: '收益',
};

/** 兜底 format 表（与 FALLBACK_METRIC_LABELS 配合，覆盖历史看版用的旧 code） */
export const FALLBACK_METRIC_FORMATS: Record<string, string> = {
  impressions: 'number',
  clicks: 'number',
  revenue_actual: 'currency',
  ctr: 'percent',
  ecpm: 'currency',
  fill_rate: 'percent',
  show_rate: 'percent',
  click_rate: 'percent',
  impression_rate: 'percent',
  impression_ratio: 'percent',
  start_dau: 'number',
  estimated_revenue_ratio: 'percent',
  estimated_arpdeu: 'currency',
  dau: 'number',
  requests: 'number',
  fills: 'number',
  shows: 'number',
  scene_arrives: 'number',
  ready_queries: 'number',
  try_shows: 'number',
  show_oks: 'number',
  show_apis: 'number',
  unique_users: 'number',
  session_count: 'number',
  duration_total: 'number',
};
