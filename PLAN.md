# PLAN.md — SDK 聚合系统 产品规划与事实基准

> **本文档是当前系统的「事实基准」**，所有页面/路由/接口/数据库表以**实际实现**为准。
>
> 任何新 PRD 必须先核对本文档的「实际事实」章节，再展开。
>
> **维护原则**：
> 1. 「实际事实」章节 = 当前代码/数据库的真实状态，每次代码变更同步更新
> 2. 「已完成模块」 = 已经交付的功能总览
> 3. 「下一步规划」 = 未来要做的事
> 4. 老的"阶段 + ⬜ 待办"格式已废弃，不再使用

---

## 一、产品定位

广告 SDK 聚合平台**管理后台** + **开发者 SDK 下载中心**，支持：

1. **应用/广告位/瀑布流/广告源/流量分组管理** —— 开发者配置自己的接入
2. **数据看板 / 综合报表 / 漏斗分析 / 用户行为 / 对账** —— 监控广告表现
3. **广告平台 + 自定义 Adapter 对接 6 步流程** —— 上传 Adapter → 平台账号 → 数据上报 → 联调测试 → 上线 → 维护
4. **SDK 下载中心** —— 开发者下载 Android/iOS SDK + 阅读技术文档 + 查看隐私政策

---

## 二、实际事实（事实基准）

### 2.1 前端技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| Framework | Vue 3 (Composition API) | 3.x |
| 构建 | Vite | 7 |
| Language | TypeScript | 5.6 (strict) |
| UI 组件 | Element Plus + @element-plus/icons-vue | 2.14 |
| 样式 | Tailwind CSS + 自定义 Design Tokens | 3.4 |
| State | Pinia | 3 |
| Router | vue-router | 4 |
| Charts | ECharts + vue-echarts | 6 |
| HTTP | axios | — |
| 日期 | dayjs | — |
| 字体 | Inter | — |

### 2.2 后端技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| Runtime | Node.js 20+ / Express 4 | tsx watch（开发） / tsup CJS（生产）|
| Language | TypeScript 5.6 | strict 模式 |
| Auth | jsonwebtoken (HS256 / 7 天) | HttpOnly Cookie 优先，回退 Bearer |
| 密码 | bcryptjs | — |
| Database | Supabase (PostgreSQL) | `@supabase/supabase-js` service_role 直连 |
| Cache | node-cache | 验证码 token |
| SDK | coze-coding-dev-sdk | 集成能力 |

### 2.3 路由清单（vue-router）

#### 公共路由

| Path | 名称 | 组件 | 说明 |
|------|------|------|------|
| `/login` | Login | `views/auth/Login.vue` | 登录页（标题"欢迎回来"）|
| `/register` | Register | `views/auth/Register.vue` | 注册页（邮箱 + 验证码）|

#### 主控制台（开发者端 / 运营端共用）

| Path | 名称 | 组件 | 说明 |
|------|------|------|------|
| `/` | — | 重定向到 `/dashboard` | — |
| `/dashboard` | Index | `views/dashboard/Index.vue` | 数据看板（ECharts 多图）|
| `/app` | App | `views/app/Index.vue` | 应用管理（CRUD + 频次/广告位/网络绑定 Drawer）|
| `/placement` | Placement | `views/placement/Index.vue` | 广告位管理 |
| `/aggregation/traffic-group` | TrafficGroup | `views/traffic-group/Index.vue` | 流量分组 |
| `/aggregation/ad-source` | AdSource | `views/ad-source/Index.vue` | 广告源管理 |
| `/aggregation/waterfall` | Waterfall | `views/waterfall/Index.vue` | 瀑布流配置（3 层 + 流量分组加载）|
| `/report/overview` | Overview | `views/report/Overview.vue` | 综合报表（指标选择 + ECharts + 表格）|
| `/report/funnel` | Funnel | `views/report/Funnel.vue` | 漏斗分析 |
| `/report/behavior` | Behavior | `views/report/Behavior.vue` | 用户行为 |
| `/reconciliation` | Reconciliation | `views/reconciliation/Index.vue` | 对账管理 |
| `/network` | Network | `views/network/Index.vue` | 广告平台（Tabs：自定义网络 / Adapter / 账号 / 报告）|
| `/message` | Message | `views/message/Index.vue` | 消息中心 |
| `/sdk` | SDK Index | `views/sdk/Index.vue` | SDK 下载（Android/iOS Tab）|
| `/sdk/docs` | SDK Docs | `views/sdk/Docs.vue` | 技术文档（左侧分类 + 右侧 markdown 渲染）|
| `/sdk/history` | SDK History | `views/sdk/History.vue` | 版本历史时间线 |
| `/sdk/privacy` | SDK Privacy | `views/sdk/Privacy.vue` | 隐私政策（外链 iframe + 跳转）|
| `/profile` | Profile | `views/profile/Index.vue` | 个人中心 |

