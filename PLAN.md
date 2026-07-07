# PLAN.md — SDK聚合系统 开发计划

> **本文档为开发基准文件，每次开发前需对比校验，完成后根据实际情况迭代更新。**
>
> **校验规则**：
> 1. 每进入一个阶段前，读取本文件确认待办清单
> 2. 每完成一个步骤，更新对应行的 `[状态]` 为 `✅` 并填写实际产出
> 3. 如发现计划与实际不符，追加「偏差记录」说明原因和调整方案
> 4. 新增需求或发现遗漏时，补充到对应阶段并标注 `🆕`

---

### 1.1 前端

| 类别 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **Framework** | Vue 3 (Composition API) | 3.x | `<script setup lang="ts">` |
| **构建工具** | Vite | 7 | dev server 端口固定 5000 |
| **Language** | TypeScript | 5.6 | strict + noImplicitAny |
| **UI 组件** | Element Plus + @element-plus/icons-vue | 2.14 | CSS 从 `index.css` 顶部 `@import` |
| **样式** | Tailwind CSS | 3.4 | Design Tokens 见 `DESIGN.md` |
| **State** | Pinia | 3 | 持久化 token + userInfo |
| **Router** | vue-router | 4 | 13 个路由 + 全局守卫 |
| **Charts** | ECharts + vue-echarts | 6 | `'use client'` 避免 SSR |
| **HTTP** | axios | — | 自动注入 JWT，401 跳转 |
| **日期** | dayjs | — | — |
| **字体** | Inter | — | DESIGN.md 指定 |
| **图标** | @element-plus/icons-vue | — | SVG 矢量，**禁止 Emoji** |

### 1.2 后端

| 类别 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **Runtime** | Node.js | 20+ | Express 4 |
| **Language** | TypeScript | 5.6 | strict 模式 |
| **运行（开发）** | tsx (watch) | — | `tsx watch server/server.ts` |
| **运行（生产）** | tsup (CJS) | — | `tsup server/server.ts --format cjs` |
| **Web 框架** | Express | 4 | HTTP + Vite dev middleware |
| **Auth** | jsonwebtoken | — | HS256 / 7 天过期 / Bearer Token |
| **密码哈希** | bcryptjs | — | — |
| **Cache** | node-cache | — | 验证码 token |
| **ID** | uuid | v4 | — |
| **Database** | Supabase (PostgreSQL) | — | `@supabase/supabase-js`（service_role 直连） |
| **对象存储** | S3 兼容 | — | Adapter 文件上传至 CDN（待集成） |

### 1.3 工具链

| 类别 | 技术选型 | 说明 |
|------|---------|------|
| **包管理** | pnpm | **唯一允许**，严禁 npm / yarn |
| **Lint** | ESLint 9 + typescript-eslint 8 | `pnpm lint` |
| **类型检查** | vue-tsc | `pnpm ts-check` |
| **测试** | puppeteer | 截图回归（已用） |
| **SDK** | coze-coding-dev-sdk | 集成能力（可选） |

### 1.4 目录结构

```
.
├── public/                 # 静态资源
├── assets/                 # 设计资源
├── src/                    # 前端源码
│   ├── App.vue / main.ts
│   ├── index.css           # 唯一全局样式（@import EP CSS + Tailwind）
│   ├── router/             # vue-router 配置（13 个路由）
│   ├── stores/             # Pinia
│   ├── utils/              # axios 封装
│   ├── layout/             # MainLayout.vue
│   └── views/              # 13 个业务页面
├── server/                 # Express 后端
│   ├── server.ts / db.ts / vite.ts
│   ├── middleware/auth.ts  # JWT 鉴权
│   ├── routes/             # 13 个 REST 路由
│   └── utils/              # supabase-client / response / id-generator
├── scripts/                # 生命周期脚本
├── .coze                   # 沙箱配置
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── eslint.config.mjs
├── package.json
├── PLAN.md
├── DESIGN.md
└── AGENTS.md
```

---

## 二、数据库设计（14张表）

### 2.1 核心业务表（9张）

| # | 表名 | 说明 | 关键索引 | 状态 |
|---|------|------|---------|------|
| 1 | `developer` | 开发者表 | developer_id(UNIQUE), email(UNIQUE) | ⬜ |
| 2 | `app` | 应用表 | developer_id, app_key(UNIQUE) | ⬜ |
| 3 | `placement` | 广告位表 | app_key, placement_id(UNIQUE) | ⬜ |
| 4 | `ad_source` | 广告网络源表 | network_code | ⬜ |
| 5 | `waterfall_config` | 瀑布流配置主表 | placement_id, (placement_id+version+traffic_group_id)复合唯一 | ⬜ |
| 6 | `waterfall_layer` | 瀑布流层级明细表 | config_id | ⬜ |
| 7 | `traffic_group` | 流量分组表 | placement_id | ⬜ |
| 8 | `report_daily` | 日报表聚合表 | (developer_id+app_key+placement_id+ad_source_id+stat_date)复合唯一 | ⬜ |
| 9 | `message` | 消息表 | developer_id, is_read | ⬜ |

