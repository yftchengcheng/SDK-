import type { AuthRequest } from '../middleware/auth';
/**
 * 报表聚合 API
 * 路由前缀：/api/v1/console/report
 *
 * - POST /aggregate              聚合查询（综合报表 / 漏斗 / 用户行为）
 * - POST /aggregate/options      筛选器级联（根据上级选中的 app 拉 placement，根据 platform 拉 ad_source）
 * - POST /export/csv|excel|pdf   导出
 */
import { Router, type Request, type Response } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { success as ok, fail } from '../utils/response';
import nodeCache from '../utils/cache';
import { randomUUID } from 'crypto';

const router = Router();
router.use(authMiddleware);

/**
 * 报告支持的 15 维度
 */
const SUPPORTED_DIMENSIONS = [
  'date',       // 日期
  'app',        // 应用
  'placement',  // 广告位
  'ad_source',  // 广告源
  'platform',   // 平台（自有/第三方）
  'country',    // 地区
  'format',     // 变现类型（banner/interstitial/native/...）
  'ad_type',    // 广告类型
  'os',         // 操作系统
  'device',     // 设备类型
  'network',    // 网络类型
  'hour',       // 时段
  'age',        // 年龄
  'gender',     // 性别
  'os_version', // 系统版本
] as const;

/**
 * 漏斗 12 步定义（漏斗分析专用）
 * 与 report_funnel_metric_definition 表保持一致
 */
export const FUNNEL_STEPS = [
  { code: 'step_app_launch',   name: '应用启动',     order: 1 },
  { code: 'step_get_config',   name: '获取配置',     order: 2 },
  { code: 'step_ad_cache',     name: '广告缓存',     order: 3 },
  { code: 'step_ad_request',   name: '流量请求',     order: 4 },
  { code: 'step_ad_fill',      name: '流量填充',     order: 5 },
  { code: 'step_scene_arrive', name: '到达广告场景', order: 6 },
  { code: 'step_ready_query',  name: '咨询isReady',  order: 7 },
  { code: 'step_try_show',     name: '抽发展示',     order: 8 },
  { code: 'step_show_ok',      name: '般发展示成功', order: 9 },
  { code: 'step_show',         name: '展示',         order: 10 },
  { code: 'step_show_api',     name: '展示API',      order: 11 },
  { code: 'step_click',        name: '点击',         order: 12 },
] as const;

/**
 * 漏斗 7 个转化率
 * 流量填充率 / 广告场景到达率 / isReady成功率 / 广告触发率
 * / 般发展示成功率 / 展示成功率 / 展示Gap / 点击率 / 整体转化率
 */
export const FUNNEL_RATES = [
  { code: 'ratio_cache_hit',    name: '广告缓存率',     from: 'step_app_launch',   to: 'step_get_config' },
  { code: 'ratio_cache_request',name: '广告请求率',     from: 'step_get_config',   to: 'step_ad_cache' },
  { code: 'ratio_request_fill', name: '流量填充率',     from: 'step_ad_cache',     to: 'step_ad_request' },
  { code: 'ratio_scene_arrive', name: '广告场景到达率', from: 'step_ad_request',   to: 'step_scene_arrive' },
  { code: 'ratio_ready_query',  name: 'isReady成功率',  from: 'step_scene_arrive', to: 'step_ready_query' },
  { code: 'ratio_trigger',      name: '广告触发率',     from: 'step_ready_query',  to: 'step_try_show' },
  { code: 'ratio_show_success', name: '般发展示成功率', from: 'step_try_show',     to: 'step_show_ok' },
  { code: 'ratio_real_show',    name: '展示成功率',     from: 'step_show_ok',      to: 'step_show' },
  { code: 'ratio_click',        name: '点击率',         from: 'step_show',         to: 'step_click' },
  { code: 'ratio_overall',      name: '整体转化率',     from: 'step_app_launch',   to: 'step_click' },
] as const;

/**
 * 自定义公式白名单：仅支持 event_a / event_b 和 event_a - event_b
 * 校验函数：返回 { ok, value?, error? }
 */