#### 管理端（admin 角色可见）

| Path | 名称 | 组件 | 说明 |
|------|------|------|------|
| `/admin/developers` | Developers | `views/admin/Developers.vue` | 开发者管理（角色/状态）|
| `/admin/report-metric` | ReportMetric | `views/admin/ReportMetric.vue` | 指标字典（CRUD + 分类）|
| `/admin/sdk/releases` | SdkReleases | `views/admin/SdkReleases.vue` | SDK 版本管理（admin CRUD）|
| `/admin/sdk/docs` | SdkDocs | `views/admin/SdkDocs.vue` | 文档管理（admin CRUD）|
| `/admin/sdk/privacy` | SdkPrivacy | `views/admin/SdkPrivacy.vue` | 隐私政策管理（admin CRUD + 外链/内部切换）|

### 2.4 后端 API 清单

#### 鉴权 (`/api/v1/auth`)

| Method | Path | 说明 |
|--------|------|------|
| POST | `/register` | 邮箱注册（验证码）|
| POST | `/login` | 登录（返回 JWT + 写入 HttpOnly Cookie）|
| POST | `/logout` | 登出（清除 Cookie）|
| GET | `/me` | 当前用户信息 |
| PUT | `/profile` | 更新个人信息 |
| PUT | `/password` | 修改密码 |
| POST | `/api-token` | 生成 API Access Token（永久）|
| POST | `/verify` | 验证 Token |
| POST | `/send-captcha` | 发送邮箱验证码（公共）|

#### 应用 (`/api/v1/console/app`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/list` | 应用列表 |
| POST | `/create` | 创建应用 |
| GET | `/detail` | 应用详情 |
| PUT | `/update` | 更新应用 |
| PUT | `/toggle-status` | 启/停用 |
| DELETE | `/delete` | 删除 |
| POST | `/upload-icon` | 上传应用图标 |
| GET | `/:id/frequency` | 频次配置详情 |
| PUT | `/:id/frequency` | 更新频次配置 |

#### 广告位 (`/api/v1/console/placement`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/list` | 列表 |
| POST | `/create` | 创建 |
| GET | `/detail` | 详情 |
| PUT | `/update` | 更新 |
| DELETE | `/delete` | 删除 |

#### 广告源 (`/api/v1/console/ad-source`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/list` | 列表 |
| POST | `/create` | 创建 |
| PUT | `/update` | 更新 |
| DELETE | `/delete` | 删除 |
| GET | `/networks` | 可选广告平台列表（已绑定）|
| POST | `/create-custom` | 关联自定义广告平台 |

#### 流量分组 (`/api/v1/console/traffic-group`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/list` | 列表（按 placement_id 过滤）|
| POST | `/create` | 创建 |
| PUT | `/update` | 更新 |
| DELETE | `/delete/:id` | 删除 |

#### 瀑布流 (`/api/v1/console/waterfall`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/get` | 当前配置（兼容 placement_id 数字+业务码双入参）|
| GET | `/list` | 历史版本列表 |
| POST | `/update` | 更新配置（双写：config.layers JSONB + waterfall_layer 表）|
| GET | `/history` | 历史快照 |

#### 数据看板 (`/api/v1/console/dashboard`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/overview` | 核心指标聚合 |
| GET | `/trend` | 趋势数据 |
| GET | `/ranking/:dimension` | 排行榜（placement/source/app）|

#### 综合报表 (`/api/v1/console/report`)

| Method | Path | 说明 |
|--------|------|------|
| POST | `/` | 旧版报表聚合（按维度 + 指标）|
| GET | `/daily` | 每日明细 |
| GET | `/export` | 导出 |

