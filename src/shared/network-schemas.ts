// 网络账号字段 schema
// 数据契约：弹窗字段全部以 credentials JSONB 存储到 ad_network_account 表
// 设计原则：网络特定字段在弹窗动态渲染，提交时所有字段打平进 credentials

export type FieldType =
  | 'text'         // 文本输入
  | 'password'     // 密码输入
  | 'switch'       // 开关
  | 'currency'     // 固定币种
  | 'select'       // 下拉
  | 'key-value'    // K-V 多对
  | 'pub-key'      // 新义公钥（生成+复制）专用

export interface BaseField {
  /** 字段类型 */
  type: FieldType
  /** 字段 key（落 credentials JSONB 的 key） */
  key: string
  /** 字段 label */
  label: string
  /** 是否必填（前端校验） */
  required?: boolean
  /** placeholder */
  placeholder?: string
  /** 默认值（boolean / string / KV 对数组） */
  default?: unknown
  /** 输入框 maxlength（仅 text/password） */
  maxlength?: number
  /** tooltip 提示文案（label 后显示 ? 问号） */
  tooltip?: string
  /** 显隐条件（value 与对应 key 当前值相等才显示） */
  showWhen?: { key: string, value: unknown }
  /** 字段宽度（占 1/2/3/4 列）默认 1 列 */
  span?: 1 | 2 | 3 | 4
}

export interface SwitchField extends BaseField { type: 'switch' }
export interface TextField extends BaseField { type: 'text' | 'password' }
export interface CurrencyField extends BaseField { type: 'currency', fixed: string }
export interface SelectField extends BaseField { type: 'select', options: { label: string, value: unknown }[] }
export interface KVFiel extends BaseField { type: 'key-value', addText?: string }
export interface PubKeyField extends BaseField { type: 'pub-key' }

export type FieldDef = SwitchField | TextField | CurrencyField | SelectField | KVFiel | PubKeyField

/** 通用字段：报表API（所有预置网络共有）。账号名称由弹窗顶层 account_name 提供，不在此重复 */
function commonPresetFields(): FieldDef[] {
  return [
    {
      type: 'switch',
      key: 'reportApi',
      label: '报表API',
    },
  ]
}

// ============================================================
// 穿山甲 CSJ
// ============================================================
const CSJ_SCHEMA: FieldDef[] = [
  ...commonPresetFields(),
  {
    type: 'switch',
    key: 'autoCreateSource',
    label: '自动创建广告源',
    default: true,
    tooltip: '请确保您的穿山甲账号拥有应用代码位管理 API 权限。若无此权限，可向穿山甲对接人进行申请。开启自动创建广告源功能，当您在新义后台创建广告源时，新义会自动在穿山甲后台同步创建广告单元。',
  },
  { type: 'text', key: 'userId', label: '用户ID', required: true, placeholder: '请输入' },
  { type: 'text', key: 'roleId', label: 'RoleID', required: true, placeholder: '请输入' },
  { type: 'password', key: 'secureKey', label: 'Secure Key', required: true, placeholder: '请输入' },
]

// ============================================================
// 优量汇 YLH（腾讯广告）
// ============================================================
const YLH_SCHEMA: FieldDef[] = [
  ...commonPresetFields(),
  { type: 'currency', key: 'currency', label: '币种', fixed: '人民币' },
  { type: 'text', key: 'accountId', label: '账户ID', required: true, placeholder: '请输入' },
  { type: 'password', key: 'secretKey', label: 'Secret Key', required: true, placeholder: '请输入' },
]

// ============================================================
// 快手 KS
// ============================================================
const KS_SCHEMA: FieldDef[] = [
  ...commonPresetFields(),
  { type: 'currency', key: 'currency', label: '币种', fixed: '人民币' },
  {
    type: 'switch',
    key: 'autoCreateSource',
    label: '自动创建广告源',
    default: true,
    tooltip: '请确保您的快手账号拥有应用代码位管理 API 权限。若无此权限，可向快手对接人进行申请。开启自动创建广告源功能，当您在新义后台创建广告源时，新义会自动在快手后台同步创建广告单元。',
  },
  { type: 'text', key: 'accountId', label: '账户ID', required: true, placeholder: '请输入' },
  { type: 'text', key: 'accessKey', label: 'AccessKey', required: true, placeholder: '请输入' },
  { type: 'password', key: 'securityKey', label: 'SecurityKey', required: true, placeholder: '请输入' },
  {
    type: 'select',
    key: 'bidCallback',
    label: '竞价信息回传',
    default: 'none',
    options: [
      { label: '全部应用', value: 'all' },
      { label: '当前应用', value: 'current' },
      { label: '不回传', value: 'none' },
    ],
  },
]

