# AGENTS.md — SDK聚合系统 项目规范

## 项目概览

广告SDK聚合平台管理后台，支持开发者管理应用、广告位、瀑布流配置、流量分组、数据报表，以及自定义广告平台的线上对接流程（Adapter上传/审核/版本管理/应用关联）。

## 版本技术栈（已实现版本）

### 前端

| 类别 | 技术 |
|------|------|
| **Framework** | Vue 3 (Composition API) |
| **构建工具** | Vite 7 |
| **Language** | TypeScript 5.6 |
| **UI 组件** | Element Plus 2.14 + @element-plus/icons-vue |
| **Styling** | Tailwind CSS 3.4（`@import` 引入 EP CSS 解决 CDN 拦截问题） |
| **State** | Pinia 3 |
| **Router** | vue-router 4 |
| **Charts** | ECharts 6 + vue-echarts |
| **HTTP** | axios |
| **日期** | dayjs |

### 后端

| 类别 | 技术 |
|------|------|
| **Runtime** | Node.js 20+ / Express 4 |
| **Language** | TypeScript 5.6 |
| **运行** | tsx（开发 watch） / tsup CJS（生产构建） |
| **Auth** | jsonwebtoken（HS256，7 天过期）+ bcryptjs 密码哈希 + **HttpOnly Cookie 鉴权**（`auth_token`，HttpOnly + SameSite=Strict，dev 不带 Secure / prod 带 Secure）；`authMiddleware` 优先 cookie，回退到 `Authorization: Bearer` |
| **Database** | Supabase（PostgreSQL）+ @supabase/supabase-js |
| **Cache** | node-cache（验证码 token） |
| **ID** | uuid v4 |
| **Cookie 解析** | cookie-parser |

### 工具链

| 类别 | 技术 |
|------|------|
| **包管理** | pnpm（**唯一允许**，严禁 npm/yarn） |
| **Lint** | ESLint 9 + typescript-eslint 8 |
| **测试** | puppeteer（截图回归） |
| **类型检查** | vue-tsc（开发），`pnpm ts-check`（CI） |
| **SDK** | coze-coding-dev-sdk（集成能力） |

## 目录结构