#### 报表-指标字典 (`/api/v1/console/report-metric`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/list` | 指标列表 |
| GET | `/categories` | 指标分类 |
| POST | `/create` | 创建指标 |
| PATCH | `/update/:id` | 更新 |
| DELETE | `/delete/:id` | 删除 |

#### 报表-看板 (`/api/v1/console/report/board`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/list` | 看板列表 |
| GET | `/detail/:id` | 看板详情 |
| POST | `/create` | 创建 |
| PATCH | `/update/:id` | 更新 |
| DELETE | `/delete/:id` | 删除 |
| POST | `/duplicate/:id` | 复制 |

#### 报表-聚合（核心）(`/api/v1/console/report`)

| Method | Path | 说明 |
|--------|------|------|
| POST | `/aggregate/options` | 聚合选项（维度/指标/过滤）|
| POST | `/aggregate` | 聚合查询 |
| POST | `/aggregate/validate-formula` | 公式校验 |
| GET | `/funnel/definition` | 漏斗定义 |
| POST | `/export/csv` | CSV 导出 |
| POST | `/export/excel` | Excel 导出 |
| POST | `/export/pdf` | PDF 导出 |
| GET | `/export/download/:filename` | 下载导出文件 |

#### 对账 (`/api/v1/console/reconciliation`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/list` | 对账单列表 |
| POST | `/import` | 导入对账数据 |
| GET | `/export` | 导出对账 |
| POST | `/resolve` | 差异处理 |

#### 消息 (`/api/v1/console/message`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/list` | 消息列表 |
| PUT | `/read` | 标记已读 |
| PUT | `/read-all` | 全部已读 |
| PUT | `/:id/read` | 单条已读 |
| GET | `/unread-count` | 未读数 |

#### 广告平台 (`/api/v1/console/network`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/list` | 广告平台列表 |
| GET | `/custom/list` | 自定义网络列表 |
| POST | `/custom/create` | 创建自定义网络 |
| POST | `/custom/update` | 更新自定义网络 |
| PUT | `/custom/:id` | 更新（PK）|
| DELETE | `/custom/:id` | 删除 |
| GET | `/custom/detail` | 自定义网络详情 |
| GET | `/custom/adapter/versions` | 自定义网络 Adapter 版本列表 |
| POST | `/custom/adapter/upload` | 上传 Adapter |
| PUT | `/custom/adapter/status` | 更新 Adapter 状态 |
| DELETE | `/adapter/:id` | 删除 Adapter |
| GET | `/adapter/list` | Adapter 列表 |
| POST | `/adapter/upload` | 上传 Adapter（preset 网络）|
| GET | `/adapter/download/:id` | 下载 Adapter |
| POST | `/adapter/review/:id` | 审核 Adapter（PASS/REJECT）|
| POST | `/app/bind` | 绑定应用到自定义网络 |
| POST | `/app/unbind` | 解绑 |
| GET | `/app/list` | 应用绑定列表 |
| POST | `/custom/report/upload` | 上报自定义网络数据 |
| GET | `/custom/report/query` | 查询自定义网络数据 |
| POST | `/account/create` | 创建广告平台账号 |
| GET | `/account/list` | 账号列表 |
| GET | `/account/detail` | 账号详情 |
| PUT | `/account/:id` | 更新账号 |
| DELETE | `/account/:id` | 删除账号 |
| POST | `/custom/upload-icon` | 自定义网络图标上传 |

#### 个人中心 (`/api/v1/console/profile`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/info` | 个人信息 |
| PUT | `/info` | 更新信息 |
| PUT | `/password` | 改密 |
| POST | `/api-token` | 生成 API Token |
| PATCH | `/api-token/expire` | Token 过期 |
| GET | `/tokens` | Token 列表 |

#### 管理 (`/api/v1/console/admin`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/developers` | 开发者列表 |
| PATCH | `/developers/:id/role` | 改角色 |
| PATCH | `/developers/:id/status` | 改状态 |

#### HAL (`/api/v1/hal`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/config` | SDK 拉取配置 |

#### SDK 内部接口 (`/api/v1/sdk`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/config` | 同 HAL（合并）|

