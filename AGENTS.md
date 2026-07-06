# 广告SDK聚合平台 - AGENTS.md

## 项目概览

广告SDK聚合平台管理控制台，面向开发者提供应用管理、广告位配置、瀑布流策略、流量分组、数据看板、对账管理等功能。

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite + Element Plus + ECharts + Vue Router + Pinia
- **后端**: Node.js + Express + TypeScript + Supabase Client (PostgREST)
- **数据库**: PostgreSQL (via Supabase, RLS 已禁用)
- **认证**: JWT (7天有效期, HS256)
- **密码**: bcryptjs 加密

## 目录结构

```
├── server/                      # 后端
│   ├── server.ts                # Express 入口 + Vite 中间件
│   ├── vite.ts                  # Vite 开发中间件（仅处理非 /api 请求）
│   ├── db.ts                    # Supabase 客户端封装
│   ├── middleware/
│   │   └── auth.ts              # JWT 认证中间件
│   ├── routes/
│   │   ├── index.ts             # 路由注册汇总
│   │   ├── auth.ts              # 注册/登录/登出/个人信息
│   │   ├── app.ts               # 应用 CRUD
│   │   ├── placement.ts         # 广告位 CRUD
│   │   ├── ad-source.ts         # 广告源 CRUD
│   │   ├── waterfall.ts         # 瀑布流配置
│   │   ├── traffic-group.ts     # 流量分组
│   │   ├── sdk.ts               # SDK 配置下发
│   │   ├── report.ts            # 数据上报 + 日报表查询
│   │   ├── dashboard.ts         # Dashboard 指标/图表
│   │   ├── reconciliation.ts    # 对账管理
│   │   ├── message.ts           # 消息中心
│   │   ├── network.ts           # 自定义广告网络
│   │   └── profile.ts           # 个人中心/API Token
│   └── utils/
│       ├── id-generator.ts      # Base62 Token 生成器 (dev_/app_/pl_/api_)
│       ├── response.ts          # 统一响应封装
│       └── supabase-client.ts   # Supabase 客户端初始化
├── src/                         # 前端
│   ├── main.ts                  # Vue 入口
│   ├── App.vue                  # 根组件
│   ├── index.css                # 全局样式 + Element Plus 主题覆盖
│   ├── router/index.ts          # 路由配置
│   ├── stores/user.ts           # 用户状态管理 (Pinia)
│   ├── utils/request.ts         # Axios 封装 (Token 拦截器)
│   ├── layout/
│   │   └── MainLayout.vue       # 主布局 (侧边栏+顶栏)
│   └── views/
│       ├── auth/                # 登录/注册
│       ├── dashboard/           # 数据看板
│       ├── app/                 # 应用管理
│       ├── placement/           # 广告位管理
│       ├── ad-source/           # 广告源管理
│       ├── waterfall/           # 瀑布流配置
│       ├── traffic-group/       # 流量分组
│       ├── report/              # 日报表
│       ├── reconciliation/      # 对账管理
│       ├── message/             # 消息中心
│       ├── profile/             # 个人中心
│       └── network/             # 自定义网络
├── scripts/                     # 构建与启动脚本
├── index.html                   # 入口 HTML
├── DESIGN.md                    # UI/UX 设计规范
└── package.json
```

## 构建和测试命令

```bash
pnpm install          # 安装依赖
pnpm run dev          # 启动开发服务器 (coze dev)
pnpm run build        # 构建生产版本
pnpm run start        # 启动生产服务
pnpm ts-check         # TypeScript 类型检查
pnpm lint             # ESLint 检查
```

## API 路由前缀

| 前缀 | 用途 |
|------|------|
| `/api/health` | 健康检查 |
| `/api/v1/auth` | 认证（无需Token） |
| `/api/v1/console/*` | 管理后台（需JWT） |
| `/api/v1/sdk/config` | SDK配置下发（app_key鉴权） |
| `/api/v1/report` | 数据上报（Body含三级Token） |

## 数据库关键约束

- 所有 13 张表的 RLS 已禁用
- `developer_id`, `app_key`, `placement_id` 为唯一索引
- Token 格式: `dev_`/`app_`/`pl_` + 16位Base62, `api_` + 32位Base62
- Supabase PostgREST 存在最终一致性，写后立即读需加重试逻辑

## 编码规范

- TypeScript strict 模式，禁止隐式 any
- Supabase 查询结果需类型断言（`.maybeSingle()` 返回 untyped）
- 统一使用 `success(res, data)` / `fail(res, code, msg)` 封装响应
- 认证中间件: `authMiddleware`，从 JWT 解析 `developerId`
- `getDeveloper(req)` 辅助函数从 req 获取当前开发者信息
- 前端 API 调用统一通过 `src/utils/request.ts` 封装的 axios 实例

## 设计规范

详见 `DESIGN.md`，核心约束：
- 强制配色白名单（6组合法搭配）
- 6档字号枚举绑定
- 6档间距系统
- Element Plus CSS 变量覆盖
- 3种标准页面模板（列表/详情/表单）
