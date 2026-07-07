# PLAN.md — SDK聚合系统 开发计划

> **本文档为开发基准文件，每次开发前需对比校验，完成后根据实际情况迭代更新。**
>
> **校验规则**：
> 1. 每进入一个阶段前，读取本文件确认待办清单
> 2. 每完成一个步骤，更新对应行的 `[状态]` 为 `✅` 并填写实际产出
> 3. 如发现计划与实际不符，追加「偏差记录」说明原因和调整方案
> 4. 新增需求或发现遗漏时，补充到对应阶段并标注 `🆕`

---

## 一、技术栈确认

> 与 `AGENTS.md` 保持一致；以下为已落地实现版本（Vue 3 + Express + Supabase）。

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

## 二、数据库设计（13张表）

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

### 2.2 被聚合SDK对接扩展表（4张）

| # | 表名 | 说明 | 关键索引 | 状态 |
|---|------|------|---------|------|
| 10 | `ad_network_def` | 广告网络定义表（通用+自定义） | network_code(UNIQUE), created_by, network_type | ⬜ |
| 11 | `custom_adapter_version` | 自定义Adapter版本表 | network_def_id, status | ⬜ |
| 12 | `app_network_binding` | 应用关联广告网络表 | (app_key+network_def_id)复合唯一 | ⬜ |
| 13 | `custom_network_report` | 自定义网络数据上传表 | (developer_id+app_key+placement_id+network_def_id+stat_date)复合唯一 | ⬜ |

### 2.3 RLS策略

所有表以 `developer_id` 为顶层隔离，开发者只能操作/查看自己的数据。

---

## 三、后端API接口清单（7大模块 30个接口）

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
| `/api/v1/sdk/config` | GET | SDK配置下发（含customAdapters） | ⬜ |
| `/api/v1/report` | POST | 数据批量上报（强制Token校验） | ⬜ |

