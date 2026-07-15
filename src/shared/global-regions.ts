// 全球地区数据
// 国家按 Tier 1/2/3 划分 + 洲
// 数据来源：综合移动广告行业通用分级

export type RegionTier = 'T1' | 'T2' | 'T3' | 'TOP';
export type RegionContinent = '亚洲' | '欧洲' | '非洲' | '北美洲' | '南美洲' | '大洋洲' | '南极洲';

export interface GlobalRegion {
  code: string;        // ISO 3166-1 alpha-2
  name: string;        // 国家中文名
  nameEn: string;      // 国家英文名
  tier: RegionTier;    // 分级
  continent: RegionContinent;
}

// TOP 国家：移动广告变现价值最高
export const TOP_COUNTRIES: GlobalRegion[] = [
  { code: 'US', name: '美国', nameEn: 'United States', tier: 'TOP', continent: '北美洲' },
  { code: 'CN', name: '中国', nameEn: 'China', tier: 'TOP', continent: '亚洲' },
  { code: 'JP', name: '日本', nameEn: 'Japan', tier: 'TOP', continent: '亚洲' },
  { code: 'KR', name: '韩国', nameEn: 'South Korea', tier: 'TOP', continent: '亚洲' },
  { code: 'GB', name: '英国', nameEn: 'United Kingdom', tier: 'TOP', continent: '欧洲' },
  { code: 'DE', name: '德国', nameEn: 'Germany', tier: 'TOP', continent: '欧洲' }
];

// T1 国家：成熟市场，eCPM 较高
export const T1_COUNTRIES: GlobalRegion[] = [
  { code: 'CA', name: '加拿大', nameEn: 'Canada', tier: 'T1', continent: '北美洲' },
  { code: 'AU', name: '澳大利亚', nameEn: 'Australia', tier: 'T1', continent: '大洋洲' },
  { code: 'NZ', name: '新西兰', nameEn: 'New Zealand', tier: 'T1', continent: '大洋洲' },
  { code: 'FR', name: '法国', nameEn: 'France', tier: 'T1', continent: '欧洲' },
  { code: 'IT', name: '意大利', nameEn: 'Italy', tier: 'T1', continent: '欧洲' },
  { code: 'ES', name: '西班牙', nameEn: 'Spain', tier: 'T1', continent: '欧洲' },
  { code: 'NL', name: '荷兰', nameEn: 'Netherlands', tier: 'T1', continent: '欧洲' },
  { code: 'SE', name: '瑞典', nameEn: 'Sweden', tier: 'T1', continent: '欧洲' },
  { code: 'NO', name: '挪威', nameEn: 'Norway', tier: 'T1', continent: '欧洲' },
  { code: 'DK', name: '丹麦', nameEn: 'Denmark', tier: 'T1', continent: '欧洲' },
  { code: 'FI', name: '芬兰', nameEn: 'Finland', tier: 'T1', continent: '欧洲' },
  { code: 'CH', name: '瑞士', nameEn: 'Switzerland', tier: 'T1', continent: '欧洲' },
  { code: 'AT', name: '奥地利', nameEn: 'Austria', tier: 'T1', continent: '欧洲' },
  { code: 'BE', name: '比利时', nameEn: 'Belgium', tier: 'T1', continent: '欧洲' },
  { code: 'IE', name: '爱尔兰', nameEn: 'Ireland', tier: 'T1', continent: '欧洲' },
  { code: 'SG', name: '新加坡', nameEn: 'Singapore', tier: 'T1', continent: '亚洲' },
  { code: 'HK', name: '中国香港', nameEn: 'Hong Kong', tier: 'T1', continent: '亚洲' },
  { code: 'TW', name: '中国台湾', nameEn: 'Taiwan', tier: 'T1', continent: '亚洲' },
  { code: 'IL', name: '以色列', nameEn: 'Israel', tier: 'T1', continent: '亚洲' },
  { code: 'AE', name: '阿联酋', nameEn: 'United Arab Emirates', tier: 'T1', continent: '亚洲' }
];

