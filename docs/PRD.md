# 广告 SDK 聚合平台 · 产品 PRD

> 版本：v1.0（基于已实现版本） · 文档目标：完整描述系统能力、UI 规范、接口契约、库表结构、注意事项，作为后续研发、产品、测试的统一参考。

---

## 目录

- [1. 产品概览](#1-产品概览)
- [2. 通用规范](#2-通用规范)
  - 2.1 鉴权机制
  - 2.2 响应格式
  - 2.3 错误码
  - 2.4 UI 设计规范
  - 2.5 技术栈
- [3. 登录注册](#3-登录注册)
  - 3.1 注册
  - 3.2 登录
  - 3.3 忘记密码 / 验证码
- [4. 数据看板](#4-数据看板)
- [5. 应用管理](#5-应用管理)
- [6. 广告位管理](#6-广告位管理)
- [7. 流量分组](#7-流量分组)
- [8. 广告源管理](#8-广告源管理)
- [9. 瀑布流配置](#9-瀑布流配置)
- [10. 数据报表](#10-数据报表)
  - 10.1 综合报表
  - 10.2 漏斗分析
  - 10.3 用户行为
- [11. 对账管理](#11-对账管理)
- [12. 广告平台 / Adapter](#12-广告平台--adapter)
- [13. 消息中心](#13-消息中心)
- [14. 个人中心](#14-个人中心)
- [15. 超级管理员](#15-超级管理员)
  - 15.1 开发者管理
  - 15.2 指标字典
- [16. 数据库设计](#16-数据库设计)
- [17. SDK 对外接口](#17-sdk-端接口开发者用)
- [18. 集成与运维](#18-集成与运维)
- [19. 注意事项汇总](#19-注意事项汇总)
- [附录 A: 完整接口清单](#附录-a完整接口清单)
- [附录 B: 术语表](#附录-b术语表)
- [附录 C: 变更记录](#附录-c变更记录)

---

## 1. 产品概览

### 1.1 产品定位

广告 SDK 聚合平台管理后台，面向 **广告主 / 流量主 / 中长尾开发者**，提供从「应用接入 → 广告位定义 → 广告源接入 → 瀑布流配置 → 数据监控 → 对账」全流程配置与可视化能力。系统支持：

- 主流广告平台（穿山甲 / 优量汇 / Sigmob / 快手 / 百度 / Mintegral …）的预置接入
- 自定义广告平台（开发者自行上传 Adapter）的完整对接流程
- 多维度的数据报表（综合 / 漏斗 / 行为 / 异常）
- 自动化的对账管理（SDK 上报 vs 平台 API 拉取）

### 1.2 用户角色

| 角色 | 标识 | 能力 |
|------|------|------|
| 开发者 | `developer` | 全部业务功能（应用 / 广告位 / 广告源 / 瀑布流 / 报表 / 对账 / 消息 / 个人中心） |
| 超级管理员 | `admin` | 开发者全部能力 + 开发者管理 + 指标字典维护 |
| SDK 调用方 | （无登录） | 通过 API Token 拉取瀑布流配置 / 上报数据（见第 17 章） |

### 1.3 信息架构

| 一级菜单 | 二级路由 | 角色 | 主要能力 |
|----------|----------|------|----------|
| 数据看板 | `/dashboard` | 全部 | 核心指标 + 趋势 + TOP 排行 |
| 应用管理 | `/app` | 全部 | 应用 CRUD、状态、频次、平台绑定 |
| 广告位 | `/placement` | 全部 | 广告位 CRUD、广告形式 / 竞价方式 |
| 聚合管理 | `/aggregation/traffic-group` | 全部 | 流量分组（按地域/机型/版本切分流量） |
| 聚合管理 | `/aggregation/ad-source` | 全部 | 广告源 CRUD（含自定义广告源） |
| 聚合管理 | `/aggregation/waterfall` | 全部 | 瀑布流配置 + 历史版本 |
| 数据报表 | `/report/overview` | 全部 | 多维聚合查询（按时间/应用/广告位/广告源/平台/地区/系统） |
| 数据报表 | `/report/funnel` | 全部 | 漏斗分析（10 步事件漏斗） |
| 数据报表 | `/report/behavior` | 全部 | 用户行为（展示频次 / 用户价值 / 使用时长） |
| 对账管理 | `/reconciliation` | 全部 | 对账单导入、差异展示、确认 / 导出 |
| 广告平台 | `/network` | 全部 | 自定义广告平台 + Adapter + 账号 + 数据上报 |
| 消息中心 | `/message` | 全部 | 收入 / 异常 / 工单类消息 |
| 个人中心 | `/profile` | 全部 | 资料、Token、密码、通知偏好 |
| 开发者管理 | `/admin/developers` | admin | 开发者列表、角色 / 状态调整 |
| 指标字典 | `/admin/report-metric` | admin | 报表指标的元数据维护 |

### 1.4 关键截图一览

> 截图存放于 `/public/prd/thumb/`

| 截图 | 模块 | 文件 |
|------|------|------|
| 登录 | 登录 | `01-login.png` |
| 注册 | 注册 | `02-register.png` |
| 数据看板 | 概览 | `03-dashboard.png` |
| 应用管理 | 应用 | `04-app.png` |
| 广告位 | 广告位 | `05-placement.png` |
| 流量分组 | 聚合 | `06-traffic-group.png` |
| 广告源 | 聚合 | `07-ad-source.png` |
| 瀑布流 | 聚合 | `08-waterfall.png` |
| 综合报表 | 报表 | `09-report-overview.png` |
| 漏斗分析 | 报表 | `10-report-funnel.png` |
| 用户行为 | 报表 | `11-report-behavior.png` |
| 对账 | 对账 | `12-reconciliation.png` |
| 广告平台 | 网络 | `13-network.png` |
| 消息 | 消息 | `14-message.png` |
| 个人 | 个人 | `15-profile.png` |
| 开发者管理 | admin | `16-admin-developers.png` |
| 指标字典 | admin | `17-admin-report-metric.png` |

---



### 1.5 快速截图

#### 1. 登录 / 注册

![登录](public/prd/thumb/01-login.png)
![注册](public/prd/thumb/02-register.png)

#### 2. 数据看板

![数据看板](public/prd/thumb/03-dashboard.png)

#### 3. 业务管理

| 应用 | 广告位 | 流量分组 | 广告源 | 瀑布流 |
|------|--------|----------|--------|--------|
| ![应用](public/prd/thumb/04-app.png) | ![广告位](public/prd/thumb/05-placement.png) | ![流量分组](public/prd/thumb/06-traffic-group.png) | ![广告源](public/prd/thumb/07-ad-source.png) | ![瀑布流](public/prd/thumb/08-waterfall.png) |

#### 4. 报表

| 综合报表 | 漏斗分析 | 用户行为 |
|----------|----------|----------|
| ![综合报表](public/prd/thumb/09-report-overview.png) | ![漏斗](public/prd/thumb/10-report-funnel.png) | ![行为](public/prd/thumb/11-report-behavior.png) |

#### 5. 辅助

| 对账 | 广告平台 | 消息 | 个人 |
|------|----------|------|------|
| ![对账](public/prd/thumb/12-reconciliation.png) | ![网络](public/prd/thumb/13-network.png) | ![消息](public/prd/thumb/14-message.png) | ![个人](public/prd/thumb/15-profile.png) |

#### 6. Admin

| 开发者管理 | 指标字典 |
|------------|----------|
| ![开发者](public/prd/thumb/16-admin-developers.png) | ![指标](public/prd/thumb/17-admin-report-metric.png) |


## 2. 通用规范

### 2.1 鉴权机制

#### 鉴权方式

- **HttpOnly Cookie 鉴权**（主）：登录成功后服务端通过 `Set-Cookie: auth_token=<JWT>; HttpOnly; SameSite=Strict` 写入；前端不感知，每次请求自动携带。
- **Bearer Token**（备）：支持 `Authorization: Bearer <token>` 头，用于 SDK 服务端直连 / Postman 调试。
- **优先级**：`authMiddleware` 优先 cookie，回退到 Bearer。两者均可生效。

#### Token 规格

| 属性 | 值 |
|------|---|
| 算法 | HS256 |
| 过期 | 7 天 |
| 载荷 | `{ developerId, email, role, iat, exp }` |
| 存储 | cookie `auth_token` + 返回 body `data.token`（双轨） |
| Secure | dev 不带 / **prod 必须带 Secure** |

#### 路由守卫

- 未登录访问受保护路由 → 重定向 `/login`。
- `role !== 'admin'` 访问 `/admin/*` → 重定向 `/dashboard` 并 `ElMessage` 提示「无权限」。

#### 接口鉴权列表（白名单）

> 以下接口**不需要**鉴权，可直接访问。

| 接口 | 用途 |
|------|------|
| `POST /api/v1/auth/register` | 注册 |
| `POST /api/v1/auth/login` | 登录 |
| `POST /api/v1/auth/send-captcha` | 发送验证码（邮箱） |
| `POST /api/v1/auth/verify` | 验证 JWT 是否有效（用于 SDK 健康检查） |
| `GET /api/health` | 服务健康检查 |
| `GET /api/v1/sdk/config` | SDK 拉取瀑布流配置（按 app_key + placement_id） |
| `POST /api/v1/sdk/report` | SDK 上报数据（按 app_key） |

> 其他所有 `/api/v1/console/*` 端点**必须**经过 `authMiddleware`。

### 2.2 响应格式

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": { /* 业务负载 */ }
}
```

**失败响应**

```json
{
  "code": 40001,
  "message": "邮箱已被注册",
  "data": null
}
```

**分页响应**（约定 `data` 形态）

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [ ... ],
    "total": 123,
    "page": 1,
    "pageSize": 10
  }
}
```

### 2.3 错误码

| 范围 | 含义 | 备注 |
|------|------|------|
| `0` | 成功 | — |
| `1xxx` | 通用错误 | 10001=参数错误，10002=资源不存在，10003=未授权，10004=无权限，10005=限流 |
| `2xxx` | 鉴权模块 | 20001=邮箱未注册，20002=密码错误，20003=Token 失效，20004=验证码错误/过期，20005=账号被禁用 |
| `3xxx` | 业务模块（应用 / 广告位 / 广告源 / 瀑布流） | 30001=app_key 重复，30002=placement_id 重复，30003=广告源被绑定不可删，30004=瀑布流正在被使用 |
| `4xxx` | 自定义网络 / Adapter | 40001=network_code 重复，40002=Adapter 审核中，40003=文件 MD5 重复 |
| `5xxx` | 数据上报 / 对账 | 50001=数据条数超限，50002=日期格式错误 |
| `9xxx` | 系统错误 | 90001=数据库错误，90002=外部 API 失败 |

### 2.4 UI 设计规范

#### 设计原则

- **业务优先**：数据密度高，信息一目了然，不做花哨装饰。
- **色系克制**：以白 + 浅灰为底，蓝为主色（强调），深色文字 + 浅色提示，避免大面积色块。
- **统一组件**：基于 Element Plus，所有弹窗 / 抽屉 / 分页 / 表格遵循 EP 默认。

#### Design Tokens

| 类别 | 名称 | 值 | 用途 |
|------|------|---|------|
| 颜色 | `--color-primary` | `#2563EB` | 主操作按钮、强调色、链接 |
| 颜色 | `--color-primary-light` | `#EFF6FF` | hover 底、选中态 |
| 颜色 | `--color-success` | `#059669` | 成功状态、上涨 |
| 颜色 | `--color-warning` | `#D97706` | 警告、待审核 |
| 颜色 | `--color-danger` | `#DC2626` | 危险、下降、删除 |
| 颜色 | `--color-text-primary` | `#1E293B` | 标题、数字 |
| 颜色 | `--color-text-secondary` | `#334155` | 表格内容 |
| 颜色 | `--color-text-tertiary` | `#64748B` | 副标题 |
| 颜色 | `--color-text-quaternary` | `#94A3B8` | 占位符 / 禁用 |
| 颜色 | `--color-bg-page` | `#F8FAFC` | 页面底色 |
| 颜色 | `--color-border` | `#E2E8F0` | 卡片边框、分隔线 |
| 颜色 | `--color-border-light` | `#F1F5F9` | 行下边框、表格分隔 |
| 圆角 | `--radius-sm` | `4px` | 标签、小按钮 |
| 圆角 | `--radius-md` | `8px` | 弹窗、抽屉 |
| 圆角 | `--radius-lg` | `10px` | 卡片 |
| 阴影 | `--shadow-card` | `0 1px 2px rgba(15,23,42,0.04), 0 0 0 1px rgba(15,23,42,0.02)` | 卡片 |
| 间距 | `--space-2` / `--space-3` / `--space-4` | `8/12/16px` | 通用间距 |
| 字号 | `--text-xs/sm/base/lg/xl` | `12/13/14/16/18px` | 通用字号 |
| 组件高 | `--comp-height-sm/base/lg` | `28/36/40px` | 按钮 / 输入框 / 表格行 |

#### 表格「精致范」规范

- **卡片容器**：`#FFFFFF` + `1px #E2E8F0` + `10px 圆角` + 双层阴影
- **表头**：`#F8FAFC` 底 / `12px` / `600` / `#334155` / `letter-spacing: 0.2px`
- **行**：`min-height: 44px`（数据）/ `40px`（表头），斑马纹偶数行 `#FAFBFC`
- **hover**：`#EFF6FF` 底 + 左侧 3px `#2563EB` 蓝条
- **列变体**：num / ratio / money / label / range / bar / checkbox + delta-up / down / flat
- **涨跌幅**：▲▼ 三角（`::before`）+ `#059669` / `#DC2626` / `#94A3B8`
- **分页**：容器 `#FAFBFC` + 圆角 `0 0 10px 10px` + 顶部 `1px #F1F5F9` + padding `12px 20px`；`el-pagination` 属性：`background small layout="total, sizes, prev, pager, next, jumper"`

#### 关键避坑（Element Plus + Tailwind + Vite）

- EP CSS 必须从 `src/index.css` 顶部 `@import "element-plus/theme-chalk/index.css"`（**必须在 `@tailwind` 之前**）— 火山引擎 CDN 会拦截 Vite 注入的 EP CSS，导致 SyntaxError。
- **禁止** `.vue` 文件写 `<style scoped>`（同样触发 CDN 拦截）。
- 严禁 JSX 渲染顶层用 `Date.now()` / `Math.random()`，改 `ref` + `onMounted` 赋值。

### 2.5 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 前端 Framework | Vue 3 (Composition API) | 3.x |
| 前端 构建 | Vite | 7 |
| 前端 语言 | TypeScript | 5.6 |
| 前端 UI | Element Plus + @element-plus/icons-vue | 2.14 |
| 前端 样式 | Tailwind CSS（CDN @import） | 3.4 |
| 前端 状态 | Pinia | 3 |
| 前端 路由 | vue-router | 4 |
| 前端 图表 | ECharts + vue-echarts | 6 |
| 前端 HTTP | axios | — |
| 后端 Runtime | Node.js + Express | 20+ / 4 |
| 后端 语言 | TypeScript | 5.6 |
| 后端 鉴权 | jsonwebtoken (HS256) + bcryptjs + HttpOnly Cookie | — |
| 后端 DB | Supabase（PostgreSQL） | — |
| 后端 运行 | tsx (dev) / tsup CJS (prod) | — |
| 包管理 | pnpm | — |

---

## 3. 登录注册

### 3.1 注册

#### UI 说明

| 元素 | 位置 | 行为 |
|------|------|------|
| 邮箱输入 | 顶部 | 必填，邮箱格式校验，邮箱后缀不能是 `prd.com` / `dev.com`（保留） |
| 密码 | 中 | 必填，8-32 位，必须含字母 + 数字 |
| 公司名称 | — | 必填，1-50 字符 |
| 公司简称 | — | 必填，2-8 字符，唯一性由后端做 |
| 联系人 | — | 必填 |
| 联系电话 | — | 必填，11 位手机号 |
| 接入方式 | — | 单选：1=SDK接入 / 2=API接入，默认 1 |
| 验证码 | — | 邮箱验证码 6 位，60s 倒计时 |
| 注册按钮 | 底部 | 主色，全宽 |

![注册](public/prd/thumb/02-register.png)

#### 业务流程

```
用户填写表单
  ↓
点击「发送验证码」→ POST /api/v1/auth/send-captcha { email }
  ↓
60s 倒计时
  ↓
用户输入验证码
  ↓
点击「注册」→ POST /api/v1/auth/register { email, password, company, companyShortName, contactName, phone, accessType, captcha }
  ↓
后端校验：
  - 邮箱未被注册
  - 验证码匹配 + 未过期（5 分钟）
  - 密码强度
  - 必填字段
  ↓
成功 → 自动登录 → 写入 HttpOnly Cookie → 跳转到 /dashboard
```

#### 后端实现

- **密码哈希**：`bcryptjs` 加 salt（10 rounds）。
- **验证码存储**：`node-cache`，key = `captcha:<email>`，TTL = 300s。开发环境固定输出 `123456`（仅 dev）。
- **developer_id 生成**：UUID v4 前 16 位（`d_<16hex>`，避免与数据库 bigint 冲突）。
- **重复检查**：先 select，再 insert；并发场景由 `app.app_key` / `placement.placement_id` 等 unique 约束兜底。

#### 关键库表

- **`developer`**（见第 16 章）
  - `id` (bigint PK) / `developer_id` (varchar 业务 ID) / `email` (unique) / `password` (bcrypt 哈希)
  - `company` / `contact_name` / `phone` / `company_short_name` / `access_type` (1=SDK / 2=API)
  - `status` (1=启用 / 0=禁用) / `role` ('developer' / 'admin') / `notify_*` 6 个通知偏好

#### 注意事项

- 验证码仅校验「邮箱是否本人」，不校验「邮箱是否已注册」— 避免被探测账号。
- 注册成功后**自动登录**，不需要再走 login 接口。
- `company_short_name` 2-8 字符，用于报表 / 消息中的展示前缀。
- 邮箱后缀白名单（如 `gmail.com` / `qq.com` / `163.com` …）— 当前未强制，生产环境建议加。

---

### 3.2 登录

#### UI 说明

| 元素 | 位置 | 行为 |
|------|------|------|
| 邮箱 | 顶部 | 必填 |
| 密码 | 中 | 必填 |
| 登录按钮 | 底部 | 主色，全宽 |
| 忘记密码链接 | 右下 | 跳转「发送验证码」流程 |
| 立即注册 | 底部 | 跳转 /register |

![登录](public/prd/thumb/01-login.png)

#### 业务流程

```
用户输入 email + password
  ↓
点击「登录」→ POST /api/v1/auth/login { email, password }
  ↓
后端：
  - 校验 developer 存在 + status=1
  - bcrypt.compare(password, hash)
  ↓
成功 → 生成 JWT (HS256, 7d) → 写入 HttpOnly Cookie + 返回 body { token, userInfo }
  ↓
前端：保存 token 到 localStorage（备用），cookie 自动管理
  ↓
跳转到 /dashboard（保留 referrer）
```

#### 后端实现

- **HttpOnly Cookie**：`Set-Cookie: auth_token=<jwt>; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`
- **prod 模式**追加 `Secure` 标志。
- **`clearAuthCookie` 工具**：登出时清除 cookie（`Set-Cookie: auth_token=; Max-Age=0`）。

#### 关键库表

- **`developer`**：read 模式。
- **`auth_token` 记录**：当前**不持久化**（JWT 自包含），仅依赖客户端 cookie + `authMiddleware` 校验。
- 未来可加 `auth_session` 表做强制登出 / 设备管理。

#### 注意事项

- 登录失败 3 次后建议加图形验证码（当前未做）。
- 登录成功返回 `userInfo` 包含 `role`，前端路由守卫据此判断 `/admin/*` 可见性。
- HttpOnly cookie 防止 XSS 窃取 token，但 **CSRF 风险**通过 `SameSite=Strict` 兜底。
- 跨域场景（如 SDK 服务端直连）使用 `Authorization: Bearer` 头。

---

### 3.3 忘记密码（邮箱验证码）

> 当前实现：发送验证码 + 校验两步；重置密码暂未实现（`developer.password` 需新接口 `POST /auth/reset-password`，规划中）。

#### 业务流程

```
用户点击「忘记密码」
  ↓
输入邮箱 → POST /auth/send-captcha { email }
  ↓
后端：node-cache 写入 captcha:<email>（5 分钟过期，dev=123456）
  ↓
用户输入验证码 → POST /auth/verify { email, captcha }
  ↓
后端：校验 captcha 一致性
  ↓
返回 { valid: true }
  ↓
（规划）用户输入新密码 → POST /auth/reset-password { email, captcha, newPassword }
  ↓
后端：重新 bcrypt 哈希 + update
```

#### 关键库表

- **node-cache 内存**（**不持久化**）— 重启即清空。

#### 注意事项

- 验证码 5 分钟过期。
- 60s 倒计时仅前端限制，后端不过滤发送频率（生产环境需加 IP 限流）。

---

## 4. 数据看板

### 4.1 UI 说明

#### 顶部 KPI 卡片（4 个）

- 横向并排，每个卡片宽 ~280px（视口 1920 视情况自适应）。
- 卡片结构：标题 + 数值（大字号 28px）+ 同比/环比小标 + 迷你折线（7 天趋势）。
- 4 个指标：**总收入（¥）** / **总展示（次）** / **总点击（次）** / **eCPM（¥）**。

#### 主体（双列布局）

- **左列**（60%）：收入趋势折线图（30 天 ECharts 折线 + 区域填充 + 工具栏）
- **右列**（40%）：TOP 应用排行（柱状图横排，前 10 名）

#### 筛选区

- 顶部筛选：时间范围（近 7 / 30 / 90 天）+ 应用（多选）
- 联动刷新：所有图表同步

![数据看板](public/prd/thumb/03-dashboard.png)

### 4.2 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/dashboard/overview` | GET | 4 个 KPI 数值 + 同比环比 |
| `/api/v1/console/dashboard/trend` | GET | 30 天趋势数据（按天聚合） |
| `/api/v1/console/dashboard/ranking/:dimension` | GET | 排行（dimension=app / ad_source / placement / region） |

#### 业务逻辑

1. **KPI 聚合**：`SUM(revenue)` / `SUM(impressions)` / `SUM(clicks)` / `AVG(eCPM)`（eCPM = revenue * 1000 / impressions）。
2. **同比**：`本周期 / 上一周期 - 1`；环比：`今日 vs 昨日`。
3. **趋势**：按 `stat_date` group by，按 `app_key IN (...)` 过滤。
4. **TOP 排行**：按 `SUM(revenue)` DESC，取前 N。

#### 关键库表

- **`report_daily`**（核心）：`(developer_id, app_key, placement_id, ad_source_id, stat_date, hour)` 复合唯一约束
  - 关键字段：`requests` / `fills` / `impressions` / `clicks` / `revenue` / `region` / `os` / `ad_type`
  - 索引建议：`(developer_id, stat_date)` / `(app_key, stat_date)` / `(placement_id, stat_date)`

#### 注意事项

- 看板默认显示当前用户 `developer_id` 的所有数据，**不做权限隔离**（每个开发者只看到自己的数据）。
- eCPM = revenue * 1000 / impressions，避免 `impressions = 0` 除零。
- 同比环比在没有上一周期数据时显示 `--`。

---

## 5. 应用管理

### 5.1 UI 说明

#### 顶部筛选区

- 关键字（应用名称 / app_key 模糊）
- 平台（Android / iOS / 双端）
- 状态（启用 / 禁用）
- 「+ 新建应用」按钮（右上角）

#### 表格

| 列 | 字段 | 宽度 | 备注 |
|----|------|------|------|
| 应用图标 | `icon_url` | 64px | 圆形裁切 48x48 |
| 应用名 | `app_name` | 180px | + 包名小字 |
| 平台 | `platform` | 90px | 1=Android / 2=iOS / 3=双端 |
| App Key | `app_key` | 160px | monospace |
| 状态 | `status` | 80px | 1=启用（绿色 tag）/ 0=禁用（灰色 tag） |
| 接入方式 | `access_type` | 100px | 1=SDK / 2=API |
| 创建时间 | `created_at` | 170px | yyyy-MM-dd HH:mm |
| 操作 | — | 260px fixed | 编辑 / 频次 / 平台绑定 / 启用禁用 / 删除 |

![应用管理](public/prd/thumb/04-app.png)

#### 新建/编辑抽屉（右侧 480px 宽）

- 必填：
  - **应用名称**（1-30 字符）
  - **包名**（Bundle ID / 包名，全局唯一）
  - **平台**（单选 1/2/3）
  - **接入方式**（SDK / API）
- 可选：
  - **应用图标**（上传，最大 2MB，png/jpg）
  - **应用分类**（游戏 / 工具 / 社交 / 电商 / …，枚举）
  - **超时时间**（ms，默认 1000）
  - **商店 URL** / **下载 URL**（接入 SDK 拉起商店用）
  - **微信 AppID** / **Universal Link**（微信跳转）
  - **频次配置**（JSON：每用户每天展示 / 点击上限）
  - **应用域名** / **副账号** / **方向** / **COPPA** / **CCPA** 合规

### 5.2 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/app/list` | GET | 分页 + 筛选 |
| `/api/v1/console/app/detail` | GET | 单个详情 |
| `/api/v1/console/app/create` | POST | 创建（生成 app_key） |
| `/api/v1/console/app/update` | PUT | 更新 |
| `/api/v1/console/app/toggle-status` | PUT | 启停 |
| `/api/v1/console/app/delete` | DELETE | 删除（有 placement 时禁止） |
| `/api/v1/console/app/upload-icon` | POST | 上传图标到 OSS |
| `/api/v1/console/app/:id/frequency` | GET / PUT | 频次配置读写 |
| `/api/v1/console/app/:id/frequency` | GET | 平台绑定（详见 5.4） |

#### 业务逻辑

1. **app_key 生成**：`ak_<16位base36随机>`，唯一。
2. **删除限制**：检查 `placement` 表中是否有该 app_key 的记录，有则禁止。
3. **状态切换**：切换时弹确认，避免误操作。
4. **平台绑定**（`/app/:id/frequency`）：关联到广告平台（自定义网络），生成 `app_network_binding` 记录。

### 5.3 关键库表

- **`app`**（核心）
  - 必填：`developer_id` / `app_key` (unique) / `app_name` / `package_name` / `platform` / `status`
  - 可选：`category` / `icon_url` / `timeout_ms` / `store_url` / `wechat_app_id` / `wechat_universal_link` / `access_type` / `store_listed` / `store_name` / `download_url` / `app_domain` / `auth_subaccount` / `orientation` / `coppa_compliant` / `ccpa_compliant` / `frequency_config` (JSONB)
- **`app_network_binding`**（平台绑定）
  - `app_key` / `network_def_id` / `adapter_version_id` / `network_app_id` / `extra_params` (JSONB) / `status` / `account_id` (→ ad_network_account)
- **`placement`**（外键引用）
  - 关联到 app_key

### 5.4 关联：平台绑定（弹窗）

- 列表展示当前应用已绑定的广告平台。
- 「+ 绑定」：从「广告平台账号」下拉选择一个已存在的账号（来自 `ad_network_account`）。
- 解除绑定：弹确认 → 软删 `app_network_binding.status = 0`。
- 关联字段：`network_app_id` = 该应用在第三方平台注册的 ID。

### 5.5 注意事项

- app_key 一旦生成**不可修改**（外键依赖）。
- 包名（`package_name`）全局唯一，重复注册会 30001 错误。
- 删除应用**会级联清理**：
  - `placement`（该 app_key 全部）
  - `app_network_binding`（该 app_key 全部）
  - `waterfall_config` + `waterfall_layer`（关联 placement）
  - `report_daily` 报表数据**保留**（用于历史追溯）
- 应用图标上传走 OSS（详见第 18 章）。
- 频次配置（`frequency_config`）结构：
  ```json
  {
    "impression_per_day": 100,
    "impression_per_hour": 20,
    "click_per_day": 10
  }
  ```

---

## 6. 广告位管理

### 6.1 UI 说明

#### 筛选区

- 关键字（名称 / placement_id）
- 所属应用（下拉）
- 广告形式（banner / interstitial / native / rewarded / splash）
- 状态

#### 表格

| 列 | 字段 | 备注 |
|----|------|------|
| 广告位名称 | `name` | + placement_id 小字 |
| 所属应用 | `app_name` | — |
| 广告形式 | `format` | 1=banner / 2=插屏 / 3=原生 / 4=激励视频 / 5=开屏 |
| 竞价类型 | `bidding_type` | 1=客户端 / 2=服务端 |
| 屏幕方向 | `screen_orientation` | 0=竖 / 1=横 / 2=不限 |
| 状态 | `status` | 启用 / 禁用 |
| 创建时间 | `created_at` | — |
| 操作 | — | 编辑 / 删除 |

![广告位](public/prd/thumb/05-placement.png)

#### 抽屉表单

- 必填：
  - **所属应用**（下拉）
  - **广告位名称**（1-30 字符）
  - **广告形式**（5 选 1）
  - **竞价类型**（2 选 1）
  - **屏幕方向**（3 选 1）
- 可选：
  - **广告位 ID**（placement_id，**默认自动生成** `pl_<16位>`，可手填）
  - **状态**（默认启用）
  - **广告尺寸**（仅 banner）
  - **素材类型**（仅 native）
  - **视频静音**（仅 rewarded / splash）
  - **自动播放**（仅 rewarded / splash）
  - **模板样式**（仅 native）

### 6.2 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/placement/list` | GET | 分页 + 筛选 |
| `/api/v1/console/placement/detail` | GET | 详情 |
| `/api/v1/console/placement/create` | POST | 创建（placement_id 自动生成） |
| `/api/v1/console/placement/update` | PUT | 更新 |
| `/api/v1/console/placement/delete` | DELETE | 删除 |

#### 业务逻辑

1. **placement_id 生成**：`pl_<16位base36>`，全局唯一。
2. **删除限制**：检查是否被 `waterfall_config` / `traffic_group` 引用，有则禁止（错误 30004）。
3. **唯一性**：`placement_id` 全局唯一（不区分 app）。

### 6.3 关键库表

- **`placement`**（核心）
  - 必填：`app_key` / `placement_id` (unique) / `name` / `format` / `status` / `bidding_type` / `screen_orientation`
  - 可选：`ad_size` / `material_type` / `video_mute` / `auto_play` / `template_style`

### 6.4 注意事项

- placement_id 一旦创建**不可修改**（被 SDK 用作拉取 key）。
- 广告形式 / 竞价类型 / 屏幕方向 改变会**影响已有瀑布流配置**（需重新编辑）。
- 同一应用下 placement 名称可重名，placement_id 必须唯一。
- 状态禁用后，SDK 拉取该 placement 配置会返回 `status=0`，SDK 端应跳过。

---

## 7. 流量分组

### 7.1 UI 说明

#### 页面布局

- **左侧树形结构**（260px）：按应用 / 广告位分组，展开后显示该广告位下的所有流量分组 + 「默认分组」+ 「+ 新建分组」按钮
- **右侧详情区**（自适应）：
  - 顶部信息条：当前分组名称 + 状态 + 创建时间 + 「编辑」「删除」按钮
  - **规则配置**：条件编辑区（可视化 + JSON 两种模式）
  - **优先级**：拖拽排序（数字越大越优先匹配）

#### 规则配置

支持**多条件 AND**：
- 字段：地域（region）/ 操作系统（os）/ 设备品牌（device_brand）/ 设备型号（device_model）/ App 版本（app_version）/ SDK 版本（sdk_version）/ 自定义标签（custom_tag）
- 操作符：等于 / 不等于 / 包含 / 不包含 / 范围
- 值：自由输入

#### 条件可视化

```
地域    [中国]    [美国]    [+ 添加]
操作系统  [Android]          [+ 添加]
App 版本 [>=]  [1.2.0]        [+ 添加]
```

#### 树形分组示例

```
应用：开心消消乐
  └─ 广告位：激励视频
       ├─ 默认分组（系统创建，优先级 0，is_default=true）
       ├─ 高价值用户（地域=中国 AND OS=Android）
       ├─ 欧美用户（地域∈{美国,英国,德国}）
       └─ 灰度测试 v2（App 版本 >= 2.0.0）
```

![流量分组](public/prd/thumb/06-traffic-group.png)

### 7.2 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/traffic-group/list` | GET | 按 placement_id 列出 |
| `/api/v1/console/traffic-group/create` | POST | 创建 |
| `/api/v1/console/traffic-group/update` | PUT | 更新 |
| `/api/v1/console/traffic-group/delete/:id` | DELETE | 删除（默认分组禁止） |

#### 业务逻辑

1. **默认分组**：每个广告位首次创建时自动生成 1 个 `is_default=true` 的分组，**不可删除**。
2. **匹配顺序**：SDK 按 priority DESC 顺序匹配，第一个条件命中的分组生效。
3. **条件存储**：`conditions` JSONB，结构：
   ```json
   [
     {"field": "region", "op": "in", "value": ["CN", "US"]},
     {"field": "os", "op": "eq", "value": "android"},
     {"field": "app_version", "op": "gte", "value": "1.2.0"}
   ]
   ```
4. **删除限制**：默认分组 + 已绑定瀑布流的分组禁止删除。

### 7.3 关键库表

- **`traffic_group`**（核心）
  - 必填：`group_name` / `conditions` (JSONB)
  - 关键：`placement_id` / `priority` / `waterfall_config_id`（关联当前生效的瀑布流）/ `status` / `is_default` / `is_system` / `is_locked` / `developer_id`
  - 默认值：`status=1`, `is_default=false`, `is_system=false`, `is_locked=false`

### 7.4 注意事项

- **优先级数值越大越靠前**（前端列表倒序展示）。
- 规则编辑后**不会立即影响线上**（需要保存后下一次 SDK 拉取才生效，缓存策略 5 分钟）。
- 流量分组与流量分组的瀑布流配置是**N:1**（一个分组关联一个 config）。
- 灰度发布建议：新建分组 → 设置小优先级数字 → 灰度验证 → 调整 priority 提升流量。

---

## 8. 广告源管理

### 8.1 UI 说明

#### 筛选区

- 关键字（广告源名 / network_code）
- 平台（穿山甲 / 优量汇 / Sigmob / 快手 / 自定义）
- 状态

#### 表格

| 列 | 字段 | 备注 |
|----|------|------|
| 广告源名 | `source_name` | — |
| 广告平台 | `network_name` | + 平台图标 |
| 平台代码 | `network_code` | monospace |
| 关联应用 | `app_name` | — |
| 第三方 App ID | `third_app_id` | monospace |
| 第三方 Placement ID | `third_placement_id` | monospace |
| 状态 | `status` | — |
| 是否自定义 | `is_custom` | true=自定义 / false=预置 |
| 操作 | — | 编辑 / 删除 / 关联流量分组 |

![广告源](public/prd/thumb/07-ad-source.png)

#### 新建/编辑抽屉

- 必填：
  - **广告平台**（下拉，从 `ad_network_def` 选择 is_preset=true 的平台）
  - **广告源名**（1-30 字符）
  - **第三方 App ID**（在该平台注册的 app_id）
  - **第三方 Placement ID**（在该平台注册的 placement_id）
- 可选：
  - **关联应用**（下拉）
  - **关联广告位**（下拉，依赖应用）
  - **扩展参数**（JSON 编辑器）

#### 自定义广告源（联调测试步骤四）

- 「+ 自定义广告源」按钮：跳到自定义广告平台创建流程（详见第 12 章）
- 创建后自动出现在广告源下拉

### 8.2 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/ad-source/list` | GET | 分页 + 筛选 |
| `/api/v1/console/ad-source/create` | POST | 创建（关联 ad_network_def） |
| `/api/v1/console/ad-source/update` | PUT | 更新 |
| `/api/v1/console/ad-source/delete` | DELETE | 删除（被绑定禁止） |
| `/api/v1/console/ad-source/networks` | GET | 可选广告平台下拉 |
| `/api/v1/console/ad-source/create-custom` | POST | 创建自定义广告源（联调步骤四） |

#### 业务逻辑

1. **network_code 关联**：创建时必须从 `ad_network_def.network_code` 选，不允许自填。
2. **删除限制**：检查 `waterfall_layer` / `ad_source_traffic_group` 是否引用，禁止删除（错误 30003）。
3. **联调步骤四 `create-custom`**：传入自定义广告平台的 `network_def_id`，自动绑定。

### 8.3 关键库表

- **`ad_source`**（核心）
  - 必填：`developer_id` / `network_def_id` / `network_code` / `network_name` / `source_name` / `status` / `third_app_id` / `third_placement_id`（最后 2 个易漏，NOT NULL）
  - 可选：`extra` (JSONB) / `is_custom` / `app_id` / `placement_id` / `store_dim_params` (JSONB)
- **`ad_source_traffic_group`**（流量分组绑定）
  - `ad_source_id` / `traffic_group_id` / `status` / `price` / `hour_limit` / `day_limit` / `interval_sec`
- **`ad_network_def`**（广告平台定义，预置 + 自定义）
  - `network_code` (unique) / `network_name` / `network_type` / `is_preset` / `system_type` / `supports_bidding` / `icon_url`
  - 12 个 `adapter_class_*` 字段（按 platform × format 共 12 个 adapter class 名）

### 8.4 注意事项

- `is_preset=true` 的网络不可被开发者编辑/删除（由平台预置）。
- `is_custom=true` 的网络**只对当前 developer 可见**（通过 `created_by` / `developer_id` 过滤）。
- `third_app_id` + `third_placement_id` 是广告源在第三方平台的真实 ID，由开发者在第三方后台注册后填入。
- 一个广告源可关联多个流量分组（通过 `ad_source_traffic_group`），每个分组可设置不同 `price` / `day_limit`。

---

## 9. 瀑布流配置

### 9.1 UI 说明

#### 页面布局

- **顶部信息条**：当前广告位 + 流量分组下拉（默认选中默认分组）+ 当前 version 标签 + 历史版本
- **左侧广告源池**（320px）：当前流量分组可用的广告源（来自 `ad_source_traffic_group`），按平台分组展示
- **右侧 3 层瀑布流**（自适应）：
  - **第 1 层：Bidding（实时竞价）**
  - **第 2 层：瀑布层（按 eCPM 倒序）**
  - **第 3 层：兜底（保底广告源）**
  - 每层可拖拽广告源到层内，层内按 sort_price 排序

#### 关键交互

- **拖拽**：从左侧广告源池拖到右侧任意层；从右侧某层拖到另一层（调整层归属）；层内上下拖拽（调整 sort_price）
- **价格编辑**：点击行内 `¥--` 单元格，弹出数字输入框（保留 2 位小数）
- **超时时间**：默认 3000ms，可行内编辑
- **保存**：右上角「保存」按钮，触发版本自增
- **历史版本**：顶部下拉选择历史 version 加载到编辑区

#### 预览面板（右上角）

- 实时显示当前编辑的瀑布流 JSON 摘要
- 移动端渲染预览（缩略图）

![瀑布流](public/prd/thumb/08-waterfall.png)

### 9.2 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/waterfall/get` | GET | 拉取当前生效配置（按 placement + traffic_group） |
| `/api/v1/console/waterfall/list` | GET | 列出所有 version |
| `/api/v1/console/waterfall/update` | POST | 保存为新 version |
| `/api/v1/console/waterfall/history` | GET | 历史版本列表 |

#### 业务逻辑

1. **三层结构**：
   - **Bidding 层**（layer_type=1）：所有支持 `supports_bidding=1` 的广告源
   - **瀑布层**（layer_type=2）：按 eCPM 降序瀑布，超时后回退下一层
   - **兜底层**（layer_type=3）：最底层保底广告源
2. **version 自增**：每次 `update` 触发 `version = MAX(version) + 1`，旧 version 不删（保留 30 天）。
3. **生效延迟**：保存后 5 分钟内 SDK 拉取会拿到新配置（缓存 TTL）。
4. **双写策略**：
   - `waterfall_config.layers` (JSONB) — 快照
   - `waterfall_layer` (关联表) — 详细行记录
   - `get` 端点返回双份，前端 `fetchConfig` 优先 JSONB，为空时回退关联表。

#### 9.3 关键库表

- **`waterfall_config`**（配置快照）
  - 必填：`placement_id` / `version` / `status`
  - 关键：`traffic_group_id` / `layers` (JSONB 3 层数组)
- **`waterfall_layer`**（每层详细行）
  - 必填：`config_id` / `layer_type` (1/2/3) / `ad_source_id`
  - 可选：`sort_price` / `timeout_ms` / `priority` / `status`

### 9.4 注意事项

- **删除流量分组前必须清理 waterfall_config**（外键引用）。
- **placement_id 实际存储形式**：历史上曾存为 number-as-string（如 `"58"`），与 `placement.placement_id` 字符串型（`"pl_xxx"`）不一致。`get/list` 端用 `.in('placement_id', [pidStr, placementIdStr])` 兼容两种入参。**新环境部署必须保证 `waterfall_config.placement_id` 与创建时入参形式一致**（推荐 string）。
- **layers 字段历史 bug**：早期建表时缺失 `layers` JSONB 列，导致 `update` 静默丢弃。已通过 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` 修复。**新环境必须执行**：
  ```sql
  ALTER TABLE waterfall_config ADD COLUMN IF NOT EXISTS layers JSONB DEFAULT '[]'::jsonb;
  ```
- **「编辑中」视觉**：行通过 `row.traffic_group_id === selectedTrafficGroupId` 判断；该行显示「编辑中」蓝色脉冲 tag + 「已加载」按钮（disabled），其他行显示「加载」按钮。
- **缓存 TTL**：SDK 端缓存 5 分钟（建议可配置）。

---

## 10. 数据报表

### 10.1 综合报表（Overview）

#### UI 说明

##### 顶部筛选器（联动刷新所有图表）

- **时间范围**：今日 / 昨日 / 近 7 天 / 近 30 天 / 自定义
- **应用**：多选
- **广告位**：多选（依赖应用）
- **广告源**：多选
- **广告类型**：banner / interstitial / native / rewarded / splash
- **广告平台**：从 `ad_network_def` 拉（`is_preset=true` + 自定义）
- **系统**：android / ios
- **国家 / 地区**：从 `report_daily.region` DISTINCT 拉
- **指标维度**：展示数 / 展示率 / 点击数 / 点击率 / CTR / 预估收益 / eCPM

##### 主体布局

- **左主区**（60%）：多线折线图（按天聚合），可叠加多个指标
- **右排行区**（40%）：TOP 5 应用 / 广告位 / 广告源（柱状图横排，可切换维度）
- **底部数据表**：明细数据 + 分页 + 列勾选 + CSV / Excel 导出

![综合报表](public/prd/thumb/09-report-overview.png)

#### 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/report/daily` | GET | 每日聚合数据（带筛选） |
| `/api/v1/console/report/export` | GET | CSV / Excel 导出 |
| `/api/v1/console/report-aggregate/options` | POST | 下拉选项（平台 / 地区 / 系统） |
| `/api/v1/console/report-aggregate/aggregate` | POST | 指标聚合（公式驱动） |
| `/api/v1/console/report-aggregate/funnel/definition` | GET | 漏斗定义 |

#### 业务逻辑

1. **聚合查询**：`SUM(requests) / SUM(fills) / SUM(impressions) / SUM(clicks) / SUM(revenue)`，按 `stat_date` group by。
2. **派生指标**：
   - 展示率 = `fills / requests`
   - 点击率 = `clicks / impressions`
   - CTR = `clicks / impressions`
   - 预估收益 = `SUM(revenue)`
   - eCPM = `revenue * 1000 / impressions`
3. **公式驱动**：`report_metric_definition` 表存储公式模板，聚合端点接受 `metric_codes[]` 动态计算。
4. **下拉选项**：
   - 平台：`ad_network_def.network_name` where `is_preset = true`
   - 系统：`report_daily.os` DISTINCT（仅 android / ios，无 harmony）
   - 国家：`report_daily.region` DISTINCT
   - 广告类型：`report_daily.ad_type` DISTINCT

#### 关键库表

- **`report_daily`**（核心）
  - 必填：`developer_id` / `app_key` / `placement_id` / `ad_source_id` / `stat_date` / `hour`
  - 复合唯一：`(developer_id, app_key, placement_id, ad_source_id, stat_date, hour)`
  - 关键：`requests` / `fills` / `impressions` / `clicks` / `revenue` / `ad_type` / `region` / `os`
- **`report_metric_definition`**（指标字典）
  - `code` / `name` / `category` / `sub_category` / `value_type` (actual/derived) / `unit` / `format` / `formula` / `required_fields` (ARRAY) / `sort_order` / `is_active` / `is_system`

#### 注意事项

- **数据权限**：仅查当前 `developer_id`。
- **大表性能**：`report_daily` 数据量大，聚合查询必须带 `developer_id + stat_date` 索引。建议分区（按月）。
- **导出**走流式响应（`text/event-stream` 或 chunked transfer）。
- **「广告平台」**下拉从 `ad_network_def` 拉，**禁止用 `network_type` 字段判断**（被滥用），改用 `is_preset`。
- **eCPM 单位**：¥（人民币），保留 2 位小数。

---

### 10.2 漏斗分析（Funnel）

#### UI 说明

##### 顶部筛选

- 应用 / 广告位 / 时间范围（默认近 7 天）

##### 漏斗图（10 步事件）

- 漏斗从左到右依次：曝光 → 点击 → 落地 → 激活 → 注册 → 登录 → 付费 → 关键行为 1 → 关键行为 2 → 留存
- 每步显示：绝对值 + 转化率（vs 上一步）+ 总体转化率
- 鼠标悬停高亮

##### 分天 / 趋势 Tab

- **分天 Tab**：表格，每行 1 天，每列 1 步指标（11 步 × 7 天）
- **趋势 Tab**：折线图，每条线 1 步指标（30 天）

![漏斗分析](public/prd/thumb/10-report-funnel.png)

#### 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/report-aggregate/funnel/definition` | GET | 漏斗步骤定义 |
| `/api/v1/console/report-aggregate/aggregate` | POST | 指标聚合（formula） |

#### 业务逻辑

1. **漏斗步骤定义**：`report_funnel_metric_definition` 表，10 条记录
   - `stage` / `code` / `name` / `is_event` / `event_index` / `formula` / `unit` / `format` / `sort_order` / `is_active` / `is_system` / `description`
2. **公式解析**：前端根据 `formula` 字符串（如 `SUM(impressions) WHERE os='android'`）调用聚合端点
3. **转化率**：
   - 步骤转化率 = 当前步 / 上一步
   - 总体转化率 = 当前步 / 第 1 步
4. **mock 数据**（dev 环境）：seededRandom 生成稳定漏斗数据

#### 关键库表

- **`report_funnel_metric_definition`**（漏斗定义）
- **`report_daily`**（数据源）

#### 注意事项

- 漏斗步骤可在「指标字典」admin 页面维护（增删改，**系统级**步骤不可删）。
- 公式中字段必须存在于 `report_daily`。
- mock 数据刷新一致（seed 固定为 `developer_id` + `placement_id` 哈希）。

---

### 10.3 用户行为（Behavior）

#### UI 说明

##### 3 个 Tab（主维度切换）

- **展示频次**（默认）
- **用户价值**
- **使用时长**

##### 每个 Tab 通用结构

- **上**：趋势图（7 指标多线折线图）+ 「指标选择」按钮（弹窗勾选）
- **下**：表格 + 分页（精致范）

##### 1. 展示频次（frequency）

- **7 指标**：展示数 / 展示占比 / 设备数 / 设备占比 / 预估收益 / 预估收益占比 / eCPM
- **9 列表格**：频次范围 + 7 指标 + 分布（条形）
- **行数据**：1次 / 2次 / 3次 / 4次 / 5次 / 6-10次 / 11-20次 / 21-50次 / 51-100次 / 100+次

##### 2. 用户价值（value）

- **7 指标**：展示数 / 展示占比 / 设备数 / 设备占比 / 预估收益 / 预估收益占比 / **预估收益累计占比**（新增）
- **8 列表格**：eCPM 范围 + 7 指标（可勾选）
- **行数据**：eCPM < 1 / 1-5 / 5-10 / 10-20 / 20-50 / 50-100 / 100+ (共 7 段 × 4 子段 = 27 行)
- **「维度」按钮**：弹窗勾选哪些列显示

##### 3. 使用时长（duration）

- **指标**：使用时长（主指标 vs 对比指标）
- **5 列对比表格**：日期 / 主指标 / 对比指标 / 差异 / 差异%
- **数据**：最近 7 天

![用户行为](public/prd/thumb/11-report-behavior.png)

#### 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| 内部 | — | **纯前端 mock**（`loadAll()` 函数生成） |
| `/api/v1/console/report/daily` | GET | 仅获取真实数据进行校验 |

#### 业务逻辑

1. **mock 生成**：
   - seededRandom（基于 placement_id 哈希，保证刷新稳定）
   - 3 个 Tab 共用 1 个 `loadAll()` 调用，生成 30 天趋势 + 表格数据
2. **指标选择**：
   - 弹窗 7 个 checkbox
   - 默认全选
   - 取消勾选 → 趋势图对应线条隐藏 + 表格对应列隐藏
3. **维度选择**（仅 value Tab）：与指标选择类似，控制表格列显隐
4. **差异计算**（duration）：`diff = main - compare`，`diffPct = diff / compare * 100`

#### 关键库表

- **无独立表**，mock 生成
- 真实数据可来自 `report_daily`（未来可对接）

#### 注意事项

- **行高必须 44px**（CSS 规范已硬约束）
- **9 列对齐**：`grid-column: 1 / -1` + 行内复制 grid-template-columns
- **分页**：`el-pagination` `background small layout="total, sizes, prev, pager, next, jumper"`
- **涨跌幅色彩**：`▲` 绿色 `#059669` / `▼` 红色 `#DC2626` / `→` 灰色 `#94A3B8`
- **数字列**：`font-variant-numeric: tabular-nums`（等宽数字，防止抖动）
- 详见 DESIGN.md「数据表格精致范规范」章节

---

## 11. 对账管理

### 11.1 UI 说明

#### 顶部筛选区

- 日期范围（默认近 7 天）
- 应用
- 广告平台
- 状态（待对账 / 差异 / 已确认）

#### 导入按钮

- 「导入对账单」按钮 → 弹出文件上传对话框
- 支持格式：CSV / Excel
- 必填列：日期 / app_key / placement_id / SDK展示 / API展示 / SDK收益 / API收益

#### 表格（每行一条对账记录）

| 列 | 字段 | 备注 |
|----|------|------|
| 日期 | `statDate` | yyyy-MM-dd |
| 应用 | `appKey` | 显示 app_name |
| 广告位 | `placementId` | — |
| 广告平台 | `networkCode` | 显示 network_name |
| SDK 展示 | `sdkImpressions` | — |
| API 展示 | `apiImpressions` | — |
| 展示差异 | `impressionDiff` | API - SDK |
| SDK 收益 | `sdkRevenue` | ¥ |
| API 收益 | `apiRevenue` | ¥ |
| 收益差异 | `revenueDiff` | API - SDK |
| 状态 | `status` | 待对账 / 差异 / 已确认 |
| 操作 | — | 详情 / 确认 / 导出 |

![对账](public/prd/thumb/12-reconciliation.png)

#### 差异规则

- 展示差异绝对值 > 5% 或 > 1000 → 标记「差异」
- 收益差异绝对值 > 5% 或 > ¥10 → 标记「差异」
- 手动确认后状态变为「已确认」

### 11.2 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/reconciliation/list` | GET | 分页 + 筛选 |
| `/api/v1/console/reconciliation/import` | POST | 上传 CSV/Excel |
| `/api/v1/console/reconciliation/export` | GET | 导出明细 |
| `/api/v1/console/reconciliation/resolve` | POST | 确认 / 标记差异已处理 |

#### 业务逻辑

1. **数据来源双轨**：
   - **SDK 侧**：从 `report_daily` 聚合
   - **API 侧**：从第三方平台拉取 / 导入 CSV
2. **差异检测**：定时任务（每日凌晨）跑对账，差异 > 阈值时：
   - 自动生成 `reconciliation` 记录
   - 发送「异常」类消息（`message.type=2`）
3. **人工确认**：在管理后台手动标记「已确认」，记录 `confirmed_by` / `confirmed_at`

#### 关键库表

- **`reconciliation`**（核心，规划中）
  - `stat_date` / `app_key` / `placement_id` / `network_def_id`
  - `sdk_impressions` / `api_impressions` / `impression_diff` / `impression_diff_pct`
  - `sdk_revenue` / `api_revenue` / `revenue_diff` / `revenue_diff_pct`
  - `status` (0=待对账 / 1=有差异 / 2=已确认) / `confirmed_by` / `confirmed_at`
  - 复合唯一：`(stat_date, app_key, placement_id, network_def_id)`

#### 注意事项

- 对账频率：**每日凌晨 2:00**（定时任务）
- 第三方平台拉取走 `coze-coding-dev-sdk`（如豆包 / 第三方 API）
- 差异 > 阈值时**必须人工介入**（自动系统无法判断是 SDK 漏报 还是 API 多报）
- 导入 CSV 大小限制：单文件 10MB / 10000 行

---

## 12. 广告平台 / Adapter

### 12.1 页面结构（4 Tab）

| Tab | 名称 | 主要功能 |
|-----|------|----------|
| 1 | 广告平台账号 | 开发者账号管理（凭证、状态） |
| 2 | 自定义广告平台 | 开发者自定义的网络 + Adapter 上传 |
| 3 | Adapter 管理 | Adapter 版本管理 + 审核 |
| 4 | 数据上报 | 自定义网络的数据上报格式 |

> 注：原 PLAN 中的 `/networks/[id]/accounts` 和 `/networks/[id]/adapters` 子页**已整合为 Tab**（URL 不够 RESTful，但功能完整）。

![广告平台](public/prd/thumb/13-network.png)

### 12.2 6 步对接流程

| 步骤 | 名称 | 落地状态 | 涉及表 | 涉及接口 |
|------|------|---------|--------|----------|
| 1 | 上传 Adapter | ✅ | `custom_adapter_version` / `ad_network_def` | `POST /network/custom/create` / `POST /network/adapter/upload` |
| 2 | 广告平台账号 | ✅ | `ad_network_account` | `POST /network/account/create` / `GET /network/account/list` / `PUT /network/account/:id` |
| 3 | 数据上报格式 | ✅ | `custom_network_report` | `POST /network/custom/report/upload` / `GET /network/custom/report/query` |
| 4 | 联调测试 | ✅ | `ad_source` | `POST /ad-source/create-custom` |
| 5 | 上线 | ✅ | `custom_adapter_version` | `PUT /network/custom/adapter/status` / `POST /network/adapter/review/:id` |
| 6 | 维护监控 | ✅ | `report_daily` / `message` | `GET /network/custom/report/query` / 异常消息通知 |

#### 步骤 1：上传 Adapter

- 「+ 自定义平台」→ 抽屉表单
  - 平台名称 / 平台代码（全局唯一） / 平台图标 / 系统类型（Android / iOS / 双端）
  - **adapter_class_*** 12 个字段：按 platform × format（5 种广告形式）填写 adapter class 名
- 「上传 Adapter ZIP」→ 弹窗选择 .zip 文件
  - 文件要求：含 `AndroidManifest.xml` / `Info.plist` 对应 adapter 类
  - 限制：单文件 50MB
  - 上传后自动计算 MD5 + 文件大小 → 落库 `custom_adapter_version`

#### 步骤 2：广告平台账号

- 「+ 添加账号」→ 弹窗
  - 选择平台（下拉）
  - 账号名 / 第三方账号 ID
  - **凭证字段**：schema-driven（不同平台字段不同）
    - 通用：`app_id` / `app_key` / `app_secret`
    - 优量汇：`package_name` / `signature_md5`
    - Sigmob：`app_id` / `api_key`
    - 穿山甲：`app_id` / `secret` / `user_id`
    - 微信：`app_id` / `universal_link`
  - 凭证脱敏显示（点击查看明文）
  - 选择关联应用
- 列表展示：账号名 / 平台 / 状态 / 创建时间 / 操作

#### 步骤 3：数据上报格式

- 「+ 上报数据」→ 弹窗
  - 选择平台
  - 上传 CSV（必填列：日期 / app_key / placement_id / 展示 / 点击 / 收益）
  - 实时预览前 10 行
- 列表展示：已上报数据，可按日期 / 应用 / 广告位 / 平台查询

#### 步骤 4：联调测试（创建自定义广告源）

- 在「广告源管理」页面「+ 自定义广告源」
- 表单：
  - 选择刚才创建的自定义广告平台
  - 广告源名 / 第三方 App ID / 第三方 Placement ID
  - 关联应用 + 广告位
- 创建后 SDK 即可拉取到该广告源

#### 步骤 5：上线（审核）

- Adapter 状态：草稿 → 审核中 → 已通过 / 已拒绝
- 状态由 admin 在「开发者管理」或「Adapter 管理」审核
- 通过后 SDK 端正式生效
- 拒绝时填写 `review_comment`，会发消息通知开发者

#### 步骤 6：维护监控

- 实时监控自定义网络的数据上报情况
- 异常（漏报 / 异常值）自动发消息
- 可在「数据上报」Tab 查询历史数据

### 12.3 关键库表

- **`ad_network_def`**（广告平台定义）
  - 必填：`network_code` (unique) / `network_name` / `network_type` / `is_preset` / `system_type`
  - 可选：`supports_bidding` / `icon_url` / `created_by` / `developer_id` / 12 个 `adapter_class_*` 字段
- **`ad_network_account`**（账号）
  - 必填：`developer_id` / `network_def_id` / `account_name`
  - 可选：`app_id` / `credentials` (JSONB) / `status` / `remark`
- **`custom_adapter_version`**（Adapter 版本）
  - 必填：`network_def_id` / `developer_id` / `version` / `file_name` / `file_url`
  - 可选：`file_size` / `file_md5` / `sdk_min_version` / `changelog` / `status` / `review_comment` / `reviewed_at` / `reviewed_by`
- **`custom_network_report`**（自定义网络数据）
  - 必填：`developer_id` / `app_key` / `placement_id` / `network_def_id` / `stat_date`
  - 可选：`impressions` / `clicks` / `revenue` / `upload_type` (1=SDK 2=API 3=手动)
- **`app_network_binding`**（应用-平台绑定）
  - 必填：`app_key` / `network_def_id` / `adapter_version_id` / `network_app_id`
  - 可选：`extra_params` (JSONB) / `status` / `account_id`

### 12.4 注意事项

- **平台代码（network_code）全局唯一**，重复会 40001 错误。
- **`is_preset=true` 的网络不可被开发者编辑 / 删除**。
- **`is_preset=false` 的网络是开发者自定义**，只对当前 developer 可见。
- **Adapter ZIP 文件**实际存到 OSS（详见第 18 章），DB 只存 URL + MD5。
- **凭证（credentials）JSONB** 字段，敏感字段（如 `app_secret`）前端默认脱敏显示（点击「查看」才显示明文）。
- **审核流程**：当前简化（admin 一键通过 / 拒绝），未来可加多级审核。

---

## 13. 消息中心

### 13.1 UI 说明

#### 顶部 Tab

- **全部**（未读优先）
- **收入通知**（type=1）
- **异常通知**（type=2）
- **工单通知**（type=3）

#### 列表（左主区）

每条消息：
- 左侧图标（按 type 区分：💰 收入 / ⚠️ 异常 / 🎫 工单）
- 标题（点击展开内容）
- 摘要
- 时间（相对时间：刚刚 / X 分钟前 / X 小时前 / X 天前）
- 未读标记（左侧蓝色圆点）
- 操作：「标记已读」/「查看详情」

#### 右侧详情（点击展开）

- 完整内容（支持富文本）
- 关联跳转（如点击「查看应用」跳到对应 app 详情）

![消息中心](public/prd/thumb/14-message.png)

### 13.2 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/message/list` | GET | 分页（按 type 筛选） |
| `/api/v1/console/message/read` | PUT | 标记已读（单条） |
| `/api/v1/console/message/read-all` | PUT | 全部已读 |
| `/api/v1/console/message/:id/read` | PUT | 标记已读（按 ID） |
| `/api/v1/console/message/unread-count` | GET | 未读数（顶栏铃铛用） |

#### 业务逻辑

1. **消息来源**：
   - 收入通知：对账完成、收益里程碑
   - 异常通知：API 拉取失败、Adapter 审核被拒、数据漏报
   - 工单通知：客服回复、平台公告
2. **未读数**：实时查询 `message.is_read=0 AND developer_id=current`
3. **顶栏铃铛**：每 30s 轮询未读数，显示红点徽标

#### 13.3 关键库表

- **`message`**（核心）
  - 必填：`developer_id` / `type` (1=收入 2=异常 3=工单) / `title` / `content`
  - 可选：`is_read` (0=未读 1=已读)

#### 13.4 通知偏好

`developer.notify_*` 6 个 boolean 字段：

- `notify_email_revenue` / `notify_email_anomaly` / `notify_email_ticket`
- `notify_inapp_revenue` / `notify_inapp_anomaly` / `notify_inapp_ticket`
- `notify_daily_digest`（每日摘要邮件）

在「个人中心」→「通知偏好」中配置。

#### 注意事项

- 消息**不会自动删除**，仅标记已读
- 邮件通知依赖 SMTP 配置（生产环境需要）
- 顶栏铃铛轮询会增加 QPS，生产环境建议改为 SSE 推送

---

## 14. 个人中心

### 14.1 UI 说明

#### 顶部信息卡片

- 头像（默认首字母）+ 公司名 + 邮箱 + 角色标签（developer / admin）
- 关键操作按钮：修改资料 / 修改密码 / 通知偏好 / 退出登录

#### 基本资料（el-descriptions）

| 字段 | 显示 |
|------|------|
| 开发者 TOKEN | `api_access_token`（脱敏）+ 复制按钮 + 重新生成按钮 |
| 邮箱 | `email`（只读） |
| 公司名称 | `company` |
| 公司简称 | `company_short_name` |
| 联系人 | `contact_name` |
| 联系电话 | `phone` |
| 接入方式 | 1=SDK接入 / 2=API接入 |
| API Token 过期时间 | `api_token_expire` |
| 创建时间 | `created_at` |
| 状态 | 1=启用 / 0=禁用 |

![个人中心](public/prd/thumb/15-profile.png)

#### 修改资料（抽屉）

- 可编辑：公司名称 / 公司简称 / 联系人 / 联系电话
- 不可编辑：邮箱 / 接入方式 / 角色

#### 修改密码（抽屉）

- 原密码（必填）
- 新密码（必填，8-32 位，含字母 + 数字）
- 确认新密码（必填，与新密码一致）
- 校验：先 `bcrypt.compare(原密码)`，再 `bcrypt.hash(新密码)`，最后 update

#### API Token（生成 + 重置）

- 「重新生成」→ 弹确认 → 调用 `POST /api/v1/auth/api-token` → 写入 `developer.api_access_token` + `api_token_expire` (+30 天)
- 复制按钮：复制 token 到剪贴板
- 注意：旧 token **立即失效**

#### 通知偏好

6 个开关（按 消息类型 × 渠道 矩阵）：

|  | 邮件 | 站内 |
|--|------|------|
| 收入 | ☐ | ☐ |
| 异常 | ☐ | ☐ |
| 工单 | ☐ | ☐ |
| 每日摘要 | — | ☐ |

### 14.2 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/profile/info` | GET | 完整资料 |
| `/api/v1/console/profile/preset` | GET | 预设数据（接入方式 / 状态等枚举） |
| `/api/v1/console/profile/tokens` | GET | 当前 API Token 列表 |
| `/api/v1/auth/profile` | PUT | 修改资料 |
| `/api/v1/auth/password` | PUT | 修改密码 |
| `/api/v1/auth/api-token` | POST | 生成 / 重置 API Token |

#### 关键库表

- **`developer`**（详见第 16 章）

### 14.3 注意事项

- **API Token** 是 SDK 端调用 `/api/v1/sdk/config` 和 `/api/v1/sdk/report` 的凭证，**不能泄露**
- 重新生成 Token 后**所有使用旧 Token 的 SDK 端需要立即更新**
- 密码修改成功后**强制登出所有设备**（未来可加，当前仅提示）

---

## 15. 超级管理员

> 仅 `role='admin'` 用户可访问 `/admin/*`

### 15.1 开发者管理

#### UI 说明

#### 表格

| 列 | 字段 | 备注 |
|----|------|------|
| 开发者 ID | `developer_id` | — |
| 邮箱 | `email` | — |
| 公司 | `company` | — |
| 联系人 | `contact_name` | — |
| 电话 | `phone` | — |
| 接入方式 | `access_type` | 1=SDK / 2=API |
| 角色 | `role` | developer / admin |
| 状态 | `status` | 1=启用 / 0=禁用 |
| 创建时间 | `created_at` | — |
| 操作 | — | 修改角色 / 启停 / 重置密码 / 详情 |

![开发者管理](public/prd/thumb/16-admin-developers.png)

#### 操作

- **修改角色**：`PATCH /admin/developers/:id/role { role: 'admin'|'developer' }`
- **启停**：`PATCH /admin/developers/:id/status { status: 0|1 }`
- **重置密码**：弹窗输入新密码 → 后端直接 update（不走验证码）

#### 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/admin/developers` | GET | 列表（支持筛选） |
| `/api/v1/console/admin/developers/:id/role` | PATCH | 改角色 |
| `/api/v1/console/admin/developers/:id/status` | PATCH | 启停 |

#### 关键库表

- **`developer`**

#### 注意事项

- **admin 数量应严格控制**（建议 ≤ 3 人）
- **admin 不能把自己降级为 developer**（防止误操作锁死）
- 禁用开发者会**立即**让其所有 session 失效（JWT 黑名单 / 强制登出）
- 重置密码会强制开发者重新登录

---

### 15.2 指标字典

#### UI 说明

#### 左侧分类树（200px）

- 分类列表（从 `report_metric_definition.category` DISTINCT）
- 选中后右侧显示该分类下的指标

#### 右侧表格

| 列 | 字段 | 备注 |
|----|------|------|
| 指标名 | `name` | 中文 |
| 指标代码 | `code` | 英文，唯一 |
| 分类 | `category` | — |
| 子分类 | `sub_category` | — |
| 取值类型 | `value_type` | actual=基础 / derived=派生 |
| 单位 | `unit` | — |
| 格式 | `format` | number / percent / currency / duration |
| 公式 | `formula` | 聚合公式 |
| 必填字段 | `required_fields` | ARRAY |
| 排序 | `sort_order` | — |
| 启用 | `is_active` | ✓ / ✗ |
| 系统级 | `is_system` | 系统级不可删 |
| 描述 | `description` | — |
| 操作 | — | 编辑 / 删除 / 启用 |

![指标字典](public/prd/thumb/17-admin-report-metric.png)

#### 公式编辑器

- 语法：`SUM(field)` / `AVG(field)` / `COUNT(field)` / `field_a * 1000 / field_b`
- 示例：`SUM(revenue) * 1000 / SUM(impressions)`（eCPM）
- 校验：调用 `POST /report-aggregate/validate-formula` 试运行

#### 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/report-metric/list` | GET | 列表（按分类筛选） |
| `/api/v1/console/report-metric/categories` | GET | 分类列表 |
| `/api/v1/console/report-metric/create` | POST | 创建（admin only） |
| `/api/v1/console/report-metric/update/:id` | PATCH | 更新（admin only） |
| `/api/v1/console/report-metric/delete/:id` | DELETE | 删除（admin only） |
| `/api/v1/console/report-aggregate/validate-formula` | POST | 校验公式 |

#### 关键库表

- **`report_metric_definition`**（核心）
  - 必填：`code` (unique) / `name` / `category` / `value_type` / `format`
  - 可选：`sub_category` / `unit` / `formula` / `required_fields` (ARRAY) / `sort_order` / `is_active` / `is_system` / `description`

#### 注意事项

- **`is_system=true` 的指标不可删除 / 修改**（系统预置）
- **公式修改后历史数据不需要重算**（公式在查询时实时应用）
- **`required_fields` 必须在 `report_daily` 存在**
- 派生指标（`value_type=derived`）必须有 `formula`，基础指标不需要

---

## 16. 数据库设计

### 16.1 表关系总览

```
developer (1) ──< (N) app ──< (N) placement ──< (N) traffic_group
                              │                       │
                              │                       └─< (N) waterfall_config ──< (N) waterfall_layer ──> ad_source
                              │                                                              └────────────────────> ad_network_def
                              │                                                              └────────────────────> ad_source_traffic_group
                              ├─< (N) app_network_binding ──> ad_network_def
                              │                                    └────────────────────> custom_adapter_version
                              │                                    └────────────────────> ad_network_account
                              ├─< (N) message
                              └─< (N) report_daily ──> ad_source
                                     └─< (N) custom_network_report
                                     └─< (N) reconciliation (规划中)

admin (role='admin') 独立于 developer，对 developer 进行管理
report_metric_definition / report_funnel_metric_definition / report_board 是独立字典表
hal_* 是 SDK 心跳 / 工单相关表
```

### 16.2 22 张表完整定义

#### 16.2.1 `developer`（开发者）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | 自增主键 |
| developer_id | varchar | ✓ | — | 业务 ID（`d_<16hex>`） |
| email | varchar | ✓ | — | 登录邮箱（unique） |
| password | varchar | ✓ | — | bcrypt 哈希 |
| company | varchar | | NULL | 公司名称 |
| contact_name | varchar | | NULL | 联系人 |
| phone | varchar | | NULL | 联系电话 |
| access_type | smallint | | 1 | 1=SDK / 2=API |
| api_access_token | varchar | | NULL | SDK 调用 Token |
| api_token_expire | timestamptz | | NULL | Token 过期时间 |
| status | smallint | | 1 | 1=启用 / 0=禁用 |
| company_short_name | varchar | | NULL | 公司简称 |
| role | varchar | ✓ | 'developer' | 'developer' / 'admin' |
| notify_email_revenue | bool | | true | 邮件-收入 |
| notify_email_anomaly | bool | | true | 邮件-异常 |
| notify_email_ticket | bool | | true | 邮件-工单 |
| notify_inapp_revenue | bool | | true | 站内-收入 |
| notify_inapp_anomaly | bool | | true | 站内-异常 |
| notify_inapp_ticket | bool | | true | 站内-工单 |
| notify_daily_digest | bool | | false | 每日摘要 |
| created_at | timestamptz | | now() | — |
| updated_at | timestamptz | | now() | — |

**唯一约束**：`email`

---

#### 16.2.2 `app`（应用）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| developer_id | varchar | ✓ | — | FK→developer.developer_id |
| app_key | varchar | ✓ | — | **unique**（`ak_<16base36>`） |
| app_name | varchar | ✓ | — | 应用名 |
| package_name | varchar | ✓ | — | **unique**（包名 / Bundle ID） |
| platform | smallint | ✓ | — | 1=Android / 2=iOS / 3=双端 |
| category | varchar | | NULL | 应用分类 |
| icon_url | varchar | | NULL | 图标 OSS URL |
| status | smallint | | 1 | 1=启用 / 0=禁用 |
| timeout_ms | smallint | | 1000 | 广告请求超时 |
| store_url | varchar | | NULL | 应用商店 URL |
| wechat_app_id | varchar | | NULL | 微信 AppID |
| wechat_universal_link | varchar | | NULL | 微信 Universal Link |
| access_type | smallint | | 1 | 1=SDK / 2=API |
| store_listed | bool | | true | 是否上架 |
| store_name | text | | NULL | 上架商店名 |
| download_url | text | | NULL | 下载 URL |
| app_domain | text | | NULL | 应用域名 |
| auth_subaccount | text | | NULL | 鉴权副账号 |
| orientation | smallint | | 1 | 0=竖 / 1=横 / 2=自动 |
| coppa_compliant | bool | | false | COPPA 合规 |
| ccpa_compliant | bool | | false | CCPA 合规 |
| frequency_config | jsonb | | '{}' | 频次配置（impression/click per day/hour） |

**唯一约束**：`app_key`, `package_name`

---

#### 16.2.3 `placement`（广告位）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| app_key | varchar | ✓ | — | FK→app.app_key |
| placement_id | varchar | ✓ | — | **unique**（`pl_<16base36>`） |
| name | varchar | ✓ | — | 广告位名 |
| format | smallint | ✓ | — | 1=banner / 2=interstitial / 3=native / 4=rewarded / 5=splash |
| status | smallint | | 1 | 1=启用 / 0=禁用 |
| bidding_type | smallint | | NULL | 1=客户端 / 2=服务端 |
| screen_orientation | smallint | | NULL | 0=竖 / 1=横 / 2=不限 |
| ad_size | smallint | | NULL | 仅 banner |
| material_type | smallint | | NULL | 仅 native |
| video_mute | smallint | | NULL | 仅 rewarded / splash |
| auto_play | smallint | | NULL | 仅 rewarded / splash |
| template_style | smallint | | NULL | 仅 native |

**唯一约束**：`placement_id`

---

#### 16.2.4 `ad_network_def`（广告平台定义）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| network_code | varchar | ✓ | — | **unique** |
| network_name | varchar | ✓ | — | 显示名 |
| network_type | smallint | ✓ | 1 | 1 / 2（**注意：被滥用，不要用此字段过滤预置**） |
| supports_bidding | smallint | | 0 | 0=否 / 1=是 |
| status | smallint | | 1 | 1=启用 / 0=禁用 |
| created_by | varchar | | NULL | 'system' / developer_id |
| is_preset | bool | ✓ | false | **预置 vs 自定义 的可靠区分** |
| developer_id | varchar | | NULL | 自定义时 = 创建者 |
| system_type | smallint | ✓ | 3 | 1=Android / 2=iOS / 3=Both |
| icon_url | varchar | | NULL | 平台图标 |
| adapter_class_init_android | varchar | | NULL | 初始化类名 |
| adapter_class_init_ios | varchar | | NULL | |
| adapter_class_banner_android | varchar | | NULL | |
| adapter_class_banner_ios | varchar | | NULL | |
| adapter_class_interstitial_android | varchar | | NULL | |
| adapter_class_interstitial_ios | varchar | | NULL | |
| adapter_class_rewarded_android | varchar | | NULL | |
| adapter_class_rewarded_ios | varchar | | NULL | |
| adapter_class_native_android | varchar | | NULL | |
| adapter_class_native_ios | varchar | | NULL | |
| adapter_class_splash_android | varchar | | NULL | |
| adapter_class_splash_ios | varchar | | NULL | |

**唯一约束**：`network_code`

---

#### 16.2.5 `ad_source`（广告源）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| developer_id | varchar | ✓ | — | 所属开发者 |
| network_def_id | bigint | | NULL | FK→ad_network_def.id |
| network_code | varchar | ✓ | — | 与 ad_network_def.network_code 一致 |
| network_name | varchar | ✓ | — | 冗余存储 |
| source_name | varchar | ✓ | — | 广告源名 |
| third_app_id | varchar | ✓ | — | 第三方平台 app_id（**NOT NULL，易漏**） |
| third_placement_id | varchar | ✓ | — | 第三方平台 placement_id（**NOT NULL，易漏**） |
| extra | jsonb | | NULL | 扩展参数 |
| status | smallint | | 1 | 1=启用 / 0=禁用 |
| is_custom | bool | | false | 是否自定义 |
| app_id | bigint | | NULL | 关联应用 |
| placement_id | bigint | | NULL | 关联广告位 |
| store_dim_params | jsonb | | NULL | 存储维度参数 |

**注意事项**：`third_app_id` + `third_placement_id` **必填且 NOT NULL**，创建时容易漏。

---

#### 16.2.6 `ad_source_traffic_group`（广告源-流量分组绑定）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| ad_source_id | bigint | ✓ | — | FK→ad_source.id |
| traffic_group_id | bigint | ✓ | — | FK→traffic_group.id |
| status | smallint | ✓ | 1 | 1=启用 / 0=禁用 |
| price | numeric | | NULL | 出价（瀑布层排序依据） |
| hour_limit | integer | | NULL | 单小时曝光上限 |
| day_limit | integer | | NULL | 单日曝光上限 |
| interval_sec | integer | | NULL | 曝光间隔（秒） |

---

#### 16.2.7 `traffic_group`（流量分组）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| placement_id | varchar | | NULL | FK→placement.placement_id |
| group_name | varchar | ✓ | — | 分组名 |
| conditions | jsonb | ✓ | '[]' | 规则条件数组 |
| priority | integer | | 0 | 优先级（**越大越优先**） |
| waterfall_config_id | bigint | ✓ | 0 | 关联当前生效的瀑布流 |
| status | smallint | | 1 | — |
| is_default | bool | | false | 默认分组（每个 placement 必有 1 个） |
| is_system | bool | | false | 系统级 |
| is_locked | bool | | false | 锁定（不可编辑） |
| developer_id | varchar | | NULL | 所属 |
| waterfall_id | varchar | | NULL | 备用 |

---

#### 16.2.8 `waterfall_config`（瀑布流配置）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| placement_id | varchar | ✓ | — | FK→placement.placement_id |
| traffic_group_id | bigint | | 0 | FK→traffic_group.id |
| version | integer | | 1 | 版本号（自增） |
| status | smallint | | 1 | 1=生效 / 0=历史 / 2=草稿 |
| layers | jsonb | | NULL | **3 层数组的 JSONB 快照** |

**重要**：`layers` JSONB 字段在最早建表时缺失，导致历史 update 静默丢弃。已通过 ALTER TABLE 修复。**新环境必须执行**：
```sql
ALTER TABLE waterfall_config ADD COLUMN IF NOT EXISTS layers JSONB DEFAULT '[]'::jsonb;
```

**placement_id 存储形式**：历史上曾存为 number-as-string（如 `"58"`），与 placement.placement_id 字符串型（`"pl_xxx"`）不一致。`get/list` 端用 `.in('placement_id', [pidStr, placementIdStr])` 兼容。**新环境部署必须保证创建时入参形式一致**（推荐 string）。

---

#### 16.2.9 `waterfall_layer`（瀑布层详细行）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| config_id | bigint | ✓ | — | FK→waterfall_config.id |
| layer_type | smallint | ✓ | — | 1=Bidding / 2=瀑布 / 3=兜底 |
| ad_source_id | bigint | ✓ | — | FK→ad_source.id |
| sort_price | numeric | | 0.00 | 出价（瀑布层内排序） |
| timeout_ms | integer | | 3000 | 超时（ms） |
| priority | integer | | 0 | — |
| status | smallint | | 1 | — |

**双写策略**：`update` 端点同时写 `waterfall_config.layers` JSONB + `waterfall_layer` 关联表。`get` 端点返回双份，前端优先 JSONB。

---

#### 16.2.10 `report_daily`（每日报表）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| developer_id | varchar | ✓ | — | — |
| app_key | varchar | ✓ | — | — |
| placement_id | varchar | ✓ | — | — |
| ad_source_id | bigint | ✓ | 0 | — |
| stat_date | date | ✓ | — | 统计日期 |
| hour | smallint | | NULL | 小时（0-23） |
| requests | integer | | 0 | 请求数 |
| fills | integer | | 0 | 填充数 |
| impressions | integer | | 0 | 展示数 |
| clicks | integer | | 0 | 点击数 |
| revenue | numeric | | 0.0000 | 收益（¥） |
| ad_type | varchar | | NULL | 广告形式 |
| region | varchar | | NULL | 国家 / 地区 |
| os | varchar | | NULL | 操作系统（android/ios） |

**复合唯一**：(developer_id, app_key, placement_id, ad_source_id, stat_date, hour)

**派生指标公式**：
- 展示率 = `fills / requests`
- 点击率 = `clicks / impressions`
- CTR = `clicks / impressions`
- eCPM = `revenue * 1000 / impressions`

---

#### 16.2.11 `custom_network_report`（自定义网络数据）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| developer_id | varchar | ✓ | — | — |
| app_key | varchar | ✓ | — | — |
| placement_id | varchar | ✓ | — | — |
| network_def_id | bigint | ✓ | — | — |
| stat_date | date | ✓ | — | — |
| impressions | integer | | 0 | — |
| clicks | integer | | 0 | — |
| revenue | numeric | | 0.0000 | — |
| upload_type | smallint | | 1 | 1=SDK 2=API 3=手动 |

---

#### 16.2.12 `ad_network_account`（广告平台账号）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| developer_id | varchar | ✓ | — | — |
| network_def_id | bigint | ✓ | — | FK→ad_network_def.id |
| app_id | bigint | | NULL | 关联 app.id（可选） |
| account_name | varchar | ✓ | — | 账号名 |
| account_id | varchar | | NULL | 第三方账号 ID |
| credentials | jsonb | | '{}' | 凭证（**敏感字段加密**） |
| status | smallint | | 1 | 1=启用 / 0=禁用 |
| remark | text | | NULL | 备注 |

---

#### 16.2.13 `app_network_binding`（应用-平台绑定）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| app_key | varchar | ✓ | — | FK→app.app_key |
| network_def_id | bigint | ✓ | — | FK→ad_network_def.id |
| adapter_version_id | bigint | ✓ | 0 | FK→custom_adapter_version.id |
| network_app_id | varchar | ✓ | — | 该应用在第三方平台的 ID |
| extra_params | jsonb | | NULL | 扩展参数 |
| status | smallint | | 1 | — |
| account_id | bigint | | NULL | FK→ad_network_account.id |

---

#### 16.2.14 `custom_adapter_version`（Adapter 版本）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| network_def_id | bigint | ✓ | — | FK→ad_network_def.id |
| developer_id | varchar | ✓ | — | — |
| version | varchar | ✓ | — | semver（自定义） |
| file_name | varchar | ✓ | — | 原始文件名 |
| file_url | varchar | ✓ | — | OSS URL |
| file_size | bigint | | NULL | 字节 |
| file_md5 | varchar | | NULL | MD5 校验 |
| sdk_min_version | varchar | | NULL | SDK 最低版本要求 |
| changelog | text | | NULL | 变更日志 |
| status | smallint | | 1 | 1=草稿 / 2=审核中 / 3=通过 / 4=拒绝 |
| review_comment | varchar | | NULL | 审核意见 |
| reviewed_at | timestamptz | | NULL | — |
| reviewed_by | varchar | | NULL | admin developer_id |

---

#### 16.2.15 `message`（消息）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| developer_id | varchar | ✓ | — | — |
| type | smallint | ✓ | — | 1=收入 / 2=异常 / 3=工单 |
| title | varchar | ✓ | — | — |
| content | text | ✓ | — | — |
| is_read | smallint | | 0 | 0=未读 / 1=已读 |

---

#### 16.2.16 `report_metric_definition`（指标字典）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| code | varchar | ✓ | — | **unique**（英文代码） |
| name | varchar | ✓ | — | 中文名 |
| category | varchar | ✓ | — | 分类 |
| sub_category | varchar | | NULL | 子分类 |
| value_type | varchar | ✓ | 'actual' | 'actual' / 'derived' |
| unit | varchar | | NULL | 单位（次 / % / ¥ / ms） |
| format | varchar | ✓ | — | number / percent / currency / duration |
| formula | text | | NULL | 聚合公式 |
| required_fields | ARRAY | | NULL | 必填字段列表 |
| sort_order | integer | | 0 | 排序 |
| is_active | bool | | true | — |
| is_system | bool | | false | 系统级不可删 |
| description | text | | NULL | — |

---

#### 16.2.17 `report_funnel_metric_definition`（漏斗指标定义）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| stage | text | ✓ | — | 阶段名 |
| code | text | ✓ | — | 英文代码 |
| name | text | ✓ | — | 中文名 |
| is_event | bool | | false | 是否事件 |
| event_index | integer | | NULL | 事件序号 |
| formula | text | | NULL | 公式 |
| unit | text | | NULL | — |
| format | text | ✓ | — | number / percent |
| sort_order | integer | | 0 | — |
| is_active | bool | | true | — |
| is_system | bool | | true | — |
| description | text | | NULL | — |

---

#### 16.2.18 `report_board`（报表看板）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| developer_id | varchar | ✓ | — | — |
| name | text | ✓ | — | 看板名 |
| report_type | text | ✓ | — | 报表类型 |
| is_default | bool | | false | 默认 |
| is_hidden | bool | | false | 隐藏 |
| config | jsonb | ✓ | '{}' | 配置（筛选器 / 列 / 排序） |
| sort_order | integer | | 0 | — |

---

#### 16.2.19 `health_check`（健康检查）

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| id | bigint PK | ✓ | seq | — |
| created_at | timestamptz | ✓ | now() | — |
| service_name | varchar | | NULL | 服务名 |
| status | smallint | | NULL | 1=healthy / 0=unhealthy |
| latency_ms | integer | | NULL | 延迟 |

---

#### 16.2.20 `hal_message` / `hal_session` / `hal_ticket`（SDK 心跳 / 工单）

> 集成自 `coze-coding-dev-sdk`，用于 SDK 端实时消息 / 会话 / 工单。
> 字段定义由 SDK 决定，此处不展开。

---

### 16.3 关键索引建议

| 表 | 索引 |
|----|------|
| `report_daily` | `(developer_id, stat_date)` / `(app_key, stat_date)` / `(placement_id, stat_date)` / `(region)` / `(os)` |
| `app` | `app_key` (unique) / `package_name` (unique) / `developer_id` |
| `placement` | `placement_id` (unique) / `app_key` |
| `ad_source` | `(developer_id, status)` / `network_def_id` |
| `waterfall_config` | `(placement_id, traffic_group_id, version)` |
| `waterfall_layer` | `(config_id, layer_type, sort_price DESC)` |
| `message` | `(developer_id, is_read, created_at DESC)` |
| `custom_adapter_version` | `(network_def_id, version)` |
| `custom_network_report` | `(developer_id, app_key, stat_date)` |

### 16.4 注意事项

- **RLS 当前未启用**（用 `service_role` key 绕过），存在越权风险，**未来必须补**。
- 字段名统一 `snake_case`（Supabase 要求）。
- **所有 JSONB 字段**前端访问前必须 `JSON.parse()`，写入前必须 `JSON.stringify()`。
- 数值字段**显式判 0**（不能用 `!val` 判定空，会把 0 误判为空）。
- **时间字段**统一 `timestamp with time zone`，前端用 `dayjs` 解析。

---

## 17. SDK 端接口（开发者用）

> SDK 端调用接口（独立鉴权，**不走 HttpOnly Cookie**）

### 17.1 拉取瀑布流配置

**接口**：`GET /api/v1/sdk/config`

**Query 参数**：
- `app_key` (必填)
- `placement_id` (必填)
- `user_context` (可选)：JSON 字符串（os / region / app_version / sdk_version / custom_tag）

**鉴权**：`Authorization: Bearer <developer.api_access_token>`

**响应**：
```json
{
  "code": 0,
  "data": {
    "config": {
      "traffic_group_id": 1,
      "version": 3,
      "layers": [
        { "type": 1, "sources": [...] },  // Bidding
        { "type": 2, "sources": [...] },  // 瀑布
        { "type": 3, "sources": [...] }   // 兜底
      ]
    }
  }
}
```

**缓存策略**：客户端缓存 5 分钟。

### 17.2 上报数据

**接口**：`POST /api/v1/sdk/report`

**Body**（批量上报，1 次最多 100 条）：
```json
{
  "reports": [
    {
      "app_key": "ak_xxx",
      "placement_id": "pl_xxx",
      "ad_source_id": 123,
      "event": "impression",  // impression / click / request / fill
      "revenue": 0.001,
      "timestamp": 1700000000000,
      "user_context": { "os": "android", "region": "CN" }
    }
  ]
}
```

**响应**：`{ code: 0, data: { accepted: 100 } }`

**限流**：单 app_key 600 QPS。

---

## 18. 集成与运维

### 18.1 对象存储（OSS）

#### 用途

- 应用图标（`app.icon_url`）
- 广告平台图标（`ad_network_def.icon_url`）
- Adapter ZIP 包（`custom_adapter_version.file_url`）

#### 集成方式

- 通过 `coze-coding-dev-sdk` 的 `storage` 集成
- **生产环境**：必须配置 S3 兼容的 OSS（如 AWS S3 / 阿里云 OSS / 腾讯云 COS）
- **开发环境**：可走本地存储（`${COZE_WORKSPACE_PATH}/public/`）

#### 注意事项

- 跨域下载必须用 `fetch + blob` 模式（**禁止** `<a download>` 跨域）
- 图片建议用 WebP / AVIF（带 PNG fallback）
- Adapter ZIP MD5 必须存库（防重传）

### 18.2 邮件 / 短信

- 邮件：SMTP（生产环境需配置）
- 短信：阿里云 / 腾讯云短信（当前未集成）
- **验证码仅走邮件**（不接入短信）

### 18.3 监控 / 日志

#### 日志目录

- `app.log`：主流程 + 关键错误
- `console.log`：浏览器控制台
- `dev.log`：补充调试

#### 健康检查

- `GET /api/health`（**未鉴权**）
- 内部会写 `health_check` 表（用于 SLA 报表）

#### 性能监控

- LCP < 2.5s / INP < 200ms / CLS < 0.1（**未启用 Web Vitals 上报**，生产环境建议加）

### 18.4 部署

| 环境 | 命令 |
|------|------|
| 开发 | `pnpm install && pnpm tsx watch server/server.ts` |
| 生产构建 | `pnpm vite build && pnpm tsup server/server.ts --format cjs` |
| 生产启动 | `node dist-server/server.js` |
| 沙箱启动 | 由 `.coze` + `scripts/*.sh` 管理 |

**端口**：固定 `5000`（从 `DEPLOY_RUN_PORT` 环境变量读）

**Node 版本**：≥ 20

---

## 19. 注意事项汇总

### 19.1 性能

1. **大表分区**：`report_daily` 按月分区（生产环境必须）
2. **索引**：见第 16 章
3. **缓存**：SDK 端 5 分钟；前端路由组件级 `keep-alive`
4. **大列表虚拟滚动**：当前未启用，**≥ 1000 行**时建议加
5. **图表按需加载**：ECharts 已按需 import，未用到的图表不打包

### 19.2 安全

1. **密码**：bcrypt 哈希（10 rounds）
2. **JWT**：HS256 + 7 天过期（生产建议改 RS256 + 黑名单）
3. **HttpOnly Cookie**：防 XSS
4. **SameSite=Strict**：防 CSRF
5. **凭证脱敏**：前端默认不显示明文
6. **API Token 重新生成**：旧 token 立即失效
7. **RLS 未启用**（**已知风险**）
8. **CSRF 风险**：HTTP API + cookie 仍存在（**建议生产加 CSRF token**）

### 19.3 合规

1. **COPPA / CCPA**：`app.coppa_compliant` / `app.ccpa_compliant` 字段
2. **数据存储**：报表数据保留 1 年（生产环境需确认）
3. **用户同意**：SDK 端需弹出隐私政策（**SDK 端实现**）
4. **GDPR**：「被遗忘权」当前未实现（**已知缺口**）

### 19.4 已知问题 / 缺口

| 问题 | 影响 | 建议 |
|------|------|------|
| `developer.password` 重置接口未实现 | 忘记密码流程不闭环 | 补 `POST /auth/reset-password` |
| 报告邮件 SMTP 未配置 | 邮件通知不生效 | 配置 SMTP 凭证 |
| RLS 未启用 | 越权风险 | 补 RLS policies |
| `reconciliation` 表未建 | 对账功能未落地 | 补表 + 接口 |
| `funnel_event` 事件表未建 | 漏斗分析只有 1 个 step | 补表 + 事件埋点 |
| 短信通知未集成 | 短信通知不生效 | 集成阿里云 / 腾讯云 |
| Web Vitals 未监控 | 无法量化性能 | 加 `web-vitals` 上报 |
| 顶栏铃铛轮询增加 QPS | 高并发下压力大 | 改 SSE 推送 |
| 报表查询未分页 | 大数据量卡顿 | 加分页 + 虚拟滚动 |
| Adapter 审核流程简化 | 无多级审核 | 加多级审核 |
| `is_system=true` 指标不可删 | 灵活性差 | 提权 + 版本控制 |
| `waterfall_config.placement_id` 历史格式不一 | list 端点需兼容 | 新环境统一用 string |

### 19.5 后续优化方向

1. **AI 智能优化**（瀑布流 eCPM 自动调优）
2. **多语言**（i18n，当前仅中文）
3. **可视化埋点**（报表事件自定义）
4. **权限分级**（运营 / 财务 / 开发者 / 管理员）
5. **第三方登录**（OAuth 2.0 / SSO）
6. **开放 API**（开发者自助接入，平台之间互通）

---

## 附录 A：完整接口清单

| 模块 | 接口 | 方法 | 鉴权 |
|------|------|------|------|
| 公共 | `/api/health` | GET | ❌ |
| 鉴权 | `/api/v1/auth/register` | POST | ❌ |
| 鉴权 | `/api/v1/auth/login` | POST | ❌ |
| 鉴权 | `/api/v1/auth/logout` | POST | ✅ |
| 鉴权 | `/api/v1/auth/verify` | POST | ❌ |
| 鉴权 | `/api/v1/auth/me` | GET | ✅ |
| 鉴权 | `/api/v1/auth/send-captcha` | POST | ❌ |
| 鉴权 | `/api/v1/auth/profile` | PUT | ✅ |
| 鉴权 | `/api/v1/auth/password` | PUT | ✅ |
| 鉴权 | `/api/v1/auth/api-token` | POST | ✅ |
| 应用 | `/api/v1/console/app/list` | GET | ✅ |
| 应用 | `/api/v1/console/app/create` | POST | ✅ |
| 应用 | `/api/v1/console/app/update` | PUT | ✅ |
| 应用 | `/api/v1/console/app/delete` | DELETE | ✅ |
| 应用 | `/api/v1/console/app/detail` | GET | ✅ |
| 应用 | `/api/v1/console/app/toggle-status` | PUT | ✅ |
| 应用 | `/api/v1/console/app/upload-icon` | POST | ✅ |
| 应用 | `/api/v1/console/app/:id/frequency` | GET / PUT | ✅ |
| 广告位 | `/api/v1/console/placement/list` | GET | ✅ |
| 广告位 | `/api/v1/console/placement/create` | POST | ✅ |
| 广告位 | `/api/v1/console/placement/update` | PUT | ✅ |
| 广告位 | `/api/v1/console/placement/delete` | DELETE | ✅ |
| 广告位 | `/api/v1/console/placement/detail` | GET | ✅ |
| 流量分组 | `/api/v1/console/traffic-group/list` | GET | ✅ |
| 流量分组 | `/api/v1/console/traffic-group/create` | POST | ✅ |
| 流量分组 | `/api/v1/console/traffic-group/update` | PUT | ✅ |
| 流量分组 | `/api/v1/console/traffic-group/delete/:id` | DELETE | ✅ |
| 广告源 | `/api/v1/console/ad-source/list` | GET | ✅ |
| 广告源 | `/api/v1/console/ad-source/create` | POST | ✅ |
| 广告源 | `/api/v1/console/ad-source/update` | PUT | ✅ |
| 广告源 | `/api/v1/console/ad-source/delete` | DELETE | ✅ |
| 广告源 | `/api/v1/console/ad-source/networks` | GET | ✅ |
| 广告源 | `/api/v1/console/ad-source/create-custom` | POST | ✅ |
| 瀑布流 | `/api/v1/console/waterfall/get` | GET | ✅ |
| 瀑布流 | `/api/v1/console/waterfall/list` | GET | ✅ |
| 瀑布流 | `/api/v1/console/waterfall/update` | POST | ✅ |
| 瀑布流 | `/api/v1/console/waterfall/history` | GET | ✅ |
| 报表 | `/api/v1/console/dashboard/overview` | GET | ✅ |
| 报表 | `/api/v1/console/dashboard/trend` | GET | ✅ |
| 报表 | `/api/v1/console/dashboard/ranking/:dimension` | GET | ✅ |
| 报表 | `/api/v1/console/report/daily` | GET | ✅ |
| 报表 | `/api/v1/console/report/export` | GET | ✅ |
| 报表 | `/api/v1/console/report-aggregate/options` | POST | ✅ |
| 报表 | `/api/v1/console/report-aggregate/aggregate` | POST | ✅ |
| 报表 | `/api/v1/console/report-aggregate/funnel/definition` | GET | ✅ |
| 报表 | `/api/v1/console/report-aggregate/validate-formula` | POST | ✅ |
| 报表 | `/api/v1/console/report-metric/list` | GET | ✅ |
| 报表 | `/api/v1/console/report-metric/categories` | GET | ✅ |
| 报表 | `/api/v1/console/report-metric/create` | POST | admin |
| 报表 | `/api/v1/console/report-metric/update/:id` | PATCH | admin |
| 报表 | `/api/v1/console/report-metric/delete/:id` | DELETE | admin |
| 对账 | `/api/v1/console/reconciliation/list` | GET | ✅ |
| 对账 | `/api/v1/console/reconciliation/import` | POST | ✅ |
| 对账 | `/api/v1/console/reconciliation/export` | GET | ✅ |
| 对账 | `/api/v1/console/reconciliation/resolve` | POST | ✅ |
| 消息 | `/api/v1/console/message/list` | GET | ✅ |
| 消息 | `/api/v1/console/message/read` | PUT | ✅ |
| 消息 | `/api/v1/console/message/read-all` | PUT | ✅ |
| 消息 | `/api/v1/console/message/:id/read` | PUT | ✅ |
| 消息 | `/api/v1/console/message/unread-count` | GET | ✅ |
| 广告平台 | `/api/v1/console/network/custom/create` | POST | ✅ |
| 广告平台 | `/api/v1/console/network/adapter/upload` | POST | ✅ |
| 广告平台 | `/api/v1/console/network/adapter/review/:id` | POST | admin |
| 广告平台 | `/api/v1/console/network/custom/adapter/status` | PUT | ✅ |
| 广告平台 | `/api/v1/console/network/custom/report/upload` | POST | ✅ |
| 广告平台 | `/api/v1/console/network/custom/report/query` | GET | ✅ |
| 广告平台 | `/api/v1/console/network/account/create` | POST | ✅ |
| 广告平台 | `/api/v1/console/network/account/list` | GET | ✅ |
| 广告平台 | `/api/v1/console/network/account/:id` | PATCH / DELETE | ✅ |
| 个人中心 | `/api/v1/console/profile/info` | GET | ✅ |
| 个人中心 | `/api/v1/console/profile/preset` | GET | ✅ |
| 个人中心 | `/api/v1/console/profile/tokens` | GET | ✅ |
| Admin | `/api/v1/console/admin/developers` | GET | admin |
| Admin | `/api/v1/console/admin/developers/:id/role` | PATCH | admin |
| Admin | `/api/v1/console/admin/developers/:id/status` | PATCH | admin |
| SDK | `/api/v1/sdk/config` | GET | Token |
| SDK | `/api/v1/sdk/report` | POST | Token |

**总计**：约 75+ 个接口，覆盖 13 个业务模块 + 鉴权 + SDK + Admin。

---

## 附录 B：术语表

| 术语 | 解释 |
|------|------|
| **SDK** | Software Development Kit，开发者嵌入到 App 中的广告库 |
| **Bidding** | 实时竞价，多个广告源同时出价，最高价得 |
| **瀑布流（Waterfall）** | 顺序请求广告源，前一个超时或失败后回退下一个 |
| **eCPM** | Effective Cost Per Mille，每千次展示有效收益 |
| **CTR** | Click Through Rate，点击率 = 点击数 / 展示数 |
| **COPPA** | 美国儿童在线隐私保护法 |
| **CCPA** | 加州消费者隐私法案 |
| **ROAS** | Return on Ad Spend，广告支出回报率 |
| **ARPU** | Average Revenue Per User |
| **LTV** | Life Time Value，用户生命周期价值 |
| **DAU / MAU** | 日活 / 月活 |
| **频次（Frequency）** | 单个用户看到广告的次数 |
| **漏斗（Funnel）** | 用户从曝光到付费的转化路径 |
| **HRROAS** | Header Bidding 实时竞价 |
| **Adapter** | 对接第三方广告平台的适配器包 |
| **Custom Network** | 开发者自定义的广告平台（区别于官方预置） |
| **TRAFFIC GROUP** | 流量分组，按规则匹配用户群体 |
| **RLS** | Row Level Security，行级权限控制 |

---

## 附录 C：变更记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-07-31 | v1.0.0 | 初版 PRD，覆盖 13 个业务模块 + 鉴权 + 22 张表 + 75+ 接口 |
| 未来 | — | 待补：邮件 / 短信集成、RLS、多级审核、Web Vitals 监控、GDPR 合规等 |

