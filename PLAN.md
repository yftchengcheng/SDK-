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

## 四、功能架构

### 4.1 模块依赖图

```
┌─────────────────────────────────────────────────────────────┐
│              前端 (Vue 3 SPA + Element Plus)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 应用/广告位 │  │ 瀑布流/分组│  │ 报表/对账 │  │ SDK/平台 │    │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘    │
│        └──────┬───────┴────────────┴────────────┘           │
│           axios (auth_token cookie + Bearer fallback)        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP /api/v1/*
┌────────────────────────┴────────────────────────────────────┐
│               后端 (Express + tsx watch)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  auth/   │  │  app/    │  │ waterfall│  │ report/  │    │
│  │  developer│  │ placement │  │ /network │  │ recon    │    │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘    │
│        └──────┬───────┴────────────┴────────────┘           │
│              @supabase/supabase-js (service_role 直连)        │
└────────────────────────┬────────────────────────────────────┘
                         │ SQL via service_role (RLS off)
┌────────────────────────┴────────────────────────────────────┐
│            Supabase (PostgreSQL 14)                          │
│  13 业务核心表 + 5 SDK 模块表 + 4 报表表 + 5 辅助表 = 27 张    │
└──────────────────────────────────────────────────────────────┘
                         ▲
                         │ 数据上报（SDK 集成后）
┌────────────────────────┴────────────────────────────────────┐
│           客户端 SDK (Android / iOS / Web)                  │
│  /api/v1/sdk/*  ←  拉取瀑布流 / 上报曝光/点击/请求             │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 角色权限矩阵

| 模块 | 开发者 (developer) | 管理员 (admin) | SDK 端 (无 token) |
|------|------------------|---------------|-----------------|
| 应用 / 广告位 / 广告源 | CRUD（仅自己 developer_id）| 全部读写 | ✗ |
| 瀑布流 / 流量分组 | CRUD（仅自己）| 全部读写 | ✗ |
| 报表 / 对账 | 只读（仅自己）| 全部读写 | ✗ |
| 广告平台 | 只读 + 账号管理（仅自己）| 全部读写 + 自定义网络 + Adapter 审核 | ✗ |
| SDK 下载 / 文档 / 隐私 | 只读 | **写**（CMS）| **只读**（无需 token，公开）|
| 开发者管理 | ✗ | 全部读写 | ✗ |
| 指标字典 | 只读 | 全部读写 | ✗ |
| SDK 上报接口 | ✗ | ✗ | **读写**（API Key 鉴权）|

> 当前实现：除 `/auth/login` `/auth/register` `/auth/send-captcha` `/sdk/*` 公开外，所有接口统一过 `authMiddleware`，role 区分在路由内部 `req.user.role === 'admin'` 判定。

### 4.3 核心数据流

**A. 报表数据流（每日聚合）**
```
客户端 SDK 实时上报
   → POST /api/v1/sdk/track  → 写 report_daily（按小时聚合）
                                      ↓
                              GET /report/daily?start=&end=&group=
                                      ↓
                              前端表格 / ECharts
```

**B. 瀑布流下发流**
```
开发者配置瀑布流（双写 waterfall_config.layers + waterfall_layer 表）
   → 客户端 SDK 拉取 GET /sdk/waterfall?app_key=&placement_id=
       → SDK 按 Bidding → 瀑布 → 兜底 顺序请求 ad_source
            → 各 ad_source 返回填充 / 出价
                 → SDK 上报曝光 / 点击 → 回到 A
```

**C. 自定义网络 6 步对接流**
```
① 广告平台定义（ad_network_def is_preset=false）
② 账号管理（ad_network_account）
③ Adapter 上传（custom_adapter_version）
④ Adapter 审核（admin：PASS/REJECT + 备注）
⑤ 应用关联（app_network_binding）
⑥ 数据接入（custom_network_report）
```

### 4.4 鉴权体系

- **HttpOnly Cookie `auth_token`**：浏览器登录态（dev 不带 Secure，prod 带 Secure；SameSite=Strict）
- **`Authorization: Bearer <token>`**：SDK 集成 / 移动端直连场景
- **`authMiddleware` 优先级**：先读 cookie，回退到 Authorization 头
- **JWT 载荷**：`{ developerId, email, role, iat, exp }`，HS256，7 天过期
- **公开接口白名单**：`/api/v1/auth/*`、`/api/v1/sdk-cms/releases/docs/categories/privacy/policy`、`/api/v1/sdk-cms/public/privacy-consent`

---

## 五、关键交互模式（页面级 PRD）

> 每个模块按 **UI 说明 · 业务逻辑 · 关键库表 · 注意事项** 四个维度展开。

### 5.1 登录页

**UI 说明**
- **顶部 hero 区**：左半屏（640px 宽）品牌侧 — Logo + 大字标题「欢迎回来」+ 副标题「使用邮箱和密码登录到广告平台管理后台」+ 3 条产品特性
- **右半屏表单卡**：480px 宽，圆角 12px，白底
  - 邮箱输入框（带 `@` 前缀图标）+ 密码框（带显示/隐藏切换眼睛图标）
  - 「记住我」复选框（仅 7 天内免重新登录）
  - 主按钮「登录」+ 「还没有账号？立即注册」副链接
- **错误提示**：输入框下方红字 + Toast 顶栏提示

**业务逻辑**
- 登录：POST `/auth/login` → 成功 setHttpCookie + 返回 userInfo → Pinia.userStore 注入
- 失败：错误码映射到 UI（密码错 = 通用提示，账号锁定 = 倒计时）
- 验证码：POST `/auth/send-captcha`（开发环境直接返回 token 到 console，60s 有效，存 node-cache）

**关键库表**
- `developer`（`email` / `password_hash` / `status` / `role` / `last_login_at`）

**注意事项**
- 登录失败次数不锁（待补）
- 忘记密码流程未实现（链接占位）
- 注册时需邮箱验证码（`node-cache` 60s 过期）

### 5.2 应用管理

**UI 说明**
- **列表页**：表格列 = 图标 / 应用名 / AppKey / 平台 Tag / 状态 / 创建时间 / 操作
  - 顶部：搜索框 + 「创建应用」主按钮
  - 分页：每页 20 条
- **创建/编辑 Drawer**：右侧 720px 宽抽屉
  - **5 个分组**（el-collapse）：① 基本（应用名 / 包名 / 平台 / 接入类型）② 应用商店（URLs）③ 法规（隐私政策 URL / 用户协议 URL）④ 微信（AppID 等）⑤ 频次（FrequencyDrawer 弹窗二级嵌套）
- **关联广告位/网络 Drawer**：单独抽屉，标签页切换「广告位」/「广告网络」，每页多选 + 已关联列表
- **频次抽屉**：每 X 分钟最多 Y 次（单广告位粒度）

**业务逻辑**
- 创建：POST `/app`，`app_key` 后端自动生成（`ak_` + uuid 8 位）
- 平台枚举：1=Android / 2=iOS / 3=双端
- 接入类型枚举：1=自有 / 2=联运 / 3=合作
- 关联：POST `/app/:id/placements` / `/app/:id/networks`（多对多通过 `app_network_binding`）
- 频次规则：存在 `app.frequency_config` JSONB 字段，每广告位独立规则

**关键库表**
- `app`（`developer_id` / `app_key` / `app_name` / `package_name` / `platform` / `access_type` / `status` / `frequency_config`）
- `app_network_binding`（`app_key` / `network_def_id`）
- `placement`（外键通过 `app_key` 关联）

**注意事项**
- `app_key` 唯一（不区分 developer）
- 删除前必须先解除所有 placement / network 绑定（前端禁用按钮）
- iOS 必填字段：`bundle_id`（包名校验格式）

#### 5.2.4 广告位字段规则（placement_field_def 字典表，42 行）

> **维度**：`(format, access_type)` 二维矩阵
> - `format`：`1=横幅 / 2=插屏 / 3=开屏 / 4=原生 / 5=激励视频`
> - `access_type`：`1=SDK / 2=API`（继承自开发者账号，注册后不可改）
>
> **数据源**：`placement_field_def` 表（5 format × 2 access，42 行 seed）— 表结构由后端 `scripts/dict/seed-placement-field-def.ts` 维护
>
> **前端调用**：`dictCache.getPlacementFieldList(format, accessType)`（TTL 5min 单例缓存）
>
> **后端接口**：`GET /api/v1/dict/placement-field-def?format=1&accessType=1` → `{ items: [...] }`

**字段规则矩阵**：

| format | access=SDK | access=API |
|--------|------------|------------|
| 1 横幅 | ad_size / refresh_interval / show_close（3 字段） | ad_size / refresh_interval / show_close（3 字段） |
| 2 插屏 | ad_size / material_type / show_close / close_delay / **screen_orientation**（5 字段） | ad_size / material_type / show_close / close_delay（4 字段） |
| 3 开屏 | skip_time / show_skip / material_type / **screen_orientation**（4 字段） | skip_time / show_skip / material_type（3 字段） |
| 4 原生 | template_style / material_type / **video_mute** / **auto_play** / **screen_orientation**（5 字段） | template_style / material_type（2 字段） |
| 5 视频 | ad_size / material_type / reward_amount / reward_unit / skip_allowed / close_delay / **screen_orientation**（7 字段） | ad_size / material_type / reward_amount / reward_unit / skip_allowed / close_delay（6 字段） |

**SDK 专有字段**（API 接入不出现，3 个）：

| 字段名 | 出现 format | 取值 |
|--------|------------|------|
| `screen_orientation` 屏幕方向 | 2 插屏 / 3 开屏 / 4 原生 / 5 视频 | 0=竖屏 / 1=横屏 / 2=横竖兼容 |
| `video_mute` 视频静音 | 4 原生 | 0=否 / 1=是 |
| `auto_play` 自动播放 | 4 原生 | 1=总是 / 2=仅WIFI / 3=点击播放 |

**业务规则**：
- 创建广告位时 `access_type` 从 `developer.access_type` 继承（注册时锁定）
- 编辑时 `access_type` 不可改（沿用创建值）
- 字段明细表 UI 在 placement/Index.vue drawer 顶部展示
- 字典表行变更后 5 分钟内生效（TTL 自动刷新）

**注意事项**：
- `template_style` 13 选 1（1图1文/1图2文/1图3文/1图1图标1文/1图1图标2文/3图1文/1图标2文/3图1图标2文/1图1图标2文1按钮/图片/1视频1封面1文/1视频1封面1图标2文/1视频1封面）
- `ad_size` 取值随 format 变化：横幅=横幅/中幅/插屏位，插屏=半屏/全屏/优选，视频=竖版/横版
- `material_type` 取值随 format 变化：插屏=图片/视频/视频+图片，开屏=图片/视频，原生=图片/视频/视频+图片，视频=图片/视频/视频+图片

### 5.3 广告位管理（placement）

**UI 说明**
- **顶部工具栏**：广告位下拉（必选，触发加载） + 流量分组下拉（按 group 粒度） + 「新建配置」按钮 + 当前 version 标签
- **中部 3 Tab 拖拽区**：
  - **Bidding**（头客层）：多 ad_source 卡片，可拖拽排序
  - **瀑布**（瀑布层）：多 ad_source 卡片
  - **兜底**：单选 ad_source 卡片
  - 每卡片：平台 Logo + 广告源名 + eCPM 估值 + 拖拽手柄 + 删除
- **底部**：保存按钮 + 历史 version 表格（version / 创建时间 / 操作）
  - 每行可「加载」或整行点击 = 载入到编辑面板
  - 编辑中行：蓝色脉冲「编辑中」tag + 「已加载」按钮（disabled）

**业务逻辑**
- 保存：POST `/waterfall`，双写 `waterfall_config.layers`（JSONB）+ `waterfall_layer` 关联表
- 加载：GET `/waterfall?placement_id=&traffic_group_id=` 返回 `{ config: { layers: JSONB }, layers: rows }`
- 优先用 `config.layers`，为空时回退 `waterfall_layer`（避免误把 `[]` 当"无配置"）
- 历史 version：每次保存递增 `version`（同 placement_id + traffic_group_id 唯一）

**关键库表**
- `waterfall_config`（`placement_id` / `traffic_group_id` / `version` / `is_default_config` / `layers` JSONB / `status`）
- `waterfall_layer`（关联行：每条 layer 一个 row：id / config_id / layer_type / order / ad_source_id / ecpm）
- `ad_source`（作为可选项源）

**注意事项**
- ⚠️ `waterfall_config.placement_id` 实际存为 number-as-string（如 `"58"`），但 placement 表的 `placement_id` 列存为 `"pl_xxx"` — list 端用 `.in('placement_id', [pidStr, placementIdStr])` 兼容两种入参
- ⚠️ 新环境必须 ALTER TABLE 加 `layers JSONB` 列（已通过 `exec_sql` 修复）
- 默认分组（`is_default_config=true`）始终被选中
- 编辑中判断走 `traffic_group_id=0` 分支

### 5.4 瀑布流配置

**UI 说明**
- **顶部筛选区**（一行 6 元素）：
  - 指标选择 chip（多选，点击打开 MetricPicker 弹窗）
  - 维度 chip（应用 / 广告位 / 广告源 / 国家 / 系统 / 广告类型 / 时间）
  - 时间范围（近 7/30/90 天 + 自定义）
  - 平台 / 系统 / 应用 / 广告位 / 广告源 下拉（级联）
  - 「查询」主按钮
- **中部 4 个核心卡片**：请求数 / 展示数 / 点击数 / eCPM（每个含环比 %）
- **下部**：左 60% 趋势图（ECharts 折线/柱图切换） + 右 40% Top 列表
- **底部**：综合报表表格（**整体居中对齐** — 2026-07-18 修复）

**指标弹窗（MetricPicker）**
- 弹窗 1100×578，左 880px 6 列指标分类（5 大类 × 6 项），右 220px「已选」列
- 每项 11px 字号 + 10px 提示 + 12px checkbox
- 「已选」列高度 = 弹窗主体高度（不撑大），超出可滚动
- 底部「确认」/「重置」/「取消」

**业务逻辑**
- 查询：GET `/report/daily` 支持多维度 groupBy + 时间范围 + 指标列表
- 聚合：后端按 (developer_id, app_key, placement_id, ad_source_id, stat_date, hour) 复合唯一约束去重
- 趋势图数据 = 同指标按时间展开；表格数据 = 按选中维度展开
- 指标字典：表 `report_metric_definition`（含公式 / 单位 / 类型 / 分类）
- 漏斗指标：`report_funnel_metric_definition`

**关键库表**
- `report_daily`（6 字段复合唯一 + `request` / `impression` / `click` / `revenue` / `region` / `os` / `ad_type`）
- `report_metric_definition`（`code` / `name` / `category` / `formula` / `unit` / `data_type` / `required_fields`）
- `report_funnel_metric_definition`（漏斗专用）
- `report_board`（看板保存的配置）

**注意事项**
- ⚠️ 表格表头 / 数据**整体居中**（headerAlign: 'center' + align: 'center'，CSS `display: flex; justify-content: center`）
- ⚠️ 维度列与指标列都要居中（不能用 `text-align: right` 单独对齐数字列，会破坏维度）
- ⚠️ `report_daily` 唯一约束：循环里 region/os 随机会导致重复键（造数据严禁）
- 指标 chip 最多 6 个（性能边界）

### 5.5 综合报表 / 自定义网络

**UI 说明**
- **4 个 Tab**：
  1. **自定义网络**：表格 + 创建弹窗（基本 + 图标上传 + 状态）
  2. **Adapter**：版本列表 + 上传（zip + md5 + 适配平台 + changelog） + 审核弹窗（PASS/REJECT + 备注 + 生效时间）
  3. **账号**：账号列表 + 创建/编辑弹窗（**凭证字段 schema-driven 动态渲染** + 凭证查看 drawer + JSON 脱敏）+ 单账号详情
  4. **数据上报**：CSV 导入 + 上报记录查询

**业务逻辑**
- ① 平台定义：POST `/network/ad-def`（`is_preset=false` 区分自定义）
- ② 账号管理：POST `/network/account`（凭证存 `credential JSONB`，查询时脱敏）
- ③ Adapter 上传：POST `/network/adapter`（file_url + version + platform + md5）
- ④ 审核：POST `/network/adapter/audit`（status: pass/reject + remark + effective_at）
- ⑤ 应用关联：POST `/app/:id/bind-network`（写 `app_network_binding`）
- ⑥ 数据接入：客户端拉取走 `/sdk/fetch-config` + 上报走 `/sdk/track`

**关键库表**
- `ad_network_def`（`network_code` / `network_name` / `is_preset` / `system_type` / `network_type`）— 必填 6 字段
- `ad_network_account`（`network_def_id` / `account_name` / `credential` JSONB / `status`）
- `custom_adapter_version`（`network_def_id` / `version` / `file_url` / `md5` / `changelog` / `audit_status` / `audit_remark` / `effective_at`）
- `app_network_binding`（`app_key` / `network_def_id`）
- `custom_network_report`（自定义网络的数据上报独立表）

**注意事项**
- ⚠️ `is_preset` 是「预置 vs 自定义」唯一可靠字段，`network_type` 字段被滥用（不要用它做预置过滤）
- ⚠️ 凭证字段 `credential` JSONB：返回给前端时必须脱敏（只显示前 4 + 后 4，中间 `*`）
- 审核流程：草稿 → 待审核 → 通过/拒绝 → 拒绝后可重新提交
- Adapter 文件：当前实现是 URL + md5，**未实现**文件直传（占位）

### 5.6 广告平台

**UI 说明**
- **下载首页**（`/sdk`）：
  - hero 区（左侧大字「下载新义 聚合 SDK」+ 副标 + 主按钮 + 3 个特性） + 右侧 2 个平台卡（Android / iOS）
  - 平台 Tab 切换（Android 6.0.9 / iOS 1.1.0）
  - 最新版本卡片：版本号 + 发布时间 + 文件大小 + md5 + 「下载」按钮 + 「复制下载链接」按钮
  - Changelog 折叠面板（按版本号倒序）
- **技术文档**（`/sdk/docs`）：
  - 左侧分类树（5 类：入门指南 / 集成步骤 / API 参考 / 高级特性 / FAQ）
  - 右侧文章列表（按分类过滤）+ 选中文章 markdown 渲染（markdown-it）
  - 文章底部「相关文章」
- **版本历史**（`/sdk/history`）：
  - 时间线（按 version 倒序），每条：版本号 + 平台 Tag + 发布时间 + 「强制更新」Tag + Changelog 摘要 + 「下载」按钮
- **隐私政策**（`/sdk/privacy`）：
  - 标题 + 生效日期 + 「外链」tag（如果 source_url 存在）
  - 内容区：检测 `source_url` → iframe 嵌入（720px 高，sandbox 沙箱化）+ 「前往官方原文」按钮
  - 否则按 `content_format` 渲染（HTML 原始 / Markdown 转换）

**业务逻辑**
- 列表：GET `/sdk-cms/releases?platform=1` 返回按版本号倒序
- 详情：GET `/sdk-cms/releases/:id`
- 文档：GET `/sdk-cms/docs?category_id=&doc_id=`（含目录树）
- 隐私：GET `/sdk-cms/privacy/policy?platform=`
- 隐私政策支持 3 种内容格式：1=HTML / 2=Markdown / 3=外链（source_url 优先）

**关键库表**
- `sdk_release`（`platform` / `version` / `changelog` / `download_url` / `md5` / `file_size` / `is_force_update` / `release_date` / `status`）
- `sdk_doc`（`category_id` / `title` / `content` / `order_num`）
- `sdk_doc_category`（`name` / `parent_id` / `order_num`）
- `sdk_privacy_policy`（`version` / `title` / `content` / `content_format` / `source_url` / `effective_date` / `status`）
- `sdk_privacy_consent`（用户同意记录：`user_id` / `policy_id` / `consent_at` / `ip`）

**注意事项**
- ⚠️ v1.1 生效政策 `source_url` = `https://docs.mobrtb.com/sdk_privacy.html`（HTML 嵌入），`content` 为空
- ⚠️ 文档标题里不能出现品牌前缀（如 "YTAd..."），SDK 类名（如 `YTAdRequest`）是技术标识，**保留**不动
- 品牌名统一「**新义**」（不要再加副词）
- iOS 包名格式：`新义-iOS-{version}.zip`（实际下载文件名）

### 5.7 SDK 下载中心

**UI 说明**
- **开发者管理**：表格 + 角色 / 状态切换弹窗（禁用/启用 / 角色变更）
- **指标字典**（`/admin/metric-def`）：分类树 + 列表 + 创建/编辑弹窗（**公式编辑器** + 必填字段 + 数据类型 + 单位）
- **SDK 版本管理**（`/admin/sdk-releases`）：列表 + 创建/编辑弹窗（平台 / 版本号 / Changelog / 下载 URL / MD5 / 强制更新 / 状态）
- **SDK 文档管理**（`/admin/sdk-docs`）：分类筛选 + 列表 + 创建/编辑弹窗（**富文本或 Markdown 编辑** + 分类选择 + 排序）
- **SDK 隐私政策管理**（`/admin/sdk-privacy`）：
  - 列表：版本 / 平台 / 来源 Tag（内部/外链）/ 生效日期 / 状态
  - 创建/编辑：顶部「内容来源」单选（内部内容 / 外部链接）
    - 内部：HTML/Markdown 单选 + content textarea
    - 外链：URL 输入 + 摘要 + 「预览」按钮

**业务逻辑**
- 所有管理后台接口走 `/api/v1/sdk-cms/admin/*`（必须 admin role）
- 公开接口走 `/api/v1/sdk-cms/*`（无需 token）
- 创建 / 更新：标准 CRUD，返回 `id` 让前端跳详情
- 删除：软删除（`status=0`），保留历史

**关键库表**
- 同 5.6 节 + `developer`（管理后台有写权限）

**注意事项**
- ⚠️ 隐私政策「外链」模式：`source_url` 必填 + `http(s)://` 开头 + `content_format=3` + `content=''`
- ⚠️ 公式字段（指标）：保存前用示例数据 dry-run 校验（避免运行时 500）
- 删除前检查关联（如文档被引用 / 隐私政策被 SDK 端拉取）— 软删除 + 关联检查

---

## 六、注意事项汇总（边界 / 踩坑清单）

> 跨页面的高优先级边界问题与已踩过的坑，出 PRD / 改代码前必读。

### 6.1 数据层（DB）

| # | 问题 | 现状 | 修复方向 |
|---|------|------|---------|
| 1 | `waterfall_config.layers` JSONB 列 | 已 ALTER TABLE 修复 | 新环境必须同步建表带上此列 |
| 2 | `waterfall_config.placement_id` 存 number-as-string，但 `placement.placement_id` 存 `"pl_xxx"` | list 端 `.in()` 兼容两种 | 统一为 number，新环境必须保持一致 |
| 3 | `report_daily` 6 字段复合唯一 | 造数据时 region/os 循环会重复 | seed 必须先选维度再循环 |
| 4 | `ad_network_def` 6 字段 NOT NULL | 易漏 `is_preset` / `system_type` | seed 脚本统一 `INSERT` 前置 SET |
| 5 | `ad_source` 易漏 `third_app_id` / `third_placement_id` 必填 | 已有踩坑 | seed 模板需校验 |
| 6 | `ad_network_account` 表 | ✅ 已建（6 步对接步骤二需要）| — |
| 7 | `developer` 表 `status` 字段 | 暂未启用禁用 | 软删除前禁用 |

### 6.2 后端（API）

| # | 问题 | 现状 | 修复方向 |
|---|------|------|---------|
| 1 | Supabase RLS 未启用 | service_role 直连 | 启用 RLS + 角色策略 |
| 2 | Adapter 文件当前存 URL 字段 | 未接入对象存储 | 接入 S3 兼容对象存储 |
| 3 | 凭证字段 `credential` JSONB 脱敏 | 已脱敏（前 4 + 后 4） | 完整审计日志 |
| 4 | `authMiddleware` 优先 cookie，回退 Bearer | 已实现 | — |
| 5 | 登录失败次数不锁 | 未限流 | 加 IP 限流 + 失败计数 |
| 6 | JWT 7 天过期，无 refresh token | 暂未实现 | 加 refresh token 机制 |
| 7 | `reconciliation` 表字段 | 部分字段缺失 | schema 审计补全 |

### 6.3 前端（UI / 交互）

| # | 问题 | 现状 | 修复方向 |
|---|------|------|---------|
| 1 | Element Plus CSS 必须从 `index.css` 顶部 `@import` | 已规避（火山引擎 CDN 拦截）| ⚠️ 禁止在 main.ts 直接 import |
| 2 | `.vue` 文件禁用 `<style scoped>` | 已规避 | ⚠️ 统一写 `index.css` |
| 3 | 综合报表表头/数据错位 | **2026-07-18 已修复：整体居中** | 不要单独用 `text-align: right` 对齐数字列 |
| 4 | 指标弹窗「已选列」高度不融洽 | **2026-07-18 已修复：mp-main 固定 420 + flex min-height:0** | 不要再用 `min-height` 让它被内容撑大 |
| 5 | 指标弹窗宽度 1100，6 列 118px | 已优化 | — |
| 6 | 瀑布流 placement_id 双入参兼容 | **已修复** | 新环境 DB 字段必须保持一致 |
| 7 | Hydration 错误防范 | 不在 `<template>` 用 `Date.now()` / `Math.random()` | 动态内容用 `ref` + `onMounted` |
| 8 | 品牌名统一「新义」 | 已统一（隐私政策 / SDK 下载首页） | 不要再加副词 / 自己起名字 |
| 9 | SDK 类名（如 `YTAdRequest`） | 保留为技术标识 | ⚠️ 不要替换为中文 |
| 10 | 文档标题禁出现品牌前缀（如 "YTAd..."） | 2026-07-18 已清理 | 新文档遵守 |
| 11 | 隐私政策外链模式 iframe sandbox | 已加 `sandbox="allow-same-origin allow-scripts allow-popups allow-forms"` | — |

### 6.4 鉴权 / 权限

| # | 问题 | 现状 | 修复方向 |
|---|------|------|---------|
| 1 | 公开接口白名单 | `/auth/*` + `/sdk-cms/*` 公开 + `/sdk-cms/admin/*` 必须 admin | — |
| 2 | SDK 上报接口 | API Key 鉴权（暂未启用，鉴权 TODO） | 加 device_id + app_key 校验 |
| 3 | 路由级权限 | 仅 role 判定 | 按模块细化权限（developer / admin / agent） |

### 6.5 性能

| # | 问题 | 现状 | 修复方向 |
|---|------|------|---------|
| 1 | 报表查询未走索引 | `report_daily` 已建索引 | 复杂查询 EXPLAIN 验证 |
| 2 | 指标 chip 最多 6 个 | 性能边界 | 超出报错 |
| 3 | 长任务拆分 | 同步接口 | 加进度条 + 取消 |

---

## 七、下一步规划（待办）

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

## 八、变更记录

### 2026-07-18：PLAN.md 整体重构

- 旧版本基于早期 12 模块设计，与当前实现偏差较大
- 新版本以**当前实际代码/路由/API/DB 为事实基准**
- 新增：5 张 SDK 模块表、4 张报表辅助表、27 张表完整字段说明
- 新增：所有 API 端点完整列表（auth / app / placement / ad-source / traffic-group / waterfall / dashboard / report / report-metric / report-board / report-aggregate / reconciliation / message / network / profile / admin / hal / sdk / sdk-cms）
- 新增：6 步对接流程落地状态
- 新增：关键 UI 修复记录（表头居中 / 指标弹窗 6 列 / 已选列等高 / 品牌名替换）
- 废弃：旧的"阶段 + ⬜ 待办"格式

### 2026-07-18：PLAN 升级为完整 PRD

- 新增第四章「**功能架构**」：模块依赖图（前端 / 后端 / Supabase / 客户端 SDK 四层）+ 角色权限矩阵（developer/admin/SDK 端 三角色 × 8 模块）+ 3 条核心数据流（报表 / 瀑布流下发 / 6 步对接）+ 鉴权体系
- 升级第五章「**关键交互模式**」为页面级 PRD 模板，每页按 **UI 说明 · 业务逻辑 · 关键库表 · 注意事项** 四维度展开（7 个核心模块：登录 / 应用 / 瀑布流 / 综合报表 / 广告平台 / SDK 下载中心 / 管理后台）
- 新增第六章「**注意事项汇总**」：跨页面高优先级边界问题与已踩过的坑（5 大类：数据层 7 项 + 后端 7 项 + 前端 11 项 + 鉴权 3 项 + 性能 3 项 = 31 条）
- 重新编号：六/七/八（原五/六）

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
