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

![数据看板架构图](public/architecture/03_2__数据看板.png)

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

![应用管理架构图](public/architecture/04_3__应用管理.png)

开发者管理的最基础实体，承载广告位、广告源、报表等所有业务的下游。

### 5.1 列表/详情页 UI 说明（Master-Detail 布局）

整体布局：**左主列表 + 右侧详情面板**（非传统表格）。开发者从左侧选择应用后，右侧实时显示该应用的 3 段式详情。

#### 5.1.1 顶部工具栏（从左到右）

- **搜索输入框**（占位文案「搜索应用名称 / app_key / 包名」）
  - 输入即时过滤，**前端纯客户端过滤**（不带回车触发）
  - 匹配规则：`app_name` 模糊 OR `app_id/id` 模糊 OR `package_name` 模糊（不区分大小写）
  - 内置「清空」按钮
- **排序下拉**（单选，3 选 1）
  - 「按添加时间倒序」（默认）
  - 「按添加时间正序」
  - 「按名称 A→Z」
- **「+ 创建应用」按钮**（主色 primary，右上角）
  - 点击后从右侧滑出 `AppDrawer`（760px 宽）
  - 默认进入「创建」模式，标题「创建应用」

> **注意**：本版本**没有**「平台下拉 / 状态下拉」顶部筛选，状态仅用于左侧主列表卡片上的状态锁展示；搜索 + 排序已覆盖 90% 检索需求。

#### 5.1.2 左侧主列表（`app-master-item` 卡片列表）

每个应用一张卡片，按当前排序顺序展示，每张卡片含 4 段信息：

| 段落 | 字段 | 渲染 | 交互 |
|------|------|------|------|
| ① 图标 | `icon_url` | 48×48 圆角方形缩略图 | 加载失败回退到首字母占位 |
| ② 名称 + 平台标签 | `app_name` + `platform` | 主文案 14px + 平台 tag（Android 蓝 / iOS 绿） | — |
| ③ App Key | `app_key` | monospace 13px，hover 显示「📋 复制」按钮 | 点击复制到剪贴板，ElMessage 提示「已复制」 |
| ④ 状态锁 | `status` | 锁形图标 + 启/禁用色 | 仅展示，不可直接切换（需进入详情） |

**卡片交互**：
- 点击整张卡片：选中后右侧详情面板刷新（高亮当前卡片，左侧 3px 蓝条）
- 默认选中第一张卡片
- 无分页：当前接口 `pageSize=200` 一次性拉完，前端做纯客户端过滤
- 空状态：`el-empty` 描述「暂无应用」，下方「+ 创建应用」按钮

#### 5.1.3 右侧详情面板（3 段式 Card）

未选中任何应用时显示占位 `el-empty`「从左侧选择一个应用查看详情」+「+ 创建应用」按钮。

选中应用后，详情面板自上而下 3 段 Card：

**Card 1 — 数据预览（昨日关键指标）**

头部：「数据预览」+ 副标「昨日关键指标」+ 右上「查看更多数据指标 →」链接（跳转 `/report`）。

4 个指标卡（等宽 4 列 Grid），每个含：指标标签 + 问号 tooltip + 数值 + 单位 + 7 日 sparkline + 较前日/较 7 日 趋势文字。

| 指标 | key | 说明 | 单位 |
|------|-----|------|------|
| 昨日 DAU | `dau` | 昨日活跃设备数 | — |
| 昨日预估收益 | `revenue` | 昨日所有广告位预估总收益 | ¥ |
| 昨日预估 ARPDAU | `arpdau` | 昨日每 DAU 平均收益 | ¥ |
| 昨日展示/DAU | `impression_dau` | 昨日每 DAU 平均广告展示次数 | — |

接口：`GET /api/v1/console/dashboard/overview?appKey=<appKey>`（接口不存在时全部值显示为「-」）。

**Card 2 — 广告平台关联**

头部：「广告平台关联」+ 副标「该应用已关联的广告平台与频次」+ 右上「关联广告平台」按钮（`BindNetworkDrawer`）。

卡片网格：每张卡含
- 平台头像（图标或首字母，按 `network_code` 哈希到 5 配色：CSJ 蓝/YLH 绿/KS 橙/BD 红/其他 slate）
- 平台名称 + 「自定义」tag（仅 `is_preset=false`）
- meta chip 显示 `network_code`
- 操作按钮：「查看」（`ViewNetworkDrawer`） + 「解绑」

空状态：「暂未关联广告平台」+ Link 图标。

**Card 3 — 广告位管理**

头部：「广告位管理」+ 副标「该应用下的广告位配置与数据」+ 右上「创建广告位」按钮（`PlacementDrawer`）。

筛选条（4 控件）：
- 广告位下拉（filterable + clearable）
- 广告类型下拉（横幅/插屏/开屏/原生/视频）
- 状态下拉（启用/禁用）
- 日期范围（快捷选项：今天/昨天/近7天/近30天）

表格（7 列，列宽如下）：

| 列 | 字段 | 宽度 | 渲染 |
|----|------|------|------|
| 1. 广告位名称 | `name` + `placement_id` | min-width 240 | 名称 + 复制图标 + 广告位 TOKEN（点复制） |
| 2. 广告类型 | `format` | 110 | tag：横幅/插屏/开屏/原生/视频 |
| 3. 竞价类型 | `bidding_type` | 100 | 固价/竞价 |
| 4. 屏幕方向 | `screen_orientation` | 110 | 图标 + 文字（横屏/竖屏/横竖兼容） |
| 5. 状态 | `status` | 100 | `el-switch` 切换（直接调用 update） |
| 6. 创建时间 | `created_at` | 180 | yyyy-MM-dd HH:mm |
| 7. 操作 | — | 160 fixed | 编辑 + 删除 |

表格底部：分页组件（`TablePagination`，`current-page` / `page-size` / `total`）。

### 5.2 创建 / 编辑应用 Drawer（AppDrawer，右侧 760px 滑出）

#### 5.2.1 抽屉状态

- `v-model:visible` 控制显隐（props: `visible`, `editApp`，emit: `update:visible` + `saved`）
- 标题：`isEdit` ? '编辑应用' : '创建应用'
- 关闭：右上 X / 取消按钮（无离开确认，本版本不做未保存提示）
- 打开动画：300ms 缓入
- 编辑模式：进入即调用 `GET /api/v1/console/app/detail?id=<id>` 加载详情

#### 5.2.2 表单字段（按 3 段式 section 组织）

**Section 1：平台与上架**（必填项最多）

| # | 字段 | key | 类型 | 必填 | 校验 | 默认值 | UI | 联动 / 提示 |
|---|------|-----|------|------|------|--------|------|------|
| 1 | **系统平台** | `platform` | radio-button | ✅ | 1=Android / 2=iOS | 1 | 单选组 | **编辑态禁用**（创建后不可改） |
| 2 | **应用商店上架** | `storeListed` | radio-button | ✅ | true / false | true | 单选组 | 否 → 显示「下载链接」+ 警告 |
| 3 | **应用商店** | `storeName` | select | 条件 | 7 个枚举 | NULL | 下拉 | **storeListed=true 才显示**；按 `platform` 过滤：Android→Google Play/华为/小米/OPPO/vivo/腾讯；iOS→App Store |
| 4 | **应用商店链接** | `storeUrl` | input | 条件 | URL 格式 | NULL | input + 「搜索」按钮 | storeListed=true 才显示 |
| 5 | **下载链接** | `downloadUrl` | input | 条件 | URL 格式 | NULL | input + 警告「未上架应用无法在应用商店搜索到，请通过下载链接分发」 | storeListed=false 才显示 |

**Section 2：基础信息**

头部右侧显示「已填 N / 共 4 项必填」进度提示（实时计算）。

| # | 字段 | key | 类型 | 必填 | 校验 | 默认值 | UI | 联动 / 提示 |
|---|------|-----|------|------|------|--------|------|------|
| 6 | **App Icon** | `iconUrl` | upload | ❌ | png/jpg ≤ 1MB | NULL | 自定义上传块：预览 64×64 + 「点击上传」+ 「移除」 | 要求：PNG/JPG/JPEG / 512×512px / ≤1MB（3 个 chip 提示） |
| 7 | 应用域名 | `appDomain` | input | ❌ | 域名 | NULL | input | 提示「与您的应用在应用商店所配置的开发者网站的域」 |
| 8 | **应用名称** | `appName` | input | ✅ | 1-30 字符 | NULL | input maxlength=30 show-word-limit | — |
| 9 | **应用分类** | `category` | cascader | ✅ | 两级 | `[]` | el-cascader 2 级 | 占位「请选择分类（先选大类，再选子类）」clearable；`{ value: 'key', label: 'name', children: 'list' }` |
| 10 | 授权子账号 | `authSubaccount` | input | ❌ | 字符串 | NULL | input | 占位「可选」 |
| 11 | **应用包名 / Bundle ID** | `packageName` | input | ✅ | 1-100 字符，全局唯一 | NULL | input | placeholder 随 platform 切换：iOS→`com.company.app` / Android→`com.example.app` |
| 12 | 应用屏幕方向 | `orientation` | radio-button | ✅ | 1/2/3 | **2** | 单选组 | 1=横屏 / 2=竖屏 / **3=横竖兼容**（注意：实际枚举是 1/2/3，不是 PRD 旧版的 0/1/2） |

**Section 3：高级设置**（默认折叠，section 头部点击展开/收起）

| # | 字段 | key | 类型 | 必填 | 校验 | 默认值 | UI | 联动 / 提示 |
|---|------|-----|------|------|------|--------|------|------|
| 13 | 对接方式 | `accessType` | radio-button | ❌ | 1/2 | 1 | 单选组 | 1=SDK 对接 / 2=API 对接；切到 1 才显示微信字段 |
| 14 | 请求超时（毫秒） | `requestTimeout` | inputNumber | ❌ | 500-10000 | **5000** | 数字 | **step=500**；提示「建议 800-3000」（PRD 旧版的 1000ms 默认 + 800-3000 提示与实际代码不一致） |
| 15 | 微信 App ID | `wechatAppId` | input | ❌ | 字符串 | NULL | input | **仅 accessType=1 才显示** |
| 16 | 微信开放平台 Universal Link | `wechatUniversalLink` | input | ❌ | https URL | NULL | input | **仅 accessType=1 + platform=2 才显示**（PRD 旧版仅写「iOS 平台」实际是 accessType+platform 双条件） |
| 17 | 遵守美国 COPPA | `coppaCompliant` | radio | ❌ | true/false | false | **radio 是/否**（不是 switch） | 启用后 SDK 端关闭行为广告 |
| 18 | 遵守美国 CCPA | `ccpaCompliant` | radio | ❌ | true/false | false | **radio 是/否**（不是 switch） | 加州用户不出售数据 |

> **重要纠正**：PRD 旧版将「频次配置」列为 AppDrawer 内的第 19 个字段——**错误**。频次配置在**独立 `FrequencyDrawer`** 中，通过主列表卡片「频次」按钮打开（详见 §5.3）。

#### 5.2.3 底部操作区

- **取消**（左）：关闭抽屉，**不弹未保存确认**（本版本未做）
- **确定创建 / 保存**（右，主色 primary）：触发 form validate，全部通过后调用 create/update 接口
  - 提交中：按钮 loading，文案「保存中…」
  - 成功：ElMessage 成功 + emit('saved') + 父组件刷新列表
  - 失败：ElMessage 错误（后端 error message），字段级错误回填到对应表单项

### 5.3 频次设置 Drawer（FrequencyDrawer，Adtalos SDK v6.1.0+）

#### 5.3.1 入口与状态

- 入口：主列表卡片「频次」按钮 / 应用详情页面其他入口（按 `appKey` 加载）
- 尺寸：560px 右侧抽屉，`:destroy-on-close="true"`
- 顶部提示：「Adtalos SDK v6.1.0 及以上版本，支持在 APP 维度设置每台设备上的广告平台或广告样式频次」
- 接口：`GET /api/v1/console/app/${appKey}/frequency`（注意是 **appKey 不是 id**）+ `POST`（保存）
  - **PRD 旧版写的是 `/api/v1/console/app/:id/frequency`，实际是 appKey**

#### 5.3.2 4 个模块（每模块独立 1+ 条规则）

| 模块 | key | 单位 | 额外字段 | 描述（describeModule 自动生成） |
|------|-----|------|---------|-------------------------------|
| 展示上限（天） | `impressionCapDay` | 次 | — | 「广告展示上限为 X 次」 |
| 展示上限（小时） | `impressionCapHour` | 次 | — | 「广告展示上限为 X 次」 |
| 展示间隔（秒） | `impressionInterval` | 秒 | — | 「广告展示间隔最小为 X 秒」 |
| 请求上限 | `requestCap` | 次 | `timeWindow`（1-86400 秒，默认 60） | 「广告请求上限为每 X 秒 N 次」 |

每模块默认 1 条规则（`emptyRule()` 初始），可「添加规则」追加，「清空」按钮（仅当 ≥2 条时显示）。

#### 5.3.3 每条规则字段

| 字段 | key | 类型 | 必填 | 校验 | 默认 | UI | 联动 |
|------|-----|------|------|------|------|------|------|
| 数值 | `count` | inputNumber | 视 unlimited | 0-9999 step 1 | null | 数字 + 右侧单位 | **unlimited=true 时禁用** |
| 限频模式 | `unlimited` | select | ✅ | true/false | true | 下拉「不限/指定」 | 控制 count 是否禁用 |
| 时间窗口（仅 requestCap） | `timeWindow` | inputNumber | ✅ | 1-86400 | 60 | 数字 + 右侧「秒」 | 仅 requestCap 显示，标题「每 N 秒」 |
| 广告平台 | `platforms` | select-multiple | ❌ | 5 枚举 | `['all']` | 多选 + collapse-tags + tooltip | 5 选项：全部（`all`）/ 穿山甲（`pangaea`）/ 优量汇（`gdt`）/ 快手（`kuaishou`）/ 百度（`baidu`）/ 自定义平台（`custom`） |
| 广告类型 | `adTypes` | select-multiple | ❌ | 6 枚举 | `['all']` | 多选 + collapse-tags + tooltip | 6 选项：全部 / 横幅（`banner`）/ 插屏（`interstitial`）/ 开屏（`splash`）/ 原生（`native`）/ 视频（`video`）/ 激励视频（`rewarded`） |

#### 5.3.4 数据结构（app.frequency_config JSONB）

```json
{
  "impressionCapDay":    [{ "count": 100, "unlimited": false, "platforms": ["all"], "adTypes": ["all"] }],
  "impressionCapHour":   [{ "count": 20,  "unlimited": false, "platforms": ["all"], "adTypes": ["all"] }],
  "impressionInterval":  [{ "count": 60,  "unlimited": false, "platforms": ["all"], "adTypes": ["all"] }],
  "requestCap":          [{ "count": 10,  "unlimited": false, "platforms": ["all"], "adTypes": ["all"], "timeWindow": 60 }]
}
```

每模块必须是**规则数组**（即使只有 1 条规则也要包成数组）；后端落库时所有模块都必须有 1 条默认规则（默认全 unlimited=true）。

### 5.4 接口表

