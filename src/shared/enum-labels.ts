/**
 * 统一 enum code → 中文 label 映射（方案 B：前端 util 翻译）
 *
 * 设计原则：
 * - 后端 API 返原始 enum code（数字/字符串），不改后端
 * - 前端展示用本文件 util 翻译；fallback 到 code 本身（防止缺漏）
 * - 新增 enum 维度：加一个常量 + 在 ENUM_LABELS 注册
 * - 选项数组（用于 form select）的 value 必须是数字/字符串与 DB 一致
 *
 * 维护规则（参见 AGENTS.md "系统数据模型边界"）：
 * - 取值范围必须与 DB DISTINCT 一致
 * - 不确定的取值不进映射（fallback 自然显示原值）
 */

// ============== APP ==============
/** app.platform 平台 */
export const APP_PLATFORM_LABELS: Record<number, string> = {
  1: 'Android',
  2: 'iOS',
  3: '双端',
};

/** app.access_type 接入方式 */
export const APP_ACCESS_TYPE_LABELS: Record<number, string> = {
  1: '自有',
  2: '联运',
  3: '合作',
};

// ============== PLACEMENT ==============
/** placement.format 广告形式（按前端 form 硬编码 code，与 DB 实际一致） */
export const PLACEMENT_FORMAT_LABELS: Record<number, string> = {
  1: '横幅',
  2: '插屏',
  3: '开屏',
  4: '原生',
  5: '视频',
};

/** placement.bidding_type 竞价类型 */
export const PLACEMENT_BIDDING_TYPE_LABELS: Record<number, string> = {
  1: '固价',
  2: '竞价',
};

/** placement.screen_orientation 屏幕方向 */
export const PLACEMENT_ORIENTATION_LABELS: Record<number, string> = {
  1: '横屏',
  2: '竖屏',
  3: '横竖兼容',
};

/** placement.ad_size 广告展示大小（仅 format=插屏时显示） */
export const PLACEMENT_AD_SIZE_LABELS: Record<number, string> = {
  1: '半屏',
  2: '全屏',
  3: '优选',
};

/** placement.material_type 素材形式（format=插屏/视频时显示） */
export const PLACEMENT_MATERIAL_TYPE_LABELS: Record<number, string> = {
  1: '图片',
  2: '视频',
  3: '视频+图片',
};

/** placement.auto_play 自动播放 */
export const PLACEMENT_AUTO_PLAY_LABELS: Record<number, string> = {
  1: '总是',
  2: '仅WiFi',
  3: '点击播放',
};

/** placement.template_style 模版样式（format=原生时显示） */
export const PLACEMENT_TEMPLATE_STYLE_LABELS: Record<number, string> = {
  1: '1图1文',
  2: '1图2文',
  3: '1图3文',
  4: '1图1图标1文',
  5: '1图1图标2文',
  6: '3图1文',
  7: '1图标2文',
  8: '3图1图标2文',
  9: '1图1图标2文1按钮',
  10: '图片',
  11: '1视频1封面1文',
  12: '1视频1封面1图标2文',
  13: '1视频1封面',
};

// ============== REPORT_DAILY (DB enum string) ==============
/** report_daily.ad_type 广告类型 enum（与 placement.format 不同维度，DB 存英文 enum code） */
export const REPORT_AD_TYPE_LABELS: Record<string, string> = {
  banner: '横幅广告',
  interstitial: '插屏广告',
  native: '信息流广告',
  rewarded: '激励视频',
  splash: '开屏广告',
};

/** report_daily.os 系统 */
export const REPORT_OS_LABELS: Record<string, string> = {
  android: 'Android',
  ios: 'iOS',
};

/** report_daily.region 国家（与 placement/app 无关） */
export const REPORT_REGION_LABELS: Record<string, string> = {
  CN: '中国',
  HK: '中国香港',
  TW: '中国台湾',
  US: '美国',
  JP: '日本',
  KR: '韩国',
  GB: '英国',
  UK: '英国',
  IN: '印度',
  DE: '德国',
  FR: '法国',
  BR: '巴西',
  RU: '俄罗斯',
  CA: '加拿大',
  AU: '澳大利亚',
  SG: '新加坡',
  ID: '印度尼西亚',
  TH: '泰国',
  VN: '越南',
  MY: '马来西亚',
  PH: '菲律宾',
  MX: '墨西哥',
  ES: '西班牙',
  IT: '意大利',
  TR: '土耳其',
  SA: '沙特阿拉伯',
  AE: '阿联酋',
  EG: '埃及',
  ZA: '南非',
  AR: '阿根廷',
};

// ============== AD_NETWORK_DEF ==============
/** ad_network_def.system_type 系统类型 */
export const NETWORK_SYSTEM_TYPE_LABELS: Record<number, string> = {
  1: 'Android',
  2: 'iOS',
  3: '双端',
};

/** ad_network_def.is_preset 是否预置（key 是 'true'/'false' 字符串） */
export const NETWORK_IS_PRESET_LABELS: Record<string, string> = {
  'true': '预置',
  'false': '自定义',
};

// ============== MESSAGE ==============
/** message.type 消息类型 */
export const MESSAGE_TYPE_LABELS: Record<number, string> = {
  1: '系统通知',
  2: '运营公告',
  3: '收益提醒',
  4: '异常告警',
};

/** message.is_read 是否已读 */
export const MESSAGE_IS_READ_LABELS: Record<number, string> = {
  0: '未读',
  1: '已读',
};

/** message.priority 优先级 */
export const MESSAGE_PRIORITY_LABELS: Record<number, string> = {
  1: '低',
  2: '中',
  3: '高',
};

