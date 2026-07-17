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

#### 表格「整体居中」规范（2026-07-18 升级 · 全平台统一）

- **所有数据列（含维度列）**：`align: 'center'` + `headerAlign: 'center'`
- **CSS 兜底**（写在 `index.css`）：`.el-table .el-table__cell > .cell { display: flex; justify-content: center; align-items: center; width: 100%; }`
- **数字列**：`font-variant-numeric: tabular-nums`（等宽数字，小数点对齐）
- ❌ **反模式（已修复）**：
  - 表头左对齐 + 数据右对齐 → 视觉错位 14-28px
  - 仅指标列右对齐 + 维度列左对齐 → 指标对齐了但维度全乱
  - 单一使用 `text-align: right`（EP 内部 cell 强制 `width: 138px` 会导致 th/td 宽度不一致）
- ✅ **正确**：全局 flex 居中方案，所有列统一

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

> **实现说明**：当前**登录 / 注册均使用 4 位 Canvas 图形验证码**（不是邮箱验证码），无图形验证码作为反爬虫兜底。

### 3.1 注册

![注册](public/prd/thumb/02-register.png)

#### 3.1.1 页面结构

- **左侧品牌区**（占屏 50%）：Logo + 品牌口号 + 4 项产品卖点 + 版权
- **右侧表单区**（50%）：注册卡片（白底 + 圆角 12px + 阴影）
  - 卡片宽度：480px
  - 卡片标题：「创建新账户」
  - 副标题：「已有账户？立即登录」（点击跳 /login）
  - 底部链接：「立即注册」「用户协议」「隐私政策」

#### 3.1.2 字段详细说明

| 字段 | 控件 | 必填 | 长度 | 校验规则 | 错误提示 | 备注 |
|------|------|------|------|----------|----------|------|
| **邮箱** | `<el-input>` prefix icon=`Message` | ✅ | 5-64 | 必须匹配正则 `/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/` | "请输入邮箱地址" / "请输入有效的邮箱地址" | 失焦校验，**不能**包含以下保留后缀：`prd.com` / `dev.com` / `test.com`（防误注册） |
| **密码** | `<el-input type="password">` prefix icon=`Lock`，尾部「👁」切换可见 | ✅ | 6-20 | 必须含字母 + 数字（前后端均校验） | "请输入密码" / "密码长度至少6位" / "密码必须包含字母和数字" | 失焦校验，输入时实时校验强度（小条形强度计） |
| **确认密码** | `<el-input type="password">` | ✅ | 6-20 | 必须与密码一致 | "两次密码输入不一致" | 实时校验（watch password） |
| **公司名称** | `<el-input>` | ✅ | 2-50 | 非空 | "请输入公司名称" | 完整公司名 |
| **公司简称** | `<el-input>` | ✅ | 2-10 | 非空 + **全局唯一**（后端查重） | "公司简称已被使用" / "请输入2-10位公司简称" | 用于报表 / 消息中的展示前缀，**不可重名** |
| **联系人** | `<el-input>` | ✅ | 2-20 | 非空 | "请输入联系人姓名" | 真实姓名 |
| **联系电话** | `<el-input>` | ✅ | 11 | 必须匹配手机号正则 `/^1[3-9]\d{9}$/` | "请输入正确的11位手机号" | 中国大陆手机号 |
| **接入方式** | `<el-radio-group>` | ✅ | — | 二选一 | — | 1=SDK 接入 / 2=API 接入，默认 1 |
| **图形验证码** | `<el-input>` + 右侧 `<canvas>` | ✅ | 4 | 字母+数字（去除易混的 0/O/1/I/l），**不区分大小写** | "请输入验证码" / "验证码错误" | Canvas 动态生成，4 条干扰线 + 80 随机点 + 字符倾斜 ±20° |
| **隐私协议** | `<el-checkbox>` | ✅ | — | 必须勾选 | "请阅读并同意隐私政策" | 文案：「我已阅读并同意《用户协议》和《隐私政策》」 |
| **注册按钮** | `<el-button type="primary">` | — | — | — | — | 全宽，所有校验通过后才可点击 |
| **「立即登录」** | `<el-link>` | — | — | — | — | 跳 /login |

#### 3.1.3 交互流程

```
[进入 /register]
    ↓
[onMounted] → 立即调用 generateCaptchaText() + drawCaptcha()
              → 4 位验证码写入 canvas（180×50 像素）
    ↓
[用户填写表单]
    ↓
[点击「看不清？换一张」链接] → 重新 drawCaptcha()（前端态，不调后端）
    ↓
[点击「注册」按钮] → formRef.value.validate() 触发所有 rules
    ↓
[前端校验通过]
    ↓
[POST /api/v1/auth/register]
    Body: { email, password, company, companyShortName, contactName, phone, accessType }
（captcha 已在前端 Canvas 本地校验通过，不发送到后端）
    ↓
[后端校验顺序]
    1. 必填字段非空（email/password/company/companyShortName/contactName/phone）
    2. email 格式（正则）
    3. 密码强度（8-20 位 + 字母 + 数字）
    4. email 唯一性（select from developer where email = ?）
    5. bcrypt hash + 插入 developer（含自动生成 api_access_token）
    ↓
[校验失败] → 返回 4xx { code, message, data: null }
            → 前端 ElMessage.error(message)
            → 重新 drawCaptcha()（强制刷新）
            → 保持表单状态（不清空）
    ↓
[校验成功] → bcrypt hash 密码
            → 生成 developer_id（d_<16位hex>）
            → insert into developer
            → 自动签发 JWT (HS256, 7d)
            → Set-Cookie: auth_token=<jwt>; HttpOnly; SameSite=Strict
            → 返回 { code: 0, data: { token, userInfo } }
    ↓
[前端处理]
    → localStorage.setItem('token', token)
    → localStorage.setItem('userInfo', JSON.stringify(userInfo))
    → ElMessage.success('注册成功，正在进入系统...')
    → router.push('/dashboard')
```

#### 3.1.4 后端实现

- **密码哈希**：`bcryptjs.hashSync(password, 10)`（10 rounds）
- **developer_id**：`'d_' + uuid.v4().split('-').join('').slice(0, 16)`
- **图形验证码**：前端 Canvas 本地绘制 + 本地校验（`canvas + generateCaptchaText()`），**不走后端**，**不依赖 node-cache**。校验逻辑：`form.captcha.toUpperCase() === captchaText.value`。
- **重复检查**：`email` 和 `company_short_name` 都做 `selectOne` 检查；并发场景由 DB unique 约束兜底
- **响应**：成功后 `setAuthCookie(res, jwt)` 自动写 HttpOnly Cookie
- **错误码**：
  - 10001：参数错误（缺字段 / 格式错误）
  - 10002：邮箱已被注册
  - 10003：公司简称已被使用
  - 10004：图形验证码错误（前端 Canvas 本地校验触发，不调后端）

#### 3.1.5 关键库表

- **`developer`**（详见第 16 章）
  - 必填：`developer_id` / `email` (unique) / `password` (bcrypt) / `role` (默认 'developer')
  - 必填：`company` / `company_short_name` (unique) / `contact_name` / `phone` / `access_type` (1/2) / `status` (默认 1) / `created_at` / `updated_at`
  - 默认：`notify_email_*` / `notify_inapp_*` 全部 true / `notify_daily_digest` 默认 false

#### 3.1.6 注意事项

- 注册成功后**自动登录**，不需再走 login
- 邮箱后缀白名单**当前未强制**（生产建议加：gmail / qq / 163 / outlook / icloud / sina / sohu）
- 公司简称**全局唯一**（跨开发者），用于消息 / 报表前缀
- 验证码 Canvas 使用前端随机数（`Math.random`），**仅作防机器提交**，不防破解
- 同意协议是法律合规要求，未勾选时按钮 disabled

---

### 3.2 登录

![登录](public/prd/thumb/01-login.png)

#### 3.2.1 页面结构

- **左侧品牌区**（50%）：与注册页一致（Logos + 4 卖点 + 版权）
- **右侧表单区**（50%）：登录卡片
  - 卡片宽度：480px
  - 卡片标题：「欢迎回来」
  - 副标题：「登录以管理您的应用和广告位」

#### 3.2.2 字段详细说明

| 字段 | 控件 | 必填 | 长度 | 校验规则 | 错误提示 | 备注 |
|------|------|------|------|----------|----------|------|
| **邮箱** | `<el-input>` | ✅ | 5-64 | 邮箱格式 | "请输入邮箱地址" / "请输入有效的邮箱地址" | — |
| **密码** | `<el-input type="password">` 可见切换 | ✅ | ≥ 6 | 仅做非空 + 长度下限 | "请输入密码" / "密码长度至少6位" | **不**做强度校验（登录时已加密存库） |
| **图形验证码** | `<el-input>` + Canvas | ✅ | 4 | 不区分大小写 | "请输入验证码" / "验证码错误" | 与注册一致的 Canvas 组件 |
| **登录按钮** | `<el-button type="primary">` | — | — | — | — | 全宽 |
| **「忘记密码？」** | `<el-link>` 灰色 | — | — | — | — | 跳 /forgot-password（**未实现**） |
| **「立即注册」** | `<el-link>` 主色 | — | — | — | — | 跳 /register |

#### 3.2.3 交互流程

```
[进入 /login]
    ↓
[onMounted] → drawCaptcha()（首次）
    ↓
[用户输入 email + password + captcha]
    ↓
[点击「登录」]
    ↓
[formRef.validate()] → 校验所有 rules
    ↓
[POST /api/v1/auth/login] Body: { email, password }
（captcha 已在前端 Canvas 本地校验通过，不发送到后端）
    ↓
[后端顺序校验]
    1. developer 存在性（by email）
    2. status = 1（启用，未被冻结）
    3. bcrypt.compare(password, hash)
    ↓
[任意步骤失败] → 返回 401（邮箱或密码错误）/ 403（账号已被冻结）
              → 前端 ElMessage.error
              → 重新 drawCaptcha()
              → 清空 captcha 输入框
    ↓
[全部通过] → 生成 JWT (HS256, 7d)
           → Set-Cookie: auth_token=<jwt>; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800
           → 返回 { code: 0, data: { token, userInfo: { id, email, role, ... } } }
    ↓
[前端处理]
    → localStorage.setItem('token', token)
    → localStorage.setItem('userInfo', JSON.stringify(userInfo))
    → pinia/user.ts 同步状态
    → ElMessage.success('登录成功')
    → router.push(redirect || '/dashboard')
```

#### 3.2.4 后端实现

- **JWT 生成**：`jwt.sign({ developerId, email, role }, SECRET, { expiresIn: '7d', algorithm: 'HS256' })`
- **HttpOnly Cookie**：`setAuthCookie(res, jwt, prod)` 工具方法
  - dev: `HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`（**不带 Secure**）
  - prod: `...; Secure`（**必须 HTTPS**）
- **错误码**（实际由 `server/utils/response.ts` 的 `fail(res, status, message)` 返回，**无业务 code 字段**，仅 HTTP 状态 + message）：
  - 400：「缺少必填字段」（email 或 password 为空）
  - 401：「邮箱或密码错误」（统一提示，防账号探测）
  - 403：「账号已被冻结」
  - 500：「登录失败」（兜底）

#### 3.2.5 关键库表

- **`developer`**：read 模式
- **JWT 载荷**：`{ developerId, email, role, iat, exp }`

#### 3.2.6 注意事项

- **当前不限制登录失败次数**（生产建议加：3 次后图形验证码 + 5 次锁定 5 分钟）
- 密码错误**不区分**「邮箱不存在」与「密码错误」— 防止账号探测
- 登录成功后 `userInfo.role` 用于路由守卫
- 跨域 SDK 场景用 `Authorization: Bearer` 头（不依赖 cookie）
- 登出时调用 `clearAuthCookie(res)` 删 cookie + `localStorage.removeItem('token/userInfo')`

---

### 3.3 忘记密码

> **当前状态**：UI 占位 + 接口未实现
>
> **规划方案**（后续版本）：
> 1. 「忘记密码？」链接 → 跳 /forgot-password
> 2. 步骤 1：输入邮箱 → `POST /auth/send-captcha`（邮箱验证码，6 位，5 分钟过期，60s 倒计时）
> 3. 步骤 2：输入验证码 + 新密码 + 确认新密码 → `POST /auth/reset-password` { email, captcha, newPassword }
> 4. 后端：bcrypt hash + update developer.password
> 5. 成功后跳 /login，提示「密码已重置，请重新登录」

#### 字段说明

| 字段 | 控件 | 必填 | 校验 |
|------|------|------|------|
| 邮箱 | `<el-input>` | ✅ | 邮箱格式 |
| 验证码 | `<el-input>` + 「发送验证码」按钮 | ✅ | 6 位数字，60s 倒计时 |
| 新密码 | `<el-input type="password">` | ✅ | 6-20 位 + 字母 + 数字 |
| 确认新密码 | `<el-input type="password">` | ✅ | 与新密码一致 |

#### 关键库表

- **node-cache**：`key = captcha:<email>`，TTL = 300s
- **`developer.password`**：update via `POST /auth/reset-password`

#### 注意事项

- 邮件发送**生产环境需配置 SMTP**
- 验证码**仅校验邮箱是否本人**（不校验邮箱是否已注册，防探测）
- 重置成功后**强制**该用户的所有 session 失效（未来加 JWT 黑名单）

---

## 4. 数据看板

### 4.1 UI 说明

#### 顶部 KPI 卡片（4 个）

- 横向并排，4 列 grid（`gap-6`，每列等宽），固定 `240px` 高，圆角 12px，白底 + 1px `--color-border` 边 + `--shadow-sm`。
- 卡片结构：label（13px 主色）+ period（11px 灰）+ 28px 收入数字（`#0F172A`）。**无迷你折线、无同比环比标签、无副指标**。
- 4 张卡按固定顺序：**昨天 / 前天 / 本月 / 上月**，每张只展示该时段 `SUM(revenue)`。

#### 数据趋势区（整宽单段）

- 标题区：「数据趋势」+ 三联筛选器：**维度下拉**（app/placement/network/adType/region/os）+ **指标下拉**（revenue/impressions/clicks/requests/fills）+ **日期范围 daterange**（默认近 7 天，含今日）。
- 主体：ECharts 折线图（整宽 ~960px × 360px），平滑曲线 + 区域渐变填充 + 横向网格 + 工具栏（保存图片 / 数据缩放 / 还原）。

#### TOP 排行网格（2×3 共 6 张）

- 6 个固定排行卡（不可增删），按以下固定顺序 2×3 网格：
  1. TOP 应用（按 app_key）
  2. TOP 广告位（按 placement_id）
  3. TOP 网络（按 ad_source_id）
  4. TOP 广告类型（按 ad_type）
  5. TOP 地区（按 region）
  6. TOP 系统（按 os）
- 每张卡：标题 + 横排柱状图（前 10 名，按指标值降序）+ 「查看全部」链接（跳综合报表）。

#### 顶部 Page Header

- 标题「数据看板」+ 右侧刷新图标按钮（手动 reload 三段数据）。

![数据看板](public/prd/thumb/03-dashboard.png)

### 4.2 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/dashboard/overview` | GET | 4 张时段收入卡片（昨天/前天/本月/上月）|
| `/api/v1/console/dashboard/trend` | GET | 数据趋势（维度 × 指标 × 日期范围，ECharts 折线数据）|
| `/api/v1/console/dashboard/ranking/:dimension` | GET | TOP 排行（dimension=app/placement/network/adType/region/os）|
| `/api/v1/console/dashboard/dimensions` | GET | 维度下拉选项枚举 |
| `/api/v1/console/dashboard/metrics` | GET | 指标下拉选项枚举 |

- 全部经 `authMiddleware` 鉴权；`developer_id` 从 JWT 取，**不**接受 query 覆盖。
- 错误码：`4001` 无 token / `4003` token 过期 / `5001` DB error。

#### 业务逻辑

1. **4 张时段收入卡**：并行查 4 个时间窗的 `SUM(revenue)`：
   - 昨天 = `stat_date = CURRENT_DATE - 1`
   - 前天 = `stat_date = CURRENT_DATE - 2`
   - 本月 = `stat_date >= DATE_TRUNC('month', CURRENT_DATE)`（含今日）
   - 上月 = `stat_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND stat_date < DATE_TRUNC('month', CURRENT_DATE)`
2. **趋势**（trend 接口）：按 dimension 分类走不同数据源：
   - 软维度（adType/region/os）：直接对 `report_daily` 按 `stat_date` group by 聚合 metric
   - 硬维度（app/placement/network）：对 `report_daily` 按 dimension 关联表（app/placement/ad_source）id group by
3. **TOP 排行**（ranking 接口）：与 trend 共享 dimensionConfig；按 `SUM(metric)` DESC 取前 `limit`（默认 10）。
4. **今日数据**：因 report_daily T+1 写入，4 张卡**不展示**今日；趋势的日期范围 daterange 可含今日（今日点为 0）。

#### 关键库表

- **`report_daily`**（主表，趋势/排行/4 张卡都依赖）
  - 复合唯一键：`(developer_id, app_key, placement_id, ad_source_id, stat_date, hour)`
  - metric 字段：`requests` / `fills` / `impressions` / `clicks` / `revenue`（NUMERIC，eCPM 派生，**不存**）
  - 软维度字段：`region` / `os` / `ad_type`
  - 索引：`(developer_id, stat_date)` / `(app_key, stat_date)` / `(placement_id, stat_date)`
- **`app`**（硬维度 1）：enrichNames 用，按 `app_key` group by 时取 `app_name`
- **`placement`**（硬维度 2）：按 `placement_id` 取 `name`
- **`ad_source`**（硬维度 3 = network）：按 `ad_source_id` 取 `source_name`
- **`developer`**（过滤）：JWT 解出 `developer_id` 后 `WHERE developer_id = ?`

#### 注意事项

