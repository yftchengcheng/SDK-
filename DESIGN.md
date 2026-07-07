# DESIGN.md - 新义SDK聚合系统

## 气质与意象

B2B 企业级广告数据管理控制台。沉稳、专业、精准。蓝+灰+白的主色调，信息密度高但不拥挤。

## 配色体系

### 主色系（蓝）

| Token | 色值 | 用途 |
|-------|------|------|
| --color-primary-950 | #172554 | — |
| --color-primary-900 | #1E3A8A | 侧边栏渐变终点 / Primary active |
| --color-primary-800 | #1E40AF | 品牌主色 / Primary 按钮 |
| --color-primary-700 | #1D4ED8 | Primary hover |
| --color-primary-600 | #2563EB | CTA / 活跃态 / 链接 / 选中态 |
| --color-primary-500 | #3B82F6 | 次要强调 / 图标 |
| --color-primary-400 | #60A5FA | — |
| --color-primary-300 | #93C5FD | — |
| --color-primary-200 | #BFDBFE | Plain 按钮边框 |
| --color-primary-100 | #DBEAFE | — |
| --color-primary-50 | #EFF6FF | 浅底 / Hover 背景 |

### 中性灰色系（Slate）

| Token | 色值 | 用途 |
|-------|------|------|
| --color-slate-900 | #0F172A | 标题 / 正文主色 |
| --color-slate-800 | #1E293B | 区块标题 |
| --color-slate-700 | #334155 | 表头文字 / Label |
| --color-slate-600 | #475569 | 常规文字 / Default 按钮 |
| --color-slate-500 | #64748B | 暂停 / 次要状态 / 副标题 |
| --color-slate-400 | #94A3B8 | Placeholder / 辅助信息 |
| --color-slate-300 | #CBD5E1 | 分割线 / 进度条底色 |
| --color-slate-200 | #E2E8F0 | 边框 / 表格边线 |
| --color-slate-100 | #F1F5F9 | 表头底色 / 轻底 |
| --color-slate-50 | #F8FAFC | 页面底色 / Disabled 背景 |

### 功能色

| 角色 | 色值 | 浅底 | 用途 |
|------|------|------|------|
| 成功 | #059669 | #D1FAE5 | 启用状态 / 完成状态 |
| 危险 | #DC2626 | #FEE2E2 | 停用 / 错误 / 删除 |
| 警告 | #D97706 | #FEF3C7 | 仅警告提示，不做装饰色 |
| 信息 | #2563EB | #DBEAFE | 信息提示 |

### 状态标签配色

| 状态 | 背景 | 文字 |
|------|------|------|
| 启用/活跃 | #D1FAE5 | #047857 |
| 停用/暂停 | #F1F5F9 | #64748B |
| 待审核 | #DBEAFE | #1E3A8A |
| 错误/失败 | #FEE2E2 | #991B1B |
| 警告 | #FEF3C7 | #92400E |

### 配色禁忌

- 禁止琥珀黄/橙色作为装饰色或强调色
- 禁止黄蓝撞色组合
- 禁止使用紫色/渐变色
- 全局保持蓝+灰+白的沉稳专业色调

## 字体排版

### 字体族

``'Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif``

### 字号体系

| Token | 值 | 用途 |
|-------|-----|------|
| --text-xs | 11px | 辅助标注 / 小标签 |
| --text-sm | 12px | 表头 / 小按钮 / 标签 / 副文本 |
| --text-base | 13px | 全局基准字号 / 正文 / 输入框 |
| --text-md | 14px | 区块标题 / 表单标签 |
| --text-lg | 16px | 弹窗标题 |
| --text-xl | 18px | 统计数值 |
| --text-2xl | 20px | 页面标题 |
| --text-3xl | 24px | 大标题 |

### 字重

| 字重 | 用途 |
|------|------|
| 400 | 正文 |
| 500 | 按钮 / 标签 / 表头 / 链接 |
| 600 | 区块标题 / 弹窗标题 / Tab 激活态 |
| 700 | 页面标题 / 统计数值 |

行高：1.5 | 字间距：-0.01em（标题/数值）

## 间距体系

| Token | 值 | 用途 |
|-------|-----|------|
| --space-xs | 4px | 最小间隙 |
| --space-sm | 8px | 图标与文字 / 小间距 |
| --space-md | 12px | 中等间距 |
| --space-lg | 16px | 表单项底部 / 卡片内边距 / 标准间距 |
| --space-xl | 20px | 大间距 / 卡片水平内边距 |
| --space-2xl | 24px | 区块间距 |

## 圆角体系

| Token | 值 | 用途 |
|-------|-----|------|
| --radius-sm | 4px | 小组件 / 小按钮 / Tag |
| --radius-md | 6px | 默认圆角 / 按钮 / 输入框 / Select / 弹窗内容 |
| --radius-lg | 8px | 卡片 / 表格 / 弹窗 |
| --radius-xl | 12px | 大面板 |