```
.
├── public/                 # 静态资源（logo.png、favicon 等）
├── assets/                 # 设计资源
├── src/                    # 前端源码
│   ├── App.vue             # 根组件（<router-view />）
│   ├── main.ts             # 应用入口（注册 Pinia/ElementPlus/Router）
│   ├── index.css           # 唯一全局样式（含 @import EP CSS + Tailwind + 自定义规范）
│   ├── index.ts            # 入口别名（备用）
│   ├── router/
│   │   └── index.ts        # vue-router 配置（13 个路由）
│   ├── stores/
│   │   └── user.ts         # Pinia 用户状态（token + userInfo）
│   ├── utils/
│   │   └── request.ts      # axios 封装（自动注入 JWT）
│   ├── layout/
│   │   └── MainLayout.vue  # 控制台主布局（侧边栏 + 顶栏 + 内容区）
│   └── views/              # 13 个业务页面
│       ├── auth/           # Login.vue / Register.vue
│       ├── dashboard/      # Index.vue（数据看板 + ECharts）
│       ├── app/            # Index.vue（应用管理）
│       ├── placement/      # Index.vue（广告位管理）
│       ├── ad-source/      # Index.vue（广告源管理）
│       ├── waterfall/      # Index.vue（瀑布流配置）
│       ├── traffic-group/  # Index.vue（流量分组）
│       ├── report/         # Index.vue（数据报表）
│       ├── reconciliation/ # Index.vue（对账管理）
│       ├── network/        # Index.vue（广告平台 + Adapter）
│       ├── message/        # Index.vue（消息中心）
│       └── profile/        # Index.vue（个人中心）
├── server/                 # Express 后端
│   ├── server.ts           # 服务入口（启动 HTTP + 集成 Vite dev middleware）
│   ├── db.ts               # 数据库连接/查询封装
│   ├── vite.ts             # Vite dev server 集成
│   ├── middleware/
│   │   └── auth.ts         # JWT 鉴权中间件（Bearer Token / 7天过期）
│   ├── routes/             # 13 个 REST 路由
│   │   ├── index.ts        # 路由注册总表
│   │   ├── auth.ts         # /login /register /send-captcha /verify-captcha
│   │   ├── app.ts          # 应用 CRUD
│   │   ├── placement.ts    # 广告位 CRUD
│   │   ├── ad-source.ts    # 广告源 CRUD
│   │   ├── waterfall.ts    # 瀑布流配置 CRUD
│   │   ├── traffic-group.ts# 流量分组 CRUD
│   │   ├── dashboard.ts    # 看板聚合
│   │   ├── report.ts       # 报表聚合
│   │   ├── reconciliation.ts# 对账
│   │   ├── network.ts      # 广告平台 + Adapter
│   │   ├── message.ts      # 消息中心
│   │   ├── profile.ts      # 个人信息
│   │   └── sdk.ts          # SDK 对外接口（数据上报/拉取）
│   └── utils/
│       ├── supabase-client.ts  # Supabase client（service_role 直连）
│       ├── response.ts         # 统一响应格式
│       └── id-generator.ts     # UUID / Token 生成
├── scripts/                # 生命周期脚本
│   ├── prepare.sh          # 依赖安装 + coze check-bins
│   ├── dev.sh              # 开发：kill port → tsx watch
│   ├── build.sh            # 生产：vite build + tsup CJS
│   ├── start.sh            # 生产：node dist-server/server.js
│   └── validate.sh         # 校验：pnpm validate
├── .coze                   # 沙箱配置（build/run 命令）
├── vite.config.ts          # Vite 配置（含 viteCssAcceptFix）
├── tailwind.config.js
├── tsconfig.json
├── eslint.config.mjs
├── package.json
├── PLAN.md                 # 开发计划（基准文档，12 模块）
├── DESIGN.md               # UI/UX 设计规范（蓝+灰+白）
└── AGENTS.md               # 本文件
```

## 关键避坑（重要）

### ⚠️ Element Plus CSS 必须从 `index.css` 顶部 `@import`

`main.ts` **不能**直接写 `import 'element-plus/dist/index.css'`，原因：

`vite.config.ts` 的 `viteCssAcceptFix` 插件会移除请求 `Accept` 头中的 `text/css`，防止火山引擎 CDN 拦截 `.vue?type=style` 时把响应体替换成原始 CSS 导致 SyntaxError。

如果在 `main.ts` 中 `import` EP CSS，Vite 会把它当 JS 模块处理并注入 `&direct` 参数返回原始 CSS，浏览器以 ES module 加载会报 SyntaxError。

**正确做法**（已落地）：

1. `src/index.css` 第 2 行：`@import "element-plus/theme-chalk/index.css";`（**必须在 `@tailwind` 之前**）
2. `src/main.ts` 不 import 任何 CSS
3. 任何 `.vue` 文件**禁止**写 `<style scoped>` 块（同样会触发 CDN 拦截）

### ⚠️ 所有样式统一在 `src/index.css`

- 禁止在 `.vue` 文件中写 `<style>` 块
- 自定义类以 `auth-*` / `page-*` / `el-*` 命名空间组织
- 遵循 DESIGN.md 的 token 体系（`--color-primary-*` / `--space-*` / `--text-*` / `--radius-*` / `--shadow-*` / `--comp-height*`）

## 包管理规范

**仅允许使用 pnpm**，严禁 npm 或 yarn。

## 开发规范

### 编码规范

- TypeScript strict 模式，**禁止** `any` / `as any`（已开 strict + noImplicitAny）
- 函数参数、返回值、事件对象必须标注类型
- 禁止引用未声明标识符
- 字段名统一 `snake_case`（Supabase 要求）
- Vue 3 Composition API 优先，`<script setup lang="ts">` 语法