- 4 张卡**不展示**今日（T+1 延迟，4 张卡皆是历史时段；今日 point 永远为 0）。
- eCPM = `SUM(revenue) * 1000 / SUM(impressions)`，在**前端**计算（接口只返 5 个原始 metric），`impressions = 0` 时返回 `--`。
- DAU 指标**当前未实装**（看板 / 趋势 / 排行接口都不返 DAU）。早期文档描述的「DAU 是粗估：曝光用户数 ÷ 当日曝光」**未上线**，后续若实现，按 SDK 上报 `metric_id = 'dau'` 聚合。
- 维度下拉 / 指标下拉的选项**前端不缓存**，每次开页调 `/dimensions` `/metrics` 拉最新枚举。
- `dimensionConfig` 切换会自动 reload 趋势图（前端 watch + 重置 trend query）。

---

## 5. 应用管理

开发者管理的最基础实体，承载广告位、广告源、报表等所有业务的下游。

### 5.1 列表页 UI 说明

#### 5.1.1 顶部工具栏（从左到右）

- **关键字搜索**（占位文案「搜索应用名称 / app_key / 包名」）
  - 输入即时过滤，**不带回车触发**，500ms 防抖
  - 匹配：`app_name` 模糊 OR `app_key` 精确 OR `package_name` 模糊
  - 清除按钮：一键清空筛选
- **平台下拉**（占位「全部平台」，单选）
  - 选项：全部 / Android / iOS / 双端
  - 切换后自动刷新表格
- **状态下拉**（单选）
  - 选项：全部 / 启用 / 禁用
- **「+ 新建应用」按钮**（主色 primary，右上角）
  - 点击后从右侧滑出「应用编辑抽屉」（480px 宽）
  - 标题随场景切换：新建 / 编辑 ID

#### 5.1.2 表格列（13 列）

| 列 | 字段 | 宽度 | 渲染 | 排序 |
|----|------|------|------|------|
| 1. 应用图标 | `icon_url` | 64px | 圆形 40×40 缩略图，无图时首字母圆形占位 | — |
| 2. 应用名 | `app_name` | 180px | 主文案 + 包名 11px `#94A3B8` 副文案 | ✅ `app_name` ASC |
| 3. 平台 | `platform` | 80px | 标签：Android(蓝) / iOS(绿) / 双端(灰) | ✅ |
| 4. App Key | `app_key` | 160px | monospace + 复制按钮（hover 显示） | — |
| 5. 状态 | `status` | 80px | `el-switch` 直接切换（带二次确认弹窗） | ✅ |
| 6. 接入方式 | `access_type` | 100px | 标签：SDK(蓝) / API(灰) | — |
| 7. 应用分类 | `category` | 100px | 中文显示，未分类显示 `--` | — |
| 8. 商店 URL | `store_url` | 100px | 有值显示链状图标 + hover 显示 URL | — |
| 9. 频次配置 | `frequency_config` | 100px | 3 个开关的简写：100/20/10 → 「100·20·10」灰色 | — |
| 10. 创建时间 | `created_at` | 170px | `yyyy-MM-dd HH:mm`，相对时间悬停可见 | ✅ |
| 11. 操作 | — | 240px fixed | 4 个文字按钮：编辑 / 频次 / 启停 / 删除 | — |

#### 5.1.3 表格交互细节

- **行 hover**：背景 `#F8FAFC` + 左侧 3px 蓝条
- **表头排序**：仅 `app_name` / `platform` / `status` / `created_at` 4 列可排序，点击切换 ASC / DESC
- **空状态**：插画 + 「暂无应用，点击右上角新建第一个应用」+ 「+ 新建应用」按钮
- **加载状态**：骨架屏（5 行），5 秒后超时提示「加载失败，请重试」

#### 5.1.4 分页

- `el-pagination` 属性：`background small layout="total, sizes, prev, pager, next, jumper"`
- 默认 pageSize=10，size 选项 [10, 20, 50]
- 跳到第 X 页：输入框回车触发

### 5.2 新建 / 编辑抽屉（AppDrawer，右侧 480px 滑出）

#### 5.2.1 抽屉状态

- `drawerVisible` 控制显隐
- 标题：`新建应用` / `编辑应用 #${id}`
- 关闭：右上 X / 取消按钮 / 路由切换（提示「有未保存内容，确认离开？」）
- 打开动画：300ms 缓入

#### 5.2.2 表单字段（从上到下）

| # | 字段 | key | 类型 | 必填 | 校验 | 默认值 | UI | 联动 / 提示 |
|---|------|-----|------|------|------|--------|------|------|
| 1 | **应用名称** | `app_name` | input | ✅ | 1-30 字符 | — | 普通 input | 超出显示计数器 `30/30` |
| 2 | **包名** | `package_name` | input | ✅ | 1-100 字符，**全局唯一**，后端 30001 错误提示 | — | 普通 input | **创建后不可修改**，编辑时禁用 |
| 3 | **应用图标** | `icon_url` | upload | ❌ | png/jpg/svg，≤ 2MB | — | 上传组件 | 限制 1 个，圆形裁切预览 |
| 4 | **平台** | `platform` | radio | ✅ | 1/2/3 | 1 (Android) | 单选组 | 切换会清空依赖平台的字段 |
| 5 | **接入方式** | `access_type` | radio | ✅ | 1/2 | 1 (SDK) | 单选组 | SDK 模式显示「下载 SDK」按钮 |
| 6 | **应用分类** | `category` | select | ❌ | 枚举 | '工具' | 下拉 | 选项：游戏 / 工具 / 社交 / 电商 / 教育 / 阅读 / 影音 / 其他 |
| 7 | **超时时间** | `timeout_ms` | inputNumber | ❌ | 500-10000 整数 | 1000 | 数字 + 单位 ms | 提示「建议 800-3000」 |
| 8 | **商店 URL** | `store_url` | input | ❌ | URL 格式 | NULL | 普通 input | 用于 SDK 一键拉起商店 |
| 9 | **微信 AppID** | `wechat_app_id` | input | ❌ | wx + 16 位 | NULL | 普通 input | 仅 iOS 平台需要 |
| 10 | **微信 Universal Link** | `wechat_universal_link` | input | ❌ | https URL | NULL | 普通 input | 依赖 微信 AppID |
| 11 | **商店已上架** | `store_listed` | switch | ❌ | bool | true | 开关 | 关闭时禁用 商店 URL / 商店名 |
| 12 | **商店名** | `store_name` | input | ❌ | 1-50 字符 | NULL | 普通 input | 依赖 store_listed=true |
| 13 | **下载 URL** | `download_url` | input | ❌ | URL 格式 | NULL | 普通 input | 仅 store_listed=false 时使用 |
| 14 | **应用域名** | `app_domain` | input | ❌ | 域名格式 | NULL | 普通 input | — |
| 15 | **副账号** | `auth_subaccount` | input | ❌ | 1-50 字符 | NULL | 普通 input | 鉴权副账号 |
| 16 | **屏幕方向** | `orientation` | radio | ❌ | 0/1/2 | 1 (横屏) | 单选组 | 0=竖屏 / 1=横屏 / 2=自动 |
| 17 | **COPPA 合规** | `coppa_compliant` | switch | ❌ | bool | false | 开关 | 启用后 SDK 端关闭行为广告 |
| 18 | **CCPA 合规** | `ccpa_compliant` | switch | ❌ | bool | false | 开关 | 加州用户不出售数据 |
| 19 | **频次配置** | `frequency_config` | sub-form | ❌ | JSON | `{}` | 子表单 | 见 5.2.3 |

#### 5.2.3 频次配置子表单（点击「频次配置」展开）

| 子字段 | key | 必填 | 范围 | 默认 | 说明 |
|--------|-----|------|------|------|------|
| 单日展示上限 | `impression_per_day` | ❌ | 1-999 | NULL | NULL=不限 |
| 单小时展示上限 | `impression_per_hour` | ❌ | 1-999 | NULL | 必须 ≤ per_day |
| 单日点击上限 | `click_per_day` | ❌ | 1-999 | NULL | NULL=不限 |
| 间隔秒数 | `interval_sec` | ❌ | 1-3600 | 0 | 0=不限 |

**联动规则**：
- `impression_per_hour > impression_per_day` → 红字提示「小时上限不能大于日上限」
- 任一字段填 0 → 后端转换为 NULL（即不限制）

#### 5.2.4 底部操作区

- **取消**（左）：关闭抽屉，未保存时弹确认
- **保存**（右，主色 primary）：触发 form validate，全部通过后调用 create/update 接口
- 提交中：按钮 loading，文案「保存中…」
- 成功：ElMessage 成功提示 + 关闭抽屉 + 刷新列表
- 失败：ElMessage 错误提示（具体原因），字段级错误回填到对应表单项

### 5.3 功能架构

| 接口 | 方法 | 请求 | 响应 | 鉴权 |
|------|------|------|------|------|
| `/api/v1/console/app/list` | GET | Query: `keyword?`、`platform?`、`status?`、`page`、`pageSize` | `{ list, total, page, pageSize }` | ✅ |
| `/api/v1/console/app/create` | POST | AppDrawer 表单完整 JSON | `{ id, app_key }` | ✅ |
| `/api/v1/console/app/update` | PUT | `{ id, ...editableFields }`（**不可修改 app_key/package_name**） | `{ success: true }` | ✅ |
| `/api/v1/console/app/toggle-status` | PUT | `{ id, status }` | `{ success: true }` | ✅ |
| `/api/v1/console/app/delete` | DELETE | Query: `id` | `{ success: true }` | ✅ |
| `/api/v1/console/app/detail` | GET | Query: `id` | `{ ...app完整数据 }` | ✅ |
| `/api/v1/console/app/upload-icon` | POST | FormData: `file` | `{ url: OSS_URL }` | ✅ |
| `/api/v1/console/app/:id/frequency` | GET | — | `{ frequency_config }` | ✅ |
| `/api/v1/console/app/:id/frequency` | PUT | `{ frequency_config }` | `{ success: true }` | ✅ |

#### 5.3.1 业务规则

1. **app_key 生成**：`ak_<16位base36随机> + 2位校验位`，保证全局唯一
2. **package_name 唯一**：创建时 `SELECT * FROM app WHERE package_name = ?` 预检；后端 `UNIQUE` 约束兜底
3. **删除限制**：
   - 检查 `placement WHERE app_key = ?` 是否非空
   - 非空返回错误：「该应用下还有 N 个广告位，请先删除」
4. **状态切换二次确认**：禁用前弹窗「禁用后 SDK 端将停止请求，确认禁用？」
5. **icon 上传**：
   - 前端先压缩到 ≤ 500KB（用 canvas）
   - 后端校验真实 MIME（不止 Content-Type）
   - 上传到 OSS，返回 URL 写入 form

### 5.4 关键库表字段详情

#### 5.4.1 `app` 表（核心）

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| `id` | bigint PK | ✅ | seq | 自增 |
| `developer_id` | varchar(50) | ✅ | — | FK→`developer.developer_id`（逻辑外键，无 DB 约束） |
| `app_key` | varchar(50) | ✅ | — | **UNIQUE**，创建时生成，不可修改 |
| `app_name` | varchar(100) | ✅ | — | 1-30 字符 |
| `package_name` | varchar(200) | ✅ | — | **UNIQUE**，全局唯一 |
| `platform` | smallint | ✅ | — | 枚举：1=Android, 2=iOS, 3=双端 |
| `category` | varchar(50) | ❌ | NULL | 枚举：游戏/工具/社交/电商/教育/阅读/影音/其他 |
| `icon_url` | varchar(500) | ❌ | NULL | OSS URL |
| `status` | smallint | ❌ | 1 | 枚举：0=禁用, 1=启用 |
| `timeout_ms` | smallint | ❌ | 1000 | 500-10000 |
| `store_url` | varchar(500) | ❌ | NULL | 商店 URL |
| `wechat_app_id` | varchar(50) | ❌ | NULL | 微信 AppID |
| `wechat_universal_link` | varchar(500) | ❌ | NULL | 微信 Universal Link |
| `access_type` | smallint | ❌ | 1 | 枚举：1=SDK, 2=API |
| `store_listed` | bool | ❌ | true | 是否上架 |
| `store_name` | text | ❌ | NULL | 商店名 |
| `download_url` | text | ❌ | NULL | 下载 URL |
| `app_domain` | varchar(200) | ❌ | NULL | 应用域名 |
| `auth_subaccount` | varchar(100) | ❌ | NULL | 副账号 |
| `orientation` | smallint | ❌ | 1 | 枚举：0=竖, 1=横, 2=自动 |
| `coppa_compliant` | bool | ❌ | false | COPPA 合规 |
| `ccpa_compliant` | bool | ❌ | false | CCPA 合规 |
| `frequency_config` | jsonb | ❌ | `{}` | 频次配置 JSON |

**索引**：`app_key`(UNIQUE), `package_name`(UNIQUE), `developer_id`, `status`

#### 5.4.2 `placement` 表（外键引用）

- `app_key` → `app.app_key`（**逻辑外键**，删除 app 时级联删除 placement）

#### 5.4.3 `app_network_binding` 表

| 字段 | 业务说明 |
|------|----------|
| `app_key` | 关联应用 |
| `network_def_id` | 关联广告平台 |
| `adapter_version_id` | 使用的 Adapter 版本 |
| `network_app_id` | 该应用在第三方平台的 ID |
| `extra_params` | JSONB 扩展参数 |
| `status` | 1=绑定 / 0=解绑 |
| `account_id` | 关联 `ad_network_account` |

### 5.5 平台绑定子弹窗（应用详情 / 应用列表「平台」按钮）

#### 5.5.1 弹窗结构

- 标题：「应用 [app_name] 的平台绑定」
- 主体：已绑定平台列表（卡片网格）
- 底部：「+ 绑定新平台」按钮

#### 5.5.2 绑定新平台弹窗

字段：

| # | 字段 | 必填 | 校验 | 说明 |
|---|------|------|------|------|
| 1 | 选择平台 | ✅ | 从 `ad_network_def` 拉 | is_preset=true + 自定义网络 |
| 2 | 选择账号 | ✅ | 从 `ad_network_account` 拉 | 过滤当前 platform |
| 3 | 第三方 App ID | ✅ | 1-100 字符 | 在该平台注册时获得的 ID |
| 4 | Adapter 版本 | ✅ | 默认选最新已审核通过的 | 从 `custom_adapter_version` 拉 |
| 5 | 扩展参数 | ❌ | JSON | 用于平台特殊配置 |

#### 5.5.3 解除绑定

- 软删：`status = 0` 而非物理删除
- 解除前弹确认：「解除后该应用将不再请求该平台广告，确认？」
- 解除后报表数据保留

### 5.6 注意事项

1. **app_key 一旦生成不可修改**（SDK 用作拉取 key）
2. **package_name 全局唯一**（不区分开发者）
3. **删除应用会级联清理**：
   - `placement` 全部
   - `app_network_binding` 全部
   - `waterfall_config` + `waterfall_layer` 全部
   - `report_daily` 报表数据**保留**（历史追溯）
4. **频次配置**：
   - JSONB 字段，前端读写需 `JSON.stringify/parse`
   - 任一字段为 0 表示「不限」
   - SDK 端按 `impression_per_hour` 优先于 `per_day` 判断
5. **应用图标**：上传走 OSS（详见 18 章），DB 只存 URL
6. **状态禁用**：
   - SDK 拉取配置时返回 `status=0`
   - SDK 端应跳过该 app_key
   - 顶栏铃铛**不发**「应用禁用」消息（避免打扰）

---

## 6. 广告位管理

广告位是开发者接入广告的最小请求单元，每个 placement_id 对应一个 SDK 端请求标识。

### 6.1 列表页 UI 说明

#### 6.1.1 顶部工具栏

- **关键字搜索**（占位「搜索广告位名称 / placement_id」）：500ms 防抖
- **所属应用下拉**（单选，必填）：从当前开发者的 app 列表拉
- **广告形式下拉**：全部 / banner / interstitial / native / rewarded / splash
- **状态下拉**：全部 / 启用 / 禁用
- **「+ 新建广告位」按钮**（主色 primary）：点击后右侧滑出抽屉

#### 6.1.2 表格列（10 列）

| 列 | 字段 | 宽度 | 渲染 |
|----|------|------|------|
| 1. 广告位 ID | `placement_id` | 140px | monospace + 复制按钮 |
| 2. 广告位名 | `name` | 200px | 主文案 |
| 3. 所属应用 | `app_name` | 180px | 蓝色链接（点击跳应用详情） |
| 4. 广告形式 | `format` | 110px | 标签：banner(蓝) / 插屏(橙) / 原生(绿) / 激励(黄) / 开屏(紫) |
| 5. 竞价类型 | `bidding_type` | 100px | 1=客户端 / 2=服务端 |
| 6. 屏幕方向 | `screen_orientation` | 100px | 0=竖 / 1=横 / 2=不限 |
| 7. 广告尺寸 | `ad_size` | 90px | banner 显示：320×50 / 728×90 / 300×250 等 |
| 8. 状态 | `status` | 80px | `el-switch` |
| 9. 创建时间 | `created_at` | 170px | yyyy-MM-dd HH:mm |
| 10. 操作 | — | 200px fixed | 编辑 / 删除 |

#### 6.1.3 表格交互

- 排序：`created_at`（默认 DESC）/ `name`
- 空状态：「该应用下还没有广告位，点击新建第一个广告位」
- 加载：骨架屏 5 行

### 6.2 新建 / 编辑抽屉（PlacementDrawer，右侧 480px 滑出）

#### 6.2.1 标题

- 新建：「新建广告位」
- 编辑：「编辑广告位 #${placement_id}」

#### 6.2.2 表单字段

