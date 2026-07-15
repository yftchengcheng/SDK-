// 设备品牌 + 型号数据
// 品牌：当前市面主流手机/pad 品牌
// 型号：每个品牌的代表机型

export type DeviceType = 'phone' | 'pad';

export interface DeviceBrand {
  code: string;        // 品牌代码（内部使用）
  name: string;        // 品牌名
  type: DeviceType[];  // 支持的设备类型
  models: string[];    // 主要机型
}

// 按市场份额排序的主流手机品牌
export const DEVICE_BRANDS: DeviceBrand[] = [
  {
    code: 'apple', name: 'Apple', type: ['phone', 'pad'],
    models: [
      'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
      'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
      'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
      'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini',
      'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini',
      'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
      'iPhone SE (3rd gen)', 'iPhone SE (2nd gen)',
      'iPad Pro 13" (M4)', 'iPad Pro 11" (M4)', 'iPad Air 13" (M2)', 'iPad Air 11" (M2)',
      'iPad (10th gen)', 'iPad (9th gen)', 'iPad mini (A17 Pro)',
      'iPad Pro 12.9" (6th gen)', 'iPad Pro 11" (4th gen)'
    ]
  },
  {
    code: 'samsung', name: '三星 Samsung', type: ['phone', 'pad'],
    models: [
      'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24',
      'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23',
      'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
      'Galaxy Z Fold6', 'Galaxy Z Flip6', 'Galaxy Z Fold5', 'Galaxy Z Flip5',
      'Galaxy A55', 'Galaxy A35', 'Galaxy A25', 'Galaxy A15',
      'Galaxy Tab S10 Ultra', 'Galaxy Tab S10+', 'Galaxy Tab S9', 'Galaxy Tab A9'
    ]
  },
  {
    code: 'xiaomi', name: '小米 Xiaomi', type: ['phone', 'pad'],
    models: [
      'Xiaomi 14 Ultra', 'Xiaomi 14 Pro', 'Xiaomi 14',
      'Xiaomi 13 Ultra', 'Xiaomi 13 Pro', 'Xiaomi 13',
      'Redmi K80 Pro', 'Redmi K80', 'Redmi K70 Pro', 'Redmi K70',
      'Redmi Note 14 Pro+', 'Redmi Note 14 Pro', 'Redmi Note 14',
      'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13',
      'Xiaomi Pad 7 Pro', 'Xiaomi Pad 7', 'Xiaomi Pad 6', 'Redmi Pad Pro'
    ]
  },
  {
    code: 'huawei', name: '华为 Huawei', type: ['phone', 'pad'],
    models: [
      'Mate 60 Pro+', 'Mate 60 Pro', 'Mate 60', 'Mate X5',
      'Pura 70 Ultra', 'Pura 70 Pro+', 'Pura 70 Pro', 'Pura 70',
      'P60 Pro', 'P60', 'P50 Pro', 'P50',
      'nova 12 Ultra', 'nova 12 Pro', 'nova 12', 'nova 11',
      'MatePad Pro 13.2', 'MatePad 11.5"', 'MatePad SE'
    ]
  },
  {
    code: 'oppo', name: 'OPPO', type: ['phone'],
    models: [
      'Find X8 Pro', 'Find X8', 'Find X7 Ultra', 'Find X7',
      'Find N3', 'Find N3 Flip',
      'Reno13 Pro', 'Reno13', 'Reno12 Pro', 'Reno12',
      'A3 Pro', 'A2 Pro',
      'K12 Plus', 'K12', 'K11'
    ]
  },
  {
    code: 'vivo', name: 'vivo', type: ['phone'],
    models: [
      'X200 Pro', 'X200', 'X100 Ultra', 'X100 Pro', 'X100',
      'X Fold3 Pro', 'X Fold3',
      'S20 Pro', 'S20', 'S19 Pro', 'S19',
      'Y200 Pro', 'Y200', 'Y100',
      'iQOO 13', 'iQOO Neo10 Pro', 'iQOO Neo10', 'iQOO Z9'
    ]
  },
  {
    code: 'honor', name: '荣耀 Honor', type: ['phone', 'pad'],
    models: [
      'Magic7 Pro', 'Magic7', 'Magic6 Pro', 'Magic6',
      'Magic V3', 'Magic Vs3',
      'Honor 200 Pro', 'Honor 200', 'Honor 100 Pro', 'Honor 100',
      'X60 Pro', 'X50 Pro', 'X50',
      'MagicPad 2', 'Honor Pad V8', 'Honor Pad X9'
    ]
  },
  {
    code: 'oneplus', name: '一加 OnePlus', type: ['phone'],
    models: [
      'OnePlus 13', 'OnePlus 12', 'OnePlus 11',
      'OnePlus Open 2', 'OnePlus Open',
      'OnePlus Ace 5 Pro', 'OnePlus Ace 5', 'OnePlus Ace 3 Pro', 'OnePlus Ace 3',
      'OnePlus Nord 4', 'OnePlus Nord 3'
    ]
  },
  {
    code: 'realme', name: 'realme', type: ['phone'],
    models: [
      'realme GT7 Pro', 'realme GT5 Pro', 'realme GT5',
      'realme Neo7', 'realme Neo7 SE', 'realme GT Neo6',
      'realme 13 Pro+', 'realme 13 Pro', 'realme 13',
      'realme C75', 'realme C65'
    ]
  },
  {
    code: 'iqoo', name: 'iQOO', type: ['phone'],
    models: [
      'iQOO 13', 'iQOO 12 Pro', 'iQOO 12',
      'iQOO Neo10 Pro', 'iQOO Neo10', 'iQOO Neo9 Pro',
      'iQOO Z9 Turbo', 'iQOO Z9', 'iQOO Z8'
    ]
  },
  {
    code: 'redmi', name: '红米 Redmi', type: ['phone'],
    models: [
      'Redmi K80 Pro', 'Redmi K80', 'Redmi K70 Pro', 'Redmi K70',
      'Redmi Note 14 Pro+', 'Redmi Note 14 Pro', 'Redmi Note 14',
      'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13',
      'Redmi 14C', 'Redmi 13C', 'Redmi A3 Pro'
    ]
  },
  {
    code: 'google', name: 'Google', type: ['phone', 'pad'],
    models: [
      'Pixel 9 Pro XL', 'Pixel 9 Pro', 'Pixel 9', 'Pixel 9 Pro Fold',
      'Pixel 8 Pro', 'Pixel 8', 'Pixel 8a',
      'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a',
      'Pixel Tablet', 'Pixel Fold'
    ]
  },
  {
    code: 'motorola', name: '摩托罗拉 Motorola', type: ['phone'],
    models: [
      'Razr 50 Ultra', 'Razr 50', 'Razr 40 Ultra',
      'Edge 50 Ultra', 'Edge 50 Pro', 'Edge 50', 'Edge 50 Fusion',
      'Moto G85', 'Moto G75', 'Moto G55'
    ]
  },
  {
    code: 'nokia', name: '诺基亚 Nokia', type: ['phone'],
    models: [
      'Nokia XR21', 'Nokia X30', 'Nokia G42', 'Nokia G22',
      'Nokia C32', 'Nokia C22'
    ]
  },
  {
    code: 'sony', name: '索尼 Sony', type: ['phone'],
    models: [
      'Xperia 1 VI', 'Xperia 1 V', 'Xperia 5 V', 'Xperia 10 VI'
    ]
  },
  {
    code: 'asus', name: '华硕 ASUS', type: ['phone'],
    models: [
      'ROG Phone 9 Pro', 'ROG Phone 9', 'ROG Phone 8 Pro', 'ROG Phone 8',
      'Zenfone 11 Ultra', 'Zenfone 10'
    ]
  },
  {
    code: 'nothing', name: 'Nothing', type: ['phone'],
    models: [
      'Nothing Phone (2a) Plus', 'Nothing Phone (2a)', 'Nothing Phone (2)', 'Nothing Phone (1)'
    ]
  },
  {
    code: 'lenovo', name: '联想 Lenovo', type: ['pad'],
    models: [
      'Lenovo Legion Y700 (2024)', 'Lenovo Legion Y700 (2023)',
      'Lenovo Tab P12 Pro', 'Lenovo Tab P11 Pro (2nd gen)', 'Lenovo Tab M11'
    ]
  },
  {
    code: 'huawei_pad', name: '华为平板 Huawei Pad', type: ['pad'],
    models: [
      'MatePad Pro 13.2"', 'MatePad Pro 11" (2024)', 'MatePad 11.5" S',
      'MatePad 11.5"', 'MatePad SE 11"', 'MatePad 2024'
    ]
  },
  {
    code: 'xiaomi_pad', name: '小米平板 Xiaomi Pad', type: ['pad'],
    models: [
      'Xiaomi Pad 7 Pro', 'Xiaomi Pad 7', 'Xiaomi Pad 6 Max', 'Xiaomi Pad 6 Pro', 'Xiaomi Pad 6',
      'Redmi Pad Pro', 'Redmi Pad SE'
    ]
  }
];

