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

- **未实现**：
  - `KVEditor` - 键值对编辑器（用于凭证 JSON 输入）
  - `AccountManager` - 账号管理组件（含凭证加密展示）
- 替代方案：当前用 `el-form-item` + `el-input` 临时实现，但缺乏 JSON 可视化、加密、批量管理能力

### 6. 6 步对接流程落地情况

| 步骤 | 名称 | 落地状态 | 备注 |
|------|------|---------|------|
| 1 | 上传 Adapter | ✅ 已实现 | network.ts upload 接口 |
| 2 | 广告平台账号 | ✅ 已实现 | ad_network_account 表 + 5 个 API + /network Tab + AccountManager 组件 |
| 3 | 数据上报格式 | ✅ 已实现 | custom/report/upload + custom_network_report 表 |
| 4 | 联调测试 | ✅ 已实现 | /ad-source/create-custom（绑定到自定义广告平台）|
| 5 | 上线 | ✅ 已实现 | /custom/adapter/status + review 接口（PASS/REJECT） |
| 6 | 维护监控 | ✅ 已实现 | report/query + reconciliation |

### 7. 优先级排序（已全部完成）

1. **【完成】** 建表 `ad_network_account` + 5 个 API + 1 个页面 Tab
2. **【完成】** `KVEditor` 组件（用于账号凭证 JSON 输入）
3. **【完成】** `POST /api/v1/console/ad-source/create-custom`
4. **【完成】** `POST /api/v1/auth/verify`

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