## 阴影体系

| Token | 值 | 用途 |
|-------|-----|------|
| --shadow-sm | 0 1px 2px rgba(0,0,0,0.03) | 卡片默认 / 输入框 |
| --shadow-md | 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.03) | 卡片 hover / 下拉框 |
| --shadow-lg | 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.03) | 弹窗 |

## 组件尺寸体系

| Token | 值 | 用途 |
|-------|-----|------|
| --comp-height-sm | 24px | Small 组件 |
| --comp-height | 28px | 默认组件高度 |
| --comp-height-lg | 32px | Large 组件 |

## 核心组件规范

### Button

- 高度：28px(默认) / 24px(small) / 32px(large)
- 内边距：0 14px / 0 10px / 0 18px
- 字号：13px / 12px / 13px | 字重：500 | 圆角：6px / 4px / 6px
- 过渡：all 0.15s ease
- Primary：背景 #1E40AF → hover #1D4ED8 → active #1E3A8A
- Primary Plain：背景 #EFF6FF + 边框 #BFDBFE + 文字 #1E40AF
- Default：边框 #E2E8F0 + 文字 #475569 → hover 边框 #60A5FA + 文字 #2563EB + 背景 #EFF6FF

### Input

- 高度：28px(默认) / 24px(small) / 32px(large)
- 边框：box-shadow: 0 0 0 1px #E2E8F0 inset
- Hover：box-shadow: 0 0 0 1px #CBD5E1 inset
- Focus：box-shadow: 0 0 0 1px #2563EB inset, 0 0 0 3px rgba(37,99,235,0.08)
- 圆角：6px | 字号：13px / placeholder 12px

### Select

同 Input 规范。下拉面板：圆角 6px / 边框 #E2E8F0 / 阴影 shadow-md。选项高度 28px。选中项：文字 #2563EB + 字重 500。Hover 项：背景 #EFF6FF。

### Table

- 表头：背景 #F8FAFC / 文字 #334155 / 字重 600 / 字号 12px / 高度 36px
- 行：文字 #475569 / 字号 13px / 高度 40px
- Hover 行：背景 #EFF6FF
- 边框：#E2E8F0 | 圆角：8px (overflow hidden)

### Tag

- 高度：22px(默认) / 20px(small) / 26px(large)
- 圆角：4px | 字重：500 / 字号：12px

### Switch

- 高度 18px / 宽度 32px / 圆角 9px
- 滑块：14×14px / 阴影 0 1px 3px rgba(0,0,0,0.15)
- 开启色：#2563EB | 过渡：all 0.25s cubic-bezier(0.4, 0, 0.2, 1)

### Dialog

- 圆角：8px
- 头部：背景 #F8FAFC / 内边距 12px 20px / 底部边框 #E2E8F0
- 标题：字重 600 / 字号 15px / 颜色 #0F172A
- Body：内边距 0
- Footer：背景 #F8FAFC / 上边框 #E2E8F0 / 内边距 12px 20px

### Card

- 圆角：8px | 边框：1px solid #E2E8F0 | 阴影：shadow-sm
- Hover：阴影升至 shadow-md | Header 内边距：10px 16px

### Pagination

- 高度：28px | 按钮尺寸：28×28px / 圆角 4px | 字号：12px

## 自定义全局样式类

### Mode Tabs（胶囊切换）

- 外壳：display: inline-flex / 背景 #F1F5F9 / 圆角 6px / 内边距 2px
- Tab 项：内边距 4px 12px / 字号 12px / 字重 500
- 激活项：白底 + 文字 #2563EB + 阴影 0 1px 2px rgba(0,0,0,0.06)
- 过渡：all 0.15s ease

### Status Tag（状态标签）

- 内边距：2px 8px | 圆角：4px | 字号：12px / 字重：500
- 使用背景+文字配对（见状态标签配色表）

### Stat Card（统计卡片）

- 白底 / 圆角 8px / 边框 #E2E8F0
- Hover：边框 #BFDBFE + 阴影 0 2px 8px rgba(37,99,235,0.06)
- 数值：字号 18px / 字重 700 / letter-spacing: -0.01em
- 标签：字号 12px / 颜色 #94A3B8

### Section Card（表单分区）

- 白底 / 圆角 8px / 边框 #E2E8F0
- 内边距：16px 20px
- 标题：字号 14px / 字重 600 / 底部分割线 #F1F5F9

## 布局规范