// 按品牌类型筛选
export function getBrandsByType(type: DeviceType | DeviceType[]): DeviceBrand[] {
  const types = Array.isArray(type) ? type : [type];
  return DEVICE_BRANDS.filter(b => types.some(t => b.type.includes(t)));
}

// 按品牌代码获取型号
export function getModelsByBrand(brandCode: string): string[] {
  return DEVICE_BRANDS.find(b => b.code === brandCode)?.models || [];
}

// 按品牌+类型筛选型号
export function getModelsByBrandAndType(brandCode: string, type: DeviceType | DeviceType[]): string[] {
  const brand = DEVICE_BRANDS.find(b => b.code === brandCode);
  if (!brand) return [];
  const types = Array.isArray(type) ? type : [type];
  if (!types.some(t => brand.type.includes(t))) return [];
  return brand.models;
}

// 扁平化型号列表（用于按品牌筛选时，UI 渲染）
export interface DeviceModelEntry {
  brand: string;     // brand code (e.g. "Apple")
  name: string;      // model name (e.g. "iPhone 15 Pro Max")
  type: DeviceType;  // phone | pad
}

function inferDeviceType(modelName: string): DeviceType {
  if (/iPad|Pad|Tab|MatePad|Mi Pad|Redmi Pad|Honor Pad|Galaxy Tab/i.test(modelName)) return 'pad';
  return 'phone';
}

export const DEVICE_MODELS: DeviceModelEntry[] = (() => {
  const out: DeviceModelEntry[] = [];
  DEVICE_BRANDS.forEach((b) => {
    b.models.forEach((m) => {
      const t = inferDeviceType(m);
      // 品牌的 type 必须包含该 model 的实际 type
      if (b.type.includes(t)) out.push({ brand: b.code, name: m, type: t });
    });
  });
  return out;
})();