### 2.2 被聚合SDK对接扩展表（5张）

| # | 表名 | 说明 | 关键索引 | 状态 |
|---|------|------|---------|------|
| 10 | `ad_network_def` | 广告网络定义表（通用+自定义） | network_code(UNIQUE), created_by, network_type | ⬜ |
| 11 | `ad_network_account` | 广告网络账号表 | network_def_id, developer_id | ⬜ |
| 12 | `app_network_binding` | 应用关联广告网络表 | (app_key+account_id)复合唯一 | ⬜ |
| 13 | `custom_adapter_version` | 自定义Adapter版本表 | network_def_id, status | ⬜ |
| 14 | `custom_network_report` | 自定义网络数据上传表 | (developer_id+app_key+placement_id+network_def_id+stat_date)复合唯一 | ⬜ |

### 2.3 新增表字段详情

#### ad_network_def（广告网络定义表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | serial PK | 内部主键 |
| network_code | varchar(32) UNIQUE | CSJ/YLH/KS/BD/SIGMOB/CUSTOM_xxx |
| network_name | varchar(50) | 网络显示名称 |
| network_type | smallint | 1=通用(平台预置) 2=自定义 |
| adapter_class_init | varchar(255) | 初始化Adapter类全路径 |
| adapter_class_banner | varchar(255) | Banner Adapter类全路径 |
| adapter_class_interstitial | varchar(255) | 插屏Adapter类全路径 |
| adapter_class_rewarded | varchar(255) | 激励视频Adapter类全路径 |
| adapter_class_native | varchar(255) | 原生Adapter类全路径 |
| adapter_class_splash | varchar(255) | 开屏Adapter类全路径 |
| supports_bidding | smallint DEFAULT 0 | 是否支持Client Bidding |
| status | smallint DEFAULT 1 | 1=草稿 2=启用 3=禁用 |
| created_by | varchar(32) | 创建者developer_id |
| created_at / updated_at | timestamp | 时间戳 |

#### ad_network_account（广告网络账号表）🆕

| 字段 | 类型 | 说明 |
|------|------|------|
| id | serial PK | 内部主键 |
| network_def_id | integer FK→ad_network_def.id | 所属广告网络 |
| developer_id | varchar(32) | 所属开发者 |
| account_name | varchar(50) | 账号名称 |
| account_id | varchar(100) | 在自定义网络中的账号唯一标识 |
| remark | text | 备注 |
| status | smallint DEFAULT 1 | 1=启用 2=禁用 |
| created_at / updated_at | timestamp | 时间戳 |

#### app_network_binding（应用关联广告网络表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | serial PK | 内部主键 |
| app_key | varchar(32) | 关联应用 |
| account_id | integer FK→ad_network_account.id | 关联的网络账号 |
| network_app_id | varchar(100) | 在该广告网络的App ID |
| extra_params | jsonb | **应用级参数**（Key-Value，如app_id/app_key/channel） |
| status | smallint DEFAULT 1 | 1=启用 2=禁用 |
| created_at / updated_at | timestamp | 时间戳 |

#### custom_adapter_version（Adapter版本表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | serial PK | 内部主键 |
| network_def_id | integer FK→ad_network_def.id | 关联网络 |
| developer_id | varchar(32) | 上传者 |
| version | varchar(20) | Adapter版本号 |
| file_name | varchar(200) | 文件名 |
| file_url | varchar(500) | CDN存储地址 |
| file_size | bigint | 文件大小（字节） |
| file_md5 | varchar(32) | 文件MD5校验 |
| sdk_min_version | varchar(20) | 最低支持的聚合SDK版本 |
| changelog | text | 版本更新说明 |
| status | smallint DEFAULT 1 | 1=待审核 2=审核通过 3=审核拒绝 4=已上线 5=已下架 |
| review_comment | varchar(500) | 审核意见 |
| reviewed_at / reviewed_by | timestamp/varchar | 审核时间和审核人 |
| online_at / offline_at | timestamp | 上线/下架时间 |