#### SDK CMS 公开接口 (`/api/v1/sdk-cms`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/releases` | 版本列表（按平台）|
| GET | `/releases/latest` | 最新版本 |
| GET | `/releases/:id` | 版本详情 |
| POST | `/releases/:id/download` | 记录下载次数 |
| GET | `/doc-categories` | 文档分类 |
| GET | `/docs` | 文档列表 |
| GET | `/docs/:id` | 文档详情 |
| GET | `/privacy/policy` | 隐私政策（按 platform 过滤生效中）|
| POST | `/privacy/consent` | 记录用户同意 |

#### SDK CMS 管理接口 (`/api/v1/sdk-cms`)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/admin/releases` | 版本列表（全部）|
| POST | `/admin/releases` | 创建版本 |
| PUT | `/admin/releases/:id` | 更新 |
| DELETE | `/admin/releases/:id` | 删除 |
| GET | `/admin/docs` | 文档列表（全部）|
| POST | `/admin/docs` | 创建文档 |
| PUT | `/admin/docs/:id` | 更新 |
| DELETE | `/admin/docs/:id` | 删除 |
| GET | `/admin/privacy` | 政策列表（全部）|
| POST | `/admin/privacy` | 创建政策 |
| PUT | `/admin/privacy/:id` | 更新 |

### 2.5 数据库表（27 张 = 13 业务核心 + 5 SDK 模块 + 4 报表 + 1 健康检查 + 4 辅助）

#### 13 张核心业务表

| # | 表名 | 关键字段 | 唯一约束 | 说明 |
|---|------|---------|---------|------|
| 1 | `developer` | developer_id, email, password, company, role, status, notify_* | developer_id / email | 开发者表 + 通知偏好 |
| 2 | `app` | app_key, app_name, package_name, platform, status, frequency_config | app_key | 应用表（含频次配置 JSONB）|
| 3 | `placement` | placement_id, name, format, status, bidding_type, screen_orientation | placement_id | 广告位表 |
| 4 | `ad_source` | network_code, source_name, third_app_id, third_placement_id, is_custom, app_id, placement_id, network_def_id | — | 广告源表 |
| 5 | `waterfall_config` | placement_id, version, traffic_group_id, status, **layers (JSONB)** | (placement_id+version+traffic_group_id) 复合 | 瀑布流配置主表 + layers JSONB 缓存 |
| 6 | `waterfall_layer` | config_id, layer_type, ad_source_id, sort_price, timeout_ms, priority | — | 瀑布流层级明细表 |
| 7 | `traffic_group` | placement_id, group_name, conditions(JSONB), priority, is_default, is_system, is_locked | — | 流量分组表 |
| 8 | `report_daily` | developer_id, app_key, placement_id, ad_source_id, stat_date, hour, requests/fills/impressions/clicks/revenue, ad_type, region, os | (developer_id+app_key+placement_id+ad_source_id+stat_date+hour) 复合 | 每日聚合 |
| 9 | `message` | developer_id, type, title, content, is_read | — | 消息表 |
| 10 | `custom_adapter_version` | network_def_id, version, file_name, file_url, file_md5, status, review_comment, reviewed_by, reviewed_at | — | 自定义网络 Adapter 版本 |
| 11 | `custom_network_report` | developer_id, app_key, placement_id, network_def_id, stat_date, impressions/clicks/revenue, upload_type | — | 自定义网络数据上报 |
| 12 | `app_network_binding` | app_key, network_def_id, adapter_version_id, account_id, status, extra_params | — | 应用 × 网络 × 账号 绑定 |
| 13 | `ad_network_def` | network_code, network_name, network_type, is_preset, system_type, supports_bidding, icon_url, adapter_class_*_android/ios | network_code | 广告平台定义（preset + custom）|

#### 5 张 SDK 模块表

| # | 表名 | 关键字段 | 说明 |
|---|------|---------|------|
| 14 | `sdk_release` | platform, version, version_code, changelog, download_url, file_md5, sdk_min_version, min_os_version, release_type, status, is_latest, is_force_update, release_date | SDK 版本（Android/iOS）|
| 15 | `sdk_doc` | category_id, title, slug, content_format(1=HTML/2=MD), content, excerpt, is_published, is_featured | 技术文档 |
| 16 | `sdk_doc_category` | name, code, description, icon, sort_order, is_active | 文档分类 |
| 17 | `sdk_privacy_policy` | version, platform, title, content_format(1=HTML/2=MD/3=外链), content, summary, effective_date, status, **source_url** | 隐私政策（支持外链模式）|
| 18 | `sdk_privacy_consent` | developer_id, privacy_id, ip_address, user_agent, consented_at | 隐私政策同意记录 |