- 页面底色：#F8FAFC
- 侧边栏渐变：#1E3A8A → #1E40AF
- 侧边栏宽度：200px（折叠 64px）
- 顶部操作区：position: sticky; top: 0; z-index + 背景 #F8FAFC
- 底部操作栏：position: sticky; bottom: 0
- Sticky 区域必须设置 background: #F8FAFC 防止穿透

## 动效规范

| 类型 | 时长 | 曲线 |
|------|------|------|
| 微交互(hover/active) | 150ms | ease |
| 状态切换(展开/收起) | 250ms | ease |
| Switch | 250ms | cubic-bezier(0.4, 0, 0.2, 1) |
| 弹窗/面板 | 250ms | ease-out |

入场动画：fadeIn: opacity 0→1 + translateY(6px→0) / 250ms ease-out

## 无障碍

- prefers-reduced-motion: reduce → 所有动画/过渡设为 0.01ms
- prefers-contrast: high → 按钮和标签加 2px solid currentColor 边框
- :focus-visible → outline: 2px solid #3B82F6; outline-offset: 2px

## 滚动条

- 宽度：5px
- 滑块：#CBD5E1 / 圆角 3px / hover #94A3B8
- 轨道：透明

## 图标规范

- 使用 Element Plus Icons（基于 SVG）
- 按钮内图标：14px（默认）/ 12px（small）
- 禁止使用 Emoji 作为图标

## 数据可视化

| 图表 | 配色 |
|------|------|
| 折线(收益) | #2563EB + 渐变填充(0.1透明) |
| 柱状(展示量) | #3B82F6 + #059669 |
| 双轴 | 柱=#3B82F6, 线=#D97706 |

## 交互规范

- 删除：二次确认弹窗
- Token复制：点击→成功提示→2秒消失
- 表单校验：实时+提交校验
- 筛选变化：自动刷新
- 消息铃铛：未读红点, >99显示"99+"

## 登录/注册页设计

### 布局
- 左表单(56%) + 右品牌(44%)，min-width 400px
- 表单区背景: #FFFFFF（分屏布局纯白对比）
- 品牌区背景: linear-gradient(135deg, #1E3A8A, #1E40AF)（同侧边栏渐变，2色，禁止3色）

### 表单区
- 表单宽度: max-width 380px
- Logo区: gap --space-md / margin-bottom --space-2xl / 图标 32×32px / 文字 --text-lg weight 600
- 标题: --text-2xl (20px) / weight 700 / --color-slate-900 / margin-bottom --space-xs
- 副标题: --text-base (13px) / weight 400 / --color-slate-400 / margin-bottom --space-2xl
- 表单标签: --text-sm (12px) / weight 600 / --color-slate-700 / padding-bottom --space-xs
- 输入框: --comp-height (28px) / 圆角 --radius-md / 字号 --text-base / placeholder --text-sm --color-slate-400
- 输入框图标: Element Plus Icons via #prefix slot / el-icon size=14 / color --color-slate-400 / focus时 --color-primary-500
- 表单项间距: margin-bottom --space-xl (20px)
- 验证码canvas: 高度同输入框 --comp-height (28px) / 宽度 100px / 圆角 --radius-md
- 隐私政策: --text-sm / --color-slate-600 / 链接 --color-primary-600 weight 500
- 提交按钮: width 100% / height --comp-height-lg (32px, CTA用large) / --text-base / weight 500 / 背景 --color-primary-800 / hover --color-primary-700 / active --color-primary-900 / 禁用 --color-primary-200
- 底部链接: --text-sm / --color-slate-400 / margin-top --space-2xl / padding-top --space-xl / border-top --color-slate-100

### 品牌区
- 内边距: --space-2xl × 2 (48px) 改用 --space-2xl × 2
- 大标题: --text-3xl (24px) / weight 700 / #FFFFFF / margin-bottom --space-md
- 描述: --text-md (14px) / weight 400 / rgba(255,255,255,0.6) / margin-bottom --space-2xl
- 特性列表gap: --space-md (12px)
- 特性卡片: padding --space-md --space-lg (12px 16px) / gap --space-md / 背景 rgba(255,255,255,0.06) / 边框 rgba(255,255,255,0.08) / 圆角 --radius-lg / hover rgba(255,255,255,0.1)
- 特性图标: 32×32px / 圆角 --radius-md / 背景 rgba(255,255,255,0.08) / SVG 16px
- 特性名称: --text-sm (12px) / weight 500 / rgba(255,255,255,0.95)
- 特性描述: --text-xs (11px) / weight 400 / rgba(255,255,255,0.45)
- 版权: --text-xs / rgba(255,255,255,0.25) / absolute bottom --space-2xl

## 设计禁忌

- 禁止琥珀黄/橙色作为装饰色或强调色
- 禁止黄蓝撞色组合
- 禁止使用紫色/渐变色
- 禁止自创字号/间距/颜色组合
- 禁止使用 Emoji 作为图标