#### custom_network_report（自定义网络数据上传表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | serial PK | 内部主键 |
| developer_id | varchar(32) | 开发者 |
| app_key | varchar(32) | 应用 |
| placement_id | varchar(32) | 广告位 |
| network_def_id | integer | 广告网络 |
| stat_date | date | 统计日期 |
| impressions / clicks | integer | 展示/点击 |
| revenue | numeric(10,4) | 收益 |
| upload_type | smallint DEFAULT 1 | 1=API手动上传 2=API自动拉取 |

### 2.4 RLS策略

所有表以 `developer_id` 为顶层隔离，开发者只能操作/查看自己的数据。

---

## 三、后端API接口清单（8大模块 35个接口）

### 3.1 认证模块 `/api/v1/auth/`

| 接口 | 方法 | 说明 | Token | 状态 |
|------|------|------|-------|------|
| `/api/v1/auth/register` | POST | 开发者注册（生成developer_id） | 无 | ⬜ |
| `/api/v1/auth/login` | POST | 登录（返回JWT） | 无 | ⬜ |
| `/api/v1/auth/logout` | POST | 登出 | JWT | ⬜ |
| `/api/v1/auth/verify` | GET | 验证JWT有效性 | JWT | ⬜ |

### 3.2 应用管理 `/api/v1/console/app/`

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/v1/console/app/list` | GET | 应用列表 | ⬜ |
| `/api/v1/console/app/create` | POST | 创建应用（生成app_key） | ⬜ |
| `/api/v1/console/app/[id]` | GET/PATCH/DELETE | 应用详情/编辑/删除 | ⬜ |

### 3.3 广告位管理 `/api/v1/console/placement/`

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/v1/console/placement/list` | GET | 广告位列表 | ⬜ |
| `/api/v1/console/placement/create` | POST | 创建广告位（生成placement_id） | ⬜ |
| `/api/v1/console/placement/[id]` | GET/PATCH/DELETE | 广告位详情/编辑/删除 | ⬜ |

### 3.4 瀑布流配置 `/api/v1/console/waterfall/`

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/v1/console/waterfall/get` | GET | 获取瀑布流配置 | ⬜ |
| `/api/v1/console/waterfall/update` | POST | 更新瀑布流配置（版本递增） | ⬜ |
| `/api/v1/console/adsource/list` | GET | 广告源列表 | ⬜ |
| `/api/v1/console/adsource/create` | POST | 创建广告源 | ⬜ |

### 3.5 数据报表 `/api/v1/console/report/`

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/v1/console/report/dashboard` | GET | 看板数据（6指标+趋势） | ⬜ |
| `/api/v1/console/report/daily` | GET | 日报表查询 | ⬜ |
| `/api/v1/console/reconciliation` | GET | 对账数据 | ⬜ |

### 3.6 消息中心 `/api/v1/console/message/`

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/v1/console/message/list` | GET | 消息列表 | ⬜ |
| `/api/v1/console/message/[id]/read` | PATCH | 标记已读 | ⬜ |

### 3.7 SDK对外接口

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/v1/sdk/config` | GET | SDK配置下发（含customAdapters+合并参数） | ⬜ |
| `/api/v1/report` | POST | 数据批量上报（强制Token校验） | ⬜ |

### 3.8 自定义广告网络管理 `/api/v1/console/network/`

#### 3.8.1 步骤一：创建自定义广告网络

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/v1/console/network/custom/create` | POST | 创建自定义广告网络（含适配器类路径） | ⬜ |
| `/api/v1/console/network/custom/update` | POST | 更新自定义网络信息 | ⬜ |
| `/api/v1/console/network/custom/detail` | GET | 获取自定义网络详情 | ⬜ |
| `/api/v1/console/network/custom/list` | GET | 获取开发者创建的自定义网络列表 | ⬜ |

#### 3.8.2 步骤二：添加广告网络账号 🆕

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/v1/console/network/account/create` | POST | 在网络下添加账号 | ⬜ |
| `/api/v1/console/network/account/list` | GET | 获取网络下账号列表 | ⬜ |
| `/api/v1/console/network/account/[id]` | PATCH/DELETE | 编辑/删除账号 | ⬜ |

#### 3.8.3 步骤三：关联应用与广告网络账号

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/v1/console/app/network/bind` | POST | 关联应用与网络账号（含应用级参数） | ⬜ |
| `/api/v1/console/app/network/unbind` | POST | 解除关联 | ⬜ |
| `/api/v1/console/app/network/list` | GET | 获取应用已关联的网络列表 | ⬜ |

#### 3.8.4 步骤四：添加广告源/代码位

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/v1/console/adsource/create-custom` | POST | 创建自定义网络代码位（含代码位级参数slot_id等） | ⬜ |