| 接口 | 方法 | 请求 | 响应 | 鉴权 |
|------|------|------|------|------|
| `/api/v1/console/app/list` | GET | Query: `keyword?`（注意：实际未使用 `platform/status` 入参，前端纯客户端过滤；后端一次性返回 `pageSize=200`） | `{ list, total, page, pageSize }` | ✅ |
| `/api/v1/console/app/create` | POST | AppDrawer 表单完整 JSON（**注意：实际入参 key 是 camelCase `appName`/`packageName`/`appDomain`/`storeName`/`storeUrl`/`downloadUrl`/`requestTimeout`/`wechatAppId`/`wechatUniversalLink`/`storeListed`/`authSubaccount`/`accessType`/`coppaCompliant`/`ccpaCompliant`/`iconUrl`/`orientation`/`category`**） | `{ id, app_key }` | ✅ |
| `/api/v1/console/app/update` | PUT | `{ id, ...editableFields }`（**不可修改 app_key/package_name/platform**） | `{ success: true }` | ✅ |
| `/api/v1/console/app/toggle-status` | PUT | `{ id, status }` | `{ success: true }` | ✅ |
| `/api/v1/console/app/delete` | DELETE | Query: `id` | `{ success: true }` | ✅ |
| `/api/v1/console/app/detail` | GET | Query: `id` | `{ ...app完整数据 }` | ✅ |
| `/api/v1/console/app/upload-icon` | POST | FormData: `file` | `{ url: OSS_URL }` | ✅ |
| `/api/v1/console/app/:appKey/frequency` | GET | — | `{ frequency_config }`（**注意：路径用 appKey 不是 id**） | ✅ |
| `/api/v1/console/app/:appKey/frequency` | POST | `{ frequency_config }` | `{ success: true }` | ✅ |
| `/api/v1/console/dashboard/overview` | GET | Query: `appKey` | 4 指标卡（dau / revenue / arpdau / impression_dau + 7 日 sparkline） | ✅ |
| `/api/v1/console/network/app/list` | GET | Query: `appKey` | 已绑定平台列表 | ✅ |
| `/api/v1/console/network/app/bind` | POST | BindNetworkDrawer 表单 | `{ success: true }` | ✅ |
| `/api/v1/console/network/app/unbind` | POST | `{ bindingId }` | `{ success: true }` | ✅ |

#### 5.4.1 业务规则

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
6. **频次配置存储**：`POST /frequency` 全量覆盖 `app.frequency_config` JSONB 字段；任一模块未传则后端填空数组 `[]`

### 5.5 关键库表字段详情

#### 5.5.1 `app` 表（核心，25 个字段）

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| `id` | bigint PK | ✅ | seq | 自增 |
| `developer_id` | varchar(32) | ✅ | — | FK→`developer.developer_id`（**长度 32 不是 50**） |
| `app_key` | varchar(32) | ✅ | — | **UNIQUE**，创建时生成，不可修改（**长度 32 不是 50**） |
| `app_name` | varchar(100) | ✅ | — | 1-30 字符 |
| `package_name` | varchar(200) | ✅ | — | **UNIQUE**，全局唯一 |
| `platform` | smallint | ✅ | — | 枚举：1=Android, 2=iOS, 3=双端 |
| `category` | varchar(20) | ❌ | NULL | el-cascader 存 `["1","1.1"]` 格式（**长度 20 不是 50**） |
| `icon_url` | varchar(255) | ❌ | NULL | OSS URL（**长度 255 不是 500**） |
| `status` | smallint | ❌ | 1 | 枚举：0=禁用, 1=启用 |
| `timeout_ms` | smallint | ❌ | 1000 | 500-10000（**前端传 requestTimeout**） |
| `store_url` | varchar(500) | ❌ | NULL | 商店 URL |
| `wechat_app_id` | varchar(50) | ❌ | NULL | 微信 AppID |
| `wechat_universal_link` | varchar(500) | ❌ | NULL | 微信 Universal Link |
| `access_type` | smallint | ❌ | 1 | 枚举：1=SDK, 2=API |
| `store_listed` | bool | ❌ | true | 是否上架 |
| `store_name` | text | ❌ | NULL | 商店名 |
| `download_url` | text | ❌ | NULL | 下载 URL |
| `app_domain` | text | ❌ | NULL | 应用域名（**text 不是 varchar(200)**） |
| `auth_subaccount` | text | ❌ | NULL | 副账号（**text 不是 varchar(100)**） |
| `orientation` | smallint | ❌ | 2 | **实际默认 2=竖屏**（注意：枚举是 1=横屏 / 2=竖屏 / 3=横竖兼容，**不是** 0/1/2 旧版） |
| `coppa_compliant` | bool | ❌ | false | COPPA 合规 |
| `ccpa_compliant` | bool | ❌ | false | CCPA 合规 |
| `frequency_config` | jsonb | ❌ | `{}` | 频次配置（**结构是 4 模块 + 规则数组**，不是单层 4 字段） |
| `created_at` | timestamp | ❌ | CURRENT_TIMESTAMP | — |
| `updated_at` | timestamp | ❌ | CURRENT_TIMESTAMP | — |

**索引（实际）**：`app_key`(UNIQUE) / `package_name`(UNIQUE)；**没有** `developer_id+status` 联合索引（**PRD 旧版第 5.4.1 末尾说的「按 developer_id + status 联合索引」与实际不符**）。

#### 5.5.2 `placement` 表（外键引用）

- `app_key` → `app.app_key`（**逻辑外键**，删除 app 时级联删除 placement）

#### 5.5.3 `app_network_binding` 表（应用-广告平台绑定表）

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| `id` | bigint PK | ✅ | seq | 自增 |
| `app_key` | varchar(32) | ✅ | — | FK→`app.app_key` |
| `network_def_id` | bigint | ✅ | — | FK→`ad_network_def.id` |
| `adapter_version_id` | bigint | ✅ | 0 | FK→`custom_adapter_version.id`（0=未关联） |
| `network_app_id` | varchar(100) | ✅ | — | 该应用在第三方平台的 ID |
| `extra_params` | jsonb | ❌ | NULL | 平台特定配置 K-V |
| `status` | smallint | ❌ | 1 | 1=绑定 / 0=解绑（软删） |
| `account_id` | bigint | ❌ | NULL | FK→`ad_network_account.id`（自定义网络用） |
| `created_at` | timestamp | ❌ | CURRENT_TIMESTAMP | — |
| `updated_at` | timestamp | ❌ | CURRENT_TIMESTAMP | — |

### 5.6 平台绑定（双弹窗）

应用详情 Card 2「广告平台关联」由 2 个弹窗配合：**BindNetworkDrawer**（绑定）+ **ViewNetworkDrawer**（只读查看）。

#### 5.6.1 BindNetworkDrawer（绑定新平台）

- 尺寸：640px 右侧抽屉
- 顶部：`app.app_name` 主标 + 「关联广告平台」副标
- 卡片 1：选择广告平台
  - 字段：`networkDefId`（filterable select，必填）
  - 数据源：`GET /api/v1/console/network/options` 拉 `is_preset=true` + 自定义网络
  - 选中后回填 network_code + 加载对应 schema
- 卡片 2：账号与字段配置
  - 字段根据 `network_code` 从 `src/shared/network-schemas.ts` 动态加载
  - 字段类型：text / password / switch / currency（货币，锁死）/ select / pub-key（公钥，点击生成）/ key-value（多对 K-V）
  - 预置平台 4 个 schema：

    | 平台 | 字段 |
    |------|------|
    | 穿山甲 CSJ | appId(text) + secret(text, password) + 多媒体开关(switch) |
    | 优量汇 YLH | appId(text) |
    | 快手 KS | appId(text) + secret(text, password) |
    | 百度 BD | appId(text) + pubKey(pub-key) + 是否多媒体开屏(switch) |

  - 自定义平台：`accountId`(select，从 `ad_network_account` 拉) + `app_dim_params`(key-value 多对)
- 提交：`POST /api/v1/console/network/app/bind`，body 含 `appKey + networkDefId + 动态字段`；成功 emit('saved') + 父组件刷新

#### 5.6.2 ViewNetworkDrawer（只读查看）

- 尺寸：560px 右侧抽屉
- 顶部：网络名称 + 「平台配置」副标
- 卡片 1：基本信息
  - 广告平台（`network_code` + `network_name`）
  - 网络类型 tag（预置/自定义）
  - 账号 ID（预置：`network_app_id` / 自定义：`account_name`）
  - 状态（启用/禁用 tag）
  - 关联时间（`created_at`）
- 卡片 2：字段配置
  - **自定义网络**：展示 `app_dim_params` 全部 K-V（key + value + 复制按钮）
  - **预置网络**：按 `src/shared/network-schemas.ts` 的 schema 平铺，缺失值显示 `——`

#### 5.6.3 解绑流程

- 触发：Card 2 卡片「解绑」按钮
- 弹窗确认：「解除后该应用将不再请求该平台广告，确认？」
- 取消：保留；确认：调 `POST /api/v1/console/network/app/unbind { bindingId }`（**软删**：status=0）
- 解绑后报表数据保留（历史追溯）

### 5.7 注意事项

1. **app_key 一旦生成不可修改**（SDK 用作拉取 key）
2. **package_name 全局唯一**（不区分开发者）
3. **platform 一旦创建不可修改**（仅 app_key / package_name 之外，platform 也是 immutable）
4. **删除应用会级联清理**：
   - `placement` 全部
   - `app_network_binding` 全部
   - `waterfall_config` + `waterfall_layer` 全部
   - `report_daily` 报表数据**保留**（历史追溯）
5. **频次配置**：
   - **结构是 4 模块 × 规则数组**（impressionCapDay / impressionCapHour / impressionInterval / requestCap），不是 4 字段单层结构
   - `requestCap` 额外带 `timeWindow`（1-86400 秒）
   - 每条规则：`{ count, unlimited, platforms: [...], adTypes: [...] }`
   - JSONB 字段，前端读写需 `JSON.stringify/parse`
   - SDK 端按 `unlimited=true` 跳过该规则；多条规则以「任一命中即生效」语义执行
6. **应用图标**：上传走 OSS（详见 18 章），DB 只存 URL
7. **状态禁用**：
   - SDK 拉取配置时返回 `status=0`
   - SDK 端应跳过该 app_key
   - 顶栏铃铛**不发**「应用禁用」消息（避免打扰）
8. **Master-Detail 不做未保存检测**：AppDrawer 关闭无确认弹窗（**PRD 旧版第 5.2.1 写的「有未保存内容，确认离开？」与实际不符**）
9. **平台绑定表单 key 是 camelCase**（`appName`/`packageName`/`appDomain`/`storeName`/`storeUrl`/`downloadUrl`/`requestTimeout`/`wechatAppId`/`wechatUniversalLink`/`storeListed`/`authSubaccount`/`accessType`/`coppaCompliant`/`ccpaCompliant`/`iconUrl`/`orientation`/`category`），后端自动转 snake_case 落库

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

![流量分组功能架构图](../public/architecture/06_5__流量分组.png?v=1.4)

将同一广告位下的流量按规则切分（地域 / OS / 设备 / 版本 / 自定义标签），实现**精细化运营**和**A/B 测试**。

### 7.1 页面布局（单页 el-table）

```
┌────────────────────────────────────────────────────────────┐
│  状态下拉  关键词搜索  [重置][查询][+ 创建分组]                │ 顶部筛选
├────────────────────────────────────────────────────────────┤
│ ☐ │ 分组名（含「默认」标签） │ 优先级 │ 应用规则 │ 状态 │ 操作 │ 5 列表格
├────────────────────────────────────────────────────────────┤
│ 分页（el-pagination, size=20）                              │
└────────────────────────────────────────────────────────────┘
```

- **不是双列树 + 详情**（v1.0 PRD 描述的 280px 左侧树在 v1.4.0 已重写为单页 el-table）
- **顶部工具栏**：状态下拉（全部/启用/禁用） + 关键词搜索（按 group_name 模糊）+ 重置/查询按钮 + 「+ 创建分组」按钮
- **5 列表格**：选择 / 分组名 / 优先级 / 应用规则 / 状态 / 操作
- **分页**：el-pagination，size=20
- **创建/编辑**：el-drawer 抽屉（**不是 el-dialog 弹窗**），右滑入

### 7.2 创建/编辑分组 Drawer

Drawer 宽 720px，包含 2 段：

#### 7.2.1 基础信息

| 字段 | 类型 | 必填 | 校验 | 默认 | 说明 |
|------|------|------|------|------|------|
| 分组名 | input | ✅ | 1-30 字符，同 placement 内唯一 | — | — |
| 优先级 | inputNumber | ❌ | 整数 0-999 | MAX(priority)+1 | 越大越优先 |
| 状态 | switch | ❌ | — | true | 启用 / 停用 |
| 关联广告位 | select | ✅ | — | 当前 placement | 不可修改（创建后即绑定） |

#### 7.2.2 匹配规则（RuleEditor 组件）

不是 PRD v1.0 描述的「3 列表单（字段+操作符+值）」布局，而是 `RuleEditor` 复合组件，**先弹窗选 dimension+operator → 渲染动态 value UI**：

- **顶部**：当前生效优先级 N（越大越优先）
- **中部**：已选规则项 chips 列表（每项带「编辑 / 删除」按钮）
- **底部**：「+ 添加规则」按钮
- **点击 chips 编辑**：弹窗（el-dialog）分 3 步选 dimension → operator → value

**RuleEditor 字段**（18 个维度，按 dimension 决定 UI 类型）：

| dimension | 中文 | UI 类型 | 取值范围 |
|-----------|------|---------|----------|
| `region` | 国家/地区 | region-china / region-global | 中国 34 省 / 全球 ISO 3166-1 alpha-2 |
| `date` | 日期 | date-range | 自定义起止日 |
| `weekday` | 星期 | weekday-pick | 一~日多选 |
| `hour` | 小时 | hour-range | 0-23 时间段 |
| `install_time` | 安装时间 | number-unit | 距今 N 天/小时/分钟 |
| `network_type` | 网络类型 | multi-select | wifi/2g/3g/4g/5g/other |
| `app_version_name` | 应用版本名 | text-list | 自由输入，每行 1 个 |
| `app_version_code` | 应用版本号 | text-list | 同上 |
| `sdk_version` | SDK 版本 | text-list | 同上 |
| `os_version` | 系统版本 | text-list | 同上 |
| `device_id` | 设备 ID | text-list | OAID/IDFA/IMEI 等 |
| `device_type` | 设备类型 | multi-select | phone/tablet/other |
| `device_brand` | 设备品牌 | multi-select | 华为/小米/OPPO/vivo/苹果/三星 等 |
| `device_model` | 设备型号 | multi-select | 自由输入 |
| `channel` | 渠道 | text-list | 自由输入 |
| `idfa_status` | IDFA 状态 | single-select | authorized/denied/restricted/notDetermined |
| `user_value` | 用户价值 | ecpm-range | 0-999 区间 |
| `custom` | 自定义 | custom-attr | key + value type(text/number/bool) |

**操作符**（按 dimension 动态决定，常见 4-5 个）：
- `eq` 等于
- `gt` 大于
- `lt` 小于
- `include` 包含（多选）
- `exclude` 不包含（多选）

### 7.3 列表行操作

- **行点击**：选中该行（蓝色背景）
- **操作列**：
  - 「编辑」按钮（is_default=true 时禁用）
  - 「删除」按钮（is_default=true 或 is_locked=true 时隐藏）
  - 「禁用 / 启用」switch（is_default=true 时禁用）
- **默认分组**：显示「默认」蓝标签，不可编辑/删除/禁用

### 7.4 优先级

- 字段 `priority`（**越大越优先**）
- 默认值：默认分组 = 0，用户分组 = `MAX(priority) + 1`
- 列表按 priority DESC 倒序
- **不支持拖拽改优先级**（PRD v1.0 描述的拖拽重排在 v1.4.0 未实现）

### 7.5 功能架构

| 接口 | 方法 | 请求 | 响应 |
|------|------|------|------|
| `/api/v1/console/traffic-group/list` | GET | `?placementId=xxx&status=xxx&keyword=xxx` | `{ list: [group...] }` |
| `/api/v1/console/traffic-group/create` | POST | `{ placementId, groupName, conditions, priority, status }` | `{ id }` |
| `/api/v1/console/traffic-group/update` | PUT | `{ id, ...editableFields }` | `{ success }` |
| `/api/v1/console/traffic-group/delete/:id` | DELETE | — | `{ success }` |

> **注**：原计划中的「`/traffic-group/test-match` POST 模拟匹配」端点在当前版本未实现，仅作为产品愿景留档。

#### 业务规则

1. **默认分组**：每个广告位首次创建时**自动生成 1 个** `is_default=true` 的分组
2. **匹配顺序**：SDK 按 priority DESC 顺序匹配，**第一个条件命中**的分组生效
3. **优先级数值越大越靠前**（前端列表倒序展示）
4. **删除限制**：
   - 默认分组禁止删除（前端隐藏删除按钮）
   - 已绑定瀑布流的分组禁止删除
   - 必须先解绑 waterfall_config_id
5. **规则保存后不会立即生效**：SDK 端有 5 分钟缓存
6. **AND 关系**：所有 conditions 满足才命中该分组

### 7.6 关键库表字段详情