| # | 字段 | key | 类型 | 必填 | 校验 | 默认 | UI | 联动 / 提示 |
|---|------|-----|------|------|------|------|------|------|
| 1 | **所属应用** | `app_key` | select | ✅ | 从当前开发者 app 列表 | — | 搜索式下拉 | 切换会清空依赖字段 |
| 2 | **广告位 ID** | `placement_id` | input | ❌ | 默认自动生成 | `pl_<16base36>` | 普通 input | **创建后不可修改** |
| 3 | **广告位名** | `name` | input | ✅ | 1-30 字符 | — | 普通 input | — |
| 4 | **广告形式** | `format` | radio | ✅ | 1/2/3/4/5 | — | 单选组（5 个大图标按钮） | 切换显示对应扩展字段 |
| 5 | **竞价类型** | `bidding_type` | radio | ✅ | 1/2 | 1 (客户端) | 单选组 | — |
| 6 | **屏幕方向** | `screen_orientation` | radio | ✅ | 0/1/2 | 0 (竖屏) | 单选组 | — |
| 7 | **状态** | `status` | switch | ❌ | 0/1 | 1 (启用) | 开关 | — |
| 8 | **广告尺寸** | `ad_size` | select | 条件 | 仅 banner 必填 | — | 下拉 | banner 专属 |
| 9 | **素材类型** | `material_type` | checkbox | 条件 | 仅 native 显示 | — | 多选组 | native 专属 |
| 10 | **视频静音** | `video_mute` | switch | 条件 | 仅 rewarded/splash | true | 开关 | rewarded/splash 专属 |
| 11 | **自动播放** | `auto_play` | switch | 条件 | 仅 rewarded/splash | true | 开关 | rewarded/splash 专属 |
| 12 | **模板样式** | `template_style` | radio | 条件 | 仅 native | 1 | 单选组 | native 专属 |

#### 6.2.3 广告形式专属字段联动

##### 1=banner（横幅）

- 必填 `ad_size`：
  - 320×50（手机标准）
  - 728×90（平板/桌面）
  - 300×250（中矩形）
  - 468×60（满屏横幅）
- 可选 `material_type`（多选）：图片 / GIF / 视频

##### 2=interstitial（插屏）

- 无专属字段
- 提示「插屏广告建议在用户操作完成后展示」

##### 3=native（原生）

- 必填 `template_style`：
  - 1=小图模式
  - 2=大图模式
  - 3=三图模式
  - 4=视频流
- 可选 `material_type`（多选）：图片 / 视频

##### 4=rewarded（激励视频）

- 必填 `video_mute`（默认 true）
- 必填 `auto_play`（默认 true）
- 提示「激励视频必须给用户明确奖励」

##### 5=splash（开屏）

- 必填 `video_mute`（默认 true）
- 必填 `auto_play`（默认 true）

#### 6.2.4 提交逻辑

- 前端先校验表单，通过后调用 create/update 接口
- 成功：ElMessage 成功提示 + 关闭抽屉 + 刷新列表
- 失败：
  - 字段级错误回填
  - 全局错误（如 placement_id 重复 30002）：显示在抽屉顶部红条
- 提交中：所有按钮 disabled，按钮文案「保存中…」

### 6.3 功能架构

| 接口 | 方法 | 请求 | 响应 |
|------|------|------|------|
| `/api/v1/console/placement/list` | GET | `app_key?`、`format?`、`status?`、`page`、`pageSize` | `{ list, total }` |
| `/api/v1/console/placement/create` | POST | 表单完整 JSON | `{ id, placement_id }` |
| `/api/v1/console/placement/update` | PUT | `{ id, ...editableFields }` | `{ success }` |
| `/api/v1/console/placement/delete` | DELETE | `?id=xxx` | `{ success }` |
| `/api/v1/console/placement/detail` | GET | `?id=xxx` | `{ ...完整数据 }` |

#### 6.3.1 业务规则

1. **placement_id 生成**：`pl_<16位base36> + 2位校验位`
2. **placement_id 全局唯一**（不区分 app）
3. **删除限制**：
   - 检查 `waterfall_config WHERE placement_id = ?` 是否非空
   - 非空返回：「该广告位有 N 个瀑布流配置，请先删除」
4. **状态切换**：禁用后 SDK 端跳过该 placement

### 6.4 关键库表字段详情

#### `placement` 表

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| `id` | bigint PK | ✅ | seq | 自增 |
| `app_key` | varchar(50) | ✅ | — | FK→`app.app_key` |
| `placement_id` | varchar(50) | ✅ | — | **UNIQUE** |
| `name` | varchar(100) | ✅ | — | 1-30 字符 |
| `format` | smallint | ✅ | — | 枚举：1=banner, 2=interstitial, 3=native, 4=rewarded, 5=splash |
| `status` | smallint | ❌ | 1 | 0=禁用, 1=启用 |
| `bidding_type` | smallint | ❌ | NULL | 1=客户端, 2=服务端 |
| `screen_orientation` | smallint | ❌ | NULL | 0=竖, 1=横, 2=不限 |
| `ad_size` | smallint | ❌ | NULL | banner：1=320×50, 2=728×90, 3=300×250, 4=468×60 |
| `material_type` | smallint[] | ❌ | NULL | bitmap：1=图片, 2=GIF, 4=视频 |
| `video_mute` | smallint | ❌ | NULL | rewarded/splash 专属：0/1 |
| `auto_play` | smallint | ❌ | NULL | rewarded/splash 专属：0/1 |
| `template_style` | smallint | ❌ | NULL | native 专属：1/2/3/4 |

### 6.5 注意事项

1. **placement_id 一旦创建不可修改**
2. **广告形式切换会**：
   - 清空专属字段
   - 弹出提示「切换广告形式会清空已配置的专属字段，确认切换？」
3. **同一应用下 placement 名称可重名**，placement_id 必须唯一
4. **禁用后**：
   - SDK 拉取配置返回 `status=0`
   - SDK 端跳过该 placement
5. **删除限制**：
   - 有 `waterfall_config` 引用禁止删除
   - 有 `traffic_group` 引用禁止删除
6. **ad_size 为枚举**，后续扩展需数据库迁移

---

## 7. 流量分组

将同一广告位下的流量按规则切分（地域 / OS / 设备 / 版本 / 自定义标签），实现**精细化运营**和**A/B 测试**。

### 7.1 页面布局（双列）

#### 7.1.1 左侧（280px）流量分组树

```
📱 应用 A
  └─ 📍 广告位 1 [banner]
       ├─ ⭐ 默认分组 [is_default]  ← 系统创建，不可删
       ├─ 🔵 中国 Android 用户
       ├─ 🔵 iOS 高版本用户
       └─ 🆕 + 新建分组
  └─ 📍 广告位 2 [rewarded]
       ├─ ⭐ 默认分组
       └─ 🔵 灰度测试 v2
```

**树节点类型**：
- 应用（不可点击展开/折叠）
- 广告位（可点击展开，展开后显示分组列表）
- 分组（点击选中 → 右侧加载详情）
- + 新建分组（hover 显示蓝色高亮）

**当前选中分组**：
- 左侧树节点显示蓝色背景 + 3px 蓝条
- 右上角「+ 新建分组」按钮（点击后**在当前广告位下**创建）

#### 7.1.2 右侧详情区（自适应）

分组详情从上到下：

1. **分组信息条**：
   - 分组名（大字号 20px）
   - 状态标签（启用/禁用）
   - 「编辑」按钮（右上角）
   - 「删除」按钮（仅非默认分组）
   - 创建时间

2. **匹配规则**（可视化编辑器）：
   - 顶部：「当前生效优先级：N」（N 越大越优先）
   - 中部：条件列表（每行一组 AND 条件）
   - 底部：「+ 添加条件」按钮

3. **关联瀑布流**（瀑布流配置入口）：
   - 显示当前分组绑定的 waterfall_config 信息
   - 「前往配置」按钮 → 跳转第 9 章瀑布流页

4. **匹配预览**（右侧栏）：
   - 实时显示当前条件的 JSON 表示
   - 底部「测试匹配」按钮：模拟一个 user_context，输出是否匹配

### 7.2 匹配规则可视化编辑器

#### 7.2.1 条件结构

```typescript
interface Condition {
  field: string         // 字段
  operator: string      // 操作符
  value: string | string[] | number  // 值
}
```

**AND 关系**：所有条件都满足才命中该分组。

#### 7.2.2 支持的字段

| field | 中文 | 取值范围 | UI |
|-------|------|----------|------|
| `region` | 国家/地区 | ISO 3166-1 alpha-2（CN/US/JP…） | 多选下拉 |
| `os` | 操作系统 | android / ios | 多选 |
| `device_brand` | 设备品牌 | 华为/小米/OPPO/VIVO/苹果/三星/… | 多选 |
| `device_model` | 设备型号 | 自由输入 | input，支持通配符 `*` |
| `app_version` | App 版本 | 1.0.0 格式 | input + 版本比较 |
| `sdk_version` | SDK 版本 | 1.0.0 格式 | input + 版本比较 |
| `custom_tag` | 自定义标签 | 自由输入 | key=value 形式 |
| `user_id` | 用户 ID | 自由输入 | input |
| `carrier` | 运营商 | 移动/联通/电信 | 多选 |
| `network_type` | 网络类型 | wifi/2g/3g/4g/5g | 多选 |

#### 7.2.3 支持的操作符

| operator | 含义 | 适用字段 | UI |
|----------|------|----------|------|
| `eq` | 等于 | 所有 | input |
| `ne` | 不等于 | 所有 | input |
| `in` | 包含（任一） | region/os/device_brand/… | 多选 |
| `nin` | 不包含（全部不在） | 同上 | 多选 |
| `gt` | 大于 | app_version/sdk_version | input |
| `gte` | 大于等于 | 同上 | input |
| `lt` | 小于 | 同上 | input |
| `lte` | 小于等于 | 同上 | input |
| `between` | 区间 | 同上 | 双 input |
| `contains` | 包含子串 | device_model/custom_tag | input |
| `starts_with` | 开头匹配 | 同上 | input |

#### 7.2.4 条件行 UI

每行条件 = 3 列：

| 列 1（150px） | 列 2（120px） | 列 3（自适应） | 操作 |
|---------------|---------------|----------------|------|
| 字段下拉 | 操作符下拉 | 值输入（根据 operator 类型动态切换） | 删除按钮 |

#### 7.2.5 添加 / 删除 / 重排

- **添加**：点击「+ 添加条件」→ 默认新增 `region eq CN`
- **删除**：行右侧红色 X
- **重排**：拖拽手柄（在条件最左侧），上下拖拽调整顺序（仅影响视觉顺序，AND 关系不依赖顺序）
- **复制**：右键条件 → 复制（深度克隆）

#### 7.2.6 JSON 预览

右侧折叠面板「JSON 预览」实时显示：

```json
{
  "logic": "AND",
  "conditions": [
    { "field": "region", "operator": "in", "value": ["CN", "HK"] },
    { "field": "os", "operator": "eq", "value": "android" },
    { "field": "app_version", "operator": "gte", "value": "2.0.0" }
  ]
}
```

#### 7.2.7 测试匹配

底部「测试匹配」按钮 → 弹窗：

- 输入框（JSON 格式）：`{"region":"CN","os":"android","app_version":"2.1.0"}`
- 点击「测试」→ 输出：
  ```
  ✅ 命中当前分组
  或
  ❌ 未命中（显示按优先级排序后会命中的其他分组名）
  ```

### 7.3 优先级

- 数字字段 `priority`（**越大越优先**）
- 默认值：
  - 默认分组 = 0
  - 用户分组创建时 = `MAX(priority) + 1`
- 前端列表倒序展示
- 拖拽调整 priority：拖动后自动 +1 / -1 重排

### 7.4 新建 / 编辑分组弹窗

#### 字段

| # | 字段 | 必填 | 校验 | 说明 |
|---|------|------|------|------|
| 1 | **分组名** | ✅ | 1-30 字符，同一 placement 内唯一 | — |
| 2 | **优先级** | ❌ | 整数 0-999 | 默认 `MAX+1` |
| 3 | **匹配规则** | ✅ | 至少 1 个条件 | 复用 7.2 可视化编辑器 |
| 4 | **关联广告位** | ✅ | 默认选中左侧 | 不可修改（创建后即绑定） |
| 5 | **备注** | ❌ | 0-200 字符 | 内部说明 |
| 6 | **状态** | ❌ | 0/1 | 默认 1（启用） |

### 7.5 功能架构

| 接口 | 方法 | 请求 | 响应 |
|------|------|------|------|
| `/api/v1/console/traffic-group/list` | GET | `?placement_id=xxx` | `{ list: [group...] }` |
| `/api/v1/console/traffic-group/create` | POST | `{ placement_id, group_name, conditions, priority, remark }` | `{ id, group_id }` |
| `/api/v1/console/traffic-group/update` | PUT | `{ id, ...editableFields }` | `{ success }` |
| `/api/v1/console/traffic-group/delete/:id` | DELETE | — | `{ success }` |
| `/api/v1/console/traffic-group/test-match` | POST | `{ conditions, user_context }` | `{ matched: bool, matched_group?: {...} }` |

#### 业务规则

1. **默认分组**：每个广告位首次创建时**自动生成 1 个** `is_default=true` 的分组
2. **匹配顺序**：SDK 按 priority DESC 顺序匹配，**第一个条件命中**的分组生效
3. **优先级数值越大越靠前**（前端列表倒序展示）
4. **删除限制**：
   - 默认分组禁止删除
   - 已绑定瀑布流的分组禁止删除
   - 必须先解绑 waterfall_config_id
5. **规则保存后不会立即生效**：SDK 端有 5 分钟缓存

### 7.6 关键库表字段详情

#### `traffic_group` 表

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| `id` | bigint PK | ✅ | seq | 自增 |
| `placement_id` | varchar(50) | ❌ | NULL | FK→`placement.placement_id` |
| `group_name` | varchar(100) | ✅ | — | 1-30 字符 |
| `conditions` | jsonb | ✅ | `[]` | 条件数组 |
| `priority` | integer | ❌ | 0 | 越大越优先 |
| `waterfall_config_id` | bigint | ❌ | 0 | 关联当前生效的瀑布流 |
| `status` | smallint | ❌ | 1 | 0=禁用, 1=启用 |
| `is_default` | bool | ❌ | false | 默认分组（不可删） |
| `is_system` | bool | ❌ | false | 系统级 |
| `is_locked` | bool | ❌ | false | 锁定（不可编辑） |
| `developer_id` | varchar(50) | ❌ | NULL | 所属开发者 |
| `waterfall_id` | varchar(50) | ❌ | NULL | 备用 |

#### `conditions` JSONB 结构

```json
{
  "logic": "AND",
  "conditions": [
    { "field": "region", "operator": "in", "value": ["CN"] },
    { "field": "os", "operator": "eq", "value": "android" }
  ]
}
```

### 7.7 注意事项

1. **优先级数值越大越靠前**（前端列表倒序展示）
2. **规则编辑后不会立即生效**（SDK 端 5 分钟缓存）
3. **流量分组与瀑布流配置是 N:1**（一个分组关联一个 config）
4. **默认分组不可删除 / 不可禁用**
5. **灰度发布建议**：
   - 新建分组（低 priority）
   - 灰度验证
   - 调整 priority 提升流量
6. **性能**：SDK 端每请求都会匹配所有分组，分组数量建议 ≤ 20
7. **测试匹配**：在 `/api/v1/console/traffic-group/test-match` 接口可输入模拟 context

---

## 8. 广告源管理

将第三方广告平台（穿山甲 / 优量汇 / Sigmob / 快手 / 自定义）封装成统一接口，供瀑布流调用。

### 8.1 列表页 UI 说明

#### 8.1.1 顶部工具栏

- **关键字搜索**：500ms 防抖
- **广告平台下拉**：从 `ad_network_def` 拉（is_preset=true + 自定义）
- **状态下拉**：全部 / 启用 / 禁用
- **「+ 新建广告源」按钮**（主色）：点击后滑出抽屉
- **「+ 自定义广告源」按钮**（次要）：用于 6 步对接步骤 4（联调测试）

#### 8.1.2 表格列（10 列）

| 列 | 字段 | 宽度 | 渲染 |
|----|------|------|------|
| 1. 广告源名 | `source_name` | 180px | — |
| 2. 广告平台 | `network_name` | 150px | + 平台图标 24×24 |
| 3. 平台代码 | `network_code` | 110px | monospace |
| 4. 关联应用 | `app_name` | 150px | 显示第一个，多个显示 +N |
| 5. 关联广告位 | `placement_name` | 150px | 显示第一个 |
| 6. 第三方 App ID | `third_app_id` | 130px | monospace |
| 7. 第三方 Placement ID | `third_placement_id` | 150px | monospace |
| 8. 状态 | `status` | 80px | switch |
| 9. 创建时间 | `created_at` | 170px | — |
| 10. 操作 | — | 240px fixed | 编辑 / 关联流量分组 / 删除 |

### 8.2 新建广告源抽屉

#### 8.2.1 表单字段

| # | 字段 | key | 必填 | 校验 | 默认 | UI |
|---|------|-----|------|------|------|------|
| 1 | **广告平台** | `network_def_id` | ✅ | 必选 | — | 下拉（带平台图标） |
| 2 | **广告源名** | `source_name` | ✅ | 1-30 字符，同开发者内唯一 | — | input |
| 3 | **关联应用** | `app_id` | ❌ | 下拉 | NULL | 多选下拉 |
| 4 | **关联广告位** | `placement_id` | ❌ | 依赖应用 | NULL | 多选下拉 |
| 5 | **第三方 App ID** | `third_app_id` | ✅ | 1-100 字符 | — | input |
| 6 | **第三方 Placement ID** | `third_placement_id` | ✅ | 1-100 字符 | — | input |
| 7 | **扩展参数** | `extra` | ❌ | JSON | `{}` | JSON 编辑器 |
| 8 | **状态** | `status` | ❌ | 0/1 | 1 | switch |

#### 8.2.2 联动规则

- 选「广告平台」后：
  - 显示该平台支持的所有广告形式提示
  - 提示「穿山甲支持 banner/interstitial/native/rewarded/splash」