> 说明：代码位级参数存储在 `waterfall_layer` 的 `extra` 字段中，与广告源创建合并处理。

#### 3.8.5 步骤五：适配器版本管理

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/v1/console/network/custom/adapter/upload` | POST | 上传自定义Adapter文件（→对象存储） | ⬜ |
| `/api/v1/console/network/custom/adapter/versions` | GET | 获取Adapter版本列表 | ⬜ |
| `/api/v1/console/network/custom/adapter/status` | PUT | 更新Adapter状态（审核通过/拒绝/下架） | ⬜ |

#### 3.8.6 步骤六：数据查看与手动上传

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/v1/console/custom/report/upload` | POST | 手动上传自定义网络数据 | ⬜ |
| `/api/v1/console/custom/report/query` | GET | 查询自定义网络数据 | ⬜ |

---

## 四、被聚合SDK线上对接流程（6步完整方案）

> 本部分详细描述自定义广告网络从创建到上线的完整流程，包含每个功能点的详细操作说明和参数传递机制。

### 整体流程

```
步骤一：创建自定义广告网络
    ↓
步骤二：添加广告网络账号
    ↓
步骤三：关联应用与广告网络账号
    ↓
步骤四：添加广告源/代码位
    ↓
步骤五：客户端接入适配器
    ↓
步骤六：数据查看与手动上传
```

### 4.1 步骤一：创建自定义广告网络

**操作入口**：Web控制台 → 应用管理 → 管理广告网络 → 自定义广告网络 → "创建自定义广告网络"

**表单字段**：

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| 广告网络名称 | 是 | 瀑布流中显示的名称，≤30字符 | 我的ADN平台 |
| 账号名称 | 是 | 该网络下第一个账号的标识，≤30字符 | 主账号 |
| 初始化适配器类全路径 | 是 | SDK初始化类完整路径 | com.myadapter.MyInitAdapter |
| Banner适配器类全路径 | 否 | Banner广告适配器类 | com.myadapter.MyBannerAdapter |
| 插屏适配器类全路径 | 否 | 插屏广告适配器类 | com.myadapter.MyInterstitialAdapter |
| 激励视频适配器类全路径 | 否 | 激励视频适配器类 | com.myadapter.MyRewardedAdapter |
| 原生适配器类全路径 | 否 | 原生广告适配器类 | com.myadapter.MyNativeAdapter |
| 开屏适配器类全路径 | 否 | 开屏广告适配器类 | com.myadapter.MySplashAdapter |
| 是否支持客户端Bidding | 否 | 勾选可在Bidding层使用 | 勾选/不勾选 |

**关键约束**：
- 未填写的广告类型 → 瀑布流中不可选择该网络的该类型
- 至少填写一种广告类型的适配器类路径
- 类路径格式基础校验（包名.类名格式），不校验类是否存在

**系统行为**：
- 自动生成唯一 `network_code`：CUSTOM_ + 8位随机字符
- 自动生成 Network Firm ID（SDK回调标识来源）
- 同时创建第一个账号（使用填写的账号名称）
- 创建后状态为"草稿"，需关联应用后才可被SDK使用

### 4.2 步骤二：添加广告网络账号

**操作入口**：自定义广告网络详情页 → 账号管理 → "添加账号"

**表单字段**：

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| 账号名称 | 是 | 标识名称，≤30字符 | 开发者A |
| 账号ID | 否 | 在自定义网络中的唯一标识 | dev_123456 |
| 备注 | 否 | 额外说明信息 | 测试环境账号 |

**账号用途**：
- **关联应用**：每个应用关联一个账号，不同应用可使用不同账号
- **数据隔离**：数据报表中可按账号维度筛选
- **权限隔离**：不同账号的广告源配置互不影响

**账号管理操作**：编辑 / 禁用（已关联应用不受影响）/ 删除（仅未关联应用时可删）

### 4.3 步骤三：关联应用与广告网络账号

**操作入口**：应用管理 → 选择目标应用 → 关联广告网络 → "添加关联"

**前置条件**：已创建自定义广告网络 + 已添加账号 + 已在第三方网络创建应用并获得App ID

**表单字段**：

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| 广告网络 | 是 | 选择已创建的自定义广告网络 | 我的ADN平台 |
| 网络账号 | 是 | 选择该网络下的账号 | 主账号 |
| 应用级参数 | 否 | Key-Value形式，SDK适配器可读取 | 见下方 |

**应用级参数详解**：
- 所有广告位共用的参数（如App ID、App Key、渠道ID等）
- Key-Value键值对配置，建议不超过20个
- Key命名规范：英文字母和下划线（如app_id、app_key）

