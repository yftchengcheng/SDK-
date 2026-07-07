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

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | Next.js 16 (App Router) + React 19 | 已初始化 |
| UI组件库 | shadcn/ui (Radix UI) | 已预装 |
| 样式方案 | Tailwind CSS 4 | 按DESIGN.md规范定制Design Tokens |
| 状态管理 | Zustand | 轻量级中后台状态管理 |
| 图表库 | Recharts | 折线图/柱状图/双轴图，'use client'避免SSR |
| 数据库 | Supabase (PostgreSQL) | 平台托管，Drizzle管理迁移 |
| 字体 | Inter | 设计规范指定 |
| 图标 | Lucide React | SVG矢量图标，禁止Emoji |
| 文件上传 | 对象存储（S3兼容） | Adapter文件上传至CDN |
| JWT | jose库 + HttpOnly Cookie | 7天有效期，自签方案 |

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
| 1.2 | 创建全部13张数据库表（Drizzle schema → db upgrade → RLS） | 13张表 + RLS策略 | ⬜ |
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
| JWT实现 | 自签JWT（jose库），HttpOnly Cookie | 无需外部Auth服务，适合中后台 |
| Token生成 | 服务端 SecureRandom + Base62 | 严格遵循PRD规范，碰撞概率 ≈ 1/4.7×10²⁸ |
| 瀑布流编辑 | 前端拖拽排序 + 三层可视化 | 直观配置Bidding/Standard/Fallback |
| 图表渲染 | Recharts（CSR only，'use client'） | 避免SSR hydration问题 |
| 数据隔离 | Supabase RLS + developer_id API层过滤 | 双重保障 |
| Adapter文件存储 | 对象存储（S3兼容） | CDN分发，SDK按配置拉取指定版本 |
| Adapter审核流程 | 状态机：待审核→审核通过→已上线→已下架 | 确保安全与质量 |
| 配置下发改造 | /api/v1/sdk/config 响应增加 customAdapters | SDK动态下载加载自定义Adapter |
| 页面底色 | #F8FAFC（slate-50） | 设计规范 |
| 侧边栏 | 蓝渐变 #1E3A8A → #1E40AF，宽200px | 设计规范 |

---

## 八、风险点与应对

| 风险 | 应对 | 状态 |
|------|------|------|
| Supabase RLS配置复杂 | 严格按skill文档场景选择，逐步验证 | — |
| 瀑布流拖拽排序实现 | 原生HTML5 Drag&Drop，避免额外依赖 | — |
| Recharts SSR问题 | 图表组件'use client' + 动态import | — |
| JWT安全 | HttpOnly + Secure + SameSite=Strict，7天有效期 | — |
| Adapter文件上传大文件 | 对象存储支持分片上传，前端进度条+MD5校验 | — |
| 自定义网络审核并发 | 乐观锁（版本号）防重复审核 | — |
| 30个API接口易遗漏 | 按清单逐一测试，确保100%覆盖 | — |
| SDK配置下发性能 | 配置缓存+增量更新（isFullUpdate标记） | — |

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