- 选「关联应用」后：
  - 「关联广告位」下拉自动过滤该应用下的 placement
- 「第三方 App ID」+「第三方 Placement ID」必填：
  - 编辑时**不可修改**这两个字段（避免破坏线上）

#### 8.2.3 提示文案

- 「第三方 App ID 是您在穿山甲/优量汇等平台注册时获得的 ID」
- 「如果不知道，请到对应平台后台查看」

### 8.3 自定义广告源（联调测试步骤 4）

> 用于 6 步对接流程的步骤 4，**关联到自定义广告平台**（来自第 12 章）。

#### 8.3.1 入口

- 「+ 自定义广告源」按钮
- 弹窗标题：「创建自定义广告源（联调测试）」

#### 8.3.2 表单字段

| # | 字段 | 必填 | 校验 | 说明 |
|---|------|------|------|------|
| 1 | **自定义平台** | ✅ | 必选 | 下拉，只显示 `is_preset=false` + 当前 developer 的 `ad_network_def` |
| 2 | **广告源名** | ✅ | 1-30 字符 | — |
| 3 | **第三方 App ID** | ✅ | 1-100 字符 | 自定义平台的标识 |
| 4 | **第三方 Placement ID** | ✅ | 1-100 字符 | 自定义平台的广告位 |
| 5 | **关联应用** | ✅ | 必选 | — |
| 6 | **关联广告位** | ✅ | 依赖应用 | — |
| 7 | **扩展参数** | ❌ | JSON | 平台自定义参数 |

#### 8.3.3 创建后

- 自动跳转到新建的广告源详情
- 提示「该广告源已关联到自定义平台 X，可在瀑布流中拖入使用」

### 8.4 关联流量分组子弹窗

#### 8.4.1 弹窗结构

- 标题：「广告源 [source_name] 流量分组关联」
- 主体：流量分组列表（按 traffic_group）
- 列表项：
  - 分组名
  - 优先级
  - 当前出价（`price`）
  - 单日上限（`day_limit`）
  - 单小时上限（`hour_limit`）
  - 状态 switch
- 底部：「+ 关联到新分组」按钮

#### 8.4.2 关联新分组

- 选择流量分组（来自该 ad_source 关联 placement 下的所有 traffic_group）
- 配置：
  - 出价（必填，0.01-9999 元）
  - 单日上限（0=不限）
  - 单小时上限（0=不限）
  - 曝光间隔（秒，0=不限）
  - 状态（默认启用）

### 8.5 功能架构

| 接口 | 方法 | 请求 | 响应 |
|------|------|------|------|
| `/api/v1/console/ad-source/list` | GET | `?keyword?`、`network_def_id?`、`status?`、`page` | `{ list, total }` |
| `/api/v1/console/ad-source/create` | POST | 表单 JSON | `{ id }` |
| `/api/v1/console/ad-source/update` | PUT | `{ id, ...editableFields }` | `{ success }` |
| `/api/v1/console/ad-source/delete` | DELETE | `?id=xxx` | `{ success }` |
| `/api/v1/console/ad-source/networks` | GET | — | `{ list: [networkDef...] }` |
| `/api/v1/console/ad-source/create-custom` | POST | `{ network_def_id, source_name, ... }` | `{ id }` |

> 注：原计划中的「`/:id/bind-groups`（GET 列表 / POST 绑定）/ `/:id/unbind-groups/:bindingId`（DELETE 解绑）」端点在当前版本未实现。流量分组绑定当前通过 ad-source 的 update 端点带 `traffic_group_ids` 字段一次写入。

#### 业务规则

1. **network_code 必须从 ad_network_def 选**（不自填，避免错别字）
2. **删除限制**：
   - 检查 `waterfall_layer WHERE ad_source_id = ?` 是否非空
   - 非空返回：「该广告源在 N 个瀑布流中使用，请先从瀑布流中移除」
3. **状态切换二次确认**

### 8.6 关键库表字段详情

#### `ad_source` 表

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| `id` | bigint PK | ✅ | seq | 自增 |
| `developer_id` | varchar(50) | ✅ | — | 所属开发者 |
| `network_def_id` | bigint | ❌ | NULL | FK→`ad_network_def.id` |
| `network_code` | varchar(50) | ✅ | — | 与 ad_network_def.network_code 一致 |
| `network_name` | varchar(100) | ✅ | — | 冗余存储（避免 join） |
| `source_name` | varchar(100) | ✅ | — | 1-30 字符 |
| `third_app_id` | varchar(100) | ✅ | — | 第三方平台 app_id（**NOT NULL**） |
| `third_placement_id` | varchar(100) | ✅ | — | 第三方平台 placement_id（**NOT NULL**） |
| `extra` | jsonb | ❌ | NULL | 扩展参数 |
| `status` | smallint | ❌ | 1 | 0=禁用, 1=启用 |
| `is_custom` | bool | ❌ | false | 是否自定义 |
| `app_id` | bigint | ❌ | NULL | 关联应用 |
| `placement_id` | bigint | ❌ | NULL | 关联广告位 |
| `store_dim_params` | jsonb | ❌ | NULL | 存储维度参数 |

#### `ad_source_traffic_group` 表

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| `id` | bigint PK | ✅ | seq | 自增 |
| `ad_source_id` | bigint | ✅ | — | FK→`ad_source.id` |
| `traffic_group_id` | bigint | ✅ | — | FK→`traffic_group.id` |
| `status` | smallint | ✅ | 1 | 0=禁用, 1=启用 |
| `price` | numeric | ❌ | NULL | 出价（瀑布层排序） |
| `hour_limit` | integer | ❌ | NULL | 单小时曝光上限 |
| `day_limit` | integer | ❌ | NULL | 单日曝光上限 |
| `interval_sec` | integer | ❌ | NULL | 曝光间隔（秒） |

### 8.7 注意事项

1. **`is_preset=true` 的网络不可被开发者编辑/删除**
2. **`is_custom=true` 的网络只对当前 developer 可见**（通过 `developer_id` 过滤）
3. **`third_app_id` + `third_placement_id` 是 NOT NULL 必填**，创建时容易漏
4. **一个广告源可关联多个流量分组**（通过 `ad_source_traffic_group`），每个分组可设置不同 `price` / `day_limit`
5. **删除前必须从所有 waterfall_layer 中移除**
6. **关联流量分组**后：
   - 自动出现在对应流量分组的「广告源池」中
   - 可在瀑布流中拖入使用
7. **联调测试步骤 4 创建的自定义广告源**会自动关联到对应的自定义广告平台

---
## 9. 瀑布流配置

瀑布流是 SDK 端拉取广告的核心配置，决定了请求的优先级、超时、回退策略。

### 9.1 页面布局

#### 9.1.1 顶部信息条

- **当前广告位**：[app_name] / [placement_name]  ← 下拉切换
- **当前流量分组**：[group_name]  ← 下拉切换
- **当前 version**：v3  ← 标签 + 「历史版本」下拉
- **状态**：生效 / 历史 / 草稿
- **更新时间**：[yyyy-MM-dd HH:mm]
- **「+ 新建版本」按钮**（右侧）

#### 9.1.2 主体三列布局

```
┌──────────────┬─────────────────────────┬──────────────┐
│              │                         │              │
│  广告源池     │  3 层瀑布流编辑区         │  实时预览     │
│  (320px)     │  (自适应)                │  (320px)     │
│              │                         │              │
│  按平台分组   │  第 1 层 Bidding         │  移动端缩略   │
│  ┌────────┐  │  ┌───────────────────┐   │              │
│  │穿山甲   │  │  │ bid│CSJ│¥25      │   │              │
│  │├激励    │  │  │ bid│YLH│¥18      │   │              │
│  │└banner  │  │  └───────────────────┘   │              │
│  ├────────┤  │  第 2 层 瀑布（按价倒序）  │              │
│  │优量汇   │  │  ┌───────────────────┐   │              │
│  │├激励    │  │  │ 1  │CSJ│¥15│3s    │   │              │
│  │└开屏    │  │  │ 2  │KS│¥12│3s    │   │              │
│  └────────┘  │  │ 3  │SIGMOB│¥8│3s │   │              │
│              │  └───────────────────┘   │              │
│              │  第 3 层 兜底            │              │
│              │  ┌───────────────────┐   │              │
│              │  │ fallback│CSJ│¥1  │   │              │
│              │  └───────────────────┘   │              │
└──────────────┴─────────────────────────┴──────────────┘
```

### 9.2 广告源池（左列）

#### 9.2.1 来源

- 从当前流量分组的 `ad_source_traffic_group` 拉
- 过滤条件：
  - `status = 1`
  - 该 ad_source 支持当前 placement 的 `format`（如 banner placement 只显示支持 banner 的 ad_source）

#### 9.2.2 展示

- 按平台（`network_name`）分组
- 平台标题：图标 + 名称
- 平台下：所有该平台的 ad_source 卡片
- 每张卡片：
  - 顶部：广告源名
  - 中部：第三方 Placement ID（小字）
  - 底部：「+」拖入按钮

#### 9.2.3 拖拽交互

- 拖拽卡到右侧任意层
- 拖拽过程中：
  - 卡片半透明 0.5
  - 目标层高亮蓝色边框
  - 鼠标变为 `grabbing`
- 释放后：
  - 新增到该层（按出价自动排位置）
  - 广告源池中该卡片状态变为「已使用」灰色

### 9.3 3 层瀑布流编辑区（中列）

#### 9.3.1 第 1 层：Bidding（实时竞价）

- **特征**：所有 `supports_bidding=1` 的广告源
- **行结构**：
  - 序号（1-N）
  - 广告源名（链接）
  - Bidding 类标识（绿色 `BID` 标签）
  - 超时时间（默认 1000ms，可编辑）
  - 优先级（数字，越大越先请求，默认按 SDK 端固定顺序）
  - 删除按钮
- **可执行操作**：
  - 行内编辑超时
  - 删除该广告源（回到池中）
  - **不支持拖拽排序**（Bidding 顺序由 SDK 端控制）

#### 9.3.2 第 2 层：瀑布层

- **特征**：按 eCPM 降序瀑布
- **行结构**：
  - 序号（1-N）
  - 广告源名（链接）
  - 出价（`sort_price`，行内编辑）
  - 超时（默认 3000ms）
  - 状态（启用/禁用 switch）
  - 删除按钮
- **可执行操作**：
  - 行内编辑出价（数字 input）
  - 行内编辑超时
  - 拖拽行调整顺序（自动同步 `sort_price`）
  - 删除该广告源
  - 切换状态

#### 9.3.3 第 3 层：兜底层

- **特征**：保底广告源
- **行结构**：
  - 序号（仅 1）
  - 广告源名
  - 出价（一般 ¥0.5-1.0）
  - 超时（默认 1000ms）
  - 删除按钮
- **可执行操作**：
  - 行内编辑
  - 替换广告源（拖入新卡覆盖旧的）
  - **不可删除兜底层**（必须存在一个）

#### 9.3.4 排序联动

- 第 2 层内拖拽改变顺序：
  - 释放后**自动重排** `sort_price`（按用户拖拽顺序）
  - 顶部提示「已自动按 ¥X 重新排序」

#### 9.3.5 字段说明

| 字段 | 类型 | 范围 | 默认 | 校验 |
|------|------|------|------|------|
| `sort_price` | decimal | 0.01-9999.99 | 0.00 | 出价（瀑布层排序依据） |
| `timeout_ms` | integer | 500-30000 | 3000 | 超时（ms） |
| `priority` | integer | 0-999 | 0 | 优先级（仅 Bidding 层有效） |

### 9.4 实时预览（右列）

- 移动端缩略图（375×667）
- 模拟手机框架
- 中间区域：占位广告位
- 点击「模拟请求」按钮：
  - 显示瀑布流执行动画：
    - 第 1 层 Bidding 同时请求
    - 第 1 层 3s 后超时 → 第 2 层
    - 第 2 层按顺序：CSJ(¥15) → 3s → KS(¥12) → 3s → SIGMOB(¥8) → 3s
    - 第 3 层兜底：CSJ(¥1) → 返回
  - 顶部显示「模拟 SDK 请求完成，总耗时 X 秒，最终展示 CSJ 第 2 层 ¥15 广告」

### 9.5 版本管理

#### 9.5.1 历史版本下拉

- 顶部「历史版本」下拉：
  - 显示最近 10 个 version
  - 格式：`v3 (2026-07-30 14:30:25)` ← 时间倒序
- 选中历史版本：
  - 右侧编辑区加载该版本数据
  - 但**不可编辑**（只读模式）
  - 提示「您正在查看历史版本 v3，编辑请回到当前生效版本或新建版本」

#### 9.5.2 新建版本

- 点击「+ 新建版本」：
  - 复制当前 version 的所有配置
  - 进入可编辑模式
  - 保存后 version 自增

#### 9.5.3 保存逻辑

- 点击「保存」：
  - 校验所有必填字段
  - 校验第 3 层兜底**至少 1 个广告源**
  - 校验第 2 层瀑布**至少 1 个广告源**（不强求）
  - 校验 Bidding 层**至少 1 个**（如果平台有 Bidding 广告源）
  - 调用 `POST /api/v1/console/waterfall/update`
  - 成功：version 自增 +1 + 历史列表更新 + 提示「保存成功，新版本 v4 已生效（5 分钟后 SDK 端生效）」
  - 失败：ElMessage 错误提示

### 9.6 功能架构

| 接口 | 方法 | 请求 | 响应 |
|------|------|------|------|
| `/api/v1/console/waterfall/get` | GET | `?placement_id=xxx&traffic_group_id=xxx` | `{ config: { layers }, layers: [rows] }` |
| `/api/v1/console/waterfall/list` | GET | `?placement_id=xxx&traffic_group_id=xxx` | `{ list: [versions] }` |
| `/api/v1/console/waterfall/update` | POST | `{ placement_id, traffic_group_id, version, layers }` | `{ id, version }` |
| `/api/v1/console/waterfall/history` | GET | `?placement_id=xxx&traffic_group_id=xxx` | `{ list: [history...] }` |

> 注：原计划中的「`/waterfall/simulate` POST 模拟竞价」端点在当前版本未实现，仅作为产品愿景留档。

#### 业务规则

1. **三层结构**：
   - Bidding（layer_type=1）
   - 瀑布（layer_type=2）
   - 兜底（layer_type=3）
2. **version 自增**：每次 update 触发 `version = MAX(version) + 1`
3. **生效延迟**：保存后 5 分钟内 SDK 拉取会拿到新配置（缓存 TTL）
4. **双写策略**：
   - `waterfall_config.layers` (JSONB) — 快照
   - `waterfall_layer` (关联表) — 详细行记录
5. **`fetchConfig` 前端策略**：优先用 `config.layers` (JSONB)，为空时回退 `waterfall_layer` 行

### 9.7 关键库表字段详情

#### `waterfall_config` 表

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| `id` | bigint PK | ✅ | seq | 自增 |
| `placement_id` | varchar(50) | ✅ | — | FK→`placement.placement_id` |
| `traffic_group_id` | bigint | ❌ | 0 | FK→`traffic_group.id`，0=默认分组 |
| `version` | integer | ❌ | 1 | 版本号（自增） |
| `status` | smallint | ❌ | 1 | 1=生效 / 0=历史 / 2=草稿 |
| `layers` | jsonb | ❌ | `[]` | **3 层数组的 JSONB 快照** |

**layers JSONB 结构**：

```json
[
  {
    "type": 1,
    "name": "Bidding",
    "sources": [
      { "ad_source_id": 1, "timeout_ms": 1000, "priority": 0 }
    ]
  },
  {
    "type": 2,
    "name": "瀑布",
    "sources": [
      { "ad_source_id": 2, "sort_price": 15.0, "timeout_ms": 3000, "status": 1 },
      { "ad_source_id": 3, "sort_price": 12.0, "timeout_ms": 3000, "status": 1 }
    ]
  },
  {
    "type": 3,
    "name": "兜底",
    "sources": [
      { "ad_source_id": 4, "sort_price": 1.0, "timeout_ms": 1000 }
    ]
  }
]
```

#### `waterfall_layer` 表

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| `id` | bigint PK | ✅ | seq | 自增 |
| `config_id` | bigint | ✅ | — | FK→`waterfall_config.id` |
| `layer_type` | smallint | ✅ | — | 1=Bidding / 2=瀑布 / 3=兜底 |
| `ad_source_id` | bigint | ✅ | — | FK→`ad_source.id` |
| `sort_price` | numeric | ❌ | 0.00 | 出价（瀑布层内排序） |
| `timeout_ms` | integer | ❌ | 3000 | 超时（ms） |
| `priority` | integer | ❌ | 0 | — |
| `status` | smallint | ❌ | 1 | 0=禁用, 1=启用 |

### 9.8 注意事项