**应用级参数示例**：

| Key | Value | 说明 |
|-----|-------|------|
| app_id | 1234567890 | 在自定义网络申请的App ID |
| app_key | abcdefghijk | 在自定义网络申请的App Key |
| channel | official | 渠道标识 |

**系统行为**：
- 参数存储到 `app_network_binding.extra_params`
- SDK拉取配置时，将应用级参数放入配置JSON下发
- 适配器从配置JSON中读取参数用于初始化第三方SDK
- 关联完成后，该应用可在瀑布流中添加该网络的代码位

**关联管理操作**：编辑（修改应用级参数）/ 禁用（瀑布流中该网络代码位返回错误）/ 解除关联（需确认无代码位使用）

### 4.4 步骤四：添加广告源/代码位

**操作入口**：瀑布流管理 → 选择广告位 → "添加代码位"

**前置条件**：应用已关联自定义广告网络 + 已在第三方网络创建广告位并获得代码位ID

**表单字段**：

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| 广告网络 | 是 | 下拉选择已关联到该应用的广告网络 | 我的ADN平台 |
| 广告格式 | 是 | 自动过滤该网络支持的广告格式 | 激励视频 |
| 广告源名称 | 是 | 自定义名称 | 我的ADN-激励视频主 |
| 选择层级 | 是 | Bidding层/标准层/兜底层 | 标准层 |
| 排序价格 | 条件必填 | 标准层必填，Bidding/兜底自动忽略 | 2.50 |
| 超时时间 | 否 | 默认3000ms | 3000 |
| 代码位级参数 | 条件必填 | 至少需要slot_id | 见下方 |

**代码位级参数详解**：
- 该代码位独有的参数（如代码位ID、奖励名称等）
- 系统预设默认参数 `slot_id`（Key固定不可修改、Value必填、不可删除）
- 可额外添加自定义Key-Value参数

**代码位级参数示例**：

| Key | Value | 说明 |
|-----|-------|------|
| slot_id | reward_12345 | 代码位ID（默认必填） |
| reward_name | 金币 | 奖励名称 |
| reward_amount | 100 | 奖励数量 |
| ad_size | 640x360 | 广告尺寸 |

**参数合并与传递**：

```
应用级参数（步骤三）+ 代码位级参数（本步骤）→ 合并 → 下发给SDK
相同Key时，代码位级参数覆盖应用级参数
```

**合并示例**：
```
应用级参数：app_id→1234567890, app_key→abcdefg
代码位级参数：slot_id→reward_12345, reward_name→金币
合并后下发：app_id→1234567890, app_key→abcdefg, slot_id→reward_12345, reward_name→金币
```

**层级放置规则**：

| 层级 | 可放置 | 特殊要求 |
|------|--------|---------|
| Bidding层 | ✅ | 网络必须支持Client Bidding，需配置超时 |
| 标准层 | ✅ | 必须填写排序价格 |
| 兜底层 | ✅ | 无需排序价格 |

**重要限制**：不支持自动价格 / slot_id必填 / 应用需已关联

### 4.5 步骤五：客户端接入适配器

> 本步骤为开发者客户端操作，Web后台仅提供文档指引和Adapter下载。

**需要实现的适配器类型**：

| 适配器 | 对应接口 | 必须 |
|--------|---------|------|
| 初始化适配器 | SDK初始化 | ✅ |
| 各广告格式适配器 | 至少一种广告格式 | ✅ |
| Client Bidding适配器 | 实时出价接口 | ⚠️ 可选 |

**适配器开发规范**：

| 规范项 | 说明 |
|--------|------|
| 初始化核心方法 | `initializeADN(context, serverExtra)` — 从serverExtra读取应用级参数 |
| 广告加载方法 | `loadAd(context, localExtra, serverExtra)` — 从serverExtra读取代码位级参数 |
| 回调要求 | 加载成功/失败只能回调一次，不可重复 |
| 线程要求 | 所有方法在主线程调用，适配器内部勿做耗时操作 |
| 版本号 | 必须返回第三方SDK版本号，不可为空 |

**Web后台提供的功能**：
- Adapter接入规范文档页面
- 各广告类型Demo下载
- Adapter版本管理与上传/审核/下载

### 4.6 步骤六：数据查看与手动上传

**数据查看**：
- 操作入口：Web控制台 → 数据报表 → 广告网络筛选 → 选择自定义网络
- 可查看指标：请求量、填充量、填充率、展示量、点击量、点击率、预估收益
- 筛选维度：时间、应用、广告位、广告网络账号