### 3.8 自定义广告网络管理 `/api/v1/console/network/`

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/v1/console/network/custom/create` | POST | 创建自定义广告网络 | ⬜ |
| `/api/v1/console/network/custom/update` | POST | 更新自定义网络信息 | ⬜ |
| `/api/v1/console/network/custom/detail` | GET | 获取自定义网络详情 | ⬜ |
| `/api/v1/console/network/custom/list` | GET | 获取开发者创建的自定义网络列表 | ⬜ |
| `/api/v1/console/network/custom/adapter/upload` | POST | 上传自定义Adapter文件（→对象存储） | ⬜ |
| `/api/v1/console/network/custom/adapter/versions` | GET | 获取Adapter版本列表 | ⬜ |
| `/api/v1/console/network/custom/adapter/status` | PUT | 更新Adapter状态（审核通过/拒绝/下架） | ⬜ |
| `/api/v1/console/app/network/bind` | POST | 将广告网络关联到应用 | ⬜ |
| `/api/v1/console/app/network/unbind` | POST | 解除关联 | ⬜ |
| `/api/v1/console/app/network/list` | GET | 获取应用已关联的网络列表 | ⬜ |
| `/api/v1/console/custom/report/upload` | POST | 手动上传自定义网络数据 | ⬜ |
| `/api/v1/console/custom/report/query` | GET | 查询自定义网络数据 | ⬜ |

---

## 四、前端页面清单（13个页面）

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
| 12 | 广告网络管理 | `/networks` | 通用网络列表（5家预置）+ 自定义网络CRUD + 审核状态 | ⬜ |
| 13 | Adapter版本管理 | `/networks/[id]/adapters` | Adapter文件上传、版本列表、审核操作、上线/下架 | ⬜ |

### 4.1 应用网络关联（子页面）

嵌入应用详情页 `/apps/[id]` 中作为Tab，而非独立页面。

### 4.2 瀑布流配置改造

添加代码位时，广告网络下拉列表动态展示 **通用网络 + 该应用已关联的自定义网络**，自定义网络标注"自定义"标签。

---

## 五、公共组件清单

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

---

## 六、开发阶段与步骤

### 阶段1：基础设施

| 步骤 | 内容 | 产出 | 状态 |
|------|------|------|------|
| 1.1 | 编写 DESIGN.md | DESIGN.md | ✅ |
| 1.2 | 创建全部 13 张数据库表（Supabase 控制台手动建表，SQL 见 `db/migrations/0001_init_schema.sql`） | 13 张表 + RLS 策略（RLS 当前未启用，未来需补） | ✅ |
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

### 阶段4：自定义广告网络模块

| 步骤 | 内容 | 产出 | 状态 |
|------|------|------|------|
| 4.1 | 广告网络管理：API + 页面 | 4个API + /networks页面 | ⬜ |
| 4.2 | Adapter版本管理：上传API + 版本列表API + 审核API + 页面 | 3个API + /networks/[id]/adapters页面 | ⬜ |
| 4.3 | 应用网络关联：API + 页面改造 | 3个API + 应用详情Tab | ⬜ |

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
| 6.3 | SDK对外接口：配置下发（含customAdapters）+ 数据上报 | 2个API改造 | ⬜ |

### 阶段7：验证与交付

| 步骤 | 内容 | 状态 |
|------|------|------|
| 7.1 | 静态检查（ts-check + lint） | ⬜ |
| 7.2 | 全量API冒烟测试（30个接口） | ⬜ |
| 7.3 | 日志健康检查 + 交付 | ⬜ |

---

## 七、关键设计决策

| 决策点 | 方案 | 理由 |
|--------|------|------|
| 前端框架 | Vue 3 + Vite + TypeScript + Element Plus + Tailwind 3 | 与 AGENTS.md 一致，已落地 |
| 后端框架 | Express 4 + tsx (dev) + tsup (prod CJS) + TypeScript | 与 AGENTS.md 一致 |
| JWT实现 | 自签JWT（jsonwebtoken），HS256，7天过期 | Bearer Token + Authorization header；7 天有效期符合中后台 |
| 鉴权方案 | 除登录/注册/验证码外，所有 `/api/v1/console/*` 必须经 `authMiddleware` | 统一 JWT 解码 → req.developerId |
| 密码哈希 | bcryptjs | Node 原生支持，零依赖 |
| 状态管理 | Pinia + localStorage 持久化 | token / userInfo 刷新不丢失 |
| 图表 | ECharts 6 + vue-echarts（onMounted 初始化） | 避免 SSR hydration 问题，Element Plus 生态兼容 |
| HTTP 客户端 | axios（自动注入 JWT + 401 拦截 → SPA 跳转 login） | 统一错误处理 |
| 数据库 | Supabase PostgreSQL（service_role 直连，RLS **当前未启用**） | 简单直接，未来需补 RLS 防越权 |
| Element Plus CSS 加载 | `src/index.css` 顶部 `@import "element-plus/theme-chalk/index.css"` | 避开 `viteCssAcceptFix` 触发的 CDN 拦截 |
| 样式隔离 | **禁止**在 `.vue` 中写 `<style scoped>`；统一在 `src/index.css` | 避免火山引擎 CDN 拦截 `.vue?type=style` |
| Token生成 | 服务端 uuid v4 | app_key / placement_id 等 |
| 瀑布流编辑 | 前端拖拽排序 + 三层可视化 | 直观配置 Bidding / Standard / Fallback |
| 数据隔离 | API 层强制注入 `developer_id` 过滤 | 当前 RLS 未启用，依赖 API 层 |
| Adapter文件存储 | 对象存储（S3 兼容） | CDN 分发，SDK 按配置拉取指定版本 |
| Adapter审核流程 | 状态机：待审核→审核通过→已上线→已下架 | 确保安全与质量 |
| 配置下发改造 | /api/v1/sdk/config 响应增加 customAdapters | SDK 动态下载加载自定义 Adapter |
| 页面底色 | #F8FAFC（slate-50） | 设计规范 |
| 侧边栏 | 蓝渐变 #1E3A8A → #1E40AF，宽 200px | 设计规范 |
| HMR 防自动刷新 | `index.html` 注入 DevGuard（劫持 WebSocket 拦截 full-reload） | 避免开发期页面莫名刷新 |

---

## 八、风险点与应对

| 风险 | 应对 | 状态 |
|------|------|------|
| Supabase RLS 当前未启用 | 全部依赖 service_role + API 层 developer_id 注入；存在越权风险，未来需补 RLS | 🆕 高 |
| 样式必须集中在 index.css | 禁止 .vue 内 `<style scoped>` 块，否则触发火山 CDN 拦截导致 SyntaxError | 🆕 中 |
| Element Plus CSS 加载位置 | 必须从 `index.css` 第 2 行 `@import` 引入，main.ts 不能 import | 🆕 中 |
| 注册表单字段数 | 已 9 字段（公司/简称/联系人/电话/邮箱/对接方式/密码/确认密码/验证码），用 2 列网格避免溢出 | 🆕 中 |
| 应用创建条件字段 | 微信 APP ID 仅 SDK 出现，Universal Link 仅 iOS+SDK 出现；后端校验对应"Universal Link 必填" | 🆕 低 |
| 开发期页面自动刷新 | index.html 注入 DevGuard，劫持 HMR WebSocket 拦截 full-reload 消息 + 监听 vite:beforeFullReload 事件 | 🆕 中 |
| tsx watch 不自动重启 | 修改 server 文件后偶发不触发，需手动 pkill 后通过 scripts/dev.sh 重启 | 🆕 低 |

---

## 九、偏差记录

> 开发过程中如发现计划与实际不符，在此记录。

| 日期 | 阶段 | 偏差描述 | 调整方案 | 影响范围 |
|------|------|---------|---------|---------|
| — | — | — | — | — |

---

## 十、迭代日志

> 每次更新本文件时记录变更。

| 日期 | 变更内容 |
|------|---------|
| 2026-07-07 | 初始创建，完整计划写入 |