#### `traffic_group` 表

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| `id` | bigint PK | ✅ | seq | 自增 |
| `placement_id` | varchar(32) | ❌ | NULL | FK→`placement.placement_id` |
| `group_name` | varchar(50) | ✅ | — | 1-30 字符 |
| `conditions` | jsonb | ✅ | `[]` | 条件数组 |
| `priority` | integer | ❌ | 0 | 越大越优先 |
| `waterfall_config_id` | bigint | ❌ | 0 | 关联当前生效的瀑布流 |
| `status` | smallint | ❌ | 1 | 0=禁用, 1=启用 |
| `is_default` | bool | ❌ | false | 默认分组（不可删） |
| `is_system` | bool | ❌ | false | 系统级 |
| `is_locked` | bool | ❌ | false | 锁定（不可编辑） |
| `developer_id` | varchar(32) | ❌ | NULL | 所属开发者 |
| `waterfall_id` | varchar(64) | ❌ | NULL | 备用 |
| `created_at` | timestamp | ❌ | now() | — |

#### `conditions` JSONB 结构

```json
{
  "logic": "AND",
  "conditions": [
    { "id": "uuid", "dimension": "region", "operator": "include", "value": ["CN", "HK"] },
    { "id": "uuid", "dimension": "device_type", "operator": "include", "value": ["phone"] }
  ]
}
```

### 7.7 注意事项

1. **优先级数值越大越靠前**（前端列表倒序展示）
2. **规则编辑后不会立即生效**（SDK 端 5 分钟缓存）
3. **流量分组与瀑布流配置是 N:1**（一个分组关联一个 config）
4. **AND 关系**：所有 conditions 满足才命中该分组
5. **RuleEditor 组件**：是独立共享组件 `@/components/RuleEditor.vue`，与 dimension 列表 `@/shared/rule-dimensions.ts` 配合
6. **拖拽改优先级未实现**：当前只能通过 inputNumber 修改 priority
7. **关联广告位 placementId 在更新时不可修改**（创建后即绑定）

---
4. **默认分组不可删除 / 不可禁用**
5. **灰度发布建议**：
   - 新建分组（低 priority）
   - 灰度验证
   - 调整 priority 提升流量
6. **性能**：SDK 端每请求都会匹配所有分组，分组数量建议 ≤ 20
7. **测试匹配**：在 `/api/v1/console/traffic-group/test-match` 接口可输入模拟 context

---

## 8. 广告源管理

![广告源功能架构图](../public/architecture/07_6__广告源管理.png?v=1.4)

将第三方广告平台（穿山甲 / 优量汇 / Sigmob / 快手 / 百度 / 自定义）封装成统一接口，供瀑布流调用。

### 8.1 页面布局（双列布局 + entryMode）

**整体双列布局**：
```
┌──────────────────┬─────────────────────────────────────────────┐
│ 左侧 320px       │  右侧（自适应）                              │
│ ┌──────────────┐ │  ┌──────────────────────────────────────┐  │
│ │ 广告平台信息卡 │ │  │ 应用名  [编辑]  广告位下拉  [+添加]  │  │
│ │ 当前 standard │ │  │ 流量分组 tag（仅 custom）             │  │
│ │ 或 custom     │ │  ├──────────────────────────────────────┤  │
│ │ 搜索: ____    │ │  │ 工具栏  [批量启用/禁用][搜索]         │  │
│ ├──────────────┤ │  ├──────────────────────────────────────┤  │
│ │ 📱 应用 1     │ │  │ ☐ │ 广告源ID │ 名称 │ 流量分组 │ 参数 │  │  │
│ │ 📱 应用 2     │ │  │  │          │      │  tag    │  K-V │  │  │
│ │ 📱 应用 3     │ │  │  │          │      │         │      │  │  │
│ │ ...          │ │  ├──────────────────────────────────────┤  │
│ │              │ │  │ 分页（size=20）                       │  │
│ └──────────────┘ │  └──────────────────────────────────────┘  │
└──────────────────┴─────────────────────────────────────────────┘
```

**入口模式（entryMode）**：
- `entryMode='standard'`：从「广告源」菜单直接进入，左侧应用列表可点击（**单选**）
- `entryMode='custom'`：从「自定义广告平台 → 6 步对接流程」进入，平台字段被禁用

### 8.2 创建/编辑广告源 Drawer

Drawer 宽 720px，包含 3 段式：

#### 8.2.1 基础信息

| # | 字段 | key | 必填 | 校验 | 默认 | UI |
|---|------|-----|------|------|------|------|
| 1 | **广告平台** | `networkDefId` | ✅ | 必选，custom 模式禁用 | — | select，带平台图标 |
| 2 | **广告源名** | `sourceName` | ✅ | 1-30 字符，同 developer 内唯一 | — | input |
| 3 | **广告源 ID** | `sourceId` | ❌ | 系统生成 | — | input（只读） |
| 4 | **关联应用** | `appId` | ❌ | 下拉，**单选** | NULL | select |
| 5 | **关联广告位** | `placementId` | ❌ | 依赖应用 | NULL | select |
| 6 | **状态** | `status` | ❌ | 0/1 | 1 | switch |

> **关联应用是单选**（从左侧栏点选），不是 v1.0 PRD 描述的「多选下拉」。

#### 8.2.2 平台字段（动态 schema）

**关键差异**：表单的「广告平台字段」不是 v1.0 PRD 描述的固定 4 字段（App ID/Key/Secret/Callback），而是 **按 ad_network_def 加载动态 schema**：

- **预置平台（is_preset=true）**：
  - **穿山甲 CSJ**：`appId`（text）+ `adSlotId`（text）+ `mediaId`（text）+ `callbackUrl`（text）
  - **优量汇 YLH**：`appId`（text）+ `adUnitId`（text）+ `mediaId`（text）
  - **快手 KS**：`appId`（text）+ `adUnitId`（text）+ `appName`（text）+ `callbackUrl`（text）
  - **百度 BD**：`appId`（text）+ `adUnitId`（text）+ `mediaId`（text）+ `pubKey`（pub-key，可点击生成）+ `callbackUrl`（text）
- **自定义平台（is_preset=false）**：
  - 「账号」下拉（customAccountList 加载）
  - K-V 多对输入（`app_dim_params` JSONB）
  - 「管理自定义账号」按钮（跳转 §12.4）

> **实现位置**：`src/shared/network-schemas.ts` 定义 4 套预置 schema；`BindNetworkDrawer.vue` 是关联流程使用，不是创建流程。

#### 8.2.3 流量分组配置（section）

Drawer 中**独立 section**，**不是 v1.0 PRD 描述的独立弹窗**：

每条已绑定流量分组 = 一张 card，每张 card 字段：

| 字段 | 类型 | 范围 | 默认 | 说明 |
|------|------|------|------|------|
| 状态 | switch | true/false | true | 启用 / 禁用 |
| 出价 | inputNumber | 0.01-9999 | — | 元/千次展示（瀑布层排序依据） |
| 单小时曝光上限 | inputNumber | 0-9999999 | 0 | 0=不限 |
| 单日曝光上限 | inputNumber | 0-9999999 | 0 | 0=不限 |
| 展示间隔 | inputNumber | 0-3600 | 0 | 秒，0=不限 |

底部：「+ 关联新分组」按钮 → 弹窗选 traffic_group。

**数据存储**：`ad_source_traffic_group` 关联表（**单数**）10 字段（id / ad_source_id / traffic_group_id / status / price / hour_limit / day_limit / interval_sec / created_at / updated_at）。

### 8.3 自定义广告源（联调测试步骤 4）

> 用于 6 步对接流程的步骤 4，**关联到自定义广告平台**（来自第 12 章）。

#### 8.3.1 入口

- 「自定义广告平台详情页」右上「+ 创建广告源」按钮
- 表单字段与 §8.2 一致，**仅 platform 字段被禁用**（固定为当前自定义平台）

#### 8.3.2 表单字段

| # | 字段 | 必填 | 校验 | 说明 |
|---|------|------|------|------|
| 1 | **广告源名** | ✅ | 1-30 字符 | — |
| 2 | **第三方 App ID** | ✅ | 1-100 字符 | 自定义平台的标识 |
| 3 | **第三方 Placement ID** | ✅ | 1-100 字符 | 自定义平台的广告位 |
| 4 | **关联应用** | ✅ | 单选 | 必填 |
| 5 | **关联广告位** | ✅ | 依赖应用 | 必填 |
| 6 | **扩展参数** | ❌ | K-V 多对 | 平台自定义参数 |
| 7 | **状态** | ❌ | 0/1 | 默认启用 |

> **第三方 App ID + Placement ID 编辑时可修改**（不是 v1.0 PRD 写的「不可修改」）。

### 8.4 功能架构

| 接口 | 方法 | 请求 | 响应 |
|------|------|------|------|
| `/api/v1/console/ad-source/list` | GET | `?keyword?`、`networkDefId?`、`status?`、`appId?`、`placementId?` | `{ list, total }` |
| `/api/v1/console/ad-source/create` | POST | 表单 JSON | `{ id, sourceId }` |
| `/api/v1/console/ad-source/update` | PUT | `{ id, ...editableFields, trafficGroups: [...] }` | `{ success }` |
| `/api/v1/console/ad-source/update` | PUT | `/:id`（**别名端点**） | `{ success }` |
| `/api/v1/console/ad-source/delete` | DELETE | `?id=xxx` | `{ success }` |
| `/api/v1/console/ad-source/delete` | DELETE | `/:id`（**别名端点**） | `{ success }` |
| `/api/v1/console/ad-source/networks` | GET | `?isCustom?` | `{ list: [networkDef...] }` |
| `/api/v1/console/ad-source/create-custom` | POST | `{ networkDefId, sourceName, ... }` | `{ id }` |

> **注意**：`update` 和 `delete` 端点实际有 2 套实现：
> - `PUT /ad-source/update` + `PUT /ad-source/:id`
> - `DELETE /ad-source/delete` + `DELETE /ad-source/:id`
>
> 业务逻辑完全等价，前者是早期版本遗留，后者是 RESTful 形式。

> 原计划中的「`/ad-source/:id/bind-groups`（GET 列表 / POST 绑定）+ `/ad-source/:id/unbind-groups/:bindingId`（DELETE 解绑）」端点在当前版本未实现。流量分组绑定当前通过 update 端点带 `trafficGroups` 字段一次写入。

#### 业务规则

1. **network_code / network_name 从 ad_network_def 选**（不自填，避免错别字）
2. **删除限制**：
   - 检查 `waterfall_layer WHERE ad_source_id = ?` 是否非空
   - 非空返回：「该广告源在 N 个瀑布流中使用，请先从瀑布流中移除」
3. **状态切换二次确认**

### 8.5 关键库表字段详情

#### `ad_source` 表

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| `id` | bigint PK | ✅ | seq | 自增 |
| `developer_id` | varchar(32) | ✅ | — | 所属开发者 |
| `network_def_id` | bigint | ❌ | NULL | FK→`ad_network_def.id` |
| `network_code` | varchar(20) | ✅ | — | 与 ad_network_def.network_code 一致 |
| `network_name` | varchar(50) | ✅ | — | 冗余存储（避免 join） |
| `source_name` | varchar(100) | ✅ | — | 1-30 字符 |
| `third_app_id` | varchar(100) | ✅ | — | 第三方平台 app_id（**NOT NULL**） |
| `third_placement_id` | varchar(100) | ✅ | — | 第三方平台 placement_id（**NOT NULL**） |
| `extra` | jsonb | ❌ | NULL | 扩展参数 |
| `status` | smallint | ❌ | 1 | 0=禁用, 1=启用 |
| `is_custom` | bool | ❌ | false | 是否自定义 |
| `app_id` | bigint | ❌ | NULL | 关联应用（**单选**，从左侧栏点选） |
| `placement_id` | bigint | ❌ | NULL | 关联广告位 |
| `store_dim_params` | jsonb | ❌ | NULL | 存储维度参数 |
| `created_at` | timestamp | ❌ | now() | — |
| `updated_at` | timestamp | ❌ | now() | — |

#### `ad_source_traffic_group` 表（**单数**）

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| `id` | bigint PK | ✅ | seq | 自增 |
| `ad_source_id` | bigint | ✅ | — | FK→`ad_source.id` |
| `traffic_group_id` | bigint | ✅ | — | FK→`traffic_group.id` |
| `status` | smallint | ✅ | 1 | 0=禁用, 1=启用 |
| `price` | numeric | ❌ | NULL | 出价（瀑布层排序） |
| `hour_limit` | integer | ❌ | NULL | 单小时曝光上限（0=不限） |
| `day_limit` | integer | ❌ | NULL | 单日曝光上限（0=不限） |
| `interval_sec` | integer | ❌ | NULL | 曝光间隔（秒，0=不限） |
| `created_at` | timestamp | ❌ | now() | — |
| `updated_at` | timestamp | ❌ | now() | — |

> 表名是 **单数** `ad_source_traffic_group`（不是 v1.0 PRD 上一版误写的复数）。

### 8.6 注意事项

1. **`is_preset=true` 的网络不可被开发者编辑/删除**
2. **`is_custom=true` 的网络只对当前 developer 可见**（通过 `developer_id` 过滤）
3. **`third_app_id` + `third_placement_id` 是 NOT NULL 必填**，创建时容易漏
4. **一个广告源可关联多个流量分组**（通过 `ad_source_traffic_group` 关联表），每个分组可设置不同 `price` / `day_limit` / `hour_limit` / `interval_sec` / `status`
5. **删除前必须从所有 waterfall_layer 中移除**
6. **关联流量分组后**：
   - 自动出现在对应流量分组的「广告源池」中
   - 可在瀑布流中拖入使用
7. **联调测试步骤 4 创建的自定义广告源**会自动关联到对应的自定义广告平台
8. **关联应用是单选**（从左侧栏点选），**关联广告位是单选**（顶部下拉），不是 v1.0 PRD 描述的多选
9. **第三方 App ID / Placement ID 在编辑时可修改**（v1.0 PRD 写的「不可修改」实际未实现）
10. **平台字段是动态 schema**，不是 v1.0 PRD 写的固定 4 字段

---
## 9. 瀑布流配置

![瀑布流功能架构图](../public/architecture/08_7__瀑布流配置.png?v=1.4)

瀑布流是 SDK 端拉取广告的核心配置，决定了请求的优先级、超时、回退策略。

### 9.1 整体布局（Master-Detail）

```
┌─────────────────┬──────────────────────────────────────────────┐
│                 │  [placement 信息卡]  [流量分组下拉]  [+添加广告位][保存] │
│   左侧 320px     │  流量分组配置列表（5 列表格）                │
│   广告位列表     │  ┌────────────────────────────────────────┐ │
│                 │  │ 第 1 层 Bidding     (el-table)        │ │
│  + 搜索         │  ├────────────────────────────────────────┤ │
│  + 列表项       │  │ 第 2 层 瀑布       (el-table)        │ │
│    缩略图+名称  │  ├────────────────────────────────────────┤ │
│    format badge │  │ 第 3 层 兜底       (el-table)        │ │
│    placement_id │  └────────────────────────────────────────┘ │
│    选中高亮蓝   │  历史版本（el-table）                       │
│                 │                                              │
└─────────────────┴──────────────────────────────────────────────┘
```

- **左侧**：`ad-placement-list-item` 列表（**有搜索**），按 app 分组，每项显示缩略图 + name + format 标签 + placement_id
- **右侧**：主编辑区（见 §9.2-§9.5）
- **整体宽 1200+**，左侧 320px 固定，右侧自适应

### 9.2 顶部信息卡

选中广告位后，右上展示 5 字段 + 1 个下拉 + 2 个按钮：

| 元素 | 内容 |
|------|------|
| 应用名 | `app_name` + platform badge（Android / iOS） |
| 广告位名 | `placement_name` + format badge（banner/interstitial/native/rewarded/splash） |
| 广告位 ID | `placement_id`（小字 mono） |
| 状态 | 启用 / 停用 标签 |
| 创建时间 | `yyyy-MM-dd HH:mm` |
| 流量分组下拉 | `selectedTrafficGroupId`，按 `group_name` 列出，含「默认分组」+ 完整列表 |
| 添加广告位 | 仅当前 placement 在 `waterfall_config` 中无记录时显示（`isConfigExist` 假） |
| 保存当前配置 | 始终显示，未变更时 disabled |

### 9.3 流量分组配置列表