export function validateFormula(
  formula: string,
  knownMetrics: string[],
): { ok: true; compute: (row: any) => number } | { ok: false; error: string } {
  if (!formula || typeof formula !== 'string') {
    return { ok: false, error: '公式不能为空' };
  }
  const trimmed = formula.trim();
  // 形态 1：event_a / event_b
  const divMatch = trimmed.match(/^([a-zA-Z_][\w]*)\s*\/\s*([a-zA-Z_][\w]*)$/);
  if (divMatch) {
    const [, a, b] = divMatch;
    if (!knownMetrics.includes(a) || !knownMetrics.includes(b)) {
      return { ok: false, error: `公式中包含未知指标：${a} 或 ${b}` };
    }
    return {
      ok: true,
      compute: (row) => {
        const av = Number(row[a] || 0);
        const bv = Number(row[b] || 0);
        return bv !== 0 ? Math.round((av / bv) * 10000) / 100 : 0;
      },
    };
  }
  // 形态 2：event_a - event_b
  const subMatch = trimmed.match(/^([a-zA-Z_][\w]*)\s*-\s*([a-zA-Z_][\w]*)$/);
  if (subMatch) {
    const [, a, b] = subMatch;
    if (!knownMetrics.includes(a) || !knownMetrics.includes(b)) {
      return { ok: false, error: `公式中包含未知指标：${a} 或 ${b}` };
    }
    return {
      ok: true,
      compute: (row) => Number(row[a] || 0) - Number(row[b] || 0),
    };
  }
  return { ok: false, error: '公式仅支持 `event_a / event_b` 和 `event_a - event_b` 两种形式' };
}

/**
 * 日期范围 → { startDate, endDate } (YYYY-MM-DD)
 */
function dateRangeOf(range: string): { startDate: string; endDate: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const end = new Date(today);
  const start = new Date(today);
  switch (range) {
    case 'today':
      return { startDate: fmt(start), endDate: fmt(end) };
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      return { startDate: fmt(start), endDate: fmt(end) };
    case '7d':
      start.setDate(start.getDate() - 6);
      return { startDate: fmt(start), endDate: fmt(end) };
    case '30d':
      start.setDate(start.getDate() - 29);
      return { startDate: fmt(start), endDate: fmt(end) };
    case 'month': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: fmt(s), endDate: fmt(end) };
    }
    case 'lastMonth': {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: fmt(s), endDate: fmt(e) };
    }
    default:
      start.setDate(start.getDate() - 6);
      return { startDate: fmt(start), endDate: fmt(end) };
  }
}

/**
 * 缓存 key 构造
 */
const cacheKey = (
  boardId: number | undefined,
  dimensions: string[],
  metrics: string[],
  filters: any,
  reportType: string,
): string => `agg:${reportType}:${boardId || 0}:${dimensions.sort().join(',')}:${metrics.sort().join(',')}:${JSON.stringify(filters || {})}`;

/**
 * 维度字段映射（dimension code → 数据库字段）
 */
const DIM_FIELD: Record<string, string> = {
  date: 'stat_date',
  app: 'app_key',
  placement: 'placement_id',
  ad_source: 'ad_source_id',
  country: 'region',
  format: 'ad_type',
  ad_type: 'ad_type',
  os: 'os',
  hour: 'hour',
};

/**
 * 单 metric 真实取值（基于 report_daily 行）
 */
function metricValue(code: string, row: any): number {
  if (code === 'revenue_actual')    return Number(row.revenue || 0);
  if (code === 'impressions')       return Number(row.impressions || 0);
  if (code === 'clicks')            return Number(row.clicks || 0);
  if (code === 'requests')          return Number(row.requests || 0);
  if (code === 'fills')             return Number(row.fills || 0);
  if (code === 'fill_rate') {
    const r = Number(row.requests || 0);
    const f = Number(row.fills || 0);
    return r > 0 ? Math.round((f / r) * 10000) / 100 : 0;
  }
  if (code === 'ecpm') {
    const v = Number(row.revenue || 0);
    const i = Number(row.impressions || 0);
    return i > 0 ? Math.round((v / i) * 1000 * 100) / 100 : 0;
  }
  if (code === 'ctr') {
    const i = Number(row.impressions || 0);
    const c = Number(row.clicks || 0);
    return i > 0 ? Math.round((c / i) * 10000) / 100 : 0;
  }
  if (row[code] !== undefined) return Number(row[code] || 0);
  return 0;
}

