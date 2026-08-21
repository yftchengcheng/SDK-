/**
 * 阶段 0.4: enum-labels 已迁移至数据库 enum_dict 表
 *
 * 新流程（AGENTS.md "字典表使用规范"）：
 * 1. 调用 utils/dict-cache.ts: loadEnums() 异步初始化（应用启动时 + 5min TTL 刷新）
 * 2. 模板 / 业务代码用 dictCache.getLabel('dict_code', value) 取 label
 * 3. 字典数据来源：enum_dict 表（与 report_metric_definition 模式一致）
 *
 * 本文件保留 getEnumLabel/enumOptions 作为本地 fallback（数据库不可用时降级到代码常量），
 * 但**不再**是唯一来源。新代码必须走 dictCache。
 */
import { dictCache } from '@/utils/dict-cache';

// ---------- 本地常量（fallback / 初始化用） ----------
export const APP_PLATFORM_LABELS: Record<number, string> = { 1: 'Android', 2: 'iOS', 3: '双端' };
export const APP_ACCESS_TYPE_LABELS: Record<number, string> = { 1: '自有', 2: '联运', 3: '合作' };
export const PLACEMENT_FORMAT_LABELS: Record<number, string> = { 1: '横幅', 2: '插屏', 3: '开屏', 4: '原生', 5: '视频' };
export const PLACEMENT_BIDDING_TYPE_LABELS: Record<number, string> = { 1: '固价', 2: '竞价' };
export const PLACEMENT_ORIENTATION_LABELS: Record<number, string> = { 1: '横屏', 2: '竖屏', 3: '横竖兼容' };
export const PLACEMENT_AD_SIZE_LABELS: Record<number, string> = { 1: '半屏', 2: '全屏', 3: '优选' };
export const PLACEMENT_MATERIAL_TYPE_LABELS: Record<number, string> = { 1: '图片', 2: '视频', 3: '视频+图片' };
export const PLACEMENT_AUTO_PLAY_LABELS: Record<number, string> = { 1: '总是', 2: '仅WiFi', 3: '点击播放' };
export const PLACEMENT_TEMPLATE_STYLE_LABELS: Record<number, string> = {
  1: '1图1文', 2: '1图2文', 3: '1图3文', 4: '1图1图标1文', 5: '1图1图标2文',
  6: '3图1文', 7: '1图标2文', 8: '3图1图标2文', 9: '1图1图标2文1按钮',
  10: '图片', 11: '1视频1封面1文', 12: '1视频1封面1图标2文', 13: '1视频1封面',
};
export const REPORT_AD_TYPE_LABELS: Record<string, string> = {
  banner: '横幅广告', interstitial: '插屏广告', native: '信息流广告',
  rewarded: '激励视频', splash: '开屏广告',
};
export const REPORT_OS_LABELS: Record<string, string> = { android: 'Android', ios: 'iOS' };
export const REPORT_REGION_LABELS: Record<string, string> = {
  CN: '中国', HK: '中国香港', TW: '中国台湾', US: '美国', JP: '日本', KR: '韩国',
  GB: '英国', UK: '英国', IN: '印度', DE: '德国', FR: '法国', BR: '巴西', RU: '俄罗斯',
  CA: '加拿大', AU: '澳大利亚', SG: '新加坡', ID: '印度尼西亚', TH: '泰国', VN: '越南',
  MY: '马来西亚', PH: '菲律宾', MX: '墨西哥', ES: '西班牙', IT: '意大利', TR: '土耳其',
  SA: '沙特阿拉伯', AE: '阿联酋', EG: '埃及', ZA: '南非', AR: '阿根廷',
};
export const NETWORK_SYSTEM_TYPE_LABELS: Record<number, string> = { 1: 'Android', 2: 'iOS', 3: '双端' };
export const NETWORK_IS_PRESET_LABELS: Record<string, string> = { 'true': '预置', 'false': '自定义' };
export const MESSAGE_TYPE_LABELS: Record<number, string> = { 1: '系统通知', 2: '运营公告', 3: '收益提醒', 4: '异常告警' };
export const MESSAGE_IS_READ_LABELS: Record<number, string> = { 0: '未读', 1: '已读' };
export const MESSAGE_PRIORITY_LABELS: Record<number, string> = { 1: '低', 2: '中', 3: '高' };
export const DEVELOPER_ROLE_LABELS: Record<string, string> = { developer: '开发者', admin: '管理员' };
export const STATUS_LABELS: Record<number, string> = { 1: '启用', 2: '停用' };
export const STATUS_TAG_TYPE: Record<number, '' | 'success' | 'info' | 'warning' | 'danger'> = {
  0: 'warning', 1: 'success', 2: 'info', 3: 'warning',
};