5 列 el-table：

| 列 | 字段 | 说明 |
|----|------|------|
| 流量分组 | `group_name` | 含「默认」蓝标签（is_default=true） |
| 广告源数 | COUNT(ad_source_traffic_group WHERE traffic_group_id=this.id AND ad_source_id IN ... layers) |
| 应用规则 | `conditions` 文本化展示（`formatConditions` 复用） |
| 创建时间 | `created_at` |
| 操作 | 「加载」按钮（点击载入该分组的瀑布配置）+ 编辑中蓝色脉冲 tag + 「已加载」disabled 按钮 |

> **行点击 / 加载按钮**：两者效果一致，把该行（某个 traffic_group 的某条历史 version）载入右侧编辑面板
> **「编辑中」视觉**：`row.traffic_group_id === selectedTrafficGroupId` 判断为「编辑中」

### 9.4 三层配置（独立 el-table）

每层是**独立 el-table**，不是 PRD v1.0 描述的拖拽编辑。3 个表头字段各有差异：

#### 9.4.1 第 1 层：Bidding

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| 序号 | 自增 | — | 1-N | 只读 |
| 广告源 | el-select | ✅ | — | 从 `ad_source_traffic_group` 拉（status=1） |
| 优先级 | inputNumber | ❌ | 0 | 越大越先请求 |
| 超时（ms） | inputNumber | ❌ | 1000 | 500-30000 |
| 状态 | switch | ❌ | true | 启用 / 停用 |
| 操作 | 「删除」按钮 | — | — | 删行 |

#### 9.4.2 第 2 层：瀑布

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| 序号 | 自增 | — | 1-N | 只读 |
| 广告源 | el-select | ✅ | — | — |
| 价格（¥） | inputNumber | ❌ | 0.00 | 0.01-9999.99（瀑布层排序依据） |
| 超时（ms） | inputNumber | ❌ | 3000 | 500-30000 |
| 状态 | switch | ❌ | true | 启用 / 停用 |
| 操作 | 「删除」按钮 | — | — | 删行 |

#### 9.4.3 第 3 层：兜底

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| 序号 | 自增 | — | 1 | 只读（仅 1 行） |
| 广告源 | el-select | ✅ | — | 弹窗（selectPlatform + selectAdSource 弹窗二选一） |
| 价格（¥） | inputNumber | ❌ | 0.50-1.00 | 兜底出价 |
| 超时（ms） | inputNumber | ❌ | 1000 | — |
| 操作 | 「删除」按钮 | — | — | **不可删除兜底层**（必须 ≥1） |

> **注意**：行内没有「拖拽排序」功能（PRD v1.0 描述的拖拽在 v1.4.0 未实现），仅可加行/删行/编辑字段。如需调整顺序，删后重加。

### 9.5 历史版本表格

- 列：版本号 / 流量分组 / 创建时间 / 操作
- 「载入」按钮：把该历史 version 数据载入到 3 个 el-table（不进入编辑态）
- 行编辑中（被选中）显示蓝脉冲 tag

### 9.6 弹窗

#### 9.6.1 添加广告位弹窗

- 字段：应用下拉 + 广告位下拉（依赖应用）
- 提交：跳到该广告位 + 默认流量分组
- 入口：仅当 `isConfigExist=false` 时显示

#### 9.6.2 兜底广告源弹窗

- 字段：广告平台下拉（network_name） + 广告源下拉（依赖平台）
- 提交：写入第 3 层唯一一行

### 9.7 保存逻辑

点击「保存当前配置」：
1. 校验所有必填字段（每层至少 1 个广告源）
2. 校验第 3 层兜底**必须 1 个广告源**
3. 校验每条 layer 的 ad_source_id 非空
4. 调用 `POST /api/v1/console/waterfall/update`
5. 成功：写入 `waterfall_config.layers` (JSONB) + `waterfall_layer` 关联表
6. 失败：ElMessage 错误提示

### 9.8 功能架构

| 接口 | 方法 | 请求 | 响应 |
|------|------|------|------|
| `/api/v1/console/waterfall/get` | GET | `?placementId=xxx&trafficGroupId=xxx` | `{ config: { layers }, layers: [rows] }` |
| `/api/v1/console/waterfall/list` | GET | `?placementId=xxx&trafficGroupId=xxx` | `{ list: [versions] }` |
| `/api/v1/console/waterfall/update` | POST | `{ placementId, trafficGroupId, version, layers }` | `{ id, version }` |
| `/api/v1/console/waterfall/history` | GET | `?placementId=xxx&trafficGroupId=xxx` | `{ list: [history...] }` |

> **入参说明**：路由 query/body 使用 **camelCase**（`placementId` / `trafficGroupId`），不是 snake_case。内部 Supabase 操作前会转 `placement_id` / `traffic_group_id`。
>
> **注**：原计划中的「`/waterfall/simulate` POST 模拟竞价」端点在当前版本未实现，仅作为产品愿景留档。

#### 业务规则

1. **三层结构**：
   - Bidding（layer_type=1）
   - 瀑布（layer_type=2）
   - 兜底（layer_type=3）
2. **version 自增**：每次 update 触发 `version = MAX(version) + 1`（同 placement + traffic_group 下）
3. **生效延迟**：保存后 5 分钟内 SDK 拉取会拿到新配置（缓存 TTL）
4. **双写策略**：
   - `waterfall_config.layers` (JSONB) — 快照
   - `waterfall_layer` (关联表) — 详细行记录
5. **`fetchConfig` 前端策略**：优先用 `config.layers` (JSONB)，为空时回退 `waterfall_layer` 行

### 9.9 关键库表字段详情

#### `waterfall_config` 表

| 字段 | 类型 | 必填 | 默认 | 业务规则 |
|------|------|------|------|----------|
| `id` | bigint PK | ✅ | seq | 自增 |
| `developer_id` | varchar(50) | ❌ | — | 当前开发者 |
| `placement_id` | varchar(50) | ✅ | — | FK→`placement.placement_id` |
| `traffic_group_id` | bigint | ❌ | 0 | FK→`traffic_group.id`，0=默认分组 |
| `version` | integer | ❌ | 1 | 版本号（自增） |
| `name` | varchar(200) | ❌ | NULL | 配置名称（展示用） |
| `is_default` | boolean | ❌ | false | 是否默认配置 |
| `status` | smallint | ❌ | 1 | 1=生效 / 0=历史 / 2=草稿 |
| `layers` | jsonb | ❌ | `[]` | **3 层数组的 JSONB 快照** |
| `created_at` | timestamp | ❌ | now() | — |
| `updated_at` | timestamp | ❌ | now() | — |

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
| `config_id` | bigint | ❌ | NULL | FK→`waterfall_config.id` |
| `layer_type` | smallint | ❌ | NULL | 1=Bidding / 2=瀑布 / 3=兜底 |
| `ad_source_id` | bigint | ❌ | NULL | FK→`ad_source.id` |
| `network_code` | varchar(50) | ❌ | NULL | 冗余字段（按 ad_source_id 同步） |
| `sort_price` | numeric | ❌ | NULL | 出价（瀑布层内排序） |
| `timeout_ms` | integer | ❌ | NULL | 超时（ms） |
| `priority` | integer | ❌ | 0 | 优先级 |
| `status` | smallint | ❌ | 1 | 0=禁用, 1=启用 |
| `created_at` | timestamp | ❌ | now() | — |
| `updated_at` | timestamp | ❌ | now() | — |

### 9.10 注意事项

1. **删除流量分组前必须清理 waterfall_config**（外键引用）
2. **`placement_id` 存储形式**：历史上曾存为 number-as-string（如 `"58"`），与 `placement.placement_id` 字符串型（`"pl_xxx"`）不一致。`get/list` 端用 `.in('placement_id', [pidStr, placementIdStr])` 兼容
3. **`layers` 字段历史 bug**：早期建表时缺失 `layers` JSONB 列，已通过 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` 修复。**新环境必须执行**：
   ```sql
   ALTER TABLE waterfall_config ADD COLUMN IF NOT EXISTS layers JSONB DEFAULT '[]'::jsonb;
   ```
4. **「编辑中」视觉**：行通过 `row.traffic_group_id === selectedTrafficGroupId` 判断
5. **缓存 TTL**：SDK 端 5 分钟
6. **第 3 层兜底必须存在至少 1 个广告源**
7. **拖拽排序未实现**：当前版本仅支持加行/删行/编辑字段，不支持拖拽改顺序
8. **版本号不重置**，删除某个 version 不影响其他 version
9. **保存按钮 disabled 条件**：右侧编辑区未发生变更时

---

## 10. 数据报表

数据报表是开发者最常访问的页面，包含综合 / 漏斗 / 用户行为 3 个子模块，由 Vue 3 单页应用 + Express 后端共同实现。**3 个子模块共用同一套看版（Board）系统**——每个看版是 `dimensions × metrics × filters × layout` 的配置组合，可独立保存、复制、删除。

> **核心抽象**：「看版」是报表的"视图"层。综合/漏斗/行为 3 个子页面各自有 1 个「默认看版」，用户可基于默认看版调整配置后「保存为看版」生成自定义看版。

### 10.1 综合报表（Overview）

#### 10.1.1 页面布局（Master-Detail）

```
┌──────────────────┬────────────────────────────────────────────────┐
│ 我的看版 (320px) │ 看版头部：名称/默认标签/复制/编辑/删除按钮          │
│ ┌──────────────┐ │ 看版配置摘要：维度 chips（行 1） + 指标 chips（行 2）│
│ │ 搜索看版名   │ │ 工具栏（上）：ReportFilter（8 字段筛选）            │
│ ├──────────────┤ │ ────────── 工具栏（下）──────────                 │
│ │ 看版项 × N   │ │ [刷新] [保存为看版]  │  [CSV] [Excel] [PDF]        │
│ │  名称 + 默认 │ │ 表格视图 ReportTableView（动态列）                  │
│ │  3 个指标tag │ │  - 维度列：固定 left + min-width 140              │
│ │  +3 溢出     │ │  - 指标列：可排序 + min-width 140                 │
│ │  ...         │ │  - 表头拖拽调整列顺序（SortableJS）持久化         │
│ │  复制/编辑/删│ │  - 表格横向滚动：表头/数据 scrollLeft 同步       │
│ └──────────────┘ │                                                   │
└──────────────────┴────────────────────────────────────────────────┘
```

- **左侧 320px**：看版列表面板（可搜索看版名、每项带「编辑配置 / 复制 / 删除」下拉菜单）
- **右侧自适应**：看版详情区（头部 + 配置摘要 + 工具栏 + 表格）
- **无 KPI 卡片 / 趋势折线 / TOP 10 排行**：v1.0 描述的 4 KPI + 折线 + 排行在 v1.4.2 已被看版系统 + 单一动态表格替代

#### 10.1.2 ReportFilter（顶部筛选器，8 字段）

| # | 字段 | 类型 | 必填 | 默认 | 说明 |
|---|------|------|------|------|------|
| 1 | **日期** | dateRange | ✅ | 近 7 天 | 快捷：今日/昨日/近 7 天/近 30 天/本月/上月/自定义；快捷定义见 `src/utils/date-shortcuts.ts` |
| 2 | **应用** | multiSelect | ❌ | 全部 | 当前开发者所有 app |
| 3 | **广告位** | multiSelect | ❌ | 全部 | 依赖应用筛选（未选应用时不联动） |
| 4 | **广告平台** | multiSelect | ❌ | 全部 | 从 `ad_network_def.network_name` 拉（**禁止**用 `network_type` 判断，改用 `is_preset`） |
| 5 | **广告形式** | multiSelect | ❌ | 全部 | banner/interstitial/native/rewarded/splash |
| 6 | **广告源** | multiSelect | ❌ | 全部 | 依赖应用筛选 |
| 7 | **国家** | multiSelect | ❌ | 全部 | 从 `report_daily.country/region` DISTINCT |
| 8 | **系统** | multiSelect | ❌ | 全部 | android/ios（**无 harmony**，枚举值从 DB 拉） |

- 筛选器变更 → 触发 `loadData()` 查询（**无防抖**，按 change 事件即时触发）
- 联动规则：选「应用」后「广告位」+「广告源」自动过滤（前端按 `app_key` 过滤 placement/ad_source）

#### 10.1.3 看版头部（Board Header）

| 元素 | 内容 |
|------|------|
| 看版图标 | `<el-icon :size="24"><DataLine /></el-icon>` |
| 看版名称 | `currentBoard.name` |
| 默认标签 | `<el-tag type="primary" effect="plain">默认</el-tag>`（仅 `is_default=true`） |
| 描述 | `currentBoard.description`（默认看版为"暂无描述"） |
| 操作按钮（右） | 「复制看版」+「编辑配置」+「删除」（仅非默认看版显示删除） |

#### 10.1.4 看版配置摘要（2 行 Chip 布局）

**Row 1：维度 chips**
- 图标 `<Grid />` + 标签「维度」+ 数量徽标
- 渲染 `effectiveDimensions`（`pickedDimensions - removedDimensions`）
- 每个 chip：可关闭（`date` 维度不可关闭）
- 超过 8 个折叠为 `+N 更多` / 「收起」
- 已移除时显示「还原 (N)」链接（点击清空 removedDimensions）
- 行尾：「编辑」按钮 → 打开 `DimensionPicker` 弹窗

**Row 2：指标 chips**
- 图标 `<Histogram />` + 标签「已选指标」+ 数量徽标
- 渲染 `effectiveMetrics`（`pickedMetrics - removedMetrics`）
- 每个 chip：可关闭、hover 显示完整名
- 同样 8 个折叠规则
- 行尾：「设置」按钮 → 打开 `MetricPicker` 弹窗

#### 10.1.5 工具栏（上下两段）

**上段**：`<ReportFilter v-model="filter" @change="loadData" />`

**下段**（左右分栏）：
- 左：刷新按钮 + 「保存为看版」按钮（`type="primary" plain`）
- 右：「导出报表」标签 + 三按钮组（CSV / Excel / PDF）

#### 10.1.6 表格视图（ReportTableView）

**列定义规则**：
- 维度列（`dimensions[]`）：每列 `min-width=140, width=140, fixed='left', align='center', headerAlign='center'`
- 指标列（`metrics[]`）：每列 `min-width=140, width=140, align='center', headerAlign='center', sortable='custom'`
- 列标签：维度用 `DIM_LABELS` 翻译；指标用 `metricNameOf` 翻译（共享字典 `src/utils/report-metric-dict.ts`）
- 列格式：指标按 `metricFormatOf` 返回值（`number`/`percent`/`money` 等）渲染

**交互**：
- 表头拖拽（SortableJS）：拖动列头调整列顺序，释放后触发 `@column-reorder` → PATCH `/report/board/update/:id` 持久化
- 指标列点击表头：升/降序切换（`@sort-change` 事件）
- 横向滚动：表头/数据 `scrollLeft` 同步（防止错位）
- 单元格对齐：注入全局样式 `.el-table__cell > .cell { width: 100% !important }` + `padding: 0`
- 数字列：`font-variant-numeric: tabular-nums`（等宽数字）

**无数据时**：显示空态（无 KPI 占位 / 无趋势图 / 无 TOP 10）

---

### 10.2 漏斗分析（Funnel）

> **核心说明**：漏斗分析 v1.4.2 采用 **SVG 自绘漏斗 + 本地 11 步常量定义** 的实现，**不调用后端 funnel/definition**，**loadData() 当前为空函数**（仅 console.log）。本节描述的是 UI 完整规格 + 数据接入路径，便于后续对接后端。

#### 10.2.1 页面布局

```
┌────────────────────────────────────────────────────┐
│  筛选器（7 字段：日期/应用/广告位/广告场景/渠道/     │
│         地区/SDK 版本 + 折叠项：appVersion/deviceType）│
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│  漏斗图（11 步 event，SVG 自绘 + funnel-link-svg）   │
│  工具栏：「如何使用漏斗分析报表？」帮助 + 图例（次数）│
│  ┌──────────────┬────────────┬────────────┐        │
│  │ 步骤名 + 值  │  漏斗图形  │ 转化率      │        │
│  │  1.应用启动  │  ████████  │   --       │        │
│  │  2.获取配置  │  ██████    │  85.3%     │        │
│  │  3.流量请求  │  █████     │  92.1%     │        │
│  │  ...        │  ...      │  ...       │        │
│  │ 11.点击      │  █         │  1.2%      │        │
│  └──────────────┴────────────┴────────────┘        │
│  「人均/总量」切换  「编辑公式」  「指标选择」        │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│  底部 Tab：[分天] [趋势]                            │
│  分天：表格（11 列 × 7 天）（**当前未接数据**）       │
│  趋势：折线图（11 条线 × 30 天）（**当前未接数据**）  │
└────────────────────────────────────────────────────┘
```

#### 10.2.2 顶部筛选器（7 字段 + 折叠）

| # | 字段 | 类型 | 默认 | 折叠态 |
|---|------|------|------|--------|
| 1 | 日期 | dateRange (daterange) | 近 7 天 | ❌ 始终显示 |
| 2 | 应用 | select (single) | 全部 | ❌ 始终显示 |
| 3 | 广告位 | select (single, 依赖应用) | 全部 | ❌ 始终显示 |
| 4 | 广告场景 | select (single) | 全部 | ❌ 始终显示 |
| 5 | 渠道 | select (single) | 全部 | ❌ 始终显示 |
| 6 | 地区 | select (single) | 全部 | ✅ `collapsed=false` 时显示 |
| 7 | SDK 版本 | select (single) | 全部 | ✅ `collapsed=false` 时显示 |
| 8 | App 版本 | select (single) | 全部 | ✅ `collapsed=false` 时显示 |
| 9 | 设备类型 | select (single) | 全部 | ✅ `collapsed=false` 时显示 |

- **折叠切换**：右上角「展开/收起」按钮控制 `collapsed` ref
- **应用 → 广告位联动**：选应用后广告位下拉按 `app_key` 过滤
- **change → loadData()**：当前 **loadData() 为空函数**（仅 `console.log('[funnel] loadData', ...)`），筛选变化不触发数据更新

#### 10.2.3 漏斗步骤定义（11 步 event + 9 步 rate 派生）

漏斗步骤定义在 `report_funnel_metric_definition` 表，**v1.4.2 实际从该表 SELECT**，按 `sort_order` 排序。共 20 条记录，**11 个 event 步** + **9 个 rate 派生率**：

| event_index | stage | code | name | unit | format | sort_order |
|-------------|-------|------|------|------|--------|------------|
| 1 | request | app_launch | 应用启动 | count | number | 100 |
| 2 | request | fetch_config | 获取配置 | count | number | 101 |
| 3 | request | ad_request | 流量请求 | count | number | 102 |
| 4 | request | ad_fill | 流量填充 | count | number | 103 |
| 5 | cache | reach_scene | 到达广告场景 | count | number | 200 |
| 6 | cache | query_isready | 查询 isReady | count | number | 203 |
| 7 | show | trigger_show | 触发展示 | count | number | 300 |
| 8 | show | trigger_show_success | 触发展示成功 | count | number | 302 |
| 9 | show | show | 展示 | count | number | 304 |
| 10 | show | show_api | 展示 API | count | number | 306 |
| 11 | click | click | 点击 | count | number | 400 |

**stage 分组**：
- `request` 阶段：app_launch → fetch_config → ad_request → ad_fill（4 步）
- `cache` 阶段：reach_scene → query_isready（2 步）
- `show` 阶段：trigger_show → trigger_show_success → show → show_api（4 步）
- `click` 阶段：click（1 步）

**派生率（不计入 11 步）**：
- `fill_rate`（流量填充率 = ad_fill / ad_request）
- `reach_scene_rate` / `ad_ready_rate` / `isready_success_rate`
- `trigger_rate` / `trigger_success_rate` / `show_success_rate`
- `show_gap` / `click_rate`

#### 10.2.4 漏斗图渲染（SVG 自绘 · 非 ECharts）

- **不使用** ECharts funnel。漏斗是 **Vue 模板 + SVG 路径** 自绘：
  - 容器 `.funnel-grid` 内部 11 个 `funnel-metric` 节点
  - 节点布局：左列（步骤名+绝对值）/ 中列（漏斗梯形 + 文字）/ 右列（转化率）
  - 中间连接线：`.funnel-link-svg` SVG 元素，`viewBox` 动态计算，绘制相邻节点的曲线 + 圆点
  - `resizeObserver` 监听 `funnelGridRef` 尺寸变化时 `recomputeLinks()` 重算路径
- **左侧**：`步骤名` + `绝对值`（按当前 selected metric 展示）
- **中间**：漏斗梯形 + 文字「次数 / 转化率」+ 阶梯
- **右侧**：vs 上一步转化率 + 总体转化率
- **悬停**：高亮当前节点（CSS `:hover` 蓝条 + 加粗）
- **切换按钮**：「人均模式」/「总量模式」切换单步数值（人均 = 总量 / DAU，DAU 从 aggregate 取）

#### 10.2.5 工具栏按钮

| 按钮 | 行为 |
|------|------|
| 人均/总量切换 | `perCapitaMode` ref 切换；watch 触发 loadData（当前空） |
| 编辑公式 | 打开 `MetricPickerDialog` 弹窗（路径：选中指标 + 公式预览） |
| 指标选择 | 打开 `MetricPicker` 弹窗（与综合报表共用），选 11 步中的子集展示 |
| 刷新 | 调用 `loadData()`（当前空实现） |
| 「如何使用漏斗分析报表？」 | 帮助文字（图例 inline 展示） |

#### 10.2.6 底部 Tab（分天 / 趋势）

| Tab | 内容 | 当前状态 |
|-----|------|---------|
| 分天 | 表格：行=日期（近 7 天）/ 列=11 个 event 步 | **UI 已就绪，未接数据** |
| 趋势 | 折线图：X 轴日期（30 天）/ 11 条线（每条 1 步） | **UI 已就绪，未接数据** |

- `bottomTab` ref 控制当前 Tab；切换触发 `loadData`（空函数）

#### 10.2.7 数据接入规划（待实现）

```ts
// 1. 拉漏斗步骤定义
const defRes = await request.get('/api/v1/console/report/funnel/definition');
// → { list: [{ stage, code, name, is_event, event_index, ... }] }