// ============================================================
// 百度 BD
// ============================================================
const BD_SCHEMA: FieldDef[] = [
  ...commonPresetFields(),
  { type: 'currency', key: 'currency', label: '币种', fixed: '人民币' },
  {
    type: 'switch',
    key: 'autoCreateSource',
    label: '自动创建广告源',
    default: true,
    tooltip: '请确保您的百度账号拥有应用代码位管理 API 权限。若无此权限，可向百度对接人进行申请。开启自动创建广告源功能，当您在新义后台创建广告源时，新义会自动在百度后台同步创建广告单元。',
  },
  {
    type: 'switch',
    key: 'useAdKey',
    label: '是否使用新义公钥',
    default: false,
    tooltip: '使用新义公钥时，需要将新义公钥配置到百度后台。若同时需要使用新义和其他平台拉取报表数据，开发者可自己生成一套公钥私钥配置，并将私钥配置到新义后台。',
  },
  // 条件渲染：是 → 公钥（生成+复制）；否 → 私钥
  {
    type: 'pub-key',
    key: 'pubKey',
    label: '新义公钥',
    showWhen: { key: 'useAdKey', value: true },
  },
  {
    type: 'text',
    key: 'privateKey',
    label: '私钥',
    required: true,
    placeholder: '请输入',
    showWhen: { key: 'useAdKey', value: false },
  },
  { type: 'text', key: 'accessKey', label: 'AccessKey', required: true, placeholder: '请输入' },
  {
    type: 'select',
    key: 'bidCallback',
    label: '竞价信息回传',
    default: 'none',
    options: [
      { label: '全部应用', value: 'all' },
      { label: '当前应用', value: 'current' },
      { label: '不回传', value: 'none' },
    ],
  },
]

// ============================================================
// 自定义网络 CUSTOM
// ============================================================
// 「应用绑定广告平台」步骤中，自定义网络需要：
// 1. 账号名称：从该自定义网络下已创建的账号中选一个
//    - 表单层只声明字段，options 由 BindNetworkDrawer 在选择网络时动态注入
// 2. 应用维度参数：多对 key=value（例如 app ID=123456），将在请求自定义广告平台时附带
// 注：上一版本把此 schema 留空是错误的（之前「应用绑定」直接退化为兜底 schema），
//     这里恢复为完整定义
const CUSTOM_SCHEMA: FieldDef[] = [
  {
    type: 'select',
    key: 'accountId',
    label: '账号名称',
    required: true,
    placeholder: '请选择账号（该自定义网络下已创建的账号）',
    options: [], // 由 BindNetworkDrawer 在选择网络后注入
  },
  {
    type: 'key-value',
    key: 'params',
    label: '应用维度参数',
    addText: '增加参数',
    tooltip: '可填写多个 key=value 形式的参数，例如 app ID=123456。参数将在请求自定义广告平台时附带。',
  },
]

// 账号管理弹窗：自定义平台不需要凭证字段（adapter_class 已在网络层配置；账号维度无参数）
//   → 留空：弹窗不会出现「账号名称(select)」和「应用维度参数」
//   → 「应用维度参数」是应用绑定概念，不该出现在账号管理里
const CUSTOM_ACCOUNT_SCHEMA: FieldDef[] = []

// ============================================================
// 兜底 schema
// ============================================================
const DEFAULT_PRESET_SCHEMA: FieldDef[] = [
  ...commonPresetFields(),
  { type: 'text', key: 'accountId', label: '账户ID', required: true, placeholder: '请输入' },
  { type: 'password', key: 'secretKey', label: 'Secret Key', required: true, placeholder: '请输入' },
]

/** 网络 schema 索引（按 network_code） */
const SCHEMAS_BY_CODE: Record<string, FieldDef[]> = {
  CSJ: CSJ_SCHEMA,
  YLH: YLH_SCHEMA,
  KS: KS_SCHEMA,
  BD: BD_SCHEMA,
}

/** 根据 network（id/code/is_preset）和 context 决定字段集
 *  - 'account' : 账号管理弹窗。账号的"凭证字段"由平台自身 schema 决定；自定义平台账号管理不需要
 *                accountId/params（这些是「应用绑定」概念），也用不到密钥（adapter_class 已在网络层配置）。
 *                因此账号管理下的自定义平台 schema 为空。
 *  - 'binding' : 应用绑定广告平台。自定义平台需要 accountId(select) + params(key-value) 用于「关联」+「应用维度参数」。
 */
export function getSchemaByNetwork(
  network: { network_code?: string; is_preset?: boolean; network_type?: number },
  context: 'account' | 'binding' = 'account',
): FieldDef[] {
  if (network.network_code && SCHEMAS_BY_CODE[network.network_code]) {
    return SCHEMAS_BY_CODE[network.network_code]
  }
  // 兼容新旧字段：is_preset=false 或 network_type=2 表示自定义平台
  if (network.is_preset === false || network.network_type === 2) {
    if (context === 'binding') {
      return CUSTOM_SCHEMA
    }
    // 账号管理：自定义平台无需凭证字段（adapter_class 已在网络层配置）
    return CUSTOM_ACCOUNT_SCHEMA
  }
  return DEFAULT_PRESET_SCHEMA
}

/** 把 schema 应用默认值，生成 form data 初始值 */
export function makeInitialData(schema: FieldDef[]): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const f of schema) {
    if (f.type === 'key-value') {
      data[f.key] = []
    } else if (f.type === 'switch') {
      data[f.key] = f.default ?? false
    } else if (f.type === 'currency') {
      data[f.key] = f.fixed
    } else {
      data[f.key] = f.default ?? ''
    }
  }
  return data
}

/** 校验必填（返回首个错误 field key，没错误返回 null） */
export function validateRequired(schema: FieldDef[], data: Record<string, unknown>): string | null {
  for (const f of schema) {
    if (!f.required) continue
    if (f.showWhen) {
      const condVal = data[f.showWhen.key]
      if (condVal !== f.showWhen.value) continue
    }
    const v = data[f.key]
    if (f.type === 'key-value') {
      if (!Array.isArray(v) || v.length === 0) return f.key
    } else if (v === undefined || v === null || v === '') {
      return f.key
    }
  }
  return null
}