1. **删除流量分组前必须清理 waterfall_config**（外键引用）
2. **`placement_id` 存储形式**：历史上曾存为 number-as-string（如 `"58"`），与 `placement.placement_id` 字符串型（`"pl_xxx"`）不一致。`get/list` 端用 `.in('placement_id', [pidStr, placementIdStr])` 兼容
3. **`layers` 字段历史 bug**：早期建表时缺失 `layers` JSONB 列，已通过 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` 修复。**新环境必须执行**：
   ```sql
   ALTER TABLE waterfall_config ADD COLUMN IF NOT EXISTS layers JSONB DEFAULT '[]'::jsonb;
   ```
4. **「编辑中」视觉**：行通过 `row.traffic_group_id === selectedTrafficGroupId` 判断
5. **缓存 TTL**：SDK 端 5 分钟
6. **第 3 层兜底必须存在至少 1 个广告源**
7. **拖拽不会立即保存**，需点击「保存」按钮
8. **版本号不重置**，删除某个 version 不影响其他 version

---

## 10. 数据报表

数据报表是开发者最常访问的页面，包含综合 / 漏斗 / 用户行为 3 个子模块。

### 10.1 综合报表（Overview）

#### 10.1.1 页面布局

```
┌────────────────────────────────────────────────────┐
│  筛选器（多维度）                                    │
└────────────────────────────────────────────────────┘
┌────────────┬──────────┬──────────┬─────────────┐
│ 总收入 ¥  │ 总展示    │ 总点击    │ eCPM ¥      │  4 个 KPI
│ ↑ 12.5%   │ ↓ 3.2%   │ ↑ 8.1%   │ ↑ 15.2%    │
└────────────┴──────────┴──────────┴─────────────┘
┌──────────────────────────┬─────────────────────┐
│                          │                     │
│  收入趋势（30天）         │  TOP 10 排行         │
│  ECharts 折线 + 区域     │  柱状图横排          │
│  （左主区 60%）           │  （右排行 40%）      │
│                          │                     │
└──────────────────────────┴─────────────────────┘
┌────────────────────────────────────────────────────┐
│  明细数据表 + 分页 + 列勾选 + 导出                  │
└────────────────────────────────────────────────────┘
```

#### 10.1.2 顶部筛选器

| # | 字段 | 类型 | 必填 | 默认 | 说明 |
|---|------|------|------|------|------|
| 1 | **时间范围** | dateRange | ✅ | 近 7 天 | 选项：今日/昨日/近 7 天/近 30 天/近 90 天/自定义 |
| 2 | **应用** | multiSelect | ❌ | 全部 | 当前开发者所有 app |
| 3 | **广告位** | multiSelect | ❌ | 全部 | 依赖应用筛选 |
| 4 | **广告源** | multiSelect | ❌ | 全部 | 依赖应用筛选 |
| 5 | **广告形式** | multiSelect | ❌ | 全部 | banner/interstitial/native/rewarded/splash |
| 6 | **广告平台** | multiSelect | ❌ | 全部 | 从 `ad_network_def` 拉（is_preset + 自定义） |
| 7 | **系统** | multiSelect | ❌ | 全部 | android/ios |
| 8 | **国家/地区** | multiSelect | ❌ | 全部 | 从 `report_daily.region` DISTINCT |

**联动规则**：
- 选「应用」后：「广告位」自动过滤
- 选「广告位」后：「广告源」自动过滤
- 任一筛选变化 → 触发查询（500ms 防抖）

#### 10.1.3 4 个 KPI 卡片

| KPI | 计算公式 | 同环比 |
|-----|---------|--------|
| 总收入 | `SUM(revenue)` | 同比：`本周期 / 上周期 - 1` |
| 总展示 | `SUM(impressions)` | 同上 |
| 总点击 | `SUM(clicks)` | 同上 |
| eCPM | `SUM(revenue) * 1000 / SUM(impressions)` | 同上 |

- **同环比**：
  - 绿色 ↑ 涨：百分比 > 0
  - 红色 ↓ 跌：百分比 < 0
  - 灰色 -- ：无上一周期数据
- **迷你折线**：7 天趋势（细线 + 半透明填充）

#### 10.1.4 收入趋势折线图

- X 轴：日期（30 天）
- Y 轴：金额（¥）
- 多线：可叠加多个指标（点击图例切换）
- 工具栏：缩放、还原、下载 PNG

#### 10.1.5 TOP 10 排行

- 切换维度（单选按钮组）：应用 / 广告位 / 广告源 / 国家
- 柱状图横排：纵轴是 TOP 10 名称，横轴是数值
- 数值前 3 名高亮金色

#### 10.1.6 明细数据表

列（默认显示，可勾选）：
- 日期 / 应用 / 广告位 / 广告源 / 广告形式 / 国家 / 系统 / 平台
- 请求数 / 填充数 / 展示数 / 点击数 / 展示率 / 点击率 / CTR / 预估收益 / eCPM

**操作**：
- 列勾选：右上角「列设置」按钮 → 打开「指标弹窗」（详见 10.1.8）
- 排序：点击表头
- 导出：右上角「导出 CSV / Excel」按钮
- 分页：pageSize = 20

**表格对齐规则**（重要 · 2026-07-18 修复后）：
- **所有列（含维度列）均采用「整体居中」对齐**：`align: 'center'` + `headerAlign: 'center'`
- ❌ 禁止：表头左对齐 + 数据右对齐（视觉错位 14-28px）
- ❌ 禁止：仅指标列右对齐 + 维度列左对齐（指标对齐了但维度全乱）
- ✅ 正确：表头与数据、所有维度与指标列均统一 `text-align: center`
- 数字列渲染：`font-variant-numeric: tabular-nums`（等宽数字，避免小数点对不齐）
- 单元格实现：`el-table__cell > .cell` 强制 `display: flex; justify-content: center; align-items: center; width: 100%`

#### 10.1.7 功能架构

| 接口 | 方法 | 请求 | 响应 |
|------|------|------|------|
| `/api/v1/console/report/daily` | GET | 所有筛选参数 | `{ list, total }` |
| `/api/v1/console/report/export` | GET | 所有筛选参数 + format=csv/xlsx | 文件流 |
| `/api/v1/console/report/aggregate/options` | POST | `{ dimension: 'platform'/'region'/'os' }` | `{ list: [...] }` |
| `/api/v1/console/report/aggregate/aggregate` | POST | `{ metrics: [...], filters: {...} }` | `{ results: [...] }` |
| `/api/v1/console/report/funnel/definition` | GET | — | `{ list: [steps] }` |
| `/api/v1/console/report/aggregate/validate-formula` | POST | `{ formula }` | `{ valid, error? }` |

#### 业务规则

1. **聚合查询**：`SUM(requests) / SUM(fills) / SUM(impressions) / SUM(clicks) / SUM(revenue)`，按 `stat_date` group by
2. **派生指标公式**：
   - 展示率 = `fills / requests`
   - 点击率 = `clicks / impressions`
   - CTR = `clicks / impressions`
   - eCPM = `revenue * 1000 / impressions`
3. **公式驱动**：`report_metric_definition` 表存储公式模板
4. **下拉选项**：
   - 平台：`ad_network_def.network_name` where `is_preset = true`
   - 系统：`report_daily.os` DISTINCT（仅 android / ios）
   - 国家：`report_daily.region` DISTINCT
   - 广告类型：`report_daily.ad_type` DISTINCT

#### 关键库表

- **`report_daily`**（核心）
  - 必填：`developer_id` / `app_key` / `placement_id` / `ad_source_id` / `stat_date` / `hour`
  - 复合唯一：`(developer_id, app_key, placement_id, ad_source_id, stat_date, hour)`
  - 关键：`requests` / `fills` / `impressions` / `clicks` / `revenue` / `ad_type` / `region` / `os`
- **`report_metric_definition`**（指标字典）

#### 注意事项

1. **数据权限**：仅查当前 `developer_id`
2. **大表性能**：`report_daily` 数据量大，必须带 `developer_id + stat_date` 索引
3. **导出**走流式响应（chunked transfer）
4. **「广告平台」下拉从 `ad_network_def` 拉**，**禁止用 `network_type` 字段判断**（被滥用），改用 `is_preset`

#### 10.1.8 指标弹窗（列设置 · 2026-07-18 升级）

##### 触发位置
明细表右上角「列设置」按钮 → 打开 `MetricPicker` 弹窗（`width="1100"`）。

##### UI 说明

```
┌────────────────────────────────────────────────────────────────────┐
│  指标选择                                              [X 关闭]     │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────── mp-main 高度固定 420 ────────────────┐  │
│  │  ┌──────────────  mp-cats (6 列) ──────────────┐ ┌─已选─┐    │  │
│  │  │ 基础指标 6  │ 转化率 4  │ 展示 5  │ 点击 4 │ ... │ 已选列│    │  │
│  │  │ [✓] 请求数  │ [ ] 展示率│ [ ] 展示│ [ ] 点击│     │  12项 │    │  │
│  │  │ [ ] 填充数  │ [ ] 点击率│ [ ] 收益│ [ ] CTR│     │ ────┐│    │  │
│  │  │ ...        │ ...      │ ...    │ ...    │     │ 请求数││    │  │
│  │  │           │          │        │        │     │ 展示数││    │  │
│  │  │           │          │        │        │     │ ...   ││    │  │
│  │  └─────────────────────────────────────────────┘ └───┬─┘    │  │
│  └─────────────────────────────────────────────────────┴──────┘  │
│                       [取消]   [确认]                              │
└────────────────────────────────────────────────────────────────────┘
```

- **弹窗尺寸**：宽 `1100px`（容纳 6 列指标，每列 118px），高 `auto`（按内容）
- **主区** `.mp-main`：`display: grid; grid-template-columns: 1fr 220px; height: 420px; overflow: hidden`
- **左：指标分类网格** `.mp-cats`：`grid-template-columns: repeat(6, 1fr); height: 100%`
  - 每个分类下 4-6 个指标 checkbox
  - 分类标题：12px / 600 / `--color-primary-700`
  - 指标名：11px；指标说明 tip：10px / `#94A3B8`
- **右：已选指标列** `.mp-side`：
  - 标题「已选」+ 当前数量
  - 列表容器 `.mp-side-list`：`flex: 1 1 0; min-height: 0; overflow-y: auto`
  - **关键：选 51 个指标不撑大弹窗**（`scrollHeight > clientHeight` 时自动出现滚动条）
  - 单项：标签 + 删除按钮
- **底部**：取消 + 确认按钮

##### 业务规则

1. **6 列布局**：每列固定 118px，12 个分类 × 4-6 指标 = 48-72 个指标全展示
2. **滚动而非撑高**：`.mp-main` `height: 420px` + `overflow: hidden` 限制总高度，已选列通过 `flex: 1 1 0; min-height: 0` 内部滚动
3. **指标分类来源**：`report_metric_definition` 表（category 字段 + sort_order）
4. **取消勾选 → 趋势图对应线条 + 表格对应列同时隐藏**
5. **跨页签同步**：综合报表 / 漏斗分析 / 用户行为 Tab 共用同一 `MetricPicker`，选择后实时同步所有 Tab 展示

##### 关键库表

- **`report_metric_definition`**：
  - `category`（基础/转化率/展示/点击/收益/单价/...）
  - `code` / `name` / `tip`（说明）
  - `unit`（count/percent/money/ratio）
  - `formula`（派生指标公式）
  - `sort_order`（每分类内排序）

##### 注意事项

1. **弹窗宽度必须 ≥ 880px**：6 列 × 118px = 708 + 220（已选列）+ gap，否则指标名截断
2. **不要**把 `mp-main` 改成 `min-height`：会导致已选列内容撑大弹窗（51 项 → 弹窗 2073px）
3. **不要**在已选列用 `max-height: 480px`：会破坏 flex 收缩，`overflow: auto` 不生效
4. **子项高度**：`.mp-cat-item` 行高 `28px`（紧凑），多行 tip 用 `line-clamp: 2`

---

### 10.2 漏斗分析（Funnel）

#### 10.2.1 页面布局

```
┌────────────────────────────────────────────────┐
│  筛选器（应用 / 广告位 / 时间）                 │
└────────────────────────────────────────────────┘
┌────────────────────────────────────────────────┐
│  漏斗图（10 步）                               │
│  曝光 → 点击 → 落地 → 激活 → 注册 → 登录 → ... │
│  每步显示：绝对值 + 转化率（vs 上一步）+ 总体转化率 │
└────────────────────────────────────────────────┘
┌────────────────────────────────────────────────┐
│  Tab：[分天] [趋势]                            │
│  ──────                                       │
│  分天：表格（11 列 × 7 天）                    │
│  趋势：折线图（11 条线 × 30 天）                │
└────────────────────────────────────────────────┘
```

#### 10.2.2 漏斗步骤定义

| 步骤 | 名称 | 公式 | 备注 |
|------|------|------|------|
| 1 | 曝光（请求） | `SUM(requests)` | — |
| 2 | 填充 | `SUM(fills)` | 填充率 = fills / requests |
| 3 | 展示 | `SUM(impressions)` | 展示率 = impressions / fills |
| 4 | 点击 | `SUM(clicks)` | CTR = clicks / impressions |
| 5 | 落地 | `SUM(landing)` | — |
| 6 | 激活 | `SUM(activate)` | — |
| 7 | 注册 | `SUM(register)` | — |
| 8 | 登录 | `SUM(login)` | — |
| 9 | 付费 | `SUM(payment)` | — |
| 10 | 留存 | `SUM(retention)` | — |

#### 10.2.3 漏斗图渲染

- 横向漏斗图（ECharts funnel）
- 左侧：步骤名 + 绝对值
- 中间：漏斗图形（宽度按绝对值比例）
- 右侧：转化率
  - vs 上一步：`当前 / 上一步`
  - 总体：`当前 / 第 1 步`
- 鼠标悬停高亮当前步骤，显示详情

#### 10.2.4 分天表格

- 行：日期（7 天）
- 列：10 步指标
- 每个 cell 显示绝对值
- 隔行斑马
- 排序：按日期倒序

#### 10.2.5 趋势折线图

- X 轴：日期（30 天）
- Y 轴：次数
- 10 条线：每条线 1 步
- 工具栏：缩放 / 下载
- 图例可点击切换

#### 10.2.6 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/report/funnel/definition` | GET | 漏斗步骤定义 |
| `/api/v1/console/report/aggregate/aggregate` | POST | 指标聚合 |

#### 业务规则

1. 漏斗步骤定义：`report_funnel_metric_definition` 表
2. 公式解析：前端根据 `formula` 字符串调用聚合端点
3. 转化率：步骤 / 上一步 / 总体
4. **mock 数据**（dev 环境）：seededRandom 生成稳定漏斗数据

#### 关键库表

- **`report_funnel_metric_definition`**：stage / code / name / formula / sort_order / is_system
- **`report_daily`**：数据源

#### 注意事项

1. 漏斗步骤可在「指标字典」admin 页面维护
2. 公式中字段必须存在于 `report_daily`
3. mock 数据刷新一致（seed 固定）

---

### 10.3 用户行为（Behavior）

#### 10.3.1 页面布局（3 Tab）

```
┌────────────────────────────────────────────────┐
│  主维度切换：[展示频次] [用户价值] [使用时长]   │
├────────────────────────────────────────────────┤
│  筛选器：应用 / 广告位 / 时间                   │
├────────────────────────────────────────────────┤
│  上：趋势图（7 指标多线） + 「指标选择」按钮    │
│  下：表格 + 分页（精致范）                       │
└────────────────────────────────────────────────┘
```

#### 10.3.2 Tab 1：展示频次

##### 上：趋势图

- 7 指标：展示数 / 展示占比 / 设备数 / 设备占比 / 预估收益 / 预估收益占比 / eCPM
- 「指标选择」按钮：弹窗 7 个 checkbox，默认全选
- 取消勾选 → 对应线条隐藏

##### 下：表格（9 列）

| # | 列 | 字段 | 渲染 |
|---|----|------|------|
| 1 | 频次 | `range_label` | 「1次」「2次」「3次」「4次」「5次」「6-10次」「11-20次」「21-50次」「51-100次」「100+次」 |
| 2 | 展示数 | `impressions` | 数字 + tabular-nums |
| 3 | 展示占比 | `imp_pct` | 百分比 |
| 4 | 设备数 | `devices` | 数字 |
| 5 | 设备占比 | `dev_pct` | 百分比 |
| 6 | 预估收益 | `revenue` | ¥ + 2 位小数 |
| 7 | 预估收益占比 | `rev_pct` | 百分比 |
| 8 | eCPM | `ecpm` | ¥ + 2 位小数 |
| 9 | 分布 | `distribution_bar` | 水平条形图（80px 宽） |

##### 关键交互

- 行高 44px
- 斑马纹
- hover 蓝条
- 9 列对齐：`grid-column: 1 / -1` + 行内复制 grid-template-columns
- 分页：pageSize=10，size 选项 [10, 20, 50]

#### 10.3.3 Tab 2：用户价值

##### 上：趋势图

- 7 指标：展示数 / 展示占比 / 设备数 / 设备占比 / 预估收益 / 预估收益占比 / **预估收益累计占比**
- 「指标选择」按钮

##### 下：表格（8 列，可勾选）

| # | 列 | 字段 | 备注 |
|---|----|------|------|
| 1 | eCPM 范围 | `range_label` | 不可隐藏（默认） |
| 2-8 | 7 指标 | 同上 | 可隐藏 |

- 「维度」按钮：弹窗勾选哪些列显示（默认全选）
- 取消勾选 → 对应列隐藏
- 行数据：eCPM < 1 / 1-5 / 5-10 / 10-20 / 20-50 / 50-100 / 100+ (共 7 段 × 4 子段 = 27 行)
- 分页：pageSize=10，size 选项 [10, 20, 50, 100]

#### 10.3.4 Tab 3：使用时长

##### 上：趋势图

- 2 条线：主指标 / 对比指标
- 「主指标 / 对比指标」切换按钮

##### 下：对比表格（5 列）

| # | 列 | 字段 | 渲染 |
|---|----|------|------|
| 1 | 日期 | `date` | yyyy-MM-dd |
| 2 | 主指标 | `main_value` | 数字 |
| 3 | 对比指标 | `compare_value` | 数字 |
| 4 | 差异 | `diff` | 主 - 对比（带 ▲▼ 三角） |
| 5 | 差异% | `diff_pct` | 百分比（带 ▲▼ 三角） |

- 涨跌幅色彩：
  - `▲` 绿色 `#059669`（涨）
  - `▼` 红色 `#DC2626`（跌）
  - `→` 灰色 `#94A3B8`（平）
- 数据：最近 7 天
- 分页：pageSize=10，size 选项 [7, 14, 30]

#### 10.3.5 功能架构

> **行为 Tab 纯前端 mock**（无后端 API）

