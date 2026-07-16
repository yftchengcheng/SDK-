/**
 * 报表筛选器中文标签映射
 *
 * 后端从 DB 拉出来的 value 通常是英文 code（如 'CN' / 'android' / 'banner'），
 * 前端展示时需要中文 label。本文件维护「已知 code → 中文 label」映射，
 * 未知 code 自动 fallback 到 code 本身（保持可读性、可扩展性）。
 *
 * 添加新国家/系统/格式时，只要 DB 里有值 + 这里加 label，UI 就会自动显示。
 */

export const COUNTRY_LABELS: Record<string, string> = {
  CN: '中国',
  HK: '中国香港',
  TW: '中国台湾',
  US: '美国',
  JP: '日本',
  KR: '韩国',
  IN: '印度',
  GB: '英国',
  UK: '英国',
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

export const OS_LABELS: Record<string, string> = {
  android: 'Android',
  ios: 'iOS',
  harmony: '鸿蒙',
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
};

export const FORMAT_LABELS: Record<string, string> = {
  banner: 'Banner',
  interstitial: '插屏',
  native: '原生',
  rewarded: '激励',
  splash: '开屏',
  draw: 'Draw 信息流',
  roll: '横幅',
  popup: '弹窗',
  video: '视频',
  fullscreen: '全屏',
};

export const PLATFORM_LABELS: Record<string, string> = {
  self: '自有',
  '3rd': '第三方',
  third: '第三方',
  custom: '自定义',
};

/**
 * 根据 type 把 code 翻译成中文 label；找不到 fallback 到 code
 */
export function getOptionLabel(type: string, value: string): string {
  switch (type) {
    case 'country': return COUNTRY_LABELS[value] || value;
    case 'os': return OS_LABELS[value] || value;
    case 'format': return FORMAT_LABELS[value] || value;
    case 'platform': return PLATFORM_LABELS[value] || value;
    default: return value;
  }
}