#### 4 张报表/对账表

| # | 表名 | 关键字段 | 说明 |
|---|------|---------|------|
| 19 | `report_metric_definition` | code, name, category, sub_category, value_type, unit, format, formula, required_fields[], is_active, is_system | 指标字典（核心：可配置指标 + 公式）|
| 20 | `report_funnel_metric_definition` | stage, code, name, is_event, event_index, formula | 漏斗指标 |
| 21 | `report_board` | developer_id, name, report_type, is_default, is_hidden, config(JSONB), sort_order | 报表看板（保存自定义看板）|
| 22 | `reconciliation` | developer_id, app_key, network_code, stat_date, expected_revenue, actual_revenue, diff, status | 对账表（待补全）|

#### 5 张辅助/历史表

| # | 表名 | 关键字段 | 说明 |
|---|------|---------|------|
| 23 | `health_check` | id, status, last_check_at | 服务健康检查 |
| 24 | `ad_source_traffic_group` | — | 旧版 ad_source × traffic_group 关联（保留）|
| 25 | `ad_network_account` | developer_id, network_def_id, app_id, account_name, account_id, credentials(JSONB), status, remark | **自定义网络/preset 网络账号管理** |
| 26 | `hal_message` | — | HAL 消息（待用）|
| 27 | `hal_session` / `hal_ticket` | — | HAL 会话（待用）|

### 2.6 关键设计规范

| 维度 | 规范 | 详细位置 |
|------|------|---------|
| 配色 | 主色蓝 #1E40AF / 侧边栏蓝渐变 / 底色 #F8FAFC | `DESIGN.md` |
| 字体 | Inter (Google Fonts CN 域名) | `src/index.css` |
| 圆角 | 8px 卡片 / 4px 按钮 | `DESIGN.md` |
| 状态标签 | 蓝（已发布）/绿（运行中）/橙（待审）/红（停用） | `DESIGN.md` |
| 响应式 | 桌面优先（≥1280px）| — |
| 鉴权 | HttpOnly Cookie 优先 + Bearer Token 回退 | `server/middleware/auth.ts` |
| API 响应 | `{ code, message, data }` | `server/utils/response.ts` |
| 字段命名 | snake_case（Supabase 要求）| — |
| 路径别名 | `@` → `src/` | `vite.config.ts` |
| 端口 | 5000（`DEPLOY_RUN_PORT` 环境变量）| `.coze` |

### 2.7 关键架构决策

1. **瀑布流 layers 双写策略**：`waterfall_config.layers` JSONB + `waterfall_layer` 关联表双写，前端优先 JSONB 为空时回退关联表
2. **placement_id 双入参兼容**：后端 `.in('placement_id', [pidStr, placementIdStr])` 兼容 number / business code
3. **隐私政策三模式**：content_format 1=HTML / 2=Markdown / 3=外链（source_url 字段）
4. **网络类型预置判断**：用 `ad_network_def.is_preset`，**不要用 `network_type`（被滥用）**
5. **指标字典驱动**：综合报表 / 漏斗指标 / 看板全部从 `report_metric_definition` / `report_funnel_metric_definition` 读取
6. **系统/默认/锁定流量分组**：`traffic_group.is_default` / `is_system` / `is_locked` 三态
7. **SDK API Token**：7 天 JWT 用于 Web 端 HttpOnly Cookie；永久 API Token（`developer.api_access_token`）用于服务端 SDK 上报

---

## 三、已完成模块（按时间线）

### 阶段 1：基础设施

- ✅ 14 张核心表 + RLS 暂未启用
- ✅ 鉴权（JWT + HttpOnly Cookie + 邮箱验证码注册）
- ✅ 用户/应用/广告位/广告源 基础 CRUD
- ✅ 13 个主控台页面

### 阶段 2：数据可视化与业务深化

- ✅ 数据看板（ECharts 多图）
- ✅ 综合报表（指标字典驱动 + 公式校验 + 多维聚合）
- ✅ 漏斗分析 / 用户行为
- ✅ 对账管理（导入 / 导出 / 差异处理）
- ✅ 瀑布流配置（3 层 + 流量分组 + 历史快照）
- ✅ 报表看板（保存自定义看板 / 默认 / 复制）
- ✅ 指标字典（admin CRUD + 系统/自定义）