**手动上传数据API**（适用于自定义网络未提供自动报表API的场景）：

| 参数 | 必填 | 说明 |
|------|------|------|
| 应用Key | 是 | app_key |
| 广告位ID | 是 | placement_id |
| 广告网络标识 | 是 | network_code |
| 统计日期 | 是 | YYYY-MM-DD |
| 展示量 | 否 | 当日展示总数 |
| 点击量 | 否 | 当日点击总数 |
| 收益 | 否 | 建议保留4位小数 |

**注意事项**：
- 同一天同一广告源重复上传会覆盖
- SDK数据与手动上传不一致时，以SDK数据为准
- 建议每日定时上传保持连续性

### 4.7 关键参数传递全流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        参数配置与传递全流程                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  第1步：创建自定义广告网络                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  配置适配器类全路径（告诉SDK该调用哪个适配器类）                      │   │
│  │  → 存入数据库 ad_network_def 表                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  第2步：添加广告网络账号（无参数传递，仅用于数据隔离）                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  创建账号记录 → 存入 ad_network_account 表                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  第3步：关联应用与广告网络账号                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  配置应用级参数：app_id, app_key, channel ...                       │   │
│  │  → 存入 app_network_binding.extra_params 字段                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  第4步：添加广告源/代码位                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  配置代码位级参数：slot_id, reward_name, ad_size ...                │   │
│  │  → 存入 waterfall_layer.extra 字段                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  第5步：合并参数并下发给SDK                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  应用级参数 + 代码位级参数 → 合并 → 下发给SDK                       │   │
│  │  （相同Key时，代码位级参数覆盖应用级参数）                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  第6步：适配器读取参数                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  SDK将合并后的参数传递给适配器                                        │   │
│  │  适配器从参数中读取所需配置 → 调用第三方SDK                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 五、前端页面清单（14个页面）

| # | 页面 | 路由 | 核心功能 | 状态 |
|---|------|------|---------|------|
| 1 | 登录 | `/login` | 邮箱+密码登录、忘记密码链接 | ⬜ |
| 2 | 注册 | `/register` | 注册表单（含接入方式选择）、邮箱验证提示 | ⬜ |
| 3 | Dashboard | `/dashboard` | 6个核心指标卡片 + 4张趋势图表 + 筛选条件 | ⬜ |
| 4 | 应用管理 | `/apps` | 应用CRUD、app_key展示复制、状态切换 | ⬜ |
| 5 | 广告位管理 | `/placements` | 广告位CRUD、placement_id展示复制、格式选择 | ⬜ |
| 6 | 瀑布流配置 | `/waterfall` | 广告源管理、三层模型可视化编辑、拖拽排序、版本管理 | ⬜ |
| 7 | 流量分组 | `/traffic-group` | 多维度规则配置、优先级管理、瀑布流绑定 | ⬜ |
| 8 | 数据报表 | `/reports` | 日报表查询、下钻、时间筛选 | ⬜ |
| 9 | 对账管理 | `/reconciliation` | SDK/API数据对比、差异率、导出Excel | ⬜ |
| 10 | 消息中心 | `/messages` | 消息列表、分类筛选、已读/未读、红点提醒 | ⬜ |
| 11 | 个人中心 | `/profile` | 信息管理、安全设置、Token展示、API管理、通知设置 | ⬜ |
| 12 | 广告网络管理 | `/networks` | 通用网络（5家预置）+ 自定义网络CRUD + 账号管理 | ⬜ |
| 13 | 网络账号管理 | `/networks/[id]/accounts` | 账号CRUD、启用/禁用、关联应用列表 | ⬜ |
| 14 | Adapter版本管理 | `/networks/[id]/adapters` | Adapter文件上传、版本列表、审核操作、上线/下架 | ⬜ |

### 5.1 应用网络关联（子页面）

嵌入应用详情页 `/apps/[id]` 中作为"关联广告网络"Tab，非独立页面。表单包含应用级参数Key-Value编辑器。

### 5.2 瀑布流配置改造

添加代码位时：
- 广告网络下拉列表动态展示 **通用网络 + 该应用已关联的自定义网络**
- 自定义网络标注"自定义"标签
- 选择自定义网络后，自动过滤该网络支持的广告格式
- 预设 `slot_id` 必填参数 + 可添加自定义Key-Value参数

---

## 六、公共组件清单

