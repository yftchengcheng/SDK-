// 流量分组规则维度定义
// 18 个维度统一 schema，由 RuleEditor 组件按 dimension 动态渲染 UI

export type RuleDimension =
  | 'region'           // 1. 地区
  | 'date'             // 2. 日期
  | 'weekday'          // 3. 星期
  | 'hour'             // 4. 小时
  | 'install_time'     // 5. 安装时间
  | 'network_type'     // 6. 网络类型
  | 'app_version_name' // 7. 应用版本名
  | 'app_version_code' // 8. 应用版本号
  | 'sdk_version'      // 9. SDK 版本
  | 'os_version'       // 10. 系统版本
  | 'device_id'        // 11. 设备 ID
  | 'device_type'      // 12. 设备类型
  | 'device_brand'     // 13. 设备品牌
  | 'device_model'     // 14. 设备型号
  | 'channel'          // 15. 渠道
  | 'idfa_status'      // 16. IDFA 状态
  | 'user_value'       // 17. 用户价值
  | 'custom';          // 18. 自定义规则

export type ValueUI =
  | 'text-list'           // 文本列表（一行一项）
  | 'number'              // 单个数字
  | 'number-unit'         // 数字 + 单位（小时/天/周/自然天）
  | 'multi-select'        // 多选下拉
  | 'single-select'       // 单选下拉
  | 'region-china'        // 中国地区（省/市）
  | 'region-global'       // 全球地区（洲/Tier/国家）
  | 'date-range'          // 日期范围
  | 'weekday-pick'        // 星期多选
  | 'hour-range'          // 小时范围
  | 'ecpm-range'          // eCPM 范围 [min, max]
  | 'custom-attr';        // 自定义属性（属性名+类型+值）

export interface DimensionMeta {
  value: RuleDimension;
  label: string;
  operators: { value: string; label: string }[];
  defaultOperator: string;
  ui: ValueUI;
  /** 是否需要时区字段（日期/星期/小时） */
  withTimezone?: boolean;
  /** 是否需要 scope 子字段（地区维度） */
  withScope?: boolean;
  /** 值的 placeholder */
  placeholder?: string;
}

export const DIMENSIONS: DimensionMeta[] = [
  {
    value: 'region',
    label: '地区',
    operators: [
      { value: 'include', label: '包括' },
      { value: 'exclude', label: '不包括' }
    ],
    defaultOperator: 'include',
    ui: 'region-china',
    withScope: true
  },
  {
    value: 'date',
    label: '日期',
    operators: [{ value: 'eq', label: '=' }],
    defaultOperator: 'eq',
    ui: 'date-range',
    withTimezone: true
  },
  {
    value: 'weekday',
    label: '星期',
    operators: [{ value: 'eq', label: '=' }],
    defaultOperator: 'eq',
    ui: 'weekday-pick',
    withTimezone: true
  },
  {
    value: 'hour',
    label: '小时',
    operators: [{ value: 'eq', label: '=' }],
    defaultOperator: 'eq',
    ui: 'hour-range',
    withTimezone: true
  },
  {
    value: 'install_time',
    label: '安装时间',
    operators: [
      { value: 'gt', label: '大于' },
      { value: 'lt', label: '小于' }
    ],
    defaultOperator: 'gt',
    ui: 'number-unit',
    placeholder: '请输入数值'
  },
  {
    value: 'network_type',
    label: '网络类型',
    operators: [{ value: 'eq', label: '=' }],
    defaultOperator: 'eq',
    ui: 'multi-select'
  },
  {
    value: 'app_version_name',
    label: '应用版本名',
    operators: [
      { value: 'include', label: '定向' },
      { value: 'exclude', label: '排除' }
    ],
    defaultOperator: 'include',
    ui: 'text-list',
    placeholder: '请输入应用版本名，一行一个'
  },
  {
    value: 'app_version_code',
    label: '应用版本号',
    operators: [
      { value: 'include', label: '定向' },
      { value: 'exclude', label: '排除' }
    ],
    defaultOperator: 'include',
    ui: 'text-list',
    placeholder: '请输入应用版本号，一行一个'
  },
  {
    value: 'sdk_version',
    label: 'SDK 版本',
    operators: [
      { value: 'include', label: '定向' },
      { value: 'exclude', label: '排除' }
    ],
    defaultOperator: 'include',
    ui: 'text-list',
    placeholder: '请输入 SDK 版本，一行一个'
  },
  {
    value: 'os_version',
    label: '系统版本',
    operators: [
      { value: 'include', label: '定向' },
      { value: 'exclude', label: '排除' }
    ],
    defaultOperator: 'include',
    ui: 'text-list',
    placeholder: '请输入系统版本，一行一个'
  },
  {
    value: 'device_id',
    label: '设备 ID',
    operators: [{ value: 'eq', label: '=' }],
    defaultOperator: 'eq',
    ui: 'text-list',
    placeholder: '请输入设备 ID，一行一个'
  },
  {
    value: 'device_type',
    label: '设备类型',
    operators: [{ value: 'eq', label: '=' }],
    defaultOperator: 'eq',
    ui: 'multi-select'
  },
  {
    value: 'device_brand',
    label: '设备品牌',
    operators: [{ value: 'eq', label: '=' }],
    defaultOperator: 'eq',
    ui: 'multi-select'
  },
  {
    value: 'device_model',
    label: '设备型号',
    operators: [
      { value: 'include', label: '定向' },
      { value: 'exclude', label: '排除' }
    ],
    defaultOperator: 'include',
    ui: 'multi-select'
  },
  {
    value: 'channel',
    label: '渠道',
    operators: [
      { value: 'include', label: '定向' },
      { value: 'exclude', label: '排除' }
    ],
    defaultOperator: 'include',
    ui: 'text-list',
    placeholder: '请输入渠道 KEY，一行一个'
  },
  {
    value: 'idfa_status',
    label: 'IDFA 状态',
    operators: [{ value: 'eq', label: '=' }],
    defaultOperator: 'eq',
    ui: 'single-select'
  },
  {
    value: 'user_value',
    label: '用户价值',
    operators: [{ value: 'eq', label: '=' }],
    defaultOperator: 'eq',
    ui: 'ecpm-range'
  },
  {
    value: 'custom',
    label: '自定义规则',
    operators: [
      { value: 'include', label: '包括' },
      { value: 'exclude', label: '不包括' }
    ],
    defaultOperator: 'include',
    ui: 'custom-attr'
  }
];