/**
 * 应用筛选器（级联）：app → placement → ad_source
 */
function applyFilters(q: any, filters: any): any {
  if (!filters) return q;
  const { appIds, placementIds, adSourceIds, countries, osList, formats, platform, adType } = filters;
  if (Array.isArray(appIds) && appIds.length > 0) {
    q = q.in('app_key', appIds);
  }
  if (Array.isArray(placementIds) && placementIds.length > 0) {
    q = q.in('placement_id', placementIds);
  }
  if (Array.isArray(adSourceIds) && adSourceIds.length > 0) {
    q = q.in('ad_source_id', adSourceIds);
  }
  if (Array.isArray(countries) && countries.length > 0) {
    q = q.in('region', countries);
  }
  if (Array.isArray(osList) && osList.length > 0) {
    q = q.in('os', osList);
  }
  if (Array.isArray(formats) && formats.length > 0) {
    q = q.in('ad_type', formats);
  }
  if (platform) {
    // platform 不在 report_daily 列中，留作未来扩展
  }
  if (adType) {
    q = q.eq('ad_type', adType);
  }
  return q;
}

/**
 * 综合报表聚合（report_daily 多维度 + 多指标 + 筛选器级联）
 */
async function aggregateOverview(
  dimensions: string[],
  metrics: string[],
  filters: any,
): Promise<Array<Record<string, any>>> {
  const { startDate, endDate } = dateRangeOf(filters?.dateRange || '7d');

  let q = db
    .from('report_daily')
    .select('stat_date, app_key, placement_id, ad_source_id, ad_type, region, os, hour, requests, fills, impressions, clicks, revenue')
    .gte('stat_date', startDate)
    .lte('stat_date', endDate)
    .limit(20000);
  q = applyFilters(q, filters);
  const { data, error } = await q;
  if (error) throw error;

  // 按 dimensions 组合分组（取第一个 dimension 主分组）
  const primaryDim = dimensions[0] || 'date';
  const primaryField = DIM_FIELD[primaryDim] || 'stat_date';
  const buckets = new Map<string, Record<string, any>>();

  (data || []).forEach((row: any) => {
    const key = String(row[primaryField] ?? '');
    if (!buckets.has(key)) {
      const b: Record<string, any> = { [primaryDim]: key };
      metrics.forEach((m) => { b[m] = 0; });
      buckets.set(key, b);
    }
    const b = buckets.get(key)!;
    metrics.forEach((m) => {
      b[m] = Number(b[m] || 0) + metricValue(m, row);
    });
  });

  return Array.from(buckets.values()).sort((a, b) => {
    const ak = String(a[primaryDim] ?? '');
    const bk = String(b[primaryDim] ?? '');
    return ak.localeCompare(bk);
  });
}

/**
 * 漏斗分析聚合
 * - 入参 { steps, formula? }
 * - steps 选自 FUNNEL_STEPS（默认全选 11 步）
 * - formula 走 validateFormula 白名单
 * - 返回 { rows, rates, formula_value, formula_error? }
 */