| 组件 | 说明 | 复用页面 | 状态 |
|------|------|---------|------|
| `AppSidebar` | 侧边栏导航（蓝渐变 #1E3A8A→#1E40AF，宽200px） | 全局Layout | ⬜ |
| `TopNav` | 顶部导航（面包屑+消息红点+用户头像） | 全局Layout | ⬜ |
| `StatCard` | 统计指标卡片（数值18px/700 + 标签12px + 趋势箭头） | Dashboard | ⬜ |
| `StatusTag` | 状态标签（配色见DESIGN.md状态标签配色表） | 多页面 | ⬜ |
| `ModeTabs` | 胶囊切换（外壳#F1F5F9+激活白底#2563EB） | 筛选/切换 | ⬜ |
| `TokenDisplay` | Token展示+一键复制 | 应用/广告位/个人中心 | ⬜ |
| `DateRangePicker` | 日期范围选择器（快捷+自定义） | Dashboard/报表/对账 | ⬜ |
| `WaterfallEditor` | 瀑布流三层可视化编辑器（Bidding/Standard/Fallback） | 瀑布流配置 | ⬜ |
| `TrafficRuleEditor` | 流量分组规则编辑器（多维度AND组合） | 流量分组 | ⬜ |
| `ConfirmDialog` | 二次确认弹窗 | 删除/重新生成Token | ⬜ |
| `EmptyState` | 空状态占位 | 列表页 | ⬜ |
| `AdapterUpload` | Adapter文件上传（拖拽+MD5校验+进度条） | Adapter版本管理 | ⬜ |
| `NetworkSelector` | 广告网络选择器（通用+自定义，自定义标注标签） | 瀑布流配置 | ⬜ |
| `ReviewPanel` | 审核操作面板（通过/拒绝/打回+意见填写） | Adapter版本管理 | ⬜ |
| `SectionCard` | 表单分区卡片（标题14px/600+底部分割线#F1F5F9） | 表单页面 | ⬜ |
| `KVEditor` 🆕 | Key-Value参数编辑器（添加/删除行，Key命名规范校验） | 应用关联/代码位添加 | ⬜ |
| `AccountManager` 🆕 | 广告网络账号管理组件（列表+添加+编辑+禁用/启用） | 网络详情页 | ⬜ |

---

## 七、开发阶段与步骤

### 阶段1：基础设施

| 步骤 | 内容 | 产出 | 状态 |
|------|------|------|------|
| 1.1 | 编写 DESIGN.md | DESIGN.md | ✅ |
| 1.2 | 创建全部14张数据库表（Drizzle schema → db upgrade → RLS） | 14张表 + RLS策略 | ⬜ |
| 1.3 | Supabase Client + ID生成器 + JWT工具 | supabase-client.ts, id-generator.ts, jwt.ts | ⬜ |
| 1.4 | 全局样式定制（Design Tokens + 自定义组件样式 + Inter字体） | globals.css改造 | ⬜ |

### 阶段2：认证系统

| 步骤 | 内容 | 产出 | 状态 |
|------|------|------|------|
| 2.1 | 后端：注册/登录/登出/验证 API | 4个API路由 | ⬜ |
| 2.2 | 前端：登录页 + 注册页 | 2个页面 | ⬜ |
| 2.3 | 全局Layout：侧边栏 + 顶导航 + Auth中间件 + 消息红点 | AppLayout | ⬜ |

### 阶段3：核心业务模块

| 步骤 | 内容 | 产出 | 状态 |
|------|------|------|------|
| 3.1 | 应用管理：API + 页面 | 3个API + /apps页面 | ⬜ |
| 3.2 | 广告位管理：API + 页面 | 3个API + /placements页面 | ⬜ |
| 3.3 | 瀑布流配置：API + 编辑器 + 页面 | 4个API + /waterfall页面 | ⬜ |
| 3.4 | 流量分组：逻辑 + 编辑器 + 页面 | /traffic-group页面 | ⬜ |

### 阶段4：自定义广告网络模块（6步对接流程）

| 步骤 | 内容 | 产出 | 状态 |
|------|------|------|------|
| 4.1 | 步骤一：创建自定义广告网络 — API + 页面 | 4个API + /networks页面 | ✅ |
| 4.2 | 步骤二：广告网络账号管理 — API + 页面 | 5个API + /network Tab + AccountManager组件 | ✅ |
| 4.3 | 步骤三：关联应用与网络账号 — API + 应用详情Tab | 3个API + KVEditor组件 + 应用关联Tab | ✅ |
| 4.4 | 步骤四：添加广告源/代码位 — API + 瀑布流改造 | 1个API + 代码位级参数编辑 + 网络选择器改造 | ✅ |
| 4.5 | 步骤五：Adapter版本管理 — 上传/审核API + 页面 | 3个API + /network Tab | ✅ |
| 4.6 | 步骤六：数据查看与手动上传 — API | 2个API（已在报表模块覆盖） | ✅ |