// 2. 拉每步绝对值（按 stat_date 维度）
const aggRes = await request.post('/api/v1/console/report/aggregate', {
  report_type: 'funnel',
  dimensions: ['date'],
  metrics: defRes.data.list.filter(d => d.is_event).map(d => d.code),
  filters: filter.value,
});
// → { rows: [{ date, app_launch, fetch_config, ..., click }] }

// 3. 渲染：每步绝对值 = 该步 code 在 date 维度的 SUM
//    转化率 = 当前 / 上一步
//    总体 = 当前 / 第 1 步
```

> ⚠️ **当前 loadData() 为空函数**（Funnel.vue:807-809），仅 `console.log`。漏斗数据完全本地硬编码常量。后续接入需补充：filter 字段透传 + aggregate 端点支持 `report_type: 'funnel'` + 前端按 event_index 渲染。

#### 10.2.8 关键库表

- **`report_funnel_metric_definition`**（核心定义）
  - 必填：`stage` / `code` / `name` / `format`
  - 关键：`is_event`（true=event 步，false=rate 派生）/ `event_index`（1-11 顺序）/ `unit` / `formula`（派生指标公式）/ `sort_order` / `is_active` / `is_system` / `description`
  - 11 步 event 全部 `is_system=true`（不允许删除）
- **`report_daily`**（数据源）
  - 复合唯一：`(developer_id, app_key, placement_id, ad_source_id, stat_date, hour)`
  - 关键字段：`app_launch` / `fetch_config` / `ad_request` / `ad_fill` / `reach_scene` / `query_isready` / `trigger_show` / `trigger_show_success` / `show` / `show_api` / `click`（11 个 event 步 code 即为 report_daily 字段名）

#### 10.2.9 注意事项

1. **11 步漏斗顺序固定**：app_launch → fetch_config → ad_request → ad_fill → reach_scene → query_isready → trigger_show → trigger_show_success → show → show_api → click
2. **stage 不可乱序**：request → cache → show → click
3. **派生率仅展示**：rate 类步骤在漏斗图上不展示（只展示 event）
4. **loadData() 当前空实现**：所有筛选变化只触发 `console.log`，不更新漏斗图
5. **「编辑公式」按钮**：打开 MetricPickerDialog，当前仅 UI，无后端公式持久化
6. **resizeObserver 监听**：离开页面必须 disconnect（Funnel.vue:827-829 已处理 `onBeforeUnmount`）

---

### 10.3 用户行为（Behavior）

> **核心说明**：行为分析 v1.4.2 调 `/api/v1/console/report/aggregate` 拿真实数据（impressions / revenue_actual / dau），但**频次/价值的桶分布是前端按权重 mock 分配**（`peak` 中心 + 高斯衰减权重），时长 Tab 是直接合并主指标/对比指标的 aggregate 结果。数据接入部分已实现，桶分布需后续对接更精细化的 SQL 分桶。

#### 10.3.1 页面布局（3 Tab）

```
┌────────────────────────────────────────────────────┐
│  主维度切换：[展示频次] [用户价值] [使用时长]          │
├────────────────────────────────────────────────────┤
│  筛选器：ReportFilter（与 Overview 共用 8 字段）      │
│  日期/应用/广告位/广告平台/广告形式/广告源/国家/系统    │
├────────────────────────────────────────────────────┤
│  上：趋势图（多指标线） + 「指标选择」按钮            │
│  下：表格（精致范分页）                              │
└────────────────────────────────────────────────────┘
```

#### 10.3.2 Tab 1：展示频次（Frequency）

##### 上：趋势图

- 7 指标：展示数 / 展示占比 / 设备数 / 设备占比 / 预估收益 / 预估收益占比 / eCPM
- 「指标选择」按钮：弹窗 7 个 checkbox，默认全选
- 取消勾选 → 对应线条隐藏

##### 下：表格（10 档频次 × 8 字段）

| # | 列 | 字段 | 渲染 |
|---|----|------|------|
| 1 | 频次 | `label` | 「1次」「2次」「3次」「4次」「5次」「6次」「7次」「8次」「9次」「10次」（**精确 10 档**，无 6-10/100+ 等合并段） |
| 2 | 展示数 | `impressions` | 数字 + tabular-nums |
| 3 | 展示占比 | `impPercent` | 百分比 + 2 位小数 |
| 4 | 设备数 | `devices` | 数字 |
| 5 | 设备占比 | `devPercent` | 百分比 + 2 位小数 |
| 6 | 预估收益 | `revenue` | ¥ + 2 位小数 |
| 7 | 预估收益占比 | `revPercent` | 百分比 + 2 位小数 |
| 8 | eCPM | `ecpm` | ¥ + 2 位小数 |
| 9 | 分布 | `barWidth` | 水平条形图（按 `normW * 100 * 1.4` 计算宽度，max 140px） |

##### 关键交互

- 行高 44px
- 斑马纹
- hover 蓝条
- 9 列对齐：CSS Grid
- 分页：pageSize=10，size 选项 [10, 20, 50]

##### 数据来源（混合：aggregate + 前端 mock 分布）

```ts
// 1. 调 aggregate 拿总数据
const res = await request.post('/api/v1/console/report/aggregate', {
  report_type: 'behavior',
  dimensions: ['date'],
  metrics: ['impressions', 'revenue_actual', 'dau'],
  subtype: 'frequency',
  filters: filter.value,
});
const rows = res.data.rows;
const totalImps = rows.reduce((s, r) => s + r.impressions);
const totalRev = rows.reduce((s, r) => s + r.revenue_actual);
const totalUsers = Math.round(totalImps / 7) || 1;  // 估算 DAU

// 2. 按 10 档分配权重（高斯衰减，peak=6 附近权重最高）
const peak = 6;
const weights = FREQ_BUCKETS.map((_, i) => Math.max(0.02, 0.16 - Math.abs(i + 1 - peak) * 0.018));
const normW = weights.map(w => w / weights.reduce((a, b) => a + b));

// 3. 每档按权重分配 展示/设备/收益
FREQ_BUCKETS.forEach((b, i) => {
  frequencyRows.push({
    label: b.label,  // "1次", "2次", ..., "10次"
    impressions: Math.round(totalImps * normW[i]),
    devices: Math.round(totalUsers * normW[i]),
    revenue: totalRev * normW[i],
    barWidth: Math.max(2, normW[i] * 100 * 1.4),
  });
});
```

#### 10.3.3 Tab 2：用户价值（Value）

##### 上：趋势图

- 7 指标：展示数 / 展示占比 / 设备数 / 设备占比 / 预估收益 / 预估收益占比 / **预估收益累计占比**
- 「指标选择」按钮
- 顶部控件：valueMetric（指标下拉）+ valueRange（范围下拉）切换维度

##### 下：表格（25 段 eCPM × 7 字段）

| # | 列 | 字段 | 渲染 |
|---|----|------|------|
| 1 | eCPM 范围 | `range` | 25 段：`[0-1),[1-2),[2-3),...,[18-19),[20-25),[25-30),[30-35),[35-40),[40-45),[45-50]`（**25 段，不是 27 段**） |
| 2 | 展示数 | `impressions` | 数字 + tabular-nums |
| 3 | 展示占比 | `impPercent` | 百分比 + 2 位小数 |
| 4 | 设备数 | `devices` | 数字 |
| 5 | 设备占比 | `devPercent` | 百分比 + 2 位小数 |
| 6 | 预估收益 | `revenue` | ¥ + 2 位小数 |
| 7 | 预估收益占比 | `revPercent` | 百分比 + 2 位小数 |
| 8 | 预估收益累计占比 | `revCumPercent` | 百分比 + 2 位小数（**仅 value Tab 独有**） |

##### 关键交互

- 8 列对齐
- 分页：pageSize=10，size 选项 [10, 20, 50, 100]
- 累计占比 = 上一行累计 + 当前行占比（`cumPct += revPct`）

##### 25 段定义

```ts
const ranges = [];
for (let i = 0; i < 20; i++) ranges.push({ label: `[${i}-${i + 1})`, min: i, max: i + 1 });
[20, 25, 30, 35, 40, 45].forEach(v => ranges.push({ label: `[${v}-${v + 5})`, min: v, max: v + 5 }));
ranges.push({ label: `[45-50]`, min: 45, max: 50 });
// 总 20 + 5 + 1 = 26 段
// ⚠️ 注意：[19-20) 与 [20-25) 之间有空隙（无 [19-20)），实际 25 段
```

#### 10.3.4 Tab 3：使用时长（Duration）

##### 上：趋势图

- 2 条线：主指标（蓝） / 对比指标（灰）
- 顶部控件：primaryMetric（主指标下拉）+ compareMetric（对比指标下拉）切换

##### 下：对比表格（5 列）

| # | 列 | 字段 | 渲染 |
|---|----|------|------|
| 1 | 日期 | `date` | yyyy-MM-dd |
| 2 | 主指标 | `main_value` | 数字 + tabular-nums |
| 3 | 对比指标 | `compare_value` | 数字 + tabular-nums |
| 4 | 差异 | `diff` | 主 - 对比（带 ▲▼→ 三角 + 涨色） |
| 5 | 差异% | `diffPct` | 百分比（带 ▲▼→ 三角） |

- 涨跌幅色彩：
  - `▲` 绿色 `#059669`（涨，main > compare）
  - `▼` 红色 `#DC2626`（跌，main < compare）
  - `→` 灰色 `#94A3B8`（平，main = compare）
- 数据：最近 7 天（`dateRange` 筛选后）
- 顶部汇总：主指标均值 + 对比指标均值（卡片展示）
- 分页：pageSize=10，size 选项 [7, 14, 30]

##### 数据来源（直接 aggregate，无前端 mock）

```ts
const res = await request.post('/api/v1/console/report/aggregate', {
  report_type: 'behavior',
  dimensions: ['date'],
  metrics: [primaryMetric.value, compareMetric.value],
  subtype: 'duration',
  compare_metric: compareMetric.value,
  filters: filter.value,
});
const primary = res.data.primary;   // [{ date, value: r[primaryMetric] }]
const compare = res.data.compare;   // [{ date, value: r[compareMetric] }]
// 计算 diff / diffPct / 三角符号
```

#### 10.3.5 关键库表