| 内部方法 | 说明 |
|---------|------|
| `loadAll()` | 生成 30 天趋势 + 3 个 Tab 表格数据 |
| `seededRandom(seed)` | 基于 seed 的伪随机 |
| `pagedFrequencyData` | computed，分页后的频率数据 |
| `pagedValueData` | computed，分页后的价值数据 |
| `pagedDurationData` | computed，分页后的时长数据 |
| `freqPage / valuePage / durationPage` | ref，当前页 |
| `pageSize` | ref，10 |

#### 业务规则

1. **mock 数据**：
   - seededRandom（基于 placement_id 哈希）
   - 保证刷新数据稳定
2. **指标选择**：
   - 弹窗采用与综合报表一致的「6 列布局指标弹窗」（详见 10.1.8）
   - 12 个分类 × 4-6 指标 = 48-72 个指标可勾选
   - 默认全选；取消勾选 → 趋势图对应线条 + 表格对应列同时隐藏
   - 选 51 个指标不撑大弹窗（已选列内部滚动）
3. **维度选择**（仅 value Tab）：与指标选择类似
4. **差异计算**（duration）：`diff = main - compare`，`diffPct = diff / compare * 100`

#### 关键库表

- **无独立表**，mock 生成
- 真实数据可来自 `report_daily`（未来对接）

#### 注意事项

1. **行高必须 44px**（CSS 硬约束）
2. **9 列对齐**：`grid-column: 1 / -1` + 行内复制 grid-template-columns
3. **分页**：`el-pagination` `background small layout="total, sizes, prev, pager, next, jumper"`
4. **涨跌幅色彩**：`▲` 绿色 / `▼` 红色 / `→` 灰色
5. **数字列**：`font-variant-numeric: tabular-nums`
6. 详见 DESIGN.md「数据表格精致范规范」

---

## 11. 对账管理

### 11.1 页面布局

#### 11.1.1 顶部工具栏

- **日期范围**：默认近 7 天
- **应用下拉**
- **广告平台下拉**
- **状态下拉**：全部 / 待对账 / 差异 / 已确认
- **「导入对账单」按钮**（主色）
- **「导出明细」按钮**（次要）

#### 11.1.2 表格列（12 列）

| # | 字段 | 宽度 | 渲染 |
|---|------|------|------|
| 1 | 日期 | `statDate` | 120px | yyyy-MM-dd |
| 2 | 应用 | `appKey` | 150px | 显示 app_name |
| 3 | 广告位 | `placementId` | 150px | 显示 name |
| 4 | 广告平台 | `networkCode` | 130px | 显示 network_name |
| 5 | SDK 展示 | `sdkImpressions` | 110px | 数字 + 灰色 |
| 6 | API 展示 | `apiImpressions` | 110px | 数字 + 蓝色 |
| 7 | 展示差异 | `impressionDiff` | 110px | API - SDK（带 ▲▼ 三角 + 色彩） |
| 8 | SDK 收益 | `sdkRevenue` | 110px | ¥ |
| 9 | API 收益 | `apiRevenue` | 110px | ¥ |
| 10 | 收益差异 | `revenueDiff` | 110px | ¥（带 ▲▼ 三角） |
| 11 | 状态 | `status` | 100px | 标签：待对账(灰) / 差异(红) / 已确认(绿) |
| 12 | 操作 | — | 200px fixed | 详情 / 确认 / 标记差异 |

#### 11.1.3 差异规则（自动判断）

- 展示差异：
  - 绝对值 > 5% 且 > 1000 → 标记「差异」
  - 否则 → 标记「正常」
- 收益差异：
  - 绝对值 > 5% 且 > ¥10 → 标记「差异」
  - 否则 → 标记「正常」
- 手动确认后 → 状态变为「已确认」

#### 11.1.4 差异详情弹窗

点击「详情」按钮 → 弹窗：
- 左列：SDK 侧数据（来源 `report_daily`）
- 右列：API 侧数据（来源 `custom_network_report`）
- 底部：差异分析（自动计算 + 文字说明）
  - 「SDK 展示比 API 多 1234 次（5.5%），可能原因：1) SDK 重复上报 2) API 漏报 3) 时间差」
- 操作：「标记为已确认」按钮

### 11.2 导入对账单弹窗

#### 11.2.1 弹窗结构

- 标题：「导入对账单」
- 步骤 1：选择文件（拖拽 + 点击）
- 步骤 2：实时预览前 10 行
- 步骤 3：列映射（如果列名不规范）
- 步骤 4：确认导入

#### 11.2.2 文件要求

- 格式：CSV / Excel
- 大小：≤ 10MB
- 行数：≤ 10000
- 必填列：
  - 日期（yyyy-MM-dd）
  - app_key
  - placement_id
  - 展示数
  - 收益
- 可选列：app_name / placement_name / 平台 / 点击数

#### 11.2.3 实时预览

上传后展示前 10 行表格 + 总行数 + 错误行数（红色高亮）

#### 11.2.4 列映射

如果上传的列名不匹配必填列：
- 显示「列映射」面板
- 左：上传文件的列
- 右：必填列
- 拖拽连接
- 默认尝试自动匹配（基于列名相似度）

#### 11.2.5 导入结果

- 成功：ElMessage 成功 + 关闭弹窗 + 刷新列表
- 部分成功：「成功导入 N 条，失败 M 条，失败原因：[详情]」
- 失败：弹窗显示错误

### 11.3 功能架构

| 接口 | 方法 | 请求 | 响应 |
|------|------|------|------|
| `/api/v1/console/reconciliation/list` | GET | 筛选参数 | `{ list, total }` |
| `/api/v1/console/reconciliation/import` | POST | FormData: file | `{ success, count, errors? }` |
| `/api/v1/console/reconciliation/export` | GET | 筛选参数 | 文件流 |
| `/api/v1/console/reconciliation/resolve` | POST | `{ id, comment? }` | `{ success }` |

> 注：原计划中的「`/reconciliation/detail` GET」端点在当前版本未实现，差异查看通过 `resolve` POST 的 `?id=xxx` 携带参数或前端用 `list` 端点全量回显实现。

#### 业务规则

1. **数据来源双轨**：
   - SDK 侧：`report_daily` 聚合
   - API 侧：`custom_network_report` 或导入 CSV
2. **差异检测**：定时任务（每日凌晨 2:00）跑对账
3. **人工确认**：手动标记「已确认」
4. **批量确认**：支持多选 + 一键确认

#### 关键库表

- **`reconciliation`**（核心，规划中）
  - `stat_date` / `app_key` / `placement_id` / `network_def_id`
  - `sdk_impressions` / `api_impressions` / `impression_diff` / `impression_diff_pct`
  - `sdk_revenue` / `api_revenue` / `revenue_diff` / `revenue_diff_pct`
  - `status` (0=待对账 / 1=有差异 / 2=已确认)
  - `confirmed_by` / `confirmed_at` / `comment`
  - 复合唯一：`(stat_date, app_key, placement_id, network_def_id)`

#### 注意事项

1. **对账频率**：每日凌晨 2:00（定时任务）
2. **第三方平台拉取**走 `coze-coding-dev-sdk`
3. **差异 > 阈值必须人工介入**
4. **导入 CSV 大小限制**：单文件 10MB / 10000 行
5. **当前 reconciliation 表未建**（规划中）

---

## 12. 广告平台 / Adapter

6 步对接流程的目标是让开发者能够**自助接入自定义广告平台**。

### 12.1 页面结构（4 Tab）

```
┌────────────────────────────────────────────────┐
│  [广告平台账号] [自定义广告平台] [Adapter 管理]  │
│  [数据上报]                                      │
└────────────────────────────────────────────────┘
```

#### Tab 1：广告平台账号

##### 列表

- 列：账号名 / 平台 / 第三方账号 ID / 关联应用 / 状态 / 创建时间 / 操作
- 「+ 添加账号」按钮

##### 添加账号弹窗

字段：

| # | 字段 | 必填 | 校验 | 说明 |
|---|------|------|------|------|
| 1 | **选择平台** | ✅ | 下拉 | 选完后显示该平台的凭证 schema |
| 2 | **账号名** | ✅ | 1-30 字符 | — |
| 3 | **第三方账号 ID** | ❌ | 1-100 字符 | 可选 |
| 4 | **凭证字段** | 动态 | 动态 | 根据平台 schema 动态渲染 |
| 5 | **关联应用** | ❌ | 多选 | — |
| 6 | **状态** | ❌ | 0/1 | 默认启用 |
| 7 | **备注** | ❌ | 0-200 字符 | — |

##### 凭证字段（schema-driven）

不同平台的凭证字段不同：

| 平台 | 字段 |
|------|------|
| 通用 | `app_id`, `app_key`, `app_secret` |
| 优量汇 | `package_name`, `signature_md5` |
| Sigmob | `app_id`, `api_key` |
| 穿山甲 | `app_id`, `secret`, `user_id` |
| 微信 | `app_id`, `universal_link` |
| 自定义 | 自由 key-value |

##### 凭证脱敏

- 默认显示：`****1234`（前 4 后 4）
- 点击「查看」按钮 → 显示明文
- 「复制」按钮：复制明文

#### Tab 2：自定义广告平台

##### 列表

- 列：平台代码 / 平台名 / 系统类型 / 是否支持 Bidding / 创建时间 / 操作

##### 「+ 自定义平台」按钮

字段：

| # | 字段 | 必填 | 校验 | 说明 |
|---|------|------|------|------|
| 1 | **平台代码** | ✅ | 2-20 字符，字母+数字+下划线，全局唯一 | 不可修改 |
| 2 | **平台名** | ✅ | 1-50 字符 | — |
| 3 | **平台图标** | ❌ | ≤ 1MB | — |
| 4 | **系统类型** | ✅ | 1=Android / 2=iOS / 3=Both | — |
| 5 | **是否支持 Bidding** | ❌ | 0/1 | 默认 0 |
| 6 | **adapter_class_*** 12 个 | 条件 | — | 按 platform × format 填写 |

##### adapter_class_*** 字段矩阵

12 个字段，每个对应 platform × format：

| | banner | interstitial | rewarded | native | splash |
|---|--------|--------------|----------|--------|--------|
| **Android** | `adapter_class_banner_android` | `adapter_class_interstitial_android` | `adapter_class_rewarded_android` | `adapter_class_native_android` | `adapter_class_splash_android` |
| **iOS** | `adapter_class_banner_ios` | `adapter_class_interstitial_ios` | `adapter_class_rewarded_ios` | `adapter_class_native_ios` | `adapter_class_splash_ios` |

例：穿山甲 Android banner adapter 完整类名 = `com.bytedance.sdk.openadsdk.adapter.BannerAdAdapter`

#### Tab 3：Adapter 管理

##### 列表

- 列：网络 / 版本号 / 文件名 / 文件大小 / MD5 / 状态 / 上传时间 / 操作
- 状态：草稿 / 审核中 / 已通过 / 已拒绝

##### 「上传 Adapter ZIP」

- 文件要求：
  - `.zip` 格式
  - 大小 ≤ 50MB
  - 必须含 `AndroidManifest.xml`（Android）/ `Info.plist`（iOS）
  - 内部必须含对应 adapter class

- 上传流程：
  1. 校验文件大小 / 格式
  2. 上传到 OSS
  3. 计算 MD5
  4. 落库 `custom_adapter_version`
  5. 进入「草稿」状态

##### 版本号规则

- 使用 semver：`主.次.修订`（如 `1.2.3`）
- 同一网络下 version 不可重复

##### 审核流程

- 「提交审核」按钮 → 状态变为「审核中」
- admin 审核 → 状态变为「已通过 / 已拒绝」
- 拒绝时填写 `review_comment`
- 拒绝会发「工单」类消息给开发者

#### Tab 4：数据上报

##### 「+ 上报数据」弹窗

- 选择平台
- 上传 CSV
- 实时预览前 10 行
- 上传后落库 `custom_network_report`

##### 列表

- 列：日期 / 应用 / 广告位 / 平台 / 展示 / 点击 / 收益 / 上报方式 / 操作
- 「查询」：按日期 / 应用 / 广告位 / 平台筛选

### 12.2 6 步对接流程（详细版）

| 步骤 | 名称 | 操作 | 涉及表 | 涉及接口 |
|------|------|------|--------|----------|
| 1 | 上传 Adapter | Tab 2 → Tab 3 | `custom_adapter_version` / `ad_network_def` | `POST /network/custom/create` / `POST /network/adapter/upload` |
| 2 | 广告平台账号 | Tab 1 | `ad_network_account` | `POST /network/account/create` / `GET /network/account/list` |
| 3 | 数据上报格式 | Tab 4 | `custom_network_report` | `POST /network/custom/report/upload` |
| 4 | 联调测试 | 广告源 → 自定义广告源 | `ad_source` | `POST /ad-source/create-custom` |
| 5 | 上线 | Tab 3 审核 | `custom_adapter_version` | `PUT /network/custom/adapter/status` / `POST /network/adapter/review/:id` |
| 6 | 维护监控 | Tab 4 + 报表 | `report_daily` / `message` | 异常消息通知 |

### 12.3 功能架构

#### 12.3.1 接口清单

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/network/custom/create` | POST | 创建自定义广告平台 |
| `/api/v1/console/network/custom/list` | GET | 列表 |
| `/api/v1/console/network/custom/adapter/status` | PUT | 提交审核 / 撤回 |
| `/api/v1/console/network/adapter/upload` | POST | 上传 Adapter ZIP |
| `/api/v1/console/network/adapter/list` | GET | Adapter 版本列表 |
| `/api/v1/console/network/adapter/review/:id` | POST | admin 审核 |
| `/api/v1/console/network/custom/report/upload` | POST | 上报数据 |
| `/api/v1/console/network/custom/report/query` | GET | 查询数据 |
| `/api/v1/console/network/account/create` | POST | 创建账号 |
| `/api/v1/console/network/account/list` | GET | 账号列表 |
| `/api/v1/console/network/account/:id` | PATCH / DELETE | 编辑 / 删除 |

> 注：原计划中的「`/network/account/credential-schema` GET」端点在当前版本未实现。凭证 schema 当前以常量配置形式保存在前端（`adNetworkCredentials.ts` 或页面内联），不动态拉取。

### 12.4 关键库表

#### `ad_network_def` 表

| 字段 | 必填 | 默认 | 业务规则 |
|------|------|------|----------|
| `network_code` | ✅ | — | **UNIQUE**（穿山甲/优量汇等固定值） |
| `network_name` | ✅ | — | 显示名 |
| `network_type` | ✅ | 1 | 1 / 2（**被滥用，不要用于判断预置**） |
| `supports_bidding` | ❌ | 0 | 0=否, 1=是 |
| `is_preset` | ✅ | false | **预置 vs 自定义 的可靠区分** |
| `developer_id` | ❌ | NULL | 自定义时 = 创建者 |
| `system_type` | ✅ | 3 | 1=Android, 2=iOS, 3=Both |
| `created_by` | ❌ | NULL | 'system' / developer_id |
| 12 个 `adapter_class_*` | ❌ | NULL | 按 platform × format 填写 |
| `icon_url` | ❌ | NULL | 平台图标 |

#### `ad_network_account` 表

| 字段 | 必填 | 默认 |
|------|------|------|
| `developer_id` | ✅ | — |
| `network_def_id` | ✅ | — |
| `account_name` | ✅ | — |
| `app_id` | ❌ | NULL |
| `credentials` | ❌ | `{}` |
| `status` | ❌ | 1 |
| `remark` | ❌ | NULL |

#### `custom_adapter_version` 表

| 字段 | 必填 | 默认 |
|------|------|------|
| `network_def_id` | ✅ | — |
| `developer_id` | ✅ | — |
| `version` | ✅ | — |
| `file_name` | ✅ | — |
| `file_url` | ✅ | — |
| `file_size` | ❌ | NULL |
| `file_md5` | ❌ | NULL |
| `sdk_min_version` | ❌ | NULL |
| `changelog` | ❌ | NULL |
| `status` | ❌ | 1 | 1=草稿 / 2=审核中 / 3=通过 / 4=拒绝 |
| `review_comment` | ❌ | NULL |
| `reviewed_at` | ❌ | NULL |
| `reviewed_by` | ❌ | NULL |

#### `custom_network_report` 表

| 字段 | 必填 | 默认 |
|------|------|------|
| `developer_id` | ✅ | — |
| `app_key` | ✅ | — |
| `placement_id` | ✅ | — |
| `network_def_id` | ✅ | — |
| `stat_date` | ✅ | — |
| `impressions` | ❌ | 0 |
| `clicks` | ❌ | 0 |
| `revenue` | ❌ | 0.0000 |
| `upload_type` | ❌ | 1 | 1=SDK 2=API 3=手动 |

#### `app_network_binding` 表

| 字段 | 必填 | 默认 |
|------|------|------|
| `app_key` | ✅ | — |
| `network_def_id` | ✅ | — |
| `adapter_version_id` | ✅ | 0 |
| `network_app_id` | ✅ | — |
| `extra_params` | ❌ | NULL |
| `status` | ❌ | 1 |
| `account_id` | ❌ | NULL |

### 12.5 注意事项

1. **平台代码全局唯一**，重复 40001 错误
2. **`is_preset=true` 不可被开发者编辑/删除**
3. **`is_preset=false` 只对当前 developer 可见**
4. **Adapter ZIP 实际存到 OSS**，DB 只存 URL + MD5
5. **凭证（credentials）JSONB** 敏感字段前端脱敏
6. **审核流程**：当前简化（admin 一键通过/拒绝）
7. **6 步流程可并行**：例如步骤 1（上传 Adapter）和步骤 2（创建账号）可同时进行

---

## 13. 消息中心

### 13.1 页面布局

#### 13.1.1 顶部 Tab

- **全部**（默认，未读优先）
- **收入通知**（type=1）
- **异常通知**（type=2）
- **工单通知**（type=3）

每个 Tab 显示未读数徽标（红色圆点 + 数字）

#### 13.1.2 列表（左主区 65%）

每条消息：
- 左侧 56px：图标（按 type 区分）
- 中部：标题 + 摘要 + 时间
- 右侧 100px：未读标记（蓝色圆点）+ 操作按钮
- 行高 80px
- 斑马纹 + hover 蓝条
- 排序：未读置顶 + 时间倒序

#### 13.1.3 详情面板（右 35%）

点击列表项 → 右侧滑出详情：
- 完整内容（支持富文本 / Markdown）
- 关联跳转（如「查看应用」按钮）
- 操作：「标记已读」「删除」

### 13.2 消息类型与触发

| type | 触发场景 | 模板 |
|------|----------|------|
| 1 收入 | 对账完成 | 「您的 [app_name] 在 [date] 的对账已完成，总收入 ¥X」 |
| 1 收入 | 收益里程碑 | 「恭喜！您的总收入突破 ¥X」 |
| 2 异常 | API 拉取失败 | 「[platform] API 拉取失败，错误信息：X」 |
| 2 异常 | Adapter 审核被拒 | 「您的 [version] Adapter 审核未通过，原因：X」 |
| 2 异常 | 数据漏报 | 「[placement] 在 [date] 数据缺失，请检查 SDK 端」 |
| 3 工单 | 客服回复 | — |
| 3 工单 | 平台公告 | — |

### 13.3 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/message/list` | GET | 分页（按 type 筛选） |
| `/api/v1/console/message/read` | PUT | 标记已读（单条） |
| `/api/v1/console/message/read-all` | PUT | 全部已读 |
| `/api/v1/console/message/:id/read` | PUT | 按 ID 标记已读 |
| `/api/v1/console/message/unread-count` | GET | 未读数（顶栏铃铛） |