// T2 国家：发展中市场，潜力较大
export const T2_COUNTRIES: GlobalRegion[] = [
  { code: 'BR', name: '巴西', nameEn: 'Brazil', tier: 'T2', continent: '南美洲' },
  { code: 'MX', name: '墨西哥', nameEn: 'Mexico', tier: 'T2', continent: '北美洲' },
  { code: 'AR', name: '阿根廷', nameEn: 'Argentina', tier: 'T2', continent: '南美洲' },
  { code: 'CL', name: '智利', nameEn: 'Chile', tier: 'T2', continent: '南美洲' },
  { code: 'CO', name: '哥伦比亚', nameEn: 'Colombia', tier: 'T2', continent: '南美洲' },
  { code: 'PE', name: '秘鲁', nameEn: 'Peru', tier: 'T2', continent: '南美洲' },
  { code: 'PL', name: '波兰', nameEn: 'Poland', tier: 'T2', continent: '欧洲' },
  { code: 'CZ', name: '捷克', nameEn: 'Czechia', tier: 'T2', continent: '欧洲' },
  { code: 'HU', name: '匈牙利', nameEn: 'Hungary', tier: 'T2', continent: '欧洲' },
  { code: 'RO', name: '罗马尼亚', nameEn: 'Romania', tier: 'T2', continent: '欧洲' },
  { code: 'GR', name: '希腊', nameEn: 'Greece', tier: 'T2', continent: '欧洲' },
  { code: 'PT', name: '葡萄牙', nameEn: 'Portugal', tier: 'T2', continent: '欧洲' },
  { code: 'RU', name: '俄罗斯', nameEn: 'Russia', tier: 'T2', continent: '欧洲' },
  { code: 'TR', name: '土耳其', nameEn: 'Turkey', tier: 'T2', continent: '亚洲' },
  { code: 'SA', name: '沙特阿拉伯', nameEn: 'Saudi Arabia', tier: 'T2', continent: '亚洲' },
  { code: 'MY', name: '马来西亚', nameEn: 'Malaysia', tier: 'T2', continent: '亚洲' },
  { code: 'TH', name: '泰国', nameEn: 'Thailand', tier: 'T2', continent: '亚洲' },
  { code: 'PH', name: '菲律宾', nameEn: 'Philippines', tier: 'T2', continent: '亚洲' },
  { code: 'ID', name: '印度尼西亚', nameEn: 'Indonesia', tier: 'T2', continent: '亚洲' },
  { code: 'VN', name: '越南', nameEn: 'Vietnam', tier: 'T2', continent: '亚洲' },
  { code: 'IN', name: '印度', nameEn: 'India', tier: 'T2', continent: '亚洲' },
  { code: 'PK', name: '巴基斯坦', nameEn: 'Pakistan', tier: 'T2', continent: '亚洲' },
  { code: 'BD', name: '孟加拉国', nameEn: 'Bangladesh', tier: 'T2', continent: '亚洲' },
  { code: 'EG', name: '埃及', nameEn: 'Egypt', tier: 'T2', continent: '非洲' },
  { code: 'ZA', name: '南非', nameEn: 'South Africa', tier: 'T2', continent: '非洲' }
];