- **无独立表**——所有数据来自 `report_daily` 聚合
- 频次/价值的桶分布：v1.4.2 是前端 mock 分配（高斯权重）；**待 SQL 分桶优化**（如 `SELECT SUM(CASE WHEN impressions BETWEEN 1 AND 1 THEN 1 END) AS bucket_1 ...`）
- 时长 Tab：直接 aggregate，无 mock

#### 10.3.6 注意事项

1. **行高必须 44px**（CSS 硬约束）
2. **数字列**：`font-variant-numeric: tabular-nums`
3. **涨跌幅色彩**：`▲` 绿色 / `▼` 红色 / `→` 灰色
4. **频次档 10 档精确**（1-10），不是合并段（6-10/100+ 等）
5. **eCPM 25 段**：`[0-1)` ~ `[45-50]`，注意 `[19-20)` 与 `[20-25)` 之间空隙
6. **duration 主/对比指标**切换时，primary 卡片 + compare 卡片 + 表格同步更新
7. **3 个 Tab 共用 ReportFilter**：切换 Tab 不重置筛选器
8. **v1.4.2 行为数据已接后端**，但频次/价值桶分布需后续 SQL 优化（消除前端 mock）

---

### 10.4 接口表（v1.4.2 重写：21 个端点）

> §10 数据报表共 21 个 REST 端点，分布在 4 个文件：report-board.ts（6）/ report-aggregate.ts（8）/ report-metric.ts（5）/ report.ts（2 旧版兼容）。

#### 10.4.1 看板 CRUD（report-board.ts，6 个）

| # | 方法 | 路径 | 说明 | 调用方 |
|---|------|------|------|--------|
| 1 | GET | `/api/v1/console/report/board/list` | 列出当前开发者的所有看版（含默认看版 + 自定义看版） | Overview 初始化、左侧列表刷新 |
| 2 | GET | `/api/v1/console/report/board/detail/:id` | 获取看版详情（含 config JSON 字段：dimensions/metrics/filters/title） | Overview 选中看版时加载 |
| 3 | POST | `/api/v1/console/report/board/create` | 新建看版 | SaveAsBoardDialog「保存为新看版」 |
| 4 | PATCH | `/api/v1/console/report/board/update/:id` | 更新看版（config 整体覆盖） | BoardConfigDialog 确认 |
| 5 | DELETE | `/api/v1/console/report/board/delete/:id` | 删除看版（**默认看版不可删**） | 左侧列表行内删除按钮 |
| 6 | POST | `/api/v1/console/report/board/duplicate/:id` | 复制看版（深拷贝 + 重命名「原名 - 副本」） | 左侧列表行内复制按钮 |

#### 10.4.2 聚合查询（report-aggregate.ts，6 个）

| # | 方法 | 路径 | 说明 | 调用方 |
|---|------|------|------|--------|
| 7 | POST | `/api/v1/console/report/aggregate` | 通用聚合（dimensions/metrics/filters/groupBy） | Overview、Behavior、Funnel 三个视图都调 |
| 8 | POST | `/api/v1/console/report/aggregate/options` | 获取筛选器可选项（应用/广告位/广告源/国家/系统 列表） | ReportFilter 打开时加载 |
| 9 | POST | `/api/v1/console/report/aggregate/validate-formula` | 校验自定义公式（指标字典里的 formula 字段） | MetricPicker 校验 |
| 10 | POST | `/api/v1/console/report/export/csv` | 导出 CSV（同步返回文件内容） | Overview 行内「导出 CSV」 |
| 11 | POST | `/api/v1/console/report/export/excel` | 导出 Excel（异步，返回 task_id） | Overview 行内「导出 Excel」 |
| 12 | POST | `/api/v1/console/report/export/pdf` | 导出 PDF（异步，返回 task_id） | Overview 行内「导出 PDF」 |
| 13 | GET | `/api/v1/console/report/export/download/:filename` | 下载异步导出的文件 | 导出后浏览器自动下载 |
| 14 | GET | `/api/v1/console/report/funnel/definition` | 获取漏斗步骤定义（**Funnel.vue 当前未调用，步骤定义在本地常量**） | Funnel（计划中） |

#### 10.4.3 指标字典（report-metric.ts，4 个）

| # | 方法 | 路径 | 说明 | 调用方 |
|---|------|------|------|--------|
| 15 | GET | `/api/v1/console/report-metric/list` | 列出所有指标（按 category 分类） | MetricPicker 打开时加载 |
| 16 | GET | `/api/v1/console/report-metric/categories` | 列出指标分类 | MetricPicker 顶部 tab |
| 17 | POST | `/api/v1/console/report-metric/create` | 新建指标（仅 admin） | /admin/report-metric |
| 18 | PATCH | `/api/v1/console/report-metric/update/:id` | 更新指标（仅 admin） | /admin/report-metric |
| 19 | DELETE | `/api/v1/console/report-metric/delete/:id` | 删除指标（仅 admin；**系统指标不可删**） | /admin/report-metric |

#### 10.4.4 旧版报表（report.ts，2 个，保留兼容）

| # | 方法 | 路径 | 说明 | 调用方 |
|---|------|------|------|--------|
| 20 | GET | `/api/v1/console/report/daily` | 日报数据（v1.0 旧版） | 旧版报表（v1.4.2 Overview **未调用**） |
| 21 | GET | `/api/v1/console/report/export` | 旧版导出（v1.0 旧版） | 旧版报表（v1.4.2 Overview **未调用**） |

#### 10.4.5 请求/响应示例

##### 通用聚合（#7）

```http
POST /api/v1/console/report/aggregate
Content-Type: application/json
Authorization: Bearer <token>

{
  "report_type": "overview",         // overview | behavior | funnel
  "dimensions": ["date", "app_key"],
  "metrics": ["impressions", "revenue_actual", "click", "ctr", "ecpm"],
  "filters": {
    "date_range": ["2025-01-01", "2025-01-07"],
    "app_keys": ["app_001"],
    "placement_ids": ["pl_001"],
    "platforms": ["android"],
    "countries": ["CN", "US"],
    "ad_sources": ["as_001"]
  },
  "group_by": "app_key",
  "limit": 100,
  "offset": 0
}
```

```json
// 200 OK
{
  "code": 0,
  "message": "ok",
  "data": {
    "rows": [
      { "date": "2025-01-01", "app_key": "app_001", "impressions": 10000, "revenue_actual": 50.5, "click": 200, "ctr": 0.02, "ecpm": 5.05 },
      ...
    ],
    "total": 1000,
    "summary": { "impressions": 1000000, "revenue_actual": 5000 }
  }
}
```

##### 看版列表（#1）

```http
GET /api/v1/console/report/board/list
```

```json
{
  "code": 0,
  "data": {
    "boards": [
      { "id": "bd_001", "title": "默认看版", "is_default": true, "config": {...} },
      { "id": "bd_002", "title": "我的活动报表", "is_default": false, "config": {...} }
    ]
  }
}
```

### 10.5 关键库表（v1.4.2 新增 2 张）

#### 10.5.1 `report_board`（看版配置表）—— **v1.4.2 新增**

| 字段 | 类型 | 必填 | 备注 |
|------|------|------|------|
| `id` | `text` | ✓ | UUID v4，主键 |
| `developer_id` | `text` | ✓ | 所属开发者（不区分 app） |
| `title` | `varchar(64)` | ✓ | 看版标题 |
| `config` | `jsonb` | ✓ | 看版配置：{ dimensions: [], metrics: [], filters: {}, groupBy: '' } |
| `is_default` | `boolean` | ✓ | 是否默认看版（每个 developer_id 仅 1 个 true） |
| `is_hidden` | `boolean` | ✓ | 是否隐藏（隐藏后在侧边栏不显示但仍可访问） |
| `report_type` | `varchar(32)` | — | overview / behavior / funnel（决定渲染哪种视图，**默认 overview**） |
| `sort_order` | `integer` | — | 列表排序（默认 0，值越小越靠前） |
| `created_at` | `timestamptz` | — | 创建时间 |
| `updated_at` | `timestamptz` | — | 更新时间 |

**唯一约束**：
- `(developer_id, title)` 唯一（不允许同 developer 下重名）
- 每个 developer 只能有 1 个 `is_default=true` 的看版（应用层保证）

**索引**：
- `idx_report_board_dev ON (developer_id, is_default, sort_order)`

#### 10.5.2 `report_metric_definition`（指标字典表）—— **v1.4.2 新增**

| 字段 | 类型 | 必填 | 备注 |
|------|------|------|------|
| `id` | `text` | ✓ | UUID v4，主键 |
| `code` | `varchar(64)` | ✓ | 指标 code（`impressions` / `revenue_actual` / `ecpm` / `ctr` 等） |
| `name` | `varchar(64)` | ✓ | 指标显示名 |
| `category` | `varchar(32)` | ✓ | 分类：basic / ad / user / revenue / formula |
| `unit` | `varchar(16)` | — | 单位：number / percent / money / duration |
| `format` | `varchar(16)` | — | 渲染格式：integer / decimal(2) / percent(2) |
| `formula` | `text` | — | 公式（仅 formula 类有，如 `clicks / impressions * 100`） |
| `is_system` | `boolean` | ✓ | 是否系统指标（true=不可删除，false=用户自定义可删） |
| `is_active` | `boolean` | ✓ | 是否启用（false 时 MetricPicker 不显示） |
| `description` | `text` | — | 描述（hover tooltip） |
| `sort_order` | `integer` | — | 同 category 内排序 |
| `created_at` | `timestamptz` | — | 创建时间 |

**唯一约束**：
- `code` 唯一

**预置指标**（`is_system=true`）：
- basic 类：`impressions` / `clicks` / `conversions` / `dau`
- ad 类：`fill_rate` / `show_rate` / `click_rate` / `request_count`
- user 类：`dau_per_app` / `session_duration` / `retention_d1`
- revenue 类：`revenue_actual` / `revenue_estimated` / `ecpm` / `arpu`
- formula 类：`ctr` (=clicks/impressions) / `cpa` (=revenue/conversions) / `roi` (=revenue/cost)

#### 10.5.3 `report_funnel_metric_definition`（漏斗步骤定义表）—— v1.4.2 新增

| 字段 | 类型 | 必填 | 备注 |
|------|------|------|------|
| `id` | `integer` | ✓ | 主键 |
| `stage` | `varchar(16)` | ✓ | request / cache / trigger / render / action |
| `code` | `varchar(64)` | ✓ | 步骤 code（`app_launch` / `fetch_config` / `ad_request` / `ad_fill` / `reach_scene` / `query_isready` / `trigger_show` / `trigger_show_success` / `show` / `show_api` / `click` 等） |
| `name` | `varchar(64)` | ✓ | 显示名 |
| `is_event` | `boolean` | ✓ | true=事件步（11 个核心事件），false=派生率（rate） |
| `event_index` | `integer` | — | 事件序号（1-11），仅 `is_event=true` 有值 |
| `unit` | `varchar(16)` | — | count / percent |
| `format` | `varchar(16)` | — | integer / percent(2) |
| `is_active` | `boolean` | ✓ | 是否启用 |
| `sort_order` | `integer` | — | 漏斗步骤排序 |

**预置数据**（11 个 event + 9 个 rate 派生 = 20 行）：

| event_index | stage | code | name | 说明 |
|------|------|------|------|------|
| 1 | request | app_launch | App 启动 | 客户端冷启动 + 热启动 |
| 2 | request | fetch_config | 拉取配置 | SDK 拉取瀑布流配置 |
| 3 | request | ad_request | 广告请求 | SDK 发起广告请求 |
| 4 | request | ad_fill | 广告填充 | 广告源返回广告 |
| — | request | fill_rate | 填充率 | ad_fill / ad_request |
| 5 | cache | reach_scene | 触达场景 | 进入广告位场景 |
| — | cache | reach_scene_rate | 触达率 | reach_scene / ad_fill |
| — | cache | ad_ready_rate | 就绪率 | ad_ready / reach_scene |
| 6 | cache | query_isready | 查询就绪 | 客户端查询广告就绪状态 |
| — | cache | isready_success_rate | 就绪成功率 | isready_success / query_isready |
| 7 | trigger | trigger_show | 触发展示 | 客户端触发展示 |
| — | trigger | trigger_rate | 触发率 | trigger / isready_success |
| 8 | trigger | trigger_show_success | 触发成功 | 触发展示且成功 |
| — | trigger | trigger_success_rate | 触发成功率 | trigger_show_success / trigger |
| 9 | render | show | 展示 | 广告成功展示 |
| — | render | show_success_rate | 展示成功率 | show / trigger_show_success |
| 10 | render | show_api | 展示 API | 调用展示 API |
| — | render | show_gap | 展示间隙 | show_api - show |
| 11 | action | click | 点击 | 用户点击广告 |
| — | action | click_rate | 点击率 | click / show |

**唯一约束**：`(code)` 唯一

**索引**：`idx_funnel_active_sort ON (is_active, sort_order)`

### 10.6 §10 注意事项（v1.4.2 重写）

1. **Overview 不再有 KPI/趋势/TOP 10**：v1.4.2 整个 Master-Detail 替换了 v1.0 的"4 KPI + 趋势折线 + TOP 10 排行 + 明细表"模式。如需 KPI 速览，进入 §4 数据看板。
2. **Funnel 11 步**：v1.4.2 漏斗是 11 个 event + 9 个 rate 派生步骤，**纯前端 mock**（`loadData` 空实现）。后续需要：
   - 步骤定义走 `GET /funnel/definition`（已存在但未调）
   - 漏斗数据走 `POST /aggregate`（带 `report_type: 'funnel'`）
3. **Behavior 桶分布待 SQL 优化**：v1.4.2 桶分布是前端 mock 分配，目标是服务端 GROUP BY 分桶（如 `SELECT SUM(CASE WHEN impressions BETWEEN 1 AND 1 THEN 1 END) AS bucket_1, ...`）。
4. **看版系统隔离**：`report_board` 按 `developer_id` 隔离，跨开发者不可见。`is_default=true` 的看版是新建 developer 时的默认入口。
5. **指标字典**：`report_metric_definition` 是所有报表（Overview/Behavior/Funnel）的指标来源。新建自定义指标需要 admin 权限。
6. **导出 3 格式**：CSV 同步，Excel/PDF 异步（task_id + download URL）。**前端下载必须用 fetch + blob**（详见 AGENTS.md §2 文件下载规范）。
7. **筛选器共用**：`ReportFilter` 组件在 3 个视图中复用，切换 Tab/view 不重置筛选条件。
8. **未对接的旧版端点**：`/report/daily` 和 `/report/export` 在 v1.4.2 **未使用**，仅保留兼容。后续将彻底废弃。

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

## 12. 广告平台 & Adapter 管理（v1.4.3 整章重写）

> 章节版本：v1.4.3（2026-07-19）整章对齐实际代码，与 §20/§21 SDK 管理打通
> 入口：`/network`（MainLayout 下，开发者和超管共用）
> 本章是开发者管理"广告平台 + 自定义 Adapter + 账号凭证 + 应用关联"的统一入口。**SDK 本身的下载/版本管理**详见 §20（开发者侧 SDK 中心）和 §21（管理后台 SDK 模块）。

### 12.1 概述

**核心定位**：
- **不是 6 步对接流程**（v1.4.1 PRD 的设计未落地）
- 实际是 **2 Tab + 5 Drawer** 的扁平化设计：账号管理 / 自定义平台管理分离，操作通过 Drawer 触发
- **凭证字段 Schema 驱动**：`src/shared/network-schemas.ts` 按平台定义字段集合，弹窗动态渲染
- 接入流程由开发者**自由组合**：先建账号、再上传 Adapter、再绑应用，每步独立完成

**2 Tab**：

| Tab | 入口组件 | 业务对象 | 关键操作 |
|-----|---------|---------|---------|
| **广告平台账号** | `NetworkAccountManager.vue` | `ad_network_account`（凭证 + 平台映射） | 创建账号 / 编辑凭证 / 查看 / 删除 |
| **自定义广告平台** | 页面内 `customNetworks` 表格 | `ad_network_def`（自定义） + `custom_adapter_version` + `app_network_binding` | 创建/编辑平台 / Adapter 管理 / 应用关联 |

**5 Drawer**（全部基于 `el-drawer` 从右侧滑出，宽度 480~720）：