#### 业务规则

1. **未读数**：实时查询 `message.is_read=0 AND developer_id=current`
2. **顶栏铃铛**：每 30s 轮询未读数，显示红点徽标
3. **批量操作**：支持多选 + 一键已读 + 一键删除

### 13.4 关键库表

#### `message` 表

| 字段 | 必填 | 默认 |
|------|------|------|
| `developer_id` | ✅ | — |
| `type` | ✅ | — | 1=收入 / 2=异常 / 3=工单 |
| `title` | ✅ | — |
| `content` | ✅ | — |
| `is_read` | ❌ | 0 | 0=未读 / 1=已读 |

### 13.5 通知偏好

`developer.notify_*` 6 个 boolean 字段（矩阵）：

|  | 邮件 | 站内 |
|--|------|------|
| 收入 | `notify_email_revenue` | `notify_inapp_revenue` |
| 异常 | `notify_email_anomaly` | `notify_inapp_anomaly` |
| 工单 | `notify_email_ticket` | `notify_inapp_ticket` |
| 每日摘要 | — | `notify_daily_digest` |

在「个人中心」→「通知偏好」中配置。

### 13.6 注意事项

1. 消息不会自动删除，仅标记已读
2. 邮件通知依赖 SMTP 配置（生产环境需要）
3. 顶栏铃铛轮询增加 QPS，生产建议改 SSE
4. **当前 message 表只有 5 个字段**（缺 message_type / priority / related_id / created_at 等）

---

## 14. 个人中心

### 14.1 页面布局

#### 14.1.1 顶部信息卡片

- 左侧：头像（圆形 80px，无图时首字母圆形占位）
- 中部：公司名（大字号 20px）+ 邮箱 + 角色标签（developer / admin）
- 右侧：4 个操作按钮
  - 「修改资料」
  - 「修改密码」
  - 「通知偏好」
  - 「退出登录」

#### 14.1.2 基本资料卡片

`el-descriptions` 2 列布局：

| 字段 | 显示 |
|------|------|
| 开发者 TOKEN | `api_access_token`（脱敏 + 复制 + 重新生成） |
| 邮箱 | `email`（只读） |
| 公司名称 | `company` |
| 公司简称 | `company_short_name` |
| 联系人 | `contact_name` |
| 联系电话 | `phone` |
| 接入方式 | 1=SDK接入 / 2=API接入 |
| API Token 过期时间 | `api_token_expire` |
| 创建时间 | `created_at` |
| 状态 | 1=启用 / 0=禁用 |

### 14.2 修改资料抽屉（480px）

字段：

| # | 字段 | 必填 | 校验 | 可修改 |
|---|------|------|------|--------|
| 1 | **公司名称** | ✅ | 1-50 字符 | ✅ |
| 2 | **公司简称** | ✅ | 2-10 字符 | ✅ |
| 3 | **联系人** | ✅ | 2-20 字符 | ✅ |
| 4 | **联系电话** | ✅ | 11 位手机号 | ✅ |

**不可编辑字段**：邮箱、接入方式、角色（受保护）

### 14.3 修改密码抽屉

字段：

| # | 字段 | 必填 | 校验 |
|---|------|------|------|
| 1 | **原密码** | ✅ | 6-20 位 |
| 2 | **新密码** | ✅ | 6-20 位，含字母 + 数字 |
| 3 | **确认新密码** | ✅ | 与新密码一致 |

**逻辑**：
- 前端先校验两次新密码一致
- 提交后端校验：bcrypt.compare(原密码, hash) → 成功后 bcrypt.hash(新密码) → update
- 成功后**强制登出**（清空 cookie + localStorage + 跳到 login）

### 14.4 API Token 管理

#### 14.4.1 显示

- 脱敏：`abc12345...xyz67890`（前 8 后 8）
- 「复制」按钮：复制明文
- 「重新生成」按钮：弹确认 → 调接口 → 更新

#### 14.4.2 重新生成

- 弹窗：「重新生成后旧 Token 立即失效，确认？」
- 调用 `POST /api/v1/auth/api-token`
- 后端：
  - 生成新 token（UUID 32 位 + 16 位随机）
  - 写入 `developer.api_access_token`
  - 设置 `api_token_expire` = now() + 30 天
- 成功后刷新显示

### 14.5 通知偏好抽屉

6 个开关：

|  | 邮件 | 站内 |
|--|------|------|
| 收入 | ☐ | ☐ |
| 异常 | ☐ | ☐ |
| 工单 | ☐ | ☐ |
| 每日摘要 | — | ☐ |

布局：3 行 × 2 列的开关组 + 底部 1 行（每日摘要）

底部「保存」按钮：批量更新 6 个字段

### 14.6 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/profile/info` | GET | 完整资料 |
| `/api/v1/console/profile/tokens` | GET | 当前 API Token 列表 |
| `/api/v1/console/profile/info` | PUT | 修改资料（个人中心内调用） |
| `/api/v1/console/profile/password` | PUT | 修改密码（个人中心内调用） |
| `/api/v1/console/profile/api-token` | POST | 生成 / 重置 API Token |
| `/api/v1/console/profile/api-token/expire` | PATCH | 调整 API Token 过期时间 |
| `/api/v1/auth/profile` | PUT | 修改资料（鉴权层） |
| `/api/v1/auth/password` | PUT | 修改密码（鉴权层） |
| `/api/v1/auth/api-token` | POST | 生成 / 重置 API Token（鉴权层） |

> ⚠️ **双写端点说明**：`/api/v1/console/profile/*` 与 `/api/v1/auth/*` 存在功能重叠的 3 对端点（profile / password / api-token）。两者行为一致，前者是个人中心页面调用入口（路由收敛在 `profile.ts`），后者是鉴权模块暴露的等价接口（`auth.ts`）。客户端调用建议统一走 `/api/v1/console/profile/*`，`/api/v1/auth/*` 保留作为 SDK / 跨模块直调入口。

### 14.7 关键库表

- **`developer`**：详见 16.2.1

### 14.8 注意事项

1. **API Token 是 SDK 端调用凭证，不能泄露**
2. **重新生成 Token 后所有使用旧 Token 的 SDK 端需要立即更新**
3. **密码修改成功后强制登出**
4. **角色修改需 admin 权限**（个人中心不能改）

---

## 15. 超级管理员

仅 `role='admin'` 用户可访问 `/admin/*`。

### 15.1 开发者管理

#### 15.1.1 列表页 UI 说明

##### 顶部工具栏

- **关键字搜索**（占位「搜索邮箱 / 公司名」）：500ms 防抖
- **接入方式下拉**：SDK / API
- **角色下拉**：developer / admin
- **状态下拉**：启用 / 禁用
- **「+ 邀请开发者」按钮**（主色）：发送邀请链接

##### 表格列（10 列）

| # | 字段 | 宽度 | 渲染 |
|---|------|------|------|
| 1 | 开发者 ID | `developer_id` | 130px | monospace |
| 2 | 邮箱 | `email` | 200px | — |
| 3 | 公司 | `company` | 180px | — |
| 4 | 联系人 | `contact_name` | 100px | — |
| 5 | 电话 | `phone` | 130px | — |
| 6 | 接入方式 | `access_type` | 100px | 标签 |
| 7 | 角色 | `role` | 100px | 标签（admin=红色，developer=蓝色） |
| 8 | 状态 | `status` | 80px | switch |
| 9 | 创建时间 | `created_at` | 170px | yyyy-MM-dd HH:mm |
| 10 | 操作 | — | 280px fixed | 修改角色 / 重置密码 / 详情 |

#### 15.1.2 操作弹窗

##### 修改角色

- 弹窗：「将 [email] 的角色修改为？」
- 单选：admin / developer
- 二次确认：「修改角色会影响该用户的访问权限，确认？」
- **限制：admin 不能把自己降级为 developer**

##### 重置密码

- 弹窗：输入新密码
- 二次确认：「重置后该用户需要用新密码登录，确认？」
- 后端：直接 update（不走验证码）

#### 15.1.3 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/admin/developers` | GET | 列表（筛选） |
| `/api/v1/console/admin/developers/:id/role` | PATCH | 改角色 |
| `/api/v1/console/admin/developers/:id/status` | PATCH | 启停 |
| `/api/v1/console/admin/developers/:id/reset-password` | POST | 重置密码（**未实现**：当前仅做交互描述，接口未上线） |
| `/api/v1/console/admin/developers/invite` | POST | 邀请（**未实现**：当前仅做交互描述，接口未上线） |

#### 15.1.4 注意事项

1. **admin 数量应严格控制**（建议 ≤ 3 人）
2. **admin 不能把自己降级为 developer**（防误操作锁死）
3. **禁用开发者会立即让其所有 session 失效**
4. **重置密码 / 邀请开发者**：当前版本仅做交互描述，接口未上线（详见 15.1.3 注）

---

### 15.2 指标字典

#### 15.2.1 页面布局

```
┌──────────┬─────────────────────────────┐
│          │  [+ 新建指标]                │
│ 分类树    │                              │
│ (200px)  │  表格（指标列表）             │
│          │                              │
└──────────┴─────────────────────────────┘
```

#### 15.2.2 左侧分类树

- 分类列表（从 `report_metric_definition.category` DISTINCT）
- 选项：收入类 / 展示类 / 点击类 / 转化类 / 自定义
- 选中后右侧显示该分类下的指标
- 「全部」选项显示所有

#### 15.2.3 右侧表格（11 列）

| # | 字段 | 渲染 |
|---|------|------|
| 1 | 指标名 | `name` | 中文 |
| 2 | 指标代码 | `code` | monospace |
| 3 | 分类 | `category` | 标签 |
| 4 | 子分类 | `sub_category` | 标签 |
| 5 | 取值类型 | `value_type` | actual / derived |
| 6 | 单位 | `unit` | — |
| 7 | 格式 | `format` | number / percent / currency / duration |
| 8 | 公式 | `formula` | monospace 字体 |
| 9 | 必填字段 | `required_fields` | 数组显示 |
| 10 | 排序 | `sort_order` | 数字 |
| 11 | 启用 | `is_active` | switch |
| 12 | 系统级 | `is_system` | 锁图标 |
| 13 | 描述 | `description` | — |
| 14 | 操作 | — | 编辑 / 删除 |

#### 15.2.4 新建 / 编辑指标弹窗

字段：

| # | 字段 | 必填 | 校验 | 说明 |
|---|------|------|------|------|
| 1 | **指标代码** | ✅ | 2-50 字符，**UNIQUE**，英文+下划线 | 创建后不可修改 |
| 2 | **指标名** | ✅ | 1-50 字符 | — |
| 3 | **分类** | ✅ | 下拉 | 收入/展示/点击/转化/自定义 |
| 4 | **子分类** | ❌ | 下拉 | 依赖分类 |
| 5 | **取值类型** | ✅ | actual / derived | actual=基础 / derived=派生 |
| 6 | **单位** | ❌ | 1-20 字符 | 次 / % / ¥ / ms |
| 7 | **格式** | ✅ | number / percent / currency / duration | 决定前端渲染 |
| 8 | **公式** | 条件 | derived 必填 | 公式语法（见下） |
| 9 | **必填字段** | ❌ | ARRAY | 公式中用到的字段 |
| 10 | **排序** | ❌ | 0-999 | 越大越靠前 |
| 11 | **启用** | ❌ | 0/1 | 默认启用 |
| 12 | **系统级** | ❌ | 0/1 | 默认非系统（创建后不可改） |
| 13 | **描述** | ❌ | 0-200 字符 | — |

#### 15.2.5 公式语法

支持：
- 聚合函数：`SUM(field)` / `AVG(field)` / `COUNT(field)` / `MAX(field)` / `MIN(field)`
- 算术运算：`+` / `-` / `*` / `/`
- 常量：数字 / 字符串
- 派生计算：`SUM(revenue) * 1000 / SUM(impressions)`（eCPM）

#### 15.2.6 公式校验

- 点击「测试公式」→ 调 `POST /report/aggregate/validate-formula`
- 后端：
  - 解析公式 AST
  - 校验所有字段存在于 `report_daily`
  - 校验语法
  - 试运行返回 0（无需实际数据）
- 返回：
  - `{ valid: true, error: null }` → 绿色 ✅
  - `{ valid: false, error: '字段 x 不存在' }` → 红色 ❌ + 错误位置

#### 15.2.7 功能架构

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/console/report-metric/list` | GET | 列表（按分类筛选） |
| `/api/v1/console/report-metric/categories` | GET | 分类列表 |
| `/api/v1/console/report-metric/create` | POST | 创建（admin only） |
| `/api/v1/console/report-metric/update/:id` | PATCH | 更新（admin only） |
| `/api/v1/console/report-metric/delete/:id` | DELETE | 删除（admin only） |
| `/api/v1/console/report/aggregate/validate-formula` | POST | 校验公式 |

#### 15.2.8 关键库表

- **`report_metric_definition`**：详见 16.2.16

#### 15.2.9 注意事项

1. **`is_system=true` 的指标不可删除/修改**
2. **公式修改后历史数据不需要重算**（公式在查询时实时应用）
3. **`required_fields` 必须在 `report_daily` 存在**
4. **派生指标必须有 formula，基础指标不需要**

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

## 20. SDK 中心（开发者端）

> **定位**：开发者接入 SDK 的官方门户。包含 4 个页面：下载首页 / 技术文档 / 隐私政策 / 版本历史。所有页面顶部继承 `<MainLayout>` 公共导航 + 左侧「SDK 中心」菜单组。

### 20.1 SDK 下载首页（`src/views/sdk/Index.vue`，路由 `/sdk`）

#### UI 说明

- **顶部 Hero 区**：
  - eyebrow 文字「**新义 聚合 SDK**」（品牌名，原"YTads 聚合 SDK"已废弃）
  - 主标题 + 副标题
  - 平台切换 Tab：「Android」「iOS」（默认 Android）
  - 主下载按钮（大）：当前 Tab 最新版本 + 文件大小 + `window.open(download_url)`
- **当前版本卡片**（Tab 下方）：
  - 版本号（如 `6.0.9`）+ 发布时间 + 包大小 + MD5
  - 依赖项（Gradle / CocoaPods 代码块）
  - 「下载 SDK」主按钮
- **Changelog 折叠区**（每个版本一条）：
  - 标题（版本号 + 发布时间）+ 新增/修复/优化三栏变更说明
  - 默认展开最新 1 条，其余折叠
- **集成指南入口**：底部 3 个跳转卡（快速接入 / API 参考 / 常见问题）

#### 业务逻辑

1. 页面挂载 → `GET /api/v1/sdk-cms/releases/latest?platform={1|2}&channel=stable` 获取当前 Tab 最新版本
2. 切换 Tab → 重新请求对应平台最新版本
3. 点「下载」→ 校验登录态 → `window.open(release.download_url)` 直接下载
4. Changelog 展开 → 拉取该版本完整 `changelog` 字段

#### 关键库表

- `sdk_release`（核心 11+ 字段：version, platform, channel, status, download_url, file_size, md5, changelog, released_at, created_by）
- `developer`（登录态）

#### 注意事项

- iOS SDK 包名 `YTads-iOS-*.zip`（**保留**作为包文件名 / URL，不替换为"新义-iOS"）
- Android SDK 类名 `YTAdView` / `YTAdRequest` / `YTAdSize` 等 SDK API 类名**保留**（技术标识，非品牌）

---

### 20.2 SDK 技术文档（`src/views/sdk/Docs.vue`，路由 `/sdk/docs`）

#### UI 说明

- **左栏 分类列表**（280px 宽，5 个分类 + 文档数）：快速开始 / Android 集成 / iOS 集成 / API 参考 / 常见问题
- **右栏 文档详情**：
  - 顶部：面包屑（SDK 中心 / 文档 / 当前分类）
  - 标题 / 最后更新时间 / 浏览数
  - **Markdown 渲染**（`markdown-it` + 高亮 + 目录 TOC）
  - 底部：「上一篇 / 下一篇」翻页

#### 业务逻辑

1. 挂载 → `GET /api/v1/sdk-cms/docs/categories` 拉分类 + 计数
2. 默认选第一个分类 → `GET /api/v1/sdk-cms/docs?category_id={id}` 拉该分类下文档列表
3. 点文档 → `GET /api/v1/sdk-cms/docs/{id}` 拉 Markdown 内容
4. Markdown 编译：自动生成 TOC、代码高亮（vue-prism-component）、表格响应式

#### 关键库表

- `sdk_doc_category`（id, name, sort_order, status）
- `sdk_doc`（id, category_id, title, slug, content(MD), view_count, sort_order, status）

#### 注意事项

- 「API 参考」下有且仅 1 篇文档，标题原"YTAdRequest 参数说明"已删除品牌前缀「YTAd」→ 现为「**Request 参数说明**」（2026-07-18 更新）
- 文档 `content` 中仍包含 `YTAdRequest` / `YTAdSize` 等真实 SDK 类名示例，**不删**（技术标识）

---

### 20.3 SDK 隐私政策（`src/views/sdk/Privacy.vue`，路由 `/sdk/privacy`）

#### UI 说明

- **顶部**：版本号 tag + 生效日期 + 摘要（如「v1.1 主要更新：增加 iOS Privacy Manifest 说明」）
- **外链 tag**：生效中政策若 `source_url` 非空 → 标题旁显示橙底「**外链**」tag + 顶部「**前往官方原文**」按钮（新窗跳转）
- **内容区**（互斥两种模式）：
  1. **外链模式**（`source_url` 非空）：iframe 嵌入 `https://docs.mobrtb.com/sdk_privacy.html`，720px 高，sandbox = `allow-same-origin allow-scripts allow-popups allow-forms`
  2. **内部模式**（`source_url` 为空）：按 `content_format` 渲染（1=HTML 直接注入 / 2=Markdown 编译）
