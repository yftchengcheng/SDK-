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
    .get('/api/v1/console/report/metric/list', { params: { is_active: 'true' } })
    .then((raw) => {
      // request 拦截器返回的是 data 字段本身：{ code, data, message }
      const res = raw as unknown as { code: number; data?: Array<{ code: string; name: string; format?: string; unit?: string }> };
      if (res?.code === 0 && Array.isArray(res.data)) {
        const map: Record<string, MetricDef> = {};
        for (const m of res.data) {
          map[m.code] = { code: m.code, name: m.name, format: m.format, unit: m.unit };
        }
        _dict.value = map;
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

/** 解析 code → 中文名（带 fallback 的纯函数） */
export function metricNameOf(code: string, fallback?: Record<string, string>): string {
  return _dict.value[code]?.name || fallback?.[code] || code;
}

/** 取 format（number/percent/currency） */
export function metricFormatOf(code: string): string | undefined {
  return _dict.value[code]?.format;
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