// T3 国家：早期市场，价值有限
export const T3_COUNTRIES: GlobalRegion[] = [
  { code: 'UA', name: '乌克兰', nameEn: 'Ukraine', tier: 'T3', continent: '欧洲' },
  { code: 'BG', name: '保加利亚', nameEn: 'Bulgaria', tier: 'T3', continent: '欧洲' },
  { code: 'RS', name: '塞尔维亚', nameEn: 'Serbia', tier: 'T3', continent: '欧洲' },
  { code: 'HR', name: '克罗地亚', nameEn: 'Croatia', tier: 'T3', continent: '欧洲' },
  { code: 'SK', name: '斯洛伐克', nameEn: 'Slovakia', tier: 'T3', continent: '欧洲' },
  { code: 'SI', name: '斯洛文尼亚', nameEn: 'Slovenia', tier: 'T3', continent: '欧洲' },
  { code: 'LT', name: '立陶宛', nameEn: 'Lithuania', tier: 'T3', continent: '欧洲' },
  { code: 'LV', name: '拉脱维亚', nameEn: 'Latvia', tier: 'T3', continent: '欧洲' },
  { code: 'EE', name: '爱沙尼亚', nameEn: 'Estonia', tier: 'T3', continent: '欧洲' },
  { code: 'VE', name: '委内瑞拉', nameEn: 'Venezuela', tier: 'T3', continent: '南美洲' },
  { code: 'EC', name: '厄瓜多尔', nameEn: 'Ecuador', tier: 'T3', continent: '南美洲' },
  { code: 'UY', name: '乌拉圭', nameEn: 'Uruguay', tier: 'T3', continent: '南美洲' },
  { code: 'BO', name: '玻利维亚', nameEn: 'Bolivia', tier: 'T3', continent: '南美洲' },
  { code: 'PY', name: '巴拉圭', nameEn: 'Paraguay', tier: 'T3', continent: '南美洲' },
  { code: 'CR', name: '哥斯达黎加', nameEn: 'Costa Rica', tier: 'T3', continent: '北美洲' },
  { code: 'PA', name: '巴拿马', nameEn: 'Panama', tier: 'T3', continent: '北美洲' },
  { code: 'DO', name: '多米尼加', nameEn: 'Dominican Republic', tier: 'T3', continent: '北美洲' },
  { code: 'GT', name: '危地马拉', nameEn: 'Guatemala', tier: 'T3', continent: '北美洲' },
  { code: 'KH', name: '柬埔寨', nameEn: 'Cambodia', tier: 'T3', continent: '亚洲' },
  { code: 'MM', name: '缅甸', nameEn: 'Myanmar', tier: 'T3', continent: '亚洲' },
  { code: 'LA', name: '老挝', nameEn: 'Laos', tier: 'T3', continent: '亚洲' },
  { code: 'NP', name: '尼泊尔', nameEn: 'Nepal', tier: 'T3', continent: '亚洲' },
  { code: 'LK', name: '斯里兰卡', nameEn: 'Sri Lanka', tier: 'T3', continent: '亚洲' },
  { code: 'KZ', name: '哈萨克斯坦', nameEn: 'Kazakhstan', tier: 'T3', continent: '亚洲' },
  { code: 'UZ', name: '乌兹别克斯坦', nameEn: 'Uzbekistan', tier: 'T3', continent: '亚洲' },
  { code: 'MA', name: '摩洛哥', nameEn: 'Morocco', tier: 'T3', continent: '非洲' },
  { code: 'NG', name: '尼日利亚', nameEn: 'Nigeria', tier: 'T3', continent: '非洲' },
  { code: 'KE', name: '肯尼亚', nameEn: 'Kenya', tier: 'T3', continent: '非洲' },
  { code: 'GH', name: '加纳', nameEn: 'Ghana', tier: 'T3', continent: '非洲' },
  { code: 'TN', name: '突尼斯', nameEn: 'Tunisia', tier: 'T3', continent: '非洲' }
];

export const ALL_GLOBAL_REGIONS: GlobalRegion[] = [
  ...TOP_COUNTRIES,
  ...T1_COUNTRIES,
  ...T2_COUNTRIES,
  ...T3_COUNTRIES
];


// 洲清单（用于下拉选择）
// 顶级/分层国家组合
export const GLOBAL_TIERS: { code: RegionTier; name: string; countries: GlobalRegion[] }[] = [
  { code: 'TOP', name: 'TOP地区', countries: TOP_COUNTRIES },
  { code: 'T1',  name: 'T1地区', countries: T1_COUNTRIES },
  { code: 'T2',  name: 'T2地区', countries: T2_COUNTRIES },
  { code: 'T3',  name: 'T3地区', countries: T3_COUNTRIES },
];

export const GLOBAL_CONTINENTS: { code: string; name: string }[] = [
  { code: '亚洲', name: '亚洲' },
  { code: '欧洲', name: '欧洲' },
  { code: '非洲', name: '非洲' },
  { code: '北美洲', name: '北美洲' },
  { code: '南美洲', name: '南美洲' },
  { code: '大洋洲', name: '大洋洲' },
  { code: '南极洲', name: '南极洲' },
];

// 洲分组
export const CONTINENT_GROUPS: Record<RegionContinent, GlobalRegion[]> = {
  '亚洲': ALL_GLOBAL_REGIONS.filter(r => r.continent === '亚洲'),
  '欧洲': ALL_GLOBAL_REGIONS.filter(r => r.continent === '欧洲'),
  '非洲': ALL_GLOBAL_REGIONS.filter(r => r.continent === '非洲'),
  '北美洲': ALL_GLOBAL_REGIONS.filter(r => r.continent === '北美洲'),
  '南美洲': ALL_GLOBAL_REGIONS.filter(r => r.continent === '南美洲'),
  '大洋洲': ALL_GLOBAL_REGIONS.filter(r => r.continent === '大洋洲'),
  '南极洲': [] // 无常住国家
};