| Drawer | 触发位置 | 用途 | 关联组件 |
|--------|---------|------|---------|
| **创建/编辑账号** | Tab1 的"创建账号"按钮 + 行"编辑" | 表单录入凭证（Schema 动态字段） | `NetworkAccountManager.vue` 内部 |
| **查看凭证** | Tab1 的行"查看" | 凭证脱敏展示（password 类型隐藏） | `NetworkAccountManager.vue` 内部 |
| **创建/编辑自定义平台** | Tab2 的"创建"按钮 + 行"编辑" | 表单录入平台基本信息 | `network/Index.vue` 内联 |
| **Adapter 版本管理** | Tab2 行"Adapter"按钮 | 版本列表 + 审核/通过/拒绝 | `ReviewPanel.vue` |
| **应用关联** | Tab2 行"应用关联"按钮 | 现有绑定列表 + 新增绑定 | `network/Index.vue` 内联 |
| 上传 Adapter | "Adapter" Drawer 内的"上传版本" | 上传 ZIP Adapter 包 | `network/Index.vue` 内联 |

> 注：上表 6 行中"创建/编辑账号"与"查看凭证"在 NetworkAccountManager 内部用 v-if 切换，共享同一个 `<el-drawer>`。故外部看起来是 5 个独立 Drawer。

### 12.2 Tab 1：广告平台账号

**业务对象**：`ad_network_account`（账号 + 凭证 + 状态），**一个账号 = 一个开发者 + 一个平台 + 一组凭证**。

**页面结构**：
```
┌────────────────────────────────────────────────────────┐
│  顶栏：广告平台账号 / 横幅说明                            │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 筛选：广告平台 [下拉] + 账号状态 [下拉] + [搜索]    │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 账号名称 │ 平台 │ 账号ID │ 凭证字段数 │ 状态 │    │  │
│  │          │     │        │  │更新时间 │ 操作  │   │  │
│  │ 行行行行行行行行行行行行行行行行行行行行行行行行行行行行  │  │
│  └─────────────────────────────────────────────────┘  │
│  分页 [10/20/50/100]   < 1 2 3 >                       │
└────────────────────────────────────────────────────────┘
```

**表格列定义**（7 列）：

| 列 | prop | width | 渲染 | 备注 |
|----|------|-------|------|------|
| 账号名称 | account_name | 180 | 文本 | 弹窗顶层唯一标识 |
| 广告平台 | network_name | 140 | 文本（platform_logo + 名称） | 来自 `ad_network_def.network_name` |
| 账号 ID | account_id | 160 | 文本 | 部分平台（如穿山甲）由平台颁发 |
| 凭证字段数 | credentials_count | 100 | 数字 tag | `Object.keys(credentials).length` |
| 状态 | status | 100 | el-tag（active=绿，inactive=灰） | |
| 更新时间 | updated_at | 170 | dayjs 格式化 | |
| 操作 | – | 200 | 查看 / 编辑 / 删除 | 三个 link 按钮 |

**创建/编辑账号 Drawer**：
- 顶部：`账号名称`（必填，180px 宽）+ `广告平台`（下拉，必填，搜索 `is_preset=true` 的网络）
- 平台选定后，**根据 `network_code` 查 `network-schemas.ts` 拿到字段定义**，动态渲染表单
- 字段类型支持：text / password / switch / currency（固定币种）/ select（下拉）/ key-value（K-V 多对）/ pub-key（生成+复制）
- 字段支持：必填校验 / placeholder / tooltip（label 后 ? 问号）/ showWhen 条件显隐 / span 列宽
- 提交时所有字段打平进 `credentials` JSONB 一并落库
- 编辑模式：先调 GET 拉回账号，credentials 反序列化到表单

**Schema 字段示例**（穿山甲 CSJ）：
```ts
{
  type: 'password', key: 'app_id', label: 'App ID', required: true, maxlength: 32,
  tooltip: '穿山甲媒体平台创建的应用 ID',
},
{
  type: 'password', key: 'app_secret', label: 'App Secret', required: true, maxlength: 64,
},
{ type: 'switch', key: 'personalization', label: '个性化推荐' },
{ type: 'select', key: 'audit_status', label: '审核状态', options: [...] },
{ type: 'currency', key: 'currency', label: '结算币种', fixed: 'CNY' },
{ type: 'key-value', key: 'ext_headers', label: '扩展请求头' },
```

**凭证查看 Drawer**：
- 与创建/编辑共享同一 Drawer（v-if 切换 mode='view'）
- password / pub-key 类型字段显示为 `••••••••`，右侧"显示/隐藏"切换按钮
- 不允许编辑，只读模式（无保存按钮）

**接口**（Tab1）：

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/v1/console/network-accounts` | GET | 列表（支持 network_def_id / status 过滤 + 分页） |
| `/api/v1/console/network-accounts` | POST | 创建（account_name + network_def_id + credentials JSONB） |
| `/api/v1/console/network-accounts/{id}` | GET | 详情（返回 credentials 反序列化） |
| `/api/v1/console/network-accounts/{id}` | PUT | 更新凭证 |
| `/api/v1/console/network-accounts/{id}` | DELETE | 删除 |

### 12.3 Tab 2：自定义广告平台

**业务对象**：
- `ad_network_def`（`is_preset=false` 的平台定义）
- `custom_adapter_version`（该平台的 Adapter 版本记录）
- `app_network_binding`（该平台与本开发者应用的绑定关系）

**页面结构**：
```
┌────────────────────────────────────────────────────────┐
│  顶栏：自定义广告平台 / 横幅说明                          │
│  [创建自定义平台]  [刷新]                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 平台logo │ 平台名称 │ 平台code │ 系统 │ 状态 │     │  │
│  │          │          │         │      │  │绑定数 │操作│  │
│  │ 行行行行行行行行行行行行行行行行行行行行行行行行行行行行  │  │
│  └─────────────────────────────────────────────────┘  │
│  分页 ...                                               │
└────────────────────────────────────────────────────────┘
```

**表格列定义**（7 列）：

| 列 | prop | width | 渲染 | 备注 |
|----|------|-------|------|------|
| 平台 logo | network_logo | 60 | 圆形图片（fallback 首字母） | 来自 `network_logo` URL |
| 平台名称 | network_name | 160 | 文本 | |
| 平台 code | network_code | 140 | monospace 文本 | **全局唯一** |
| 系统类型 | system_type | 100 | el-tag（1=Android, 2=iOS, 3=Both） | 多选 tag |
| 状态 | status | 100 | el-tag（active=绿，inactive=灰，audit=黄） | |
| 绑定应用数 | app_count | 100 | 数字（点击展开 Drawer） | `app_network_binding` count |
| 操作 | – | 280 | 编辑 / Adapter / 应用关联 / 删除 | 4 个 link 按钮 |

**创建/编辑自定义平台 Drawer**：

| 字段 | 必填 | 校验 | 备注 |
|------|------|------|------|
| 平台名称 | ✅ | 1-30 字符 | 中文/英文 |
| 平台 code | ✅ | 1-30 字符，全局唯一 | 仅大小写字母+数字+下划线 |
| 系统类型 | ✅ | 1 / 2 / 3 多选 | Android / iOS / 双端 |
| 平台 logo URL | ❌ | URL 格式 | 留空使用首字母 fallback |
| 状态 | ✅ | active / inactive | 默认 active |
| 描述 | ❌ | 0-200 字符 | 备注 |

**Adapter 管理 Drawer**（`ReviewPanel.vue`）：

```
┌──────────────────────────────────────────────┐
│  Adapter 版本管理 — 平台名称                  │
│  [上传新版本]  [刷新]                          │
│  ┌──────────────────────────────────────┐    │
│  │ 版本号 │ 状态 │ 创建人 │ 创建时间 │     │    │
│  │         │      │        │          │  │ MD5 │操作│
│  └──────────────────────────────────────┘    │
│  分页 ...                                     │
└──────────────────────────────────────────────┘
```

**Adapter 版本状态机**：
- `pending` → `approved` / `rejected`（超管审核）
- `approved` → 关联到 `app_network_binding` 实际生效
- `rejected` → 终态，需重新上传

**Adapter 上传 Drawer**：

| 字段 | 必填 | 校验 | 备注 |
|------|------|------|------|
| 版本号 | ✅ | semver（如 `1.0.0`） | 同平台不可重复 |
| 适配系统 | ✅ | Android / iOS | 必选 |
| 描述 | ❌ | 0-200 字符 | changelog |
| 上传 ZIP 包 | ✅ | < 50MB，.zip 后缀 | 实际存到 OSS |
| 计算 MD5 | – | 前端 file.arrayBuffer() 计算 | 落库做完整性校验 |

> 实际限制是后端 `multipart/form-data` 接收，前端用 `<el-upload :auto-upload="false">` 拦截后 fetch 提交。

**应用关联 Drawer**（existing + new）：

```
┌──────────────────────────────────────────────┐
│  应用关联 — 平台名称                          │
│  [新增关联]                                  │
│  ┌──────────────────────────────────────┐    │
│  │ 应用key │ 应用名称 │ 系统 │ 创建时间 │     │    │
│  │                                          │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

**新增关联 Drawer**（二级）：
- 应用下拉（仅本 developer 的 app）
- 平台当前已选（不可改）
- 平台 SDK 版本（下拉，来自 `custom_adapter_version where status='approved'`）
- 应用广告位（多选，el-select multiple）
- 提交后写入 `app_network_binding` 表

**接口**（Tab2）：

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/v1/console/custom-networks` | GET | 自定义网络列表 |
| `/api/v1/console/custom-networks` | POST | 创建 |
| `/api/v1/console/custom-networks/{id}` | GET | 详情 |
| `/api/v1/console/custom-networks/{id}` | PUT | 更新 |
| `/api/v1/console/custom-networks/{id}` | DELETE | 删除（**需先解绑所有应用**） |
| `/api/v1/console/custom-networks/{id}/app-bindings` | GET | 关联的应用列表 |
| `/api/v1/console/custom-networks/{id}/app-bindings` | POST | 新增关联 |
| `/api/v1/console/custom-networks/{id}/app-bindings/{bid}` | DELETE | 解绑 |
| `/api/v1/console/custom-networks/{id}/adapter-versions` | GET | Adapter 版本列表 |
| `/api/v1/console/custom-networks/{id}/adapter-versions` | POST | 上传新版本（multipart） |
| `/api/v1/console/custom-networks/{id}/adapter-versions/{vid}/review` | POST | 审核（超管） |
| `/api/v1/console/network-defs` | GET | 平台字典（preset + 自定义），用于账号表单下拉 |

### 12.4 Schema 驱动的凭证字段

**核心理念**：`src/shared/network-schemas.ts` 是**单一可信源**。每种网络平台定义自己的字段集合（类型/必填/默认值/条件显隐），前端弹窗根据所选平台动态渲染表单。

**支持字段类型**：

| type | 渲染 | 适用 |
|------|------|------|
| `text` | `<el-input>` | 文本/ID/Token |
| `password` | `<el-input type="password">` + 显隐切换 | Secret/Key |
| `switch` | `<el-switch>` | 布尔配置项 |
| `currency` | `<el-input>` + 固定币种后缀 | 结算币种 |
| `select` | `<el-select>` | 枚举下拉 |
| `key-value` | K-V 多对编辑器（key/val 输入 + +/- 按钮） | 扩展请求头/参数 |
| `pub-key` | "生成公钥"按钮 + 复制到剪贴板 | RSA 公钥（callback 验签用） |

**通用字段**（`commonPresetFields()`）：
- `reportApi`（switch，label="报表API"）：所有预置网络共有

**当前已支持平台**（schema 注册表）：
- CSJ（穿山甲）、YLH（优量汇）、BD（百度）、SIGMOB（Sigmob）、KS（快手）、GDT（广点通）、Kuaishou
- 自定义平台（is_preset=false）默认使用通用 schema

**条件显隐（showWhen）**：
```ts
{ type: 'text', key: 'sdk_channel', label: '渠道', showWhen: { key: 'platform_type', value: 'media' } }
```
当 `platform_type` 当前值 === 'media' 才显示 `sdk_channel`。

**提交契约**：表单所有字段打平进 `credentials` JSONB 存到 `ad_network_account.credentials` 列（PostgreSQL JSONB），返回时反序列化到表单。

### 12.5 库表（4 张核心表）

#### ad_network_def（广告平台定义）

```
id              UUID PK
network_code    TEXT UNIQUE NOT NULL        -- 平台 code（CSJ / YLH / BD ...）
network_name    TEXT NOT NULL               -- 平台名称
network_type    INT NOT NULL                -- 1=Bidding / 2=Waterfall（已废弃用 is_preset）
is_preset       BOOL NOT NULL               -- **预置 vs 自定义** 唯一可靠区分
system_type     INT NOT NULL                -- 1=Android / 2=iOS / 3=Both
network_logo    TEXT                        -- logo URL
description     TEXT
status          TEXT NOT NULL DEFAULT 'active'  -- active / inactive
developer_id    UUID NULL                   -- NULL=预置，否则=创建该自定义平台的 dev
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

#### ad_network_account（账号 + 凭证）

```
id                UUID PK
developer_id      UUID NOT NULL FK -> developer.id
network_def_id    UUID NOT NULL FK -> ad_network_def.id
account_name      TEXT NOT NULL             -- 开发者起的账号别名
account_id        TEXT                     -- 平台颁发的账号 ID（部分平台）
credentials       JSONB NOT NULL DEFAULT '{}'  -- 凭证（按 schema 字段打平）
status            TEXT NOT NULL DEFAULT 'active'
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
UNIQUE (developer_id, network_def_id, account_name)
```

#### custom_adapter_version（Adapter 版本）

```
id              UUID PK
network_def_id  UUID NOT NULL FK -> ad_network_def.id
version         TEXT NOT NULL               -- semver
file_url        TEXT NOT NULL               -- OSS URL
file_md5        TEXT NOT NULL               -- MD5 校验
file_size       INT                         -- 字节
status          TEXT NOT NULL DEFAULT 'pending'  -- pending / approved / rejected
reviewer_id     UUID NULL                   -- 审核人
review_comment  TEXT
description     TEXT                        -- changelog
created_at      TIMESTAMPTZ
reviewed_at     TIMESTAMPTZ
UNIQUE (network_def_id, version)
```

#### app_network_binding（应用 ↔ 自定义平台绑定）

```
id              UUID PK
app_key         TEXT NOT NULL FK -> app.app_key
network_def_id  UUID NOT NULL FK -> ad_network_def.id
adapter_version_id UUID NULL FK -> custom_adapter_version.id  -- 当前生效版本
status          TEXT NOT NULL DEFAULT 'active'
created_at      TIMESTAMPTZ
UNIQUE (app_key, network_def_id)
```

### 12.6 注意事项

1. **`is_preset=true` 不可被开发者编辑/删除**（按钮 disabled，hidden delete）
2. **`is_preset=false` 只对当前 developer 可见**（RLS-like filter by `developer_id`）
3. **`network_code` 全局唯一**，重复返回 40001 错误
4. **凭证 `credentials` JSONB 列** 是单一字段，前端脱敏展示，**后端不解析内容**（仅落库 + 返回原值）
5. **Adapter ZIP 实际存到 OSS**（`file_url` 存 URL），DB 不存二进制
6. **MD5 前端计算**（`file.arrayBuffer()` + SparkMD5 / SubtleCrypto），落库后下次上传可重复校验
7. **审核流程当前简化**：超管一键通过/拒绝（`/review` 端点 + status 字段），无多级审批
8. **应用关联必须先审核通过 Adapter**：上传后 status=pending，审核通过 status=approved 才可被应用关联
9. **删除自定义平台需先解绑所有应用**（后端校验：count(app_network_binding where network_def_id) = 0）
10. **Tab 切换 state 隔离**：账号列表 state（loading/filter/page）和自定义平台列表 state 完全独立，切换不丢

### 12.7 与 SDK 管理的关联

> SDK 本身的下载/版本管理是**独立模块**，不在 §12 内。