// 维度 meta 查找
export function getDimensionMeta(dim: RuleDimension): DimensionMeta | undefined {
  return DIMENSIONS.find(d => d.value === dim);
}

// Rule 完整结构
export interface Rule {
  id: string;
  dimension: RuleDimension;
  operator: string;
  // 通用 value 字段
  value: string | string[] | number | number[] | number[][] | Record<string, unknown> | null;
  // 地区专用
  regionScope?: 'china' | 'global';
  regionTier?: 'TOP' | 'T1' | 'T2' | 'T3' | 'CONTINENT';
  regionContinent?: string;
  // 日期/星期/小时 专用
  timezone?: string;
  // 安装时间 专用
  installUnit?: 'hour' | 'day' | 'week' | 'natural_day';
  // 自定义规则 专用
  customAttrName?: string;
  customAttrType?: 'string' | 'integer' | 'float';
}

// 网络类型可选值
export const NETWORK_TYPES = [
  { value: '2g', label: '2G' },
  { value: '3g', label: '3G' },
  { value: '4g', label: '4G' },
  { value: '5g', label: '5G' },
  { value: 'wifi', label: '仅 WiFi 网络' }
];

// 设备类型可选值
export const DEVICE_TYPES = [
  { value: 'phone', label: 'Phone' },
  { value: 'pad', label: 'Pad' }
];

// IDFA 状态可选值
export const IDFA_STATUS = [
  { value: 'has', label: '有' },
  { value: 'none', label: '无' }
];

// 星期可选值
export const WEEKDAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' }
];

// 安装时间单位
export const INSTALL_UNITS = [
  { value: 'hour', label: '小时' },
  { value: 'day', label: '天' },
  { value: 'week', label: '周' },
  { value: 'natural_day', label: '自然天' }
];

// 时区列表（常用）
export const TIMEZONES = [
  { value: 'UTC+8', label: '默认-UTC+8 中国标准时间' },
  { value: 'UTC+0', label: 'UTC+0 协调世界时' },
  { value: 'UTC+9', label: 'UTC+9 日本标准时间' },
  { value: 'UTC+5:30', label: 'UTC+5:30 印度标准时间' },
  { value: 'UTC-5', label: 'UTC-5 美国东部时间' },
  { value: 'UTC-8', label: 'UTC-8 美国太平洋时间' },
  { value: 'UTC+1', label: 'UTC+1 中欧时间' },
  { value: 'UTC+10', label: 'UTC+10 澳大利亚东部时间' }
];

// 自定义规则字符类型
export const CUSTOM_ATTR_TYPES = [
  { value: 'string', label: '字符串' },
  { value: 'integer', label: '整点型' },
  { value: 'float', label: '浮点型' }
];

// 维度标签 Map（表格里展示用）
export const DIMENSION_LABEL: Record<string, string> = DIMENSIONS.reduce(
  (acc: Record<string, string>, d: DimensionMeta) => { acc[d.value] = d.label; return acc; },
  {} as Record<string, string>
);