// ============== DEVELOPER ==============
/** developer.role 角色 */
export const DEVELOPER_ROLE_LABELS: Record<string, string> = {
  developer: '开发者',
  admin: '管理员',
};

// ============== 通用 ==============
/** 通用状态 1/2（很多表都有 status 字段，约定 1=启用/正常，2=停用/禁用） */
export const STATUS_LABELS: Record<number, string> = {
  1: '启用',
  2: '停用',
};

/** 通用状态 → el-tag type 映射（基于约定：1=success 启用，2=info 停用，0/其他=warning） */
export const STATUS_TAG_TYPE: Record<number, '' | 'success' | 'info' | 'warning' | 'danger'> = {
  0: 'warning',
  1: 'success',
  2: 'info',
  3: 'warning',
};

// ============================================================================
// 统一查表入口
// ============================================================================

type LabelMap = Record<string, string>;

/** 所有 enum 维度的统一注册表（key 是 dimension 名） */
export const ENUM_LABELS: Record<string, LabelMap> = {
  // app
  'app.platform': APP_PLATFORM_LABELS as unknown as LabelMap,
  'app.access_type': APP_ACCESS_TYPE_LABELS as unknown as LabelMap,
  'app.status': STATUS_LABELS as unknown as LabelMap,
  // placement
  'placement.format': PLACEMENT_FORMAT_LABELS as unknown as LabelMap,
  'placement.bidding_type': PLACEMENT_BIDDING_TYPE_LABELS as unknown as LabelMap,
  'placement.screen_orientation': PLACEMENT_ORIENTATION_LABELS as unknown as LabelMap,
  'placement.ad_size': PLACEMENT_AD_SIZE_LABELS as unknown as LabelMap,
  'placement.material_type': PLACEMENT_MATERIAL_TYPE_LABELS as unknown as LabelMap,
  'placement.auto_play': PLACEMENT_AUTO_PLAY_LABELS as unknown as LabelMap,
  'placement.template_style': PLACEMENT_TEMPLATE_STYLE_LABELS as unknown as LabelMap,
  'placement.status': STATUS_LABELS as unknown as LabelMap,
  // ad_source
  'ad_source.status': STATUS_LABELS as unknown as LabelMap,
  // traffic_group
  'traffic_group.status': STATUS_LABELS as unknown as LabelMap,
  // ad_network_def
  'ad_network_def.system_type': NETWORK_SYSTEM_TYPE_LABELS as unknown as LabelMap,
  'ad_network_def.is_preset': NETWORK_IS_PRESET_LABELS,
  'ad_network_def.status': STATUS_LABELS as unknown as LabelMap,
  'ad_network_account.status': STATUS_LABELS as unknown as LabelMap,
  // waterfall
  'waterfall_config.status': STATUS_LABELS as unknown as LabelMap,
  'waterfall_layer.status': STATUS_LABELS as unknown as LabelMap,
  // message
  'message.type': MESSAGE_TYPE_LABELS as unknown as LabelMap,
  'message.is_read': MESSAGE_IS_READ_LABELS as unknown as LabelMap,
  'message.priority': MESSAGE_PRIORITY_LABELS as unknown as LabelMap,
  // developer
  'developer.status': STATUS_LABELS as unknown as LabelMap,
  'developer.role': DEVELOPER_ROLE_LABELS as unknown as LabelMap,
  // report_daily
  'report_daily.ad_type': REPORT_AD_TYPE_LABELS as unknown as LabelMap,
  'report_daily.os': REPORT_OS_LABELS as unknown as LabelMap,
  'report_daily.region': REPORT_REGION_LABELS as unknown as LabelMap,
};

/**
 * 把 enum code 翻译成中文 label
 * @param dim 维度名（如 'app.platform' / 'placement.format'）
 * @param value enum code（数字/字符串/布尔）
 * @returns 中文 label；找不到时 fallback 到原 value（保证可读性）
 */
export function getEnumLabel(dim: string, value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '--';
  const map = ENUM_LABELS[dim];
  if (!map) return String(value);
  const key = typeof value === 'boolean' ? String(value) : value;
  return map[key as string] ?? String(value);
}

/**
 * 把 enum code 翻译成 el-tag 的 type（仅 status 类维度有意义）
 * @param dim 维度名（必须以 .status 结尾）
 * @param value enum code
 * @returns el-tag type；找不到时返回 ''
 */
export function getEnumTagType(dim: string, value: string | number | null | undefined): '' | 'success' | 'info' | 'warning' | 'danger' {
  if (value === null || value === undefined) return '';
  if (dim.endsWith('.status') || dim === 'message.is_read') {
    return STATUS_TAG_TYPE[Number(value)] ?? '';
  }
  return '';
}

/**
 * 便捷调用：避免在每个 view 里都写 getEnumLabel('xxx.status', row.status)
 */
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

/**
 * 把 LabelMap 转成 el-select 用的 { value, label }[]
 * @param dim 维度名（如 'placement.format'）
 * @returns options 数组（value 保持原类型：number / string / boolean）
 */
export function enumOptions(dim: string): { value: string | number | boolean; label: string }[] {
  const map = ENUM_LABELS[dim];
  if (!map) return [];
  return Object.entries(map).map(([k, v]) => {
    // 转回原类型：boolean 用 'true'/'false'，number 用 number，string 保持 string
    let value: string | number | boolean = k;
    if (k === 'true') value = true;
    else if (k === 'false') value = false;
    else if (/^-?\d+(\.\d+)?$/.test(k)) value = Number(k);
    return { value, label: v };
  });
}

/**
 * enumLabel 是 getEnumLabel 的简写（用于模板里更简洁）
 */
export const enumLabel = getEnumLabel;