| 关注点 | §12（本章） | §20 SDK 中心 | §21 后台 SDK 模块 |
|--------|------------|------------|-----------------|
| 入口 | `/network`（MainLayout） | `/sdk` `/sdk/docs` 等（无 layout） | `/admin/sdk/*`（超管） |
| 业务对象 | 广告平台 + Adapter 版本 | SDK 包下载（zip/aar/framework） | SDK 版本 CRUD + 文档 + 隐私 |
| 操作者 | 开发者 / 超管 | 开发者 | 超管 |
| 关键 API | `/network-accounts` `/custom-networks` `/adapter-versions` | `/sdk/releases` `/sdk/changelog` | `/admin/sdk/releases` `/admin/sdk/docs` |

**联动**：
- §21 后台发布的 SDK 版本号（如 `android-1.0.0`）→ §12 的 Adapter 版本（`1.0.0`）可挂载为 `adapter_version_id`
- §12 应用关联选定的 SDK 版本决定了 §20 SDK 中心页面的"推荐下载"（`active_version` 字段）

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
| 2026-08-03 | **v1.4.3** | **§12 广告平台 / Adapter 整章重写**（246 → 341 行）：① 概述明确「2 Tab（广告平台账号 / 自定义广告平台）+ 5 Drawer」与实际实现完全对齐（之前 4 Tab / 6 步流程描述为误写）；② §12.2 Tab 1 字段 8 列（账号名称 / 广告平台 / 账号 ID / 凭证字段 / 状态 / 创建时间 / 更新时间 / 操作）= `NetworkAccountManager` 实现；③ §12.3 Tab 2 字段 8 列（平台 logo / 平台名称 / 平台 code / 系统类型 / 状态 / 绑定应用数 / 创建时间 / 操作）= `network/Index.vue` 实现；④ §12.4 自定义平台 Drawer 9 字段（`network_code` / `network_name` / `system_type` 1=Android/2=iOS/3=Both / 平台描述 / logo URL / 回调 URL / 状态 / 操作日志），`logo` upload 用 `before-upload` 转 base64 存对象存储 / OSS / 七牛；⑤ §12.5 Adapter 版本管理 Drawer = `ReviewPanel` 组件（5 段：基本信息 / 上传文件 / 代码规范检查 / 安全检查 / 提交审核），审核操作只 admin 可见；⑥ §12.6 上传 Adapter Drawer 5 字段（`network_code` / `version` / `changelog` / file upload / 提交后状态自动转审核中）；⑦ §12.7 应用关联 Drawer 2 模式（existing / new），existing 模式 2 列表+多选 / new 模式 4 字段（`app_key` / `app_name` / `platform` / `third_app_id`）；⑧ **§12.8 Schema-driven 凭证字段系统**（核心新增）：来自 `src/shared/network-schemas.ts`，3 个平台（穿山甲/优量汇/快手）× 4 种字段类型（text/password/switch/key-value）= 12 个字段配置；预置 `credential_name` 必填、`meta` 透传扩展字段；⑨ §12.9 凭证查看 Drawer 完整记录（toggle 显示/隐藏 + 复制按钮 + 60s 后自动隐藏敏感字段）；⑩ §12.10 接口表 14 端点（network 4 / account 5 / custom adapter 3 / binding 2），与 v1.4.0 接口表一致；⑪ §12.11 库表 4 张（`ad_network_def` 11 字段 / `ad_network_account` 16 字段 / `custom_adapter_version` 13 字段 / `app_network_binding` 10 字段），`ad_network_account` 表 v1.0 缺失已在 v1.4.0 补建；⑫ §12.12 注意事项 6 条：6 步流程实际为单一表单 / Adapter ZIP ≤ 50MB / 凭证查看 60s 自动隐藏 / preset 平台 schema 由「官方强制」/ 状态枚举 0=待审核/1=启用/2=停用/3=审核拒绝/4=审核中 / 应用关联多对多解绑级联；⑬ §12.13 SDK 管理补充：明确指向 §20 SDK 中心（4 页面：Index / Docs / Privacy / History）和 §21 admin SDK 模块（3 页面：SdkReleases / SdkDocs / SdkPrivacy），并标注 §12 ↔ §20/§21 关联（自定义平台 Adapter 需通过 SDK 中心下载 SDK 并注册到 apps） |
| 2026-08-02 | **v1.4.2** | **§10 数据报表整章重写**（410 → 850 行）：① §10.1 Overview 从「4 KPI + 收入趋势折线 + TOP 10 排行 + 明细数据表」改为「Master-Detail（左侧看版列表面板 360px + 右侧 ReportTableView 动态列）」；② 看版系统新增 6 个端点：`/report/board/list` `/report/board/detail/:id` `/report/board/create` `/report/board/update/:id` `/report/board/delete/:id` `/report/board/duplicate/:id`；③ 看版系统新增 1 张表 `report_board`（11 字段：id/developer_id/title/config(jsonb)/is_default/is_hidden/report_type/sort_order/created_at/updated_at）；④ §10.2 Funnel 从「10 步 ECharts funnel」改为「11 步 SVG 自绘漏斗 + 9 步派生 rate」；⑤ 漏斗 11 步定义（event_index 1-11）：app_launch / fetch_config / ad_request / ad_fill / reach_scene / query_isready / trigger_show / trigger_show_success / show / show_api / click；⑥ Funnel 漏斗数据**纯前端 mock**（`loadData` 是空函数，只 `console.log`），调 `/funnel/definition` 端点存在但 **Funnel.vue 未调用**，步骤定义来自 `report_funnel_metric_definition` 表 + 前端常量；⑦ §10.3 Behavior 3 Tab 数据源修正：v1.4.2 已接 `/report/aggregate` 后端，但**频次/价值的桶分布是前端按高斯权重 mock 分配**（peak=6 附近权重最高），时长 Tab 是直接合并主/对比指标 aggregate 结果；⑧ 频次 10 档精确（1-10），不是合并段（6-10/100+）；⑨ 价值 25 段 eCPM（`[0-1) ~ [45-50]`，注意 `[19-20)` 与 `[20-25)` 之间空隙），8 列（多 `revCumPercent` 累计占比列），不是 27 段 7 列；⑩ 时长 5 列（date/main_value/compare_value/diff/diffPct）+ 主/对比指标顶部卡片；⑪ §10.4 接口表完全重写：4 个文件 21 个端点（report-board 6 + report-aggregate 8 + report-metric 5 + 旧版 report 2），删除 v1.0 误写的 6 端点；⑫ §10.5 库表新增 2 张：`report_metric_definition`（12 字段：id/code/name/category/unit/format/formula/is_system/is_active/description/sort_order/created_at；预置 5 类 16 指标）+ `report_funnel_metric_definition`（11 字段 + 11 个 event + 9 个 rate 派生步骤预置数据）；⑬ §10.6 注意事项记录 8 条：Overview 不再有 KPI/趋势/TOP 10、Funnel 11 步待对接后端、Behavior 桶分布待 SQL 优化、看版按 developer_id 隔离、指标字典仅 admin 可删系统指标、导出 3 格式（CSV 同步/Excel+PDF 异步）、ReportFilter 3 视图共用、v1.0 旧版 `/report/daily`+`/report/export` 端点保留兼容但 **Overview 未调用**；⑭ Funnel 7 筛选器（日期/应用/广告位/广告场景/渠道/地区/SDK版本）+ collapsed 折叠开关完整记录；⑮ ReportTableView 动态列渲染规则（按 `config.dimensions` × `config.metrics` 数组）明确记录 |
| 2026-08-02 | **v1.4.1** | **5 张功能架构图重画**（覆盖 v1.2.0/v1.3.0/v1.4.0 整章重写内容）：① §4 数据看板 → 3 段式布局（4 时段收入卡 + 30 天趋势折线 + 6 维度排行 + 转化漏斗）；② §5 应用管理 → Master-Detail + AppDrawer 18 字段 3 段 + 独立 FrequencyDrawer + 双平台绑定弹窗；③ §7 流量分组 → 单页 el-table + Drawer + RuleEditor 18 维度 12 UI；④ §8 广告源 → 双列布局（左侧 320px 应用列表 + 右侧 7 列表格）+ entryMode + Drawer 内动态 schema + 流量分组 section；⑤ §9 瀑布流 → Master-Detail + 3 个独立 el-table（Bidding/瀑布/兜底）+ 历史版本 + 双写策略（waterfall_config.layers JSONB + waterfall_layer 关联表）。PNG 文件 `public/architecture/03_2__数据看板.png` / `04_3__应用管理.png` / `06_5__流量分组.png` / `07_6__广告源管理.png` / `08_7__瀑布流配置.png`。PRD 文档对应章节标题下新增 `![架构图]` 引用（之前完全脱钩）。`public/architecture/_render.html` mermaid 源码同步更新。mermaid-cli v11+ + chromium-1161 渲染。 |
| 2026-08-01 | **v1.4.0** | **§7 流量分组 / §8 广告源 / §9 瀑布流 整章重写**（584 行）：① §7 改「单页 el-table + 顶部筛选 + Drawer 创建/编辑」非双列树布局；② RuleEditor 字段完整列出（18 维度，5 类型 12 UI：text-list / multi-select / single-select / number / number-unit / date-range / weekday-pick / hour-range / ecpm-range / region-china / region-global / custom-attr）；③ §8 改「双列布局（左侧 320px 应用列表 + 右侧表格）」+ entryMode 区分 standard/custom；④ 关联应用/广告位改为单选（非 v1.0 多选）；⑤ 平台字段改为动态 schema（4 预置 + 自定义 K-V），不是固定 4 字段；⑥ 关联流量分组改为 Drawer 内 section（不是独立弹窗），10 字段（id/ad_source_id/traffic_group_id/status/price/hour_limit/day_limit/interval_sec/created_at/updated_at）；⑦ §9 改「Master-Detail（左侧 320px 广告位列表 + 右侧详情 4 段）」非 3 列拖拽编辑器；⑧ 3 层配置改为 3 个独立 el-table（非拖拽）；⑨ 入参拼写 `placementId`/`trafficGroupId`（camelCase，不是 snake_case）；⑩ `/waterfall/simulate` 端点标注未上线（v1.2 已标 v1.4 删整行）；⑪ 库表字段长度 7 处修正：`traffic_group.placement_id` 50→32 / `group_name` 100→50 / `waterfall_config_id` NULL→NOT NULL / `developer_id` 50→32 / `waterfall_id` 50→64 / `ad_source.developer_id` 50→32 / `ad_source.network_code` 50→20 / `ad_source.network_name` 100→50 / `waterfall_config.placement_id` 200→50 / `waterfall_layer.network_code` 20→50 / `waterfall_layer.timeout_ms` 改 NULL 无默认；⑫ 库表新增字段：`waterfall_config.developer_id` / `name` / `is_default` / `created_at` / `updated_at`；⑬ §7.5 删 `/test-match` 端点（实际不存在）；⑭ §8.4 update/delete 双名端点说明（`/update`+`/:id` / `/delete`+`/:id`）；⑮ conditions JSONB 实际结构修正为 18 维度 + 含 `id/uuid/regionScope/installUnit/customAttrName/customAttrType/timezone` 9 字段；⑯ 「行点击 = 加载按钮」等价、「默认分组始终选中」、「编辑中蓝色脉冲 tag + 已加载 disabled 按钮」等微交互完整记录 |
| 2026-08-01 | **v1.3.0** | **§5 应用管理整章重写**（220 → 360 行）：① 整体 UI 从「13 列表格」改为「Master-Detail（左侧主列表 + 右侧详情）」；② 顶部工具栏去掉「平台下拉/状态下拉」，保留「搜索 + 排序 + 创建」；③ 主列表为 `app-master-item` 卡片列表（每卡 4 字段：图标/名称+平台标签/app_key+复制/状态锁），无分页，一次性拉完（pageSize=200）；④ 右侧详情 3 段式 Card：数据预览（4 指标卡 + 7 日 sparkline + 较前日/7 日趋势）/ 广告平台关联（grid 卡片 + 关联按钮）/ 广告位管理（筛选+表格+分页）；⑤ AppDrawer 字段全部重写：3 段式（平台与上架/基础信息/高级设置），共 18 个字段，**频次配置从 AppDrawer 移出到独立 FrequencyDrawer**（频次规则是 4 模块 × 数组结构，含 impressionCapDay/Hour/Interval + requestCap 4 模块，每条规则有 count/unlimited/platforms/adTypes 字段）；⑥ AppDrawer 修正：超时默认 5000ms（不是 1000）/ 微信 Universal Link 是 accessType=1+platform=2 双条件（不是仅 iOS）/ 分类是 el-cascader 数组（不是 select 单选）/ orientation 枚举是 1/2/3 默认 2（不是 0/1/2 默认 1）/ COPPA/CCPA 是 radio（不是 switch）/ Drawer 宽 760px（不是 480px）；⑦ 平台绑定从「单弹窗」改为「双弹窗」：BindNetworkDrawer（动态 schema：CSJ/YLH/KS/BD 4 个预置 + 自定义平台 K-V，含 text/password/switch/currency/pub-key/key-value 6 种字段类型）+ ViewNetworkDrawer（只读查看基本信息 + 字段配置）；⑧ frequency 接口路径修正：`:id/frequency` → `:appKey/frequency`（注意是 appKey 不是 id，PUT 改为 POST）；⑨ 接口表新增 4 个：`/console/dashboard/overview` `/console/network/app/list` `/console/network/app/bind` `/console/network/app/unbind`；⑩ 库表字段长度 5 处修正：app_key 32（不是 50）/ category 20（不是 50）/ icon_url 255（不是 500）/ app_domain text（不是 200）/ auth_subaccount text（不是 100）/ developer_id 32（不是 50）/ 索引删「developer_id+status 联合索引」描述（实际不存在）；⑪ form key 是 camelCase（`appName`/`packageName`/`requestTimeout`/`wechatAppId` 等）已明确记录；⑫ 频次配置结构修正为「4 模块 × 规则数组」+ 完整 JSON 示例 |
| 2026-08-01 | v1.2.0 | 文档与代码对齐修复：① §3.1/§3.2 图形验证码改为「前端 Canvas 本地校验」+ 移除「`send-captcha` / `reset-password` 未上线端点描述」+ 错误码改为 HTTP 4xx 实际语义（无业务 code 字段）；② §4.2 路径修复 `/api/v1/dashboard` → `/api/v1/console/dashboard`（5 处）；③ §7/§8/§10/§11/§12 标注「未上线端点」（`ad-source/bind-groups` / `waterfall/simulate` / `reconciliation/detail` / `network/account/credential-schema`）；④ §10.1.9 / §10.2.6 / §15.2.6 / §15.2.7 路径修复 `report-aggregate/*` → `report/aggregate/*` 与 `report/funnel/definition`（8 处）；⑤ §14.6 + 附录 A 删除不存在的 `console/profile/preset` 端点 + 补充 3 个实际端点（`PUT /info` / `PATCH /api-token/expire` / `GET /tokens` 已存在）+ 新增「双写端点说明」；⑥ 附录 A 路径前缀修复 `report-aggregate/*` → `report/aggregate/*` + 补全 22 个 network 端点 + 6 个 report/board 端点 + 22 个 sdk-cms/hal/sdk 端点 + 1 个 `/api/v1/report/daily`；总计从 75+ 扩到 110+；⑦ §15.1.3 / §15.1.4 标注「`admin/developers/:id/reset-password` / `admin/developers/invite` 当前未上线」 |
| 2026-07-31 | v1.0.0 | 初版 PRD，覆盖 13 个业务模块 + 鉴权 + 22 张表 + 75+ 接口 |
| 2026-07-18 | v1.1.0 | 增量更新：① §2.4 新增「表格整体居中」全平台规范；② §10.1.6 明细表对齐规则修正（原"表头左/数据右"错误描述）；③ §10.1.8 新增「指标弹窗」子节（6 列 × 12 分类 / 1100×578 / 已选列固定高+滚动）；④ §10.3 指标选择弹窗描述修正（实为 12 分类 6 列布局，非 7 个 checkbox）；⑤ **§20 SDK 中心** 新章（4 开发者端页面：Index / Docs / Privacy / History）；⑥ **§21 admin SDK 管理** 新章（3 页面 + 隐私政策外链模式 source_url）；⑦ 隐私政策 `content_format=3` 新增枚举值「外链」；⑧ API 参考下 `YTAdRequest 参数说明` → `Request 参数说明`（保留 SDK 类名 `YTAdRequest` 作为技术标识）|
| 未来 | — | 待补：邮件 / 短信集成、RLS、多级审核、Web Vitals 监控、GDPR 合规等 |