### 阶段 3：广告平台 + 自定义网络 6 步对接

- ✅ 步骤 1：上传 Adapter（preset + custom 两路）
- ✅ 步骤 2：广告平台账号（`ad_network_account` 表 + 5 API + NetworkAccountManager 弹窗 + 凭证查看 drawer + JSON 脱敏）
- ✅ 步骤 3：数据上报格式（`custom_network_report` 表 + upload/query）
- ✅ 步骤 4：联调测试（`/ad-source/create-custom` 关联自定义网络）
- ✅ 步骤 5：上线（`/custom/adapter/status` + `/adapter/review/:id`）
- ✅ 步骤 6：维护监控（`/custom/report/query` + 对账）

### 阶段 4：管理后台

- ✅ 开发者管理（角色/状态切换）
- ✅ 指标字典（系统/自定义分类）
- ✅ SDK 版本/文档/隐私政策 CRUD

### 阶段 5：SDK 下载中心

- ✅ 5 张 SDK 表（release / doc / doc_category / privacy_policy / privacy_consent）
- ✅ 4 个开发者端页面（下载 / 文档 / 历史 / 隐私）
- ✅ 3 个 admin 端页面（版本 / 文档 / 隐私）
- ✅ 12+ SDK CMS API（公开 8 + admin 6）
- ✅ 11 版本 + 5 分类 + 7 文档 + 2 政策 seed
- ✅ 隐私政策外链模式（`source_url` 字段，开发者端 iframe 嵌入）

### 阶段 6：UI 精修

- ✅ 综合报表表头/数据整体居中对齐（`text-align: center` + flex `justify-content: center`）
- ✅ 指标弹窗 6 列并行布局 + 字号缩到 12/11/10px
- ✅ 指标弹窗 1100 宽 + 已选列与弹窗主体等高
- ✅ 已选列超出可滚动（不再撑大弹窗）
- ✅ 品牌名 YTads → 新义（隐私政策 / SDK 下载首页 / 标题文案）

---

## 四、关键交互模式（页面级）

### 4.1 登录页

- 标题「欢迎回来」+ 副标题「使用邮箱和密码登录到广告平台管理后台」
- 邮箱 + 密码 + 记住我 + 忘记密码链接（暂未实现）
- 底部「还没有账号？立即注册」

### 4.2 应用管理

- 列表：图标 + 名称 + AppKey + 平台 tag + 状态 + 操作
- 创建/编辑 Drawer：基本 + 商店 + 法规 + 微信 + 频次 5 个分组
- 频次：单独 FrequencyDrawer 弹窗（每 X 分钟最多 Y 次）
- 关联广告位/网络：单独 Drawer，多选 + 列表

### 4.3 瀑布流配置

- 顶部：广告位下拉 + 流量分组下拉 + 当前 version 标签
- 中部：3 个 Tab（Bidding / 瀑布 / 兜底），每层多 ad_source 拖拽排序
- 底部：保存按钮 + 历史 version 列表（每行可「加载」回显到编辑面板）
- 关键修复：placement_id 双入参兼容（数字 ID + 业务码 pl_xxx）
- 「已加载」按钮：避免误把 `[]` 当作"无配置"

### 4.4 综合报表

- 顶部：指标选择 + 维度选择 + 时间范围 + 平台/系统/应用/广告位/广告源 筛选 + 查询
- 中部：4 个核心指标卡片
- 下部：ECharts 趋势图 + 表格
- **关键修复**：表头/数据整体居中（不再错位）
- 指标弹窗：6 列并行，1100 宽，已选列等高 + 超出可滚动

### 4.5 广告平台 / 自定义网络

- 4 个 Tab：自定义网络 / Adapter / 账号 / 数据上报
- 自定义网络 Tab：列表 + 创建弹窗（基本 + 图标 + 状态）
- Adapter Tab：版本列表 + 上传 + 审核（PASS/REJECT + 备注）
- 账号 Tab：账号列表 + 创建/编辑（凭证字段 schema-driven 动态渲染 + 凭证查看 drawer + JSON 脱敏）
- 数据上报 Tab：CSV 导入 + 查询