### Hydration / 渲染问题防范

- 严禁在 `<template>` / `<script setup>` 顶层直接使用 `Date.now()` / `Math.random()` / `new Date()`
- 需要动态内容：使用 `ref` + `onMounted` 赋值
- ECharts / canvas 必须包在 `onMounted` 初始化
- 严禁非法 HTML 嵌套（如 `<p>` 嵌套 `<div>`）

### Vite 配置

- 路径别名 `@` → `src/`
- dev server 端口固定 5000（`process.env.DEPLOY_RUN_PORT`）
- 监听 `usePolling: true, interval: 100`（沙箱兼容）
- `allowedHosts: true` + `Cache-Control: no-store`

### UI 设计规范

- **严格遵循** DESIGN.md 中的配色、字号、间距、圆角、阴影、组件规范
- 页面底色 `#F8FAFC`，侧边栏蓝渐变 `#1E3A8A` → `#1E40AF`
- 图标使用 `@element-plus/icons-vue`，**禁止 Emoji**
- 状态标签配色见 DESIGN.md 状态标签配色表
- 字体族：`'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### 后端规范

- 所有 API 响应统一格式 `{ code, message, data }`（见 `server/utils/response.ts`）
- 所有表操作使用 Supabase SDK（`supabaseClient.from()`），**不**用 Drizzle ORM
- 每次调用必须检查 `{ data, error }`，error 必须 throw
- `.delete()` / `.update()` 必须带 filter
- 鉴权：除 `/auth/login` `/auth/register` `/auth/send-captcha` 外，所有接口必须经过 `authMiddleware` 校验 JWT
  - 优先从 `req.cookies.auth_token` 读取（HttpOnly Cookie 场景）
  - 回退到 `Authorization: Bearer <token>` 头（SDK 直连场景）
  - `setAuthCookie` / `clearAuthCookie` 工具方法统一管理 Cookie 写入/清除
- 字段名 `snake_case`

### 数据库规范

- 13 张核心业务表 + 1 张健康检查表 = **14 张表**：
  - 业务表：`developer` / `app` / `placement` / `ad_source` / `waterfall_config` / `waterfall_layer` / `traffic_group` / `report_daily` / `message` / `custom_adapter_version` / `custom_network_report` / `app_network_binding` / `ad_network_def`
  - 辅助表：`health_check`（健康检查，PLAN 未列入）
  - **⚠️ 待补表**：`ad_network_account`（广告平台账号管理，6 步对接流程步骤二需要）
- 通过 Supabase 控制台手动建表（**无 migration 文件**，新环境需同步建表）
- RLS **当前未启用**（用 service_role key 绕过），存在越权风险，未来需补
- `waterfall_config.layers` JSONB 列（**必填**）：保存每条配置的 3 个瀑布层（Bidding/瀑布/兜底）。**该列在最早建表时缺失，导致历史 update 静默丢弃 layers 字段。已通过 `exec_sql` ALTER TABLE ADD COLUMN 修复**。新环境必须同步建表时带上此列：
  ```sql
  ALTER TABLE waterfall_config ADD COLUMN IF NOT EXISTS layers JSONB DEFAULT '[]'::jsonb;
  ```
- **`waterfall_layer` 与 `waterfall_config.layers` 双写策略**：
  - 旧 `update` 端点：只写 `waterfall_config.layers`（JSONB），不写 `waterfall_layer` 表
  - 新 `update` 端点（refactor 后）：双写 — `waterfall_config.layers` + `waterfall_layer` 关联表
  - `get` 端点返回 `{ config: { layers: JSONB }, layers: 关联表 rows }` 双份
  - **`fetchConfig` 前端策略**：优先用 `config.layers`（JSONB），为空时回退 `waterfall_layer` 行（避免误把 `[]` 当作"无配置"）。已修复。
- **当前编辑行视觉**：`isEditingConfigRow(row)` 通过 `row.traffic_group_id` 与 `selectedTrafficGroupId` 比对判断是否为「编辑中」。该行显示「编辑中」蓝色脉冲 tag + 「已加载」按钮（disabled），其他行显示「加载」按钮可点。

### 「加载」按钮 vs 「点行」切换
- 两者效果一致：把该行（某个 traffic_group 的某条历史 version）载入右侧编辑面板
- 区别：点行 = 整行点击区，点「加载」= 显式操作（按钮）
- 默认分组（`is_default_config=true`）始终被选中，编辑中判断走 `traffic_group_id=0` 分支
- 顶栏「流量分组」下拉 = 按 group 粒度切换（最新 version 自动载入）
- **get/list 端点的 placement_id 查询**：`waterfall_config.placement_id` 实际存为 number-as-string（如 `"58"`），但 placement 表的 `placement_id` 列存为 `"pl_xxx"` 形式。list 端用 `.in('placement_id', [pidStr, placementIdStr])` 兼容两种入参（前端用 number `selectedPlacement.value`，后端也接受 string `"pl_xxx"`）。**新环境部署必须保证 `waterfall_config.placement_id` 列与创建 config 时传入的 placementId 形式一致**（推荐 number）。

## 实施差距分析（vs PLAN.md）

### 1. 路由路径差异（命名习惯不同）

| PLAN | 实际实现 | 备注 |
|------|---------|------|
| /apps | /app | 单数 |
| /placements | /placement | 单数 |
| /reports | /report | 单数 |
| /messages | /message | 单数 |
| /networks | /network | 单数 |
| /networks/[id]/accounts | /network (tab 切换) | 子页改为 Tab |
| /networks/[id]/adapters | /network (tab 切换) | 子页改为 Tab |
| - | /ad-source | 独立页面（PLAN 整合到 waterfall） |

### 2. 数据库表差距

- **缺失 1 张表**：`ad_network_account`
  - 用途：管理 6 步对接流程步骤二「广告平台账号」
  - 字段预期：id, network_def_id, developer_id, account_name, app_id, credentials(JSON), status, created_at, updated_at
  - 影响：步骤二账号管理功能无法落地

### 3. API 接口差距（PLAN: 35 → 实际: ~50+，但缺 5 个核心）

**已实现的核心接口**（覆盖 30/35）：
- Auth: register/login/logout/me/profile/password/api-token（7）
- App: list/create/update/delete/detail（6）
- Placement: list/create/update/delete/detail（5）
- AdSource: list/create/update/delete（4）
- Waterfall: get/update/layers（3）
- Traffic-Group: list/create/update/delete（4）
- Network: custom (CRUD) + adapter (upload/versions/status) + report (upload/query) + app-binding（13+）
- Report: overview/trend/source-comparison/placement-ranking/anomalies/daily（6）
- Reconciliation: list/detail/export/confirm（4）
- Message: list/read/unread-count（3+）
- Profile / Dashboard / SDK: 完整

**未实现的关键接口**（5 个）：
| 接口 | 用途 | 优先级 |
|------|------|--------|
| `POST /api/v1/auth/verify` | JWT Token 验证 | 中 |
| `POST /api/v1/console/adsource/create-custom` | 创建自定义广告源（关联自定义广告平台） | 高 |
| `POST /api/v1/console/network/account/create` | 创建广告平台账号 | 高 |
| `GET /api/v1/console/network/account/list` | 广告平台账号列表 | 高 |
| `PATCH/DELETE /api/v1/console/network/account/[id]` | 编辑/删除账号 | 高 |

### 4. 页面差距（PLAN: 14 → 实际: 13）

- **未独立成页的 2 个**：
  - `/networks/[id]/accounts` → 整合为 `/network` 的 Tab（账号管理）
  - `/networks/[id]/adapters` → 整合为 `/network` 的 Tab（Adapter 管理）
- 实际功能完整，但 URL 不够 RESTful

### 5. 组件差距（PLAN 新增 2 个）

- **已实现（升级版）**：
  - `KVEditor` → 改用 `src/shared/network-schemas.ts` schema-driven 字段定义（`FieldDef` 类型：text/password/switch/currency/select/key-value/pub-key）
  - `AccountManager` → 改用 `src/components/NetworkAccountManager.vue`（schema-driven 弹窗 + 凭证查看 drawer + JSON 脱敏）
- **核心模式**：弹窗「凭证字段」分隔线后，由 `schemaFields` computed 根据所选平台动态渲染表单项，提交时所有字段打平进 `credentials` JSONB
- 旧 `src/components/AccountManager.vue` 已删除（被 `NetworkAccountManager` 替代）

### 6. 6 步对接流程落地情况

| 步骤 | 名称 | 落地状态 | 备注 |
|------|------|---------|------|
| 1 | 上传 Adapter | ✅ 已实现 | network.ts upload 接口 |
| 2 | 广告平台账号 | ✅ 已实现 | ad_network_account 表 + 5 个 API + /network Tab + NetworkAccountManager 组件 |
| 3 | 数据上报格式 | ✅ 已实现 | custom/report/upload + custom_network_report 表 |
| 4 | 联调测试 | ✅ 已实现 | /ad-source/create-custom（绑定到自定义广告平台）|
| 5 | 上线 | ✅ 已实现 | /custom/adapter/status + review 接口（PASS/REJECT） |
| 6 | 维护监控 | ✅ 已实现 | report/query + reconciliation |

### 7. 优先级排序（已全部完成）

1. **【完成】** 建表 `ad_network_account` + 5 个 API + 1 个页面 Tab
2. **【完成】** `KVEditor` 组件（用于账号凭证 JSON 输入）
3. **【完成】** `POST /api/v1/console/ad-source/create-custom`
4. **【完成】** `POST /api/v1/auth/verify`

## 系统数据模型边界（造数据 / 硬编码必读）

> 任何前端下拉 / 后端过滤 / seed 脚本都必须**从 DB 读**，不允许硬编码。  
> 任何 demo 数据必须严格按必填字段 + 唯一约束 + 枚举值生成。

### 1. 核心枚举值（从 `information_schema` / 字段语义推断，不许猜）

| 字段 | 表 | 合法取值 | 备注 |
|------|-----|---------|------|
| `platform` | `app` | 1=Android / 2=iOS / 3=双端 (Both) | **无鸿蒙 / Windows / macOS** |
| `system_type` | `ad_network_def` | 1=Android / 2=iOS / 3=Both | **无鸿蒙** |
| `is_preset` | `ad_network_def` | true=平台官方预置 / false=开发者自定义 | **唯一可靠的"预置 vs 自定义"区分字段** |
| `network_type` | `ad_network_def` | 1 或 2 | 字段被滥用（用户测试残留也设 1），**不要用此字段做预置过滤** |
| `format` | `placement` | 1=banner / 2=interstitial / 3=native / 4=rewarded / 5=splash | — |
| `bidding_type` | `placement` | 1=客户端竞价 / 2=服务端竞价 | — |
| `screen_orientation` | `placement` | 0=竖屏 / 1=横屏 / 2=不限 | — |
| `access_type` | `app` | 1=自有 / 2=联运 / 3=合作 | — |

### 2. 必填字段（NOT NULL，无默认值）

- **`ad_network_def` 必填 6 字段**：`id` / `network_code` / `network_name` / `network_type` / `is_preset` / `system_type`
- **`ad_source` 必填 8 字段**：`developer_id` / `network_def_id` / `network_code` / `network_name` / `source_name` / `status` / `third_app_id` / `third_placement_id`（最后 2 个易漏，NOT NULL）
- **`app` 必填 5 字段**：`developer_id` / `app_key` / `app_name` / `package_name` / `platform` / `status`
- **`placement` 必填 7 字段**：`app_key` / `placement_id` / `name` / `format` / `status` / `bidding_type` / `screen_orientation`
- **`report_daily` 必填**：`developer_id` / `app_key` / `placement_id` / `ad_source_id` / `stat_date` / `hour`

### 3. 唯一约束

- `ad_network_def.network_code` 唯一
- `app.app_key` 唯一（不区分 developer）
- `placement.placement_id` 唯一（不区分 app）
- `report_daily` 复合唯一：(developer_id, app_key, placement_id, ad_source_id, stat_date, hour)
  - **每个唯一组合只能 1 行**，循环里 region/os 随机会导致重复键

### 4. 联动规则（造数据必须遵守）

| 关系 | 联动逻辑 |
|------|----------|
| `app.platform` → `report_daily.os` | platform=1→os=android；platform=2→os=ios；platform=3→os∈{android,ios} |
| `ad_source` → `ad_network_def` | `ad_source.network_def_id` 必须 link 到 `ad_network_def.id`；`ad_source.network_code` = `ad_network_def.network_code` |
| `ad_source` → `app`（间接） | 通过 `app_network_binding` 关联；demo 里简化为同一 dev 名下 ad_source 共享 |
| `placement.format` → `ad_source` 支持的格式 | ad_source 必须支持 placement 选定的 format（SDK 层面） |

### 5. 下拉选项生成规则

| 字段 | 来源 | 过滤条件 |
|------|------|---------|
| 平台 | `ad_network_def.network_name` | `is_preset = true`（不要用 `network_type`，被滥用） |
| 系统 | `report_daily.os` DISTINCT | 仅 `android / ios`（无 harmony） |
| 应用 | `app.app_name` | — |
| 广告位 | `placement.name` | — |
| 广告源 | `ad_source.source_name` | — |
| 广告类型 | `report_daily.ad_type` DISTINCT | — |
| 国家 | `report_daily.region` DISTINCT | — |

### 6. 反模式（绝对禁止）

- ❌ 在前端代码 / 后端 options 端点 / seed 脚本里硬编码 `'CSJ' / 'YLH' / 'SIGMOB'` 等具体网络 code
- ❌ 在 option-labels 里造 `harmony / windows / macOS` 等枚举值不在 DB 字段语义中的 OS
- ❌ 在 PLATFORM_LABELS 里造 `self / 3rd / third / custom` 等"分类"标签（数据库没这个维度）
- ❌ 用 `network_type` 字段判断"预置 vs 自定义"（被滥用，应改用 `is_preset`）
- ❌ seed 时 region/os 循环套娃造成 report_daily 唯一约束违反
- ❌ ad_source 漏填 `third_app_id` / `third_placement_id` 必填字段

### 7. seed 脚本规范

- 任何 `network_code` / `network_name` 引用都从 `ad_network_def` SELECT 出来
- 任何 `app_key` / `placement_id` 引用都从对应表 SELECT 出来
- demo 跑完后做反向校验：所有 ad_source.network_code 都在 is_preset=true 的 code 集合中

## 开发流程

1. 每次开发前读取 `PLAN.md`，确认当前阶段待办
2. 严格按 `DESIGN.md` 的 UI/UX 规范实现界面
3. 完成后更新 `PLAN.md` 对应步骤状态为 ✅
4. 如发现偏差，记录到 `PLAN.md` 偏差记录表
5. 交付前通过 `test_run` 执行静态检查 + API 冒烟测试

## 启动与构建

| 环境 | 命令 | 说明 |
|------|------|------|
| 开发 | `pnpm install && pnpm tsx watch server/server.ts` | Vite dev + Express，端口 5000 |
| 生产构建 | `pnpm vite build && pnpm tsup server/server.ts --format cjs ...` | 输出 `dist/` + `dist-server/server.js` |
| 生产启动 | `node dist-server/server.js` | 仅 Express，端口 5000 |
| 沙箱启动 | 由 `.coze` + `scripts/*.sh` 管理 | `dev.sh` 杀端口 → `tsx watch` |
| 静态检查 | `pnpm lint` / `pnpm ts-check` | ts-check 用 vue-tsc |