type LabelMap = Record<string, string>;
export const ENUM_LABELS: Record<string, LabelMap> = {
  'app.platform': APP_PLATFORM_LABELS as unknown as LabelMap,
  'app.access_type': APP_ACCESS_TYPE_LABELS as unknown as LabelMap,
  'app.status': STATUS_LABELS as unknown as LabelMap,
  'placement.format': PLACEMENT_FORMAT_LABELS as unknown as LabelMap,
  'placement.bidding_type': PLACEMENT_BIDDING_TYPE_LABELS as unknown as LabelMap,
  'placement.screen_orientation': PLACEMENT_ORIENTATION_LABELS as unknown as LabelMap,
  'placement.ad_size': PLACEMENT_AD_SIZE_LABELS as unknown as LabelMap,
  'placement.material_type': PLACEMENT_MATERIAL_TYPE_LABELS as unknown as LabelMap,
  'placement.auto_play': PLACEMENT_AUTO_PLAY_LABELS as unknown as LabelMap,
  'placement.template_style': PLACEMENT_TEMPLATE_STYLE_LABELS as unknown as LabelMap,
  'placement.status': STATUS_LABELS as unknown as LabelMap,
  'ad_source.status': STATUS_LABELS as unknown as LabelMap,
  'traffic_group.status': STATUS_LABELS as unknown as LabelMap,
  'ad_network_def.system_type': NETWORK_SYSTEM_TYPE_LABELS as unknown as LabelMap,
  'ad_network_def.is_preset': NETWORK_IS_PRESET_LABELS,
  'ad_network_def.status': STATUS_LABELS as unknown as LabelMap,
  'ad_network_account.status': STATUS_LABELS as unknown as LabelMap,
  'waterfall_config.status': STATUS_LABELS as unknown as LabelMap,
  'waterfall_layer.status': STATUS_LABELS as unknown as LabelMap,
  'message.type': MESSAGE_TYPE_LABELS as unknown as LabelMap,
  'message.is_read': MESSAGE_IS_READ_LABELS as unknown as LabelMap,
  'message.priority': MESSAGE_PRIORITY_LABELS as unknown as LabelMap,
  'developer.status': STATUS_LABELS as unknown as LabelMap,
  'developer.role': DEVELOPER_ROLE_LABELS as unknown as LabelMap,
  'report_daily.ad_type': REPORT_AD_TYPE_LABELS as unknown as LabelMap,
  'report_daily.os': REPORT_OS_LABELS as unknown as LabelMap,
  'report_daily.region': REPORT_REGION_LABELS as unknown as LabelMap,
};

/** 把 dict_code 翻译成中文 label（**优先从 dictCache 拿，fallback 到本地常量**） */
export function getEnumLabel(dim: string, value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '--';
  // 优先从 dictCache（数据库）拿
  const cached = dictCache.getLabel(dim, value);
  if (cached !== null) return cached;
  // fallback 到本地常量
  const map = ENUM_LABELS[dim];
  if (!map) return String(value);
  const key = typeof value === 'boolean' ? String(value) : value;
  return map[key as string] ?? String(value);
}

export function getEnumTagType(dim: string, value: string | number | null | undefined): '' | 'success' | 'info' | 'warning' | 'danger' {
  if (value === null || value === undefined) return '';
  if (dim.endsWith('.status') || dim === 'message.is_read') {
    return STATUS_TAG_TYPE[Number(value)] ?? '';
  }
  return '';
}

export const adSourceStatusLabel = (v: number | null | undefined) => getEnumLabel('ad_source.status', v);
export const trafficGroupStatusLabel = (v: number | null | undefined) => getEnumLabel('traffic_group.status', v);
export const placementStatusLabel = (v: number | null | undefined) => getEnumLabel('placement.status', v);
export const waterfallConfigStatusLabel = (v: number | null | undefined) => getEnumLabel('waterfall_config.status', v);
export const waterfallLayerStatusLabel = (v: number | null | undefined) => getEnumLabel('waterfall_layer.status', v);
export const adNetworkDefStatusLabel = (v: number | null | undefined) => getEnumLabel('ad_network_def.status', v);
export const adNetworkAccountStatusLabel = (v: number | null | undefined) => getEnumLabel('ad_network_account.status', v);
export const developerStatusLabel = (v: number | null | undefined) => getEnumLabel('developer.status', v);
export const appStatusLabel = (v: number | null | undefined) => getEnumLabel('app.status', v);
export const messageTypeLabel = (v: number | null | undefined) => getEnumLabel('message.type', v);
export const messagePriorityLabel = (v: number | null | undefined) => getEnumLabel('message.priority', v);
export const systemTypeLabel = (v: number | null | undefined) => getEnumLabel('ad_network_def.system_type', v);
export const isPresetLabel = (v: boolean | null | undefined) => getEnumLabel('ad_network_def.is_preset', v);

export function enumOptions(dim: string): { value: string | number | boolean; label: string }[] {
  // 优先从 dictCache 拿
  const cached = dictCache.getOptions(dim);
  if (cached && cached.length > 0) return cached;
  // fallback 到本地常量
  const map = ENUM_LABELS[dim];
  if (!map) return [];
  return Object.entries(map).map(([k, v]) => {
    let value: string | number | boolean = k;
    if (k === 'true') value = true;
    else if (k === 'false') value = false;
    else if (/^-?\d+(\.\d+)?$/.test(k)) value = Number(k);
    return { value, label: v };
  });
}

export const enumLabel = getEnumLabel;