- **历史版本**：底部折叠区，可切换查看 v1.0 / v1.1 等历史快照

#### 业务逻辑

1. 挂载 → `GET /api/v1/sdk-cms/privacy/policy?platform={1|2}` 拉生效政策
2. 检测 `source_url` 字段：
   - 非空 → 渲染外链 tag + iframe + 跳转按钮
   - 空 → 按 `content_format` 渲染内部内容
3. 切换历史版本 → 重新请求对应版本

#### 关键库表

- `sdk_privacy_policy`（id, version, platform, title, content_format, content, summary, source_url, effective_date, status）

#### 注意事项

- **外链模式**（2026-07-18 升级）：当 `source_url` 存在时，**优先**外链渲染；`content` 字段此时可空
- `content_format` 枚举新增值 **3 = 外链**（与 1=HTML / 2=Markdown 并列）
- 当前生效政策 v1.1 的 `source_url` = `https://docs.mobrtb.com/sdk_privacy.html`（已落地）
- iframe 加载失败时降级：显示「前往查看原文」按钮（避免 X-Frame-Options 拦截）

---

### 20.4 SDK 版本历史（`src/views/sdk/History.vue`，路由 `/sdk/history`）

#### UI 说明

- **时间线布局**（垂直 timeline）：最新版本在上
- 每条记录：版本号 + 平台 tag（Android/iOS）+ 发布时间 + channel tag（stable/beta）+ 变更摘要（点击展开完整 changelog）
- 顶部筛选条：平台 / channel / 时间范围

#### 业务逻辑

1. 挂载 → `GET /api/v1/sdk-cms/releases?platform=&channel=&from=&to=` 拉历史列表
2. 展开 changelog → 拉该条 `changelog` 全文
3. 「下载历史版本」→ 直接 `window.open(download_url)`

#### 关键库表

- `sdk_release`（同 20.1，按 `status=1` + `released_at DESC` 排序）

---

## 21. 管理后台 · SDK 模块（`/admin/*`）

> **定位**：admin 端 SDK 资源的 CRUD 后台。共 3 个页面 + 1 个新增的"内容来源切换"模式。顶部继承 admin 主布局，左侧菜单组「SDK 管理」。

### 21.1 版本发布管理（`src/views/admin/SdkReleases.vue`，路由 `/admin/sdk/releases`）

#### UI 说明

- **顶部操作栏**：搜索框（按 version / changelog 关键词）+ 「+ 新建版本」按钮
- **主表格**（居中对齐，按 §2.4 规范）：
  - 版本号 / 平台 / channel / 状态 / 文件大小 / 发布时间 / 操作
  - 状态：已发布（绿）/ 灰测中（黄）/ 已下架（灰）tag
  - 操作：「编辑 / 复制链接 / 下架」三按钮
- **新建/编辑弹窗**：
  - 必填：version, platform(1/2), channel(stable/beta), download_url, file_size, md5, changelog, status, released_at
  - 自动生成 slug + 校验 version 唯一性

#### 业务逻辑

1. 列表 → `GET /api/v1/sdk-cms/admin/releases?...`
2. 新建/编辑 → `POST /api/v1/sdk-cms/admin/releases`（含权限校验 `authMiddleware`）
3. 下架 → `PATCH /api/v1/sdk-cms/admin/releases/{id}` 仅更新 `status=0`

#### 关键库表

- `sdk_release`（同 20.1）

---

### 21.2 文档管理（`src/views/admin/SdkDocs.vue`，路由 `/admin/sdk/docs`）

#### UI 说明

- **左栏 分类管理**（可增删改分类：name / sort_order / status）
- **右栏 文档列表**（按当前选中分类筛选）：
  - 标题 / 排序 / 浏览数 / 状态 / 操作
  - 「+ 新建文档」按钮
- **编辑弹窗**：
  - 必填：title, category_id, content(Markdown), sort_order, status
  - 实时预览：左右分屏（左侧 Markdown 编辑器，右侧编译预览）

#### 业务逻辑

1. 分类增删改 → `POST/PUT/DELETE /api/v1/sdk-cms/admin/doc-categories/{id}`
2. 文档 CRUD → `POST/PUT/DELETE /api/v1/sdk-cms/admin/docs/{id}`
3. 编辑器：textarea + markdown-it 编译预览

#### 关键库表

- `sdk_doc_category` / `sdk_doc`

---

### 21.3 隐私政策管理（`src/views/admin/SdkPrivacy.vue`，路由 `/admin/sdk/privacy`）

#### UI 说明

- **顶部操作栏**：「+ 新建政策」按钮
- **主表格**：
  - 版本号 / 平台 / 来源（**内/外链** tag）/ 标题 / 生效日期 / 状态 / 操作
  - 来源列：外链模式显示橙底「外链」tag，内嵌模式显示蓝底「内部」tag
  - 外链模式额外列：URL（可点击跳转，截断省略）
- **新建/编辑弹窗**（核心：内容来源切换）：
  - 顶部「**内容来源**」radio 单选：`内部内容（HTML/Markdown）` / `外部链接`
  - 选**外链**时：
    - 显示 `外链 URL` 输入框（必填，校验 `http(s)://` 开头）
    - 显示「预览」按钮（右侧新窗打开）
    - 显示 `摘要` 输入框（顶部展示用）
    - 隐藏「内容格式」radio + `content` 大文本框
  - 选**内部**时：
    - 显示「内容格式」radio（HTML / Markdown）
    - 显示 `content` 大文本框
    - `source_url` 字段自动置空

#### 业务逻辑

1. 内容来源切换 → 控制表单字段显隐（`v-if`），提交时根据 source_type 派发
2. 选外链提交：`POST { version, source_url, summary, status, content_format=3, content='', effective_date }`
3. 选内部提交：`POST { version, source_url='', content, content_format(1/2), summary, status, effective_date }`
4. 后端 `POST /api/v1/sdk-cms/admin/privacy` 已支持两种模式（共用端点）

#### 关键库表

- `sdk_privacy_policy`（同 20.3）

#### 注意事项

- **外链模式**（2026-07-18 升级）：admin 端表单新增 source_type 切换，DB 加 `source_url` 列，`content` 改为 nullable（默认 ''）
- `content_format` 枚举值 **3 = 外链**（与 1=HTML / 2=Markdown 并列）
- 当前生效政策 v1.1 已是外链模式，URL = `https://docs.mobrtb.com/sdk_privacy.html`

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
| 报表 | `/api/v1/console/dashboard/dimensions` | GET | ✅ |
| 报表 | `/api/v1/console/dashboard/metrics` | GET | ✅ |
| 报表 | `/api/v1/console/report/daily` | GET | ✅ |
| 报表 | `/api/v1/console/report/export` | GET | ✅ |
| 报表 | `/api/v1/console/report/aggregate/options` | POST | ✅ |
| 报表 | `/api/v1/console/report/aggregate/aggregate` | POST | ✅ |
| 报表 | `/api/v1/console/report/funnel/definition` | GET | ✅ |
| 报表 | `/api/v1/console/report/aggregate/validate-formula` | POST | ✅ |
| 报表 | `/api/v1/console/report-metric/list` | GET | ✅ |
| 报表 | `/api/v1/console/report-metric/categories` | GET | ✅ |
| 报表 | `/api/v1/console/report-metric/create` | POST | admin |
| 报表 | `/api/v1/console/report-metric/update/:id` | PATCH | admin |
| 报表 | `/api/v1/console/report/board/list` | GET | ✅ |
| 报表 | `/api/v1/console/report/board/detail/:id` | GET | ✅ |
| 报表 | `/api/v1/console/report/board/create` | POST | admin |
| 报表 | `/api/v1/console/report/board/duplicate/:id` | POST | admin |
| 报表 | `/api/v1/console/report/board/update/:id` | PATCH | admin |
| 报表 | `/api/v1/console/report/board/delete/:id` | DELETE | admin |
| 报表 | `/api/v1/console/report/export/csv` | POST | ✅ |
| 报表 | `/api/v1/console/report/export/excel` | POST | ✅ |
| 报表 | `/api/v1/console/report/export/pdf` | POST | ✅ |
| 报表 | `/api/v1/console/report/export/download/:filename` | GET | ✅ |
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
| 广告平台 | `/api/v1/console/network/list` | GET | ✅ |
| 广告平台 | `/api/v1/console/network/custom/list` | GET | ✅ |
| 广告平台 | `/api/v1/console/network/custom/detail` | GET | ✅ |
| 广告平台 | `/api/v1/console/network/custom/create` | POST | ✅ |
| 广告平台 | `/api/v1/console/network/custom/update` | PUT | ✅ |
| 广告平台 | `/api/v1/console/network/custom/upload-icon` | POST | ✅ |
| 广告平台 | `/api/v1/console/network/custom/delete/:id` | DELETE | ✅ |
| 广告平台 | `/api/v1/console/network/adapter/list` | GET | ✅ |
| 广告平台 | `/api/v1/console/network/adapter/upload` | POST | ✅ |
| 广告平台 | `/api/v1/console/network/adapter/download/:id` | GET | ✅ |
| 广告平台 | `/api/v1/console/network/adapter/review/:id` | POST | admin |
| 广告平台 | `/api/v1/console/network/adapter/delete/:id` | DELETE | admin |
| 广告平台 | `/api/v1/console/network/custom/adapter/versions` | GET | ✅ |
| 广告平台 | `/api/v1/console/network/custom/adapter/status` | PUT | ✅ |
| 广告平台 | `/api/v1/console/network/custom/adapter/upload` | POST | ✅ |
| 广告平台 | `/api/v1/console/network/custom/report/upload` | POST | ✅ |
| 广告平台 | `/api/v1/console/network/custom/report/query` | GET | ✅ |
| 广告平台 | `/api/v1/console/network/app/list` | GET | ✅ |
| 广告平台 | `/api/v1/console/network/app/bind` | POST | ✅ |
| 广告平台 | `/api/v1/console/network/app/unbind` | POST | ✅ |
| 广告平台 | `/api/v1/console/network/account/list` | GET | ✅ |
| 广告平台 | `/api/v1/console/network/account/detail` | GET | ✅ |
| 广告平台 | `/api/v1/console/network/account/create` | POST | ✅ |
| 广告平台 | `/api/v1/console/network/account/:id` | PATCH / DELETE | ✅ |
| 个人中心 | `/api/v1/console/profile/info` | GET | ✅ |
| 个人中心 | `/api/v1/console/profile/info` | PUT | ✅ |
| 个人中心 | `/api/v1/console/profile/password` | PUT | ✅ |
| 个人中心 | `/api/v1/console/profile/tokens` | GET | ✅ |
| 个人中心 | `/api/v1/console/profile/api-token` | POST | ✅ |
| 个人中心 | `/api/v1/console/profile/api-token/expire` | PATCH | ✅ |
| Admin | `/api/v1/console/admin/developers` | GET | admin |
| Admin | `/api/v1/console/admin/developers/:id/role` | PATCH | admin |
| Admin | `/api/v1/console/admin/developers/:id/status` | PATCH | admin |
| SDK 文档 | `/api/v1/sdk-cms/docs` | GET | ❌ |
| SDK 文档 | `/api/v1/sdk-cms/docs/:id` | GET | ❌ |
| SDK 文档 | `/api/v1/sdk-cms/doc-categories` | GET | ❌ |
| SDK 文档 | `/api/v1/sdk-cms/admin/docs` | GET | admin |
| SDK 文档 | `/api/v1/sdk-cms/admin/docs` | POST | admin |
| SDK 文档 | `/api/v1/sdk-cms/admin/docs/:id` | PUT | admin |
| SDK 文档 | `/api/v1/sdk-cms/admin/docs/:id` | DELETE | admin |
| SDK 文档 | `/api/v1/sdk-cms/admin/releases` | GET | admin |
| SDK 文档 | `/api/v1/sdk-cms/admin/releases` | POST | admin |
| SDK 文档 | `/api/v1/sdk-cms/admin/releases/:id` | PUT | admin |
| SDK 文档 | `/api/v1/sdk-cms/admin/releases/:id` | DELETE | admin |
| SDK 文档 | `/api/v1/sdk-cms/releases` | GET | ❌ |
| SDK 文档 | `/api/v1/sdk-cms/releases/:id` | GET | ❌ |
| SDK 文档 | `/api/v1/sdk-cms/releases/latest` | GET | ❌ |
| SDK 文档 | `/api/v1/sdk-cms/releases/:id/download` | POST | ❌ |
| SDK 隐私 | `/api/v1/sdk-cms/privacy/policy` | GET | ❌ |
| SDK 隐私 | `/api/v1/sdk-cms/privacy/consent` | POST | ❌ |
| SDK 隐私 | `/api/v1/sdk-cms/admin/privacy` | GET | admin |
| SDK 隐私 | `/api/v1/sdk-cms/admin/privacy` | POST | admin |
| SDK 隐私 | `/api/v1/sdk-cms/admin/privacy/:id` | PUT | admin |
| HAL | `/api/v1/hal/config` | GET | Token |
| SDK | `/api/v1/sdk/config` | GET | Token |
| SDK | `/api/v1/sdk/report` | POST | Token |
| 报表-外 | `/api/v1/report/daily` | GET | Token |
| 健康检查 | `/api/health` | GET | ❌ |

**总计**：约 110 个接口，覆盖 14 个业务模块 + 鉴权 + SDK + Admin + SDK-CMS。

> ⚠️ **mount 路径说明**：所有 console 业务均挂在 `/api/v1/console/*` 下（app / placement / ad-source / waterfall / traffic-group / dashboard / report / report-metric / report-board / report-aggregate / reconciliation / message / network / profile / admin）；鉴权单独挂在 `/api/v1/auth/*`；SDK 平台聚合数据上报挂在 `/api/v1/hal/*`；公开 SDK 接口挂在 `/api/v1/sdk/*`；SDK 文档与隐私政策管理挂在 `/api/v1/sdk-cms/*`；外部数据上报用 `/api/v1/report/*`。

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
| 2026-08-01 | v1.2.0 | 文档与代码对齐修复：① §3.1/§3.2 图形验证码改为「前端 Canvas 本地校验」+ 移除「`send-captcha` / `reset-password` 未上线端点描述」+ 错误码改为 HTTP 4xx 实际语义（无业务 code 字段）；② §4.2 路径修复 `/api/v1/dashboard` → `/api/v1/console/dashboard`（5 处）；③ §7/§8/§10/§11/§12 标注「未上线端点」（`ad-source/bind-groups` / `waterfall/simulate` / `reconciliation/detail` / `network/account/credential-schema`）；④ §10.1.9 / §10.2.6 / §15.2.6 / §15.2.7 路径修复 `report-aggregate/*` → `report/aggregate/*` 与 `report/funnel/definition`（8 处）；⑤ §14.6 + 附录 A 删除不存在的 `console/profile/preset` 端点 + 补充 3 个实际端点（`PUT /info` / `PATCH /api-token/expire` / `GET /tokens` 已存在）+ 新增「双写端点说明」；⑥ 附录 A 路径前缀修复 `report-aggregate/*` → `report/aggregate/*` + 补全 22 个 network 端点 + 6 个 report/board 端点 + 22 个 sdk-cms/hal/sdk 端点 + 1 个 `/api/v1/report/daily`；总计从 75+ 扩到 110+；⑦ §15.1.3 / §15.1.4 标注「`admin/developers/:id/reset-password` / `admin/developers/invite` 当前未上线」 |
| 2026-07-31 | v1.0.0 | 初版 PRD，覆盖 13 个业务模块 + 鉴权 + 22 张表 + 75+ 接口 |
| 2026-07-18 | v1.1.0 | 增量更新：① §2.4 新增「表格整体居中」全平台规范；② §10.1.6 明细表对齐规则修正（原"表头左/数据右"错误描述）；③ §10.1.8 新增「指标弹窗」子节（6 列 × 12 分类 / 1100×578 / 已选列固定高+滚动）；④ §10.3 指标选择弹窗描述修正（实为 12 分类 6 列布局，非 7 个 checkbox）；⑤ **§20 SDK 中心** 新章（4 开发者端页面：Index / Docs / Privacy / History）；⑥ **§21 admin SDK 管理** 新章（3 页面 + 隐私政策外链模式 source_url）；⑦ 隐私政策 `content_format=3` 新增枚举值「外链」；⑧ API 参考下 `YTAdRequest 参数说明` → `Request 参数说明`（保留 SDK 类名 `YTAdRequest` 作为技术标识）|
| 未来 | — | 待补：邮件 / 短信集成、RLS、多级审核、Web Vitals 监控、GDPR 合规等 |