### 阶段5：数据与报表

| 步骤 | 内容 | 产出 | 状态 |
|------|------|------|------|
| 5.1 | Dashboard：指标卡片 + 趋势图表 + 筛选 | 1个API + /dashboard页面 | ⬜ |
| 5.2 | 数据报表：日报表 + 自定义网络数据 | 3个API + /reports页面 | ⬜ |
| 5.3 | 对账管理：数据对比 + 差异率 | 1个API + /reconciliation页面 | ⬜ |

### 阶段6：辅助模块

| 步骤 | 内容 | 产出 | 状态 |
|------|------|------|------|
| 6.1 | 消息中心：API + 页面 + 红点 | 2个API + /messages页面 | ⬜ |
| 6.2 | 个人中心：信息/安全/Token/API管理 | /profile页面 | ⬜ |
| 6.3 | SDK对外接口：配置下发（含customAdapters+合并参数）+ 数据上报 | 2个API改造 | ⬜ |

### 阶段7：验证与交付

| 步骤 | 内容 | 状态 |
|------|------|------|
| 7.1 | 静态检查（ts-check + lint） | ⬜ |
| 7.2 | 全量API冒烟测试（35个接口） | ⬜ |
| 7.3 | 日志健康检查 + 交付 | ⬜ |

---

## 八、关键设计决策

| 决策点 | 方案 | 理由 |
|--------|------|------|
| JWT实现 | 自签JWT（jose库），HttpOnly Cookie | 无需外部Auth服务，适合中后台 |
| Token生成 | 服务端 SecureRandom + Base62 | 严格遵循PRD规范，碰撞概率 ≈ 1/4.7×10²⁸ |
| 瀑布流编辑 | 前端拖拽排序 + 三层可视化 | 直观配置Bidding/Standard/Fallback |
| 图表渲染 | Recharts（CSR only，'use client'） | 避免SSR hydration问题 |
| 数据隔离 | Supabase RLS + developer_id API层过滤 | 双重保障 |
| Adapter文件存储 | 对象存储（S3兼容） | CDN分发，SDK按配置拉取指定版本 |
| Adapter审核流程 | 状态机：待审核→审核通过→已上线→已下架 | 确保安全与质量 |
| 配置下发改造 | /api/v1/sdk/config 响应增加 customAdapters + 合并参数 | SDK动态下载加载 + 参数传递 |
| 参数合并规则 | 代码位级参数覆盖应用级参数（相同Key） | 代码位特有配置优先级更高 |
| 广告网络账号 | 独立表 ad_network_account | 同一网络多账号，支持数据/权限隔离 |
| 页面底色 | #F8FAFC（slate-50） | 设计规范 |
| 侧边栏 | 蓝渐变 #1E3A8A → #1E40AF，宽200px | 设计规范 |

---

## 九、风险点与应对

| 风险 | 应对 | 状态 |
|------|------|------|
| Supabase RLS配置复杂 | 严格按skill文档场景选择，逐步验证 | — |
| 瀑布流拖拽排序实现 | 原生HTML5 Drag&Drop，避免额外依赖 | — |
| Recharts SSR问题 | 图表组件'use client' + 动态import | — |
| JWT安全 | HttpOnly + Secure + SameSite=Strict，7天有效期 | — |
| Adapter文件上传大文件 | 对象存储支持分片上传，前端进度条+MD5校验 | — |
| 自定义网络审核并发 | 乐观锁（版本号）防重复审核 | — |
| 35个API接口易遗漏 | 按清单逐一测试，确保100%覆盖 | — |
| SDK配置下发性能 | 配置缓存+增量更新（isFullUpdate标记） | — |
| 参数合并Key冲突 | 代码位级参数覆盖应用级参数，明确优先级 | — |

---

## 十、偏差记录

> 开发过程中如发现计划与实际不符，在此记录。

| 日期 | 阶段 | 偏差描述 | 调整方案 | 影响范围 |
|------|------|---------|---------|---------|
| — | — | — | — | — |

---

## 十一、迭代日志

> 每次更新本文件时记录变更。

| 日期 | 变更内容 |
|------|---------|
| 2026-07-07 | 初始创建，完整计划写入 |
| 2026-07-07 | 优化：根据详细对接流程描述，新增ad_network_account表（14张表）、新增3个账号管理API（35个接口）、新增网络账号管理页面（14个页面）、新增KVEditor+AccountManager组件、细化6步对接流程含完整参数传递机制、更新阶段4为6步对应开发步骤 |