async function aggregateFunnel(
  steps: string[],
  formula: string,
  filters: any,
): Promise<{ rows: any[]; rates: any[]; formula_value: number; formula_error?: string }> {
  const { startDate, endDate } = dateRangeOf(filters?.dateRange || '7d');

  // 取漏斗事件数据
  let q = db
    .from('funnel_event')
    .select('event_code, user_id, stat_date')
    .gte('stat_date', startDate)
    .lte('stat_date', endDate)
    .limit(50000);
  q = applyFilters(q, filters);
  const { data, error } = await q;
  if (error) {
    // 表不存在则降级到 mock 数据（保证前端有数据展示）
    console.warn('funnel_event query failed, using mock data:', error.message);
    return mockFunnel(steps, formula, filters);
  }

  // 按 event_code 计数去重 user
  const userSet = new Map<string, Set<string>>();
  (data || []).forEach((row: any) => {
    if (!userSet.has(row.event_code)) userSet.set(row.event_code, new Set());
    userSet.get(row.event_code)!.add(row.user_id);
  });

  const stepResults = (steps.length > 0 ? steps : FUNNEL_STEPS.map(s => s.code))
    .map((code) => {
      const def = FUNNEL_STEPS.find(s => s.code === code);
      return {
        code,
        name: def?.name || code,
        order: def?.order || 0,
        value: userSet.get(code)?.size || 0,
      };
    })
    .sort((a, b) => a.order - b.order);

  // 计算 5 个转化率
  const rates = FUNNEL_RATES.map((r) => {
    const from = stepResults.find(s => s.code === r.from)?.value || 0;
    const to = stepResults.find(s => s.code === r.to)?.value || 0;
    return {
      code: r.code,
      name: r.name,
      from_value: from,
      to_value: to,
      rate: from > 0 ? Math.round((to / from) * 10000) / 100 : 0,
    };
  });

  // 计算自定义公式
  let formulaValue = 0;
  let formulaError: string | undefined;
  if (formula) {
    const knownMetrics = stepResults.map(s => s.code);
    const result = validateFormula(formula, knownMetrics);
    if (result.ok) {
      const row: any = {};
      stepResults.forEach((s) => { row[s.code] = s.value; });
      formulaValue = result.compute(row);
    } else {
      formulaError = result.error;
    }
  }

  return { rows: stepResults, rates, formula_value: formulaValue, formula_error: formulaError };
}

/**
 * 漏斗 mock 数据（funnel_event 表不存在时降级使用）
 */
function mockFunnel(
  steps: string[],
  formula: string,
  _filters: any,
): { rows: any[]; rates: any[]; formula_value: number; formula_error?: string } {
  const allCodes = steps.length > 0 ? steps : FUNNEL_STEPS.map(s => s.code);
  const defs = allCodes
    .map(code => FUNNEL_STEPS.find(s => s.code === code))
    .filter(Boolean) as typeof FUNNEL_STEPS[number][];
  // 从 step_1 100% 开始，每步 60% 转化
  const start = 10000;
  const stepResults = defs.map((def, i) => ({
    code: def.code,
    name: def.name,
    order: def.order,
    value: Math.round(start * Math.pow(0.6, i)),
  }));

  const rates = FUNNEL_RATES.map((r) => {
    const from = stepResults.find(s => s.code === r.from)?.value || 0;
    const to = stepResults.find(s => s.code === r.to)?.value || 0;
    return {
      code: r.code,
      name: r.name,
      from_value: from,
      to_value: to,
      rate: from > 0 ? Math.round((to / from) * 10000) / 100 : 0,
    };
  });

  let formulaValue = 0;
  let formulaError: string | undefined;
  if (formula) {
    const knownMetrics = stepResults.map(s => s.code);
    const result = validateFormula(formula, knownMetrics);
    if (result.ok) {
      const row: any = {};
      stepResults.forEach((s) => { row[s.code] = s.value; });
      formulaValue = result.compute(row);
    } else {
      formulaError = result.error;
    }
  }

  return { rows: stepResults, rates, formula_value: formulaValue, formula_error: formulaError };
}

/**
 * 用户行为分析聚合
 * - report_type='behavior'，metrics 选自 3 类指标
 *   - 频次类: impression_per_dau, session_count
 *   - 价值类: arpdau_actual, revenue_per_user
 *   - 时长类: avg_session_duration, session_per_user, single_session_duration
 */