### 4.6 SDK 下载中心

- **下载首页**：hero + 平台 Tab（Android/iOS） + 最新版本卡片 + Changelog 折叠 + 下载按钮
- **技术文档**：左侧分类（入门/集成/API 参考/高级/FAQ）+ 右侧 markdown 渲染 + 相关文章
- **版本历史**：时间线（按版本倒序 + 平台 Tag + 强制更新 Tag）
- **隐私政策**：检测 `source_url` 存在 → iframe 嵌入 + "前往官方原文"按钮（外链模式）；否则按 content_format 渲染

### 4.7 管理后台

- **开发者管理**：列表 + 角色 / 状态切换
- **指标字典**：分类树 + 列表 + 创建 / 编辑（公式编辑器 + 必填字段 + 类型）
- **SDK 版本管理**：列表 + 创建 / 编辑（平台 + 版本号 + Changelog + 下载 URL + MD5 + 强制更新）
- **SDK 文档管理**：分类筛选 + 列表 + 富文本/Markdown 编辑
- **SDK 隐私政策管理**：列表 + 创建 / 编辑（**内容来源切换：内部内容/外部链接** + 外链 URL 校验）

---

## 五、下一步规划（待办）

### 5.1 短期（功能补完）

| # | 任务 | 优先级 | 备注 |
|---|------|-------|------|
| 1 | reconciliation 表结构补全（当前字段可能缺失） | 高 | schema 审计 |
| 2 | 消息通知实际触发链路（notify_* 偏好接入） | 中 | 现仅有偏好字段 |
| 3 | HAL session/ticket 表实际启用 | 中 | 占位表 |
| 4 | 自定义网络图标上传接入（custom/upload-icon 路由已实现，待 UI 联调）| 低 | — |
| 5 | 报表导出格式扩展（已支持 csv/excel/pdf）| — | ✅ 已完成 |

### 5.2 中期（产品迭代）

| # | 任务 | 优先级 | 备注 |
|---|------|-------|------|
| 1 | 漏斗分析图表化（现以表格为主）| 中 | — |
| 2 | 用户行为路径分析（funnel → behavior 联动）| 中 | — |
| 3 | 对账差异智能标记（异常点检测）| 中 | — |
| 4 | 报表看板共享 / 团队协作 | 低 | — |
| 5 | SDK 集成示例代码生成（按平台/版本）| 低 | — |

### 5.3 长期（架构演进）

| # | 任务 | 优先级 | 备注 |
|---|------|-------|------|
| 1 | Supabase RLS 启用（当前用 service_role 绕过）| 高 | 安全审计 |
| 2 | 对象存储接入（Adapter 文件当前为 URL 字段）| 中 | S3 兼容 |
| 3 | SDK 实时数据上报 → Kafka → 实时看板 | 中 | — |
| 4 | 多语言（i18n）| 低 | 当前中文为主 |

---

## 六、变更记录

### 2026-07-18：PLAN.md 整体重构

- 旧版本基于早期 12 模块设计，与当前实现偏差较大
- 新版本以**当前实际代码/路由/API/DB 为事实基准**
- 新增：5 张 SDK 模块表、4 张报表辅助表、27 张表完整字段说明
- 新增：所有 API 端点完整列表（auth / app / placement / ad-source / traffic-group / waterfall / dashboard / report / report-metric / report-board / report-aggregate / reconciliation / message / network / profile / admin / hal / sdk / sdk-cms）
- 新增：6 步对接流程落地状态
- 新增：关键 UI 修复记录（表头居中 / 指标弹窗 6 列 / 已选列等高 / 品牌名替换）
- 废弃：旧的"阶段 + ⬜ 待办"格式

### 历史变更（摘要）

- SDK 模块完整实施（11 版本 + 5 分类 + 7 文档 + 2 政策 seed）
- 自定义网络 6 步对接全流程
- 综合报表指标驱动 + 公式校验 + 多格式导出
- 瀑布流 layers 双写 + placement_id 双入参兼容
- 隐私政策外链模式
- 品牌名 YTads → 新义（隐私政策 / SDK 下载首页）
- 登录页标题改"欢迎回来"

---

> **下次更新时机**：每次代码变更后同步更新「实际事实」章节对应行。
