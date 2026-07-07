# AGENTS.md — SDK聚合系统 项目规范

## 项目概览

广告SDK聚合平台管理后台，支持开发者管理应用、广告位、瀑布流配置、流量分组、数据报表，以及自定义广告网络的线上对接流程（Adapter上传/审核/版本管理/应用关联）。

## 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **Charts**: Recharts (CSR only)
- **Database**: Supabase (PostgreSQL) + Drizzle迁移
- **Auth**: JWT (jose库 + HttpOnly Cookie)

## 目录结构

```
├── public/                 # 静态资源
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── (auth)/         # 认证页面组（登录/注册）
│   │   ├── (console)/      # 控制台页面组（需认证）
│   │   └── api/            # API路由
│   │       └── v1/         # v1版本API
│   ├── components/         # 组件
│   │   ├── ui/             # shadcn/ui基础组件
│   │   └── shared/         # 业务公共组件
│   ├── hooks/              # 自定义Hooks
│   ├── lib/                # 工具库
│   │   ├── utils.ts        # 通用工具
│   │   ├── id-generator.ts # Token生成器
│   │   └── jwt.ts          # JWT工具
│   ├── stores/             # Zustand状态仓库
│   └── storage/database/   # Supabase数据库
│       ├── supabase-client.ts
│       └── shared/schema.ts
├── PLAN.md                 # 开发计划（基准文档）
├── DESIGN.md               # UI/UX设计规范
└── AGENTS.md               # 本文件
```

## 包管理规范

**仅允许使用 pnpm**，严禁 npm 或 yarn。

## 开发规范

### 编码规范

- TypeScript strict 模式，禁止隐式 any / as any
- 函数参数、返回值、事件对象必须标注类型
- 禁止引用未声明标识符
- 字段名统一 snake_case（Supabase要求）

### Hydration问题防范

- 严禁JSX中直接使用 typeof window / Date.now() / Math.random()
- 动态内容必须 'use client' + useEffect + useState
- 图表组件（Recharts）必须 'use client'
- 严禁非法HTML嵌套（如 p 嵌套 div）

### next.config配置

- 路径不写死绝对路径，使用 path.resolve / import.meta.dirname / process.cwd()

### UI设计规范

- 严格遵循 DESIGN.md 中的配色、字号、间距、圆角、阴影、组件规范
- 页面底色 #F8FAFC，侧边栏蓝渐变 #1E3A8A→#1E40AF
- 图标使用 Lucide React，禁止 Emoji
- 状态标签配色见 DESIGN.md 状态标签配色表

### 数据库规范

- 所有表操作使用 Supabase SDK（client.from()），不用 Drizzle ORM 语法
- 每次调用检查 { data, error }，error 必须 throw
- .delete() / .update() 必须带 filter
- 字段名 snake_case

## 开发流程

1. 每次开发前读取 PLAN.md，确认当前阶段待办
2. 严格按 DESIGN.md 的UI/UX规范实现界面
3. 完成后更新 PLAN.md 对应步骤状态为 ✅
4. 如发现偏差，记录到 PLAN.md 偏差记录表
5. 交付前通过 test_run 执行静态检查 + API冒烟测试