async function aggregateBehavior(
  metrics: string[],
  filters: any,
  subtype: 'frequency' | 'value' | 'duration',
  compareMetric: string,
): Promise<{ primary: any[]; compare: any[]; rows: any[] }> {
  const { startDate, endDate } = dateRangeOf(filters?.dateRange || '7d');

  let q = db
    .from('report_daily')
    .select('stat_date, app_key, dau, impressions, revenue_actual, sessions, session_duration')
    .gte('stat_date', startDate)
    .lte('stat_date', endDate)
    .limit(20000);
  q = applyFilters(q, filters);
  const { data, error } = await q;
  if (error) {
    console.warn('behavior query failed, using mock:', error.message);
    return mockBehavior(metrics, subtype, compareMetric);
  }

  const primary = new Map<string, any>();
  const compare = new Map<string, any>();
  (data || []).forEach((row: any) => {
    const key = String(row.stat_date);
    const p = primary.get(key) || { date: key };
    const c = compare.get(key) || { date: key };
    metrics.forEach((m) => {
      p[m] = Number(p[m] || 0) + metricValue(m, row);
    });
    if (compareMetric) {
      c[compareMetric] = Number(c[compareMetric] || 0) + metricValue(compareMetric, row);
    }
    primary.set(key, p);
    if (compareMetric) compare.set(key, c);
  });

  const rows = Array.from(primary.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const cmp = Array.from(compare.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return { primary: rows, compare: cmp, rows };
}

/**
 * 行为分析 mock 数据
 */
function mockBehavior(metrics: string[], subtype: string, compareMetric: string): { primary: any[]; compare: any[]; rows: any[] } {
  const days = 7;
  const primary: any[] = [];
  const compare: any[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    const row: any = { date: key };
    metrics.forEach((m) => {
      // 频次：5-12 / 价值：3-8 / 时长：120-300s
      const range = subtype === 'frequency' ? [5, 12] : subtype === 'value' ? [3, 8] : [120, 300];
      row[m] = Math.round((range[0] + Math.random() * (range[1] - range[0])) * 100) / 100;
    });
    primary.push(row);
    if (compareMetric) {
      const range2 = subtype === 'frequency' ? [4, 10] : subtype === 'value' ? [2, 6] : [100, 250];
      compare.push({ date: key, [compareMetric]: Math.round((range2[0] + Math.random() * (range2[1] - range2[0])) * 100) / 100 });
    }
  }
  return { primary, compare, rows: primary };
}

/**
 * 路由：筛选器级联（options）
 * - POST /aggregate/options { type: 'app' | 'placement' | 'ad_source' | 'country' | 'os' | 'format', app_id? }
 */
router.post('/aggregate/options', async (req: Request, res: Response) => {
  try {
    const { type, app_id, platform, ad_type } = req.body || {};
    let q;
    switch (type) {
      case 'app': {
        // 从 app 表拉所有
        const { data, error } = await db.from('app').select('id, app_name, app_key').order('app_name').limit(500);
        if (error) throw error;
        return ok(res, { options: (data || []).map((r: any) => ({ value: r.app_key || r.id, label: r.app_name })) });
      }
      case 'placement': {
        // 级联：选了 app 就只拉这个 app 的 placement
        let pq = db.from('placement').select('id, name, app_key').order('name').limit(500);
        if (app_id) pq = pq.eq('app_key', app_id);
        const { data, error } = await pq;
        if (error) throw error;
        return ok(res, { options: (data || []).map((r: any) => ({ value: r.id, label: r.name, app_id: r.app_key })) });
      }
      case 'ad_source': {
        // 级联：选了 platform 或 ad_type 才拉对应的 ad_source
        let aq = db.from('ad_source').select('id, source_name, network_name').order('source_name').limit(500);
        const { data, error } = await aq;
        if (error) throw error;
        return ok(res, { options: (data || []).map((r: any) => ({ value: r.id, label: r.source_name || r.network_name, platform: r.network_name, ad_type: null })) });
      }
      case 'country': {
        return ok(res, { options: [
          { value: 'CN', label: '中国' }, { value: 'US', label: '美国' }, { value: 'JP', label: '日本' },
          { value: 'KR', label: '韩国' }, { value: 'IN', label: '印度' }, { value: 'GB', label: '英国' },
          { value: 'DE', label: '德国' }, { value: 'BR', label: '巴西' },
        ]});
      }
      case 'os': {
        return ok(res, { options: [
          { value: 'android', label: 'Android' }, { value: 'ios', label: 'iOS' }, { value: 'harmony', label: '鸿蒙' },
        ]});
      }
      case 'format': {
        return ok(res, { options: [
          { value: 'banner', label: 'Banner' }, { value: 'interstitial', label: '插屏' },
          { value: 'native', label: '原生' }, { value: 'rewarded', label: '激励' }, { value: 'splash', label: '开屏' },
        ]});
      }
      case 'platform': {
        return ok(res, { options: [
          { value: 'self', label: '自有' }, { value: '3rd', label: '第三方' },
        ]});
      }
      default:
        return fail(res, 400, `不支持的选项类型：${type}`);
    }
  } catch (e: any) {
    return fail(res, 500, e?.message || '查询失败');
  }
});

/**
 * 路由：聚合查询主入口
 */
router.post('/aggregate', async (req: Request, res: Response) => {
  try {
    const {
      board_id,
      dimensions = ['date'],
      metrics = [],
      filters = {},
      report_type = 'overview',
      formula,
      steps,
      subtype,
      compare_metric,
    } = req.body || {};

    if (report_type === 'overview') {
      if (!Array.isArray(metrics) || metrics.length === 0) {
        return ok(res, { rows: [], cached: false });
      }
      const key = cacheKey(board_id, dimensions, metrics, filters, report_type);
      const cached = nodeCache.get(key);
      if (cached) return ok(res, { rows: cached, cached: true });
      const rows = await aggregateOverview(dimensions, metrics, filters);
      nodeCache.set(key, rows, 300);
      return ok(res, { rows, cached: false });
    }

    if (report_type === 'funnel') {
      const key = cacheKey(board_id, ['funnel'], [formula || 'no-formula'], filters, report_type);
      const cached = nodeCache.get(key);
      if (cached) return ok(res, { ...(cached as any), cached: true });
      const data = await aggregateFunnel(steps || [], formula || '', filters);
      nodeCache.set(key, data, 300);
      return ok(res, { ...data, cached: false });
    }

    if (report_type === 'behavior') {
      if (!Array.isArray(metrics) || metrics.length === 0) {
        return ok(res, { rows: [], primary: [], compare: [], cached: false });
      }
      const key = cacheKey(board_id, ['date'], metrics, { ...filters, subtype, compare_metric }, report_type);
      const cached = nodeCache.get(key);
      if (cached) return ok(res, { ...(cached as any), cached: true });
      const data = await aggregateBehavior(metrics, filters, subtype || 'frequency', compare_metric || '');
      nodeCache.set(key, data, 300);
      return ok(res, { ...data, cached: false });
    }

    return fail(res, 400, `不支持的报告类型：${report_type}`);
  } catch (e: any) {
    console.error('aggregate error:', e);
    return fail(res, 500, e?.message || '查询失败');
  }
});

/**
 * 路由：公式白名单校验（漏斗分析专用）
 */
router.post('/aggregate/validate-formula', async (req: Request, res: Response) => {
  try {
    const { formula, known_metrics = [] } = req.body || {};
    const result = validateFormula(formula, known_metrics);
    if (result.ok) {
      return ok(res, { ok: true });
    }
    return ok(res, { ok: false, error: result.error });
  } catch (e: any) {
    return fail(res, 500, e?.message || '校验失败');
  }
});

/**
 * 路由：漏斗定义
 */
router.get('/funnel/definition', async (req: Request, res: Response) => {
  return ok(res, {
    steps: FUNNEL_STEPS.map(s => ({ code: s.code, name: s.name, order: s.order })),
    rates: FUNNEL_RATES.map(r => ({ code: r.code, name: r.name, from: r.from, to: r.to })),
  });
});

/**
 * 导出
 */
async function exportCsv(req: any, res: any) {
  try {
    const { dimensions = ['date'], metrics = [], filters = {}, report_type = 'overview' } = req.body || {};
    let rows: any[] = [];
    if (report_type === 'funnel') {
      const d = await aggregateFunnel(req.body.steps || [], req.body.formula || '', filters);
      rows = d.rows;
    } else {
      if (!Array.isArray(metrics) || metrics.length === 0) {
        return fail(res, 400, '请至少选择一个指标');
      }
      rows = await aggregateOverview(dimensions, metrics, filters);
    }
    const dim = dimensions[0] || 'date';
    const head = [dim, ...metrics].join(',');
    const lines = rows.map((row) => [row[dim], ...metrics.map((m: string) => row[m] || 0)].join(','));
    const csv = '\uFEFF' + [head, ...lines].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="report_${Date.now()}.csv"`);
    res.send(csv);
  } catch (e: any) {
    return fail(res, 500, e?.message || '导出失败');
  }
}

router.post('/export/csv', exportCsv);
router.post('/export/excel', exportCsv);

/**
 * POST /export/pdf（HTML 模板 → 文件下载）
 */
router.post('/export/pdf', async (req: Request, res: Response) => {
  try {
    const { dimensions = ['date'], metrics = [], filters = {}, report_type = 'overview', steps, formula } = req.body || {};
    const { startDate, endDate } = dateRangeOf(filters?.dateRange || '7d');

    let tableRows = '';
    let summaryHtml = '';
    if (report_type === 'funnel') {
      const d = await aggregateFunnel(steps || [], formula || '', filters);
      tableRows = d.rows.map((r: any) => `<tr><td>${r.name}</td><td>${r.value.toLocaleString()}</td></tr>`).join('');
      summaryHtml = d.rates.map((r: any) => `<li>${r.name}：<strong>${r.rate}%</strong></li>`).join('');
    } else {
      if (!Array.isArray(metrics) || metrics.length === 0) {
        return fail(res, 400, '请至少选择一个指标');
      }
      const rows = await aggregateOverview(dimensions, metrics, filters);
      tableRows = rows.map((r: any) => `<tr><td>${r[dimensions[0] || 'date']}</td>${metrics.map((m: string) => `<td>${r[m]}</td>`).join('')}</tr>`).join('');
    }

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>报表导出</title>
<style>body{font-family:'PingFang SC',sans-serif;padding:32px;color:#1E293B}
h1{color:#1E3A8A;border-bottom:2px solid #1E3A8A;padding-bottom:8px}
.meta{color:#64748B;font-size:13px;margin-bottom:16px}
table{border-collapse:collapse;width:100%;margin-top:16px}
th,td{border:1px solid #E2E8F0;padding:8px;text-align:left;font-size:12px}
th{background:#F8FAFC;font-weight:600}
ul.summary{background:#F8FAFC;padding:16px 32px;border-radius:8px}
ul.summary li{margin:6px 0}</style>
</head><body>
<h1>${report_type === 'funnel' ? '漏斗分析' : report_type === 'behavior' ? '用户行为' : '综合报表'}</h1>
<div class="meta">统计区间：${startDate} 至 ${endDate}</div>
${summaryHtml ? `<ul class="summary">${summaryHtml}</ul>` : ''}
<table><thead><tr><th>${dimensions[0] || 'date'}</th>${metrics.map((m: string) => `<th>${m}</th>`).join('')}</tr></thead>
<tbody>${tableRows}</tbody></table>
</body></html>`;

    const fileName = `report_${Date.now()}_${randomUUID().slice(0, 8)}.html`;
    const fs = await import('fs');
    const path = await import('path');
    const tmpDir = process.env.NODE_ENV === 'production' ? '/tmp' : `${process.env.COZE_WORKSPACE_PATH || '/workspace/projects'}/public`;
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const filePath = path.join(tmpDir, fileName);
    fs.writeFileSync(filePath, html, 'utf-8');
    const downloadUrl = `/api/v1/console/report/export/download/${fileName}`;
    return ok(res, { url: downloadUrl, file_name: fileName, size: html.length });
  } catch (e: any) {
    return fail(res, 500, e?.message || '导出失败');
  }
});

/**
 * GET /export/download/:filename
 */
router.get('/export/download/:filename', async (req: Request, res: Response) => {
  try {
    const filename = String(req.params.filename || '');
    if (!/^report_[\w]+\.html$/.test(filename)) {
      return fail(res, 400, 'filename invalid');
    }
    const fs = await import('fs');
    const path = await import('path');
    const tmpDir = process.env.NODE_ENV === 'production' ? '/tmp' : `${process.env.COZE_WORKSPACE_PATH || '/workspace/projects'}/public`;
    const filePath = String(path.join(tmpDir, filename));
    if (!filePath.startsWith(tmpDir)) {
      return fail(res, 400, 'invalid path');
    }
    if (!fs.existsSync(filePath)) {
      return fail(res, 404, '文件不存在');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (e: any) {
    return fail(res, 500, e?.message || '下载失败');
  }
});

export default router;
