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
- 侧边栏渐变：#0F172A → #1E293B（深炭灰，无蓝色倾向 — 极稳重）
- 侧边栏宽度：200px（折叠 64px）
- 顶部操作区：position: sticky; top: 0; z-index + 背景 `#0F172A → #1E293B`（与侧边栏同色系，形成统一深色控制台框）
- 底部操作栏：position: sticky; bottom: 0
- Sticky 区域必须设置 background 防止穿透
- **控制台表面色 Token**（2026-01 用户偏好升级 — 从深蓝改深炭灰）：
  - `--surface-deep` = `#0F172A`（极深炭）
  - `--surface-mid` = `#1E293B`（深炭）
  - `--surface-low` = `#334155`（中炭）
  - `--surface-edge` = `rgba(255,255,255,0.08)`（表面内分隔线）
  - `--surface-edge-strong` = `rgba(255,255,255,0.14)`（表面内强分隔线）
  - 三处使用：`.sidebar` / `.top-bar` / `.auth-hero-side` 同步使用
  - **蓝色仅保留在 CTA / 主按钮 / 链接 / 激活态**（#1E40AF / #2563EB）

## Master-Detail 布局规范（2026-07 用户要求：/app 页面采用小窄条 master + 详情区）

### 页面整体结构

```
┌─────────────────────────────────────────────────────────────┐  ← page-shell（flex column, gap 16px）
│  ┌───────────────────────────────────────────────────────┐  │
│  │ page-header（白底圆角卡片，与其他页面一致）              │  │  ← 高度 ~75px
│  │  [icon] 应用管理                  [数据报表] [创建应用]│  │
│  │         管理应用基础信息、广告位、广告平台与数据概览       │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌──────────┬────────────────────────────────────────────┐  │  ← app-master-detail（flex 1, min-height 0）
│  │  Master  │  Detail                                     │  │
│  │  200px   │  flex: 1                                    │  │
│  │          │                                             │  │
│  │  · 我的应用│  ┌────────────────────────────────────┐    │  │
│  │  · 搜索框 │  │ 应用信息卡（icon+name+meta）        │    │  │
│  │  · app 1 │  └────────────────────────────────────┘    │  │
│  │  · app 2 │  ┌────────────────────────────────────┐    │  │
│  │  · ...   │  │ 数据预览卡（4 个 stat-card）        │    │  │
│  └──────────┴────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 顶部 page-header 规范（与其他页面一致）

- **结构**：`.page-header > .page-header-left + .page-header-actions`
- **左侧**：`.page-header-icon` (32px 圆角色块) + `.page-header-titles` (h1.title + p.subtitle)
- **右侧**：业务按钮（如「数据报表」+「创建应用」），间距 12px
- **高度**：~75px（icon 行高）
- **样式**：白底 / 1px slate-200 边 / radius 8px / shadow-sm
- **内边距**：16-20px 上下、24px 左右

### 整体结构

```
┌────────────────┬────────────────────────────────────────────┐
│  Master        │  Detail                                     │
│  (小窄条)      │  (4 个垂直堆叠的卡片)                        │
│  200px         │  flex: 1                                    │
│                │                                             │
│  紧凑列表      │  ┌────────────────────────────────────┐    │
│  · 我的应用    │  │ 应用信息卡（icon+name+meta）        │    │
│  · +创建       │  └────────────────────────────────────┘    │
│  · 搜索框      │  ┌────────────────────────────────────┐    │
│  · 排序        │  │ 数据预览卡（4 个 stat-card）        │    │
│  ──────────    │  └────────────────────────────────────┘    │
│  · app 1       │  ┌────────────────────────────────────┐    │
│  · app 2       │  │ 广告平台关联卡                     │    │
│  · app 3       │  └────────────────────────────────────┘    │
│  · ...         │  ┌────────────────────────────────────┐    │
│                │  │ 广告位卡（筛选 + 表格 + 分页）     │    │
│                │  └────────────────────────────────────┘    │
└────────────────┴────────────────────────────────────────────┘
```

### 容器规范

- 容器类：`.app-master-detail`（与 `.page-shell` 组合时**必须显式覆盖** `flex-direction: row`，因为 `.page-shell` 默认是 column）
- 布局：`display: flex; flex-direction: row; gap: 16px;`
- 高度：`calc(100vh - 88px)`（顶栏 56px + padding 16px*2）
- 边距：margin 0 / padding 16px
- 背景：`#F8FAFC`（slate-50）
- overflow: hidden
- **高度策略**：`flex: 1; min-height: 0;`（**禁止**用 `height: calc(100vh - Xpx)`，因为 page-header 高度变化时 calc 会算错；用 flex: 1 让 page-shell 自动撑开）
- **页面外层**（`MainLayout` 的 `.main-area`）无 overflow 限制，整体滚动由 `<body>` 接管；detail 内部用 `overflow-y: auto` 单独滚动

### 左侧 Master 列表面板（`.app-master-panel`）

- 宽度：**200px**（小窄条，flex-shrink: 0）
- 卡片样式：白底 / 1px slate-200 边 / radius 8px / shadow-sm
- 内部：flex column，header + list
- overflow: hidden

#### Master Header（垂直堆叠，**禁止横排**）

```
┌────────────────────┐
│ 📱 我的应用  3     │   ← title (icon + 文字 + count tag)
│ [ + 创建 ]         │   ← 全宽 primary 按钮
│ [ 搜索框        ]  │   ← 搜索
│ [ 排序下拉     ▾ ] │   ← 排序
├────────────────────┤
│ ...                │
```

- 容器：`.app-master-header` padding 14px / flex column / gap 10px / 底部分割线
- 顶行：`.app-master-header-top` 必须是 `flex-direction: column`（**禁止 row**，否则 200px 容纳不下）
- title：14px / 600 / slate-900 / 图标 primary-500
- create 按钮：`.app-master-create-btn` `align-self: stretch; width: 100%`（占满整行）
- 搜索框：default 尺寸
- 排序下拉：class `app-master-sort` 100% 宽

#### Master List Item（紧凑型，**禁止多行**）

- 容器：`.app-master-item` flex / gap 8px / padding 8px 10px / radius 6px / margin-bottom 2px
- hover：背景 slate-50
- active：背景 primary-50 + 内嵌 1px primary-200 边
- icon：28×28 / radius 6px / 背景 slate-100 / 文字 13px（active 时背景 primary-100 / 文字 primary-600）
- 文字区：`.app-master-item-body` flex 1 / min-width 0
- 名称：12px / 500 / slate-900 / 单行省略（`text-overflow: ellipsis` + `max-width: 100px`）
- 平台 chip：`.platform-tag` 9px 字号 / 14px 高 / padding 0 4px / radius 3px（紧凑到极致）
- 副标题 ID：**隐藏**（`display: none`），避免在 200px 里换行挤压
- 状态图标：`.app-master-item-status` 12px Lock 图标 / slate-400

### 右侧 Detail 区（`.app-detail-panel`）

- 容器：flex 1 / min-width 0 / overflow-y auto / flex column / gap 12px / padding-right 4px
- **不**单独包裹一层 page-header，**直接**包含 4 个卡片

#### 卡片 1：应用信息（`.app-detail-header`）

- 容器：白底 / 1px slate-200 边 / radius 8px / shadow-sm / padding 16px 20px / flex space-between
- 左侧：app icon (48px) + 名称 + meta
  - 名称：20px / 600 / slate-900
  - meta：`包名 · AppKey · 创建时间` 用 **中点「·」** 分隔（**禁止 1px 灰线**，避免视觉噪音）
  - 平台 chip / 状态 chip
- 右侧：操作按钮组（`集成设置` / `SDK 设置策略` / `编辑应用`）

#### 卡片 2-4：通用 Section Card

- 容器：白底 / 1px slate-200 边 / radius 8px / padding 16px 20px / shadow-sm
- 标题：14px / 600 / slate-900
- 右上角：辅助操作按钮（如 `+关联广告平台` 必须 `type="primary"` 蓝色实心，**禁止** plain）

### 表格列对齐规范（**必做**）

- 表格 **所有列** 加 `align="center" header-align="center"`（**禁止**默认左对齐，否则数据列与字段列错位）
- 状态列里的开关 / 标签：用 inline-flex + vertical-align: middle 强制居中
- Tag 元素：`.el-table .el-tag { display: inline-flex; align-items: center; vertical-align: middle; }` 避免偏高

### Meta 分隔符（`包名 · AppKey · 创建时间`）

- **禁止**用 1px 灰线 `<span class="divider">` 视觉噪音
- **必须**用中点「·」字符 + 浅色：`color: slate-300` / `font-size: 12px`
- 间距：左右各 8px margin

### 命名规范

- 容器：`.app-master-detail` / `.app-master-panel` / `.app-detail-panel`
- Master item：`.app-master-item` / `.app-master-item-icon` / `.app-master-item-body` / `.app-master-item-name` / `.app-master-item-name-text` / `.app-master-item-status`
- 平台 chip：`.platform-tag`（与其它页面通用，可复用）
- 卡片：`.app-detail-header`（特殊，固定名字）/ `.app-detail-card`（通用，dataPreview / adNetwork / placement 复用）

### 易错点（血泪教训）

- ⚠️ **flex-direction 被覆盖** — `.app-master-detail` 与 `.page-shell` 组合时，`.page-shell` 默认 `flex-direction: column`，**必须显式声明** `flex-direction: row`，否则 master/detail 垂直堆叠
- ⚠️ **padding 16px 破坏左边距对齐** — `.app-master-detail` **禁止** `padding: 16px`，否则 master 卡片比 page-header 缩进 16px，视觉错位。**正确做法**：`padding: 0`，master 卡片自带 `border` 撑出视觉边界
- ⚠️ **200px 不能放横排 header** — 标题 + 按钮横排会挤，必须 column 堆叠
- ⚠️ **表格列对齐** — el-table 默认左对齐，**所有列必须显式** `align="center" header-align="center"`
- ⚠️ **状态 Tag 偏高** — el-tag 默认 `display: inline-block` + `vertical-align: baseline`，需要 inline-flex + middle
- ⚠️ **ID 副标题已弃用** — 200px 改显示「应用 TOKEN」(`app_key`)，Key icon + monospace 字体 + ellipsis 截断；点击复制。详见 4.3 节。

## 4.3 应用列表项副标题（2026-07 用户要求：在应用名下方显示应用 TOKEN）

**第 2 行：AppKey → 应用 TOKEN**

```
┌──────────────────────────────┐
│ [icon] 测试App  [Android]     │  ← name + 平台 chip
│        🔑 app_2LGbdGVF...     │  ← TOKEN（Key icon + 短截断 + 单击复制）
└──────────────────────────────┘
```

- **位置**：紧贴 name 下方，gap 2px
- **字号**：11px（比 name 小 1-2px）
- **字体**：`'SF Mono', Menlo, Consolas, monospace`（技术字符串）
- **icon**：`<Key />` 10px，slate-500 透明度 0.7
- **截断**：`text-overflow: ellipsis`（200px 容器 + 28px icon + 12px 状态 = 剩余 ~155px 容纳 app_key）
- **悬停**：背景 slate-100 + 文字变 primary-700
- **点击**：`@click.stop="copyText(app.app_key)"` 复制全文，stop 防止触发 item 选中
- **active 态**：文字直接用 primary-700 强调
- **命名**：`data-token` 用于复制

**字段命名规范**（必须遵守）：

| 位置 | 旧名（弃用） | 新名（2026-07） | 字段 |
|------|------|------|------|
| 列表项副标题 | `ID: xxx` | 应用 TOKEN | `app.app_key` |
| 详情 meta 标签 | `AppKey` | 应用 TOKEN | `currentApp.app_key` |

**禁止使用 `AppKey` 字符串作为用户可见标签**，全部改 `应用 TOKEN`（后端字段仍是 `app_key` 不变）。

## 列表页统一规范（2026-07 用户要求：所有列表页严格统一）

### 整体三段式布局

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header（页面标题 + 主操作）                              │  ← .page-header
├──────────────────────────────────────────────────────────────┤
│  Filter Bar（筛选区）                                          │  ← .page-filter
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Table Card（数据表 + 内嵌分页）                               │  ← .page-card
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

三段都用 .page-card 容器（白底 / 8px 圆角 / 1px #E2E8F0 / shadow-sm / padding 0），
上下间距 16px，左右紧贴内容区（24px 边距）。

### Page Header

- 高度：60-72px
- 内部布局：`display: flex; align-items: center; justify-content: space-between;`
- 左侧区 `.page-header-left`：
  - **图标徽章** 36×36 / 圆角 8 / 背景 #EFF6FF / 颜色 #2563EB / Element Plus Icon
  - **标题组**：
    - 主标题 `--text-xl` (18px) / weight 700 / #0F172A
    - 副标题（可选）`--text-sm` (12px) / #94A3B8 / max-width 60ch
- 右侧区 `.page-header-actions`：
  - 按钮组，gap 8px，主操作在前
  - 主操作：`<el-button type="primary" :icon="Plus">新建 XXX</el-button>`
  - 次操作：`<el-button :icon="Refresh">刷新</el-button>`

### Filter Bar

- **必须有**（即便当前只有一个搜索框）—— 视觉节奏统一
- 容器 `.page-filter`：
  - 高度 64px（多行可换），padding：**16px 20px**，gap **16px**
  - 背景白色；边框 1px #E2E8F0；圆角 **8px**（沿用 `--radius-lg`）；阴影 `0 1px 2px rgba(15, 23, 42, 0.04)`
  - 内部布局：`display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap`
- 左侧区 `.page-filter-form`：el-form `:inline` 表单
  - 每个条件：`el-form-item label="XX"`，label **字号 13px / 字重 500 / #334155 / line-height 36px / min-width 60px / padding-right 8px**
  - 输入/选择框：宽 **200px**（默认）；时间范围：**240px**；其余枚举：120-200px 按字段长度调整
  - 控件外观：**36px 高 / 8px 圆角 / 1px #E2E8F0 内边 / #FFFFFF 底**
  - 状态：hover 浅蓝边 #93C5FD / focus 主蓝边 #2563EB + 浅蓝外环 3px #EFF6FF
  - input 内部文字：14px / #0F172A / placeholder #94A3B8
- 右侧区 `.page-filter-actions`：操作按钮组
  - `<el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>`
  - `<el-button :icon="RefreshLeft" @click="onReset">重置</el-button>`
  - 可选：`<el-button :icon="Download" plain @click="onExport">导出</el-button>`
  - 按钮尺寸：**36px 高 / 8px 圆角 / 0 16px padding / 14px 字号 / 500 字重**
  - primary：背景 #2563EB / 白字；hover #1D4ED8
  - default：背景白 / 1px #E2E8F0 边 / #334155 字；hover 浅蓝底 #EFF6FF + 主蓝边 #2563EB + 主蓝字
  - 所有 transition **0.18s ease**
- 边界：css 规则写在 `src/index.css` 末尾的「page-filter 视觉优化（v2）」块，全部 `!important` 兜底；**禁止**在 .vue 文件写 `<style scoped>`（项目无 scoped，:deep() 无效）
- 实施位置：4 个列表页（app / placement / ad-source / traffic-group）已统一

### Table Card

- padding：0
- 内部：el-table + el-pagination
- el-pagination 位置：**右下角内嵌**
  - padding：12px 20px
  - 顶部 1px #F1F5F9 分割线
  - `<el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper" @current-change="fetchList" @size-change="fetchList" small background />`
- el-table 配置（统一）：
  - `stripe` / `:header-cell-style="{ background: '#F8FAFC', color: '#334155', fontWeight: 600 }"`
  - `:cell-style="{ color: '#475569' }"`
  - 操作列 `width="160" fixed="right" label="操作"`
  - 状态列 `width="80"` 配合 `.status-tag` 组件
  - 时间列 `width="170"` Element Plus 默认格式 `YYYY-MM-DD HH:mm:ss`
- 空数据：使用 el-table 默认 empty slot，居中显示 `-` 或描述文案

### 状态标签 .status-tag

| 状态值 | 背景 | 文字 | 圆角 |
|--------|------|------|------|
| active / 1 / 启用 | #D1FAE5 | #047857 | 4px |
| paused / 0 / 停用 | #F1F5F9 | #64748B | 4px |
| pending / 审核中 | #DBEAFE | #1E3A8A | 4px |
| error / 失败 | #FEE2E2 | #991B1B | 4px |
| warning | #FEF3C7 | #92400E | 4px |

- 高度 22px / 内边距 2px 8px / 字号 12px / 字重 500
- 实现：`<span class="status-tag" :class="`status-tag--${variant}`">{{ label }}</span>`

### 操作列按钮规范

- 主操作：`<el-button link type="primary" :icon="Edit">编辑</el-button>`
- 次操作：`<el-button link type="primary" :icon="View">查看</el-button>`
- 危险操作：`<el-button link type="danger" :icon="Delete">删除</el-button>`
- 多个按钮用 el-space 隔开，gap 4px
- 操作列固定右侧，width 160px（3-4 个操作）

### 命名与代码规范

- 容器类名空间：`.page-header` / `.page-filter` / `.page-card` / `.page-table-wrap` / `.page-pagination`
- 内部子元素：`.page-header-left` / `.page-header-actions` / `.page-filter-form` / `.page-filter-actions`
- 状态标签：`.status-tag` + `.status-tag--active` 等修饰类
- 筛选 form：`:model="filter"`（统一用 filter 变量名）
- 分页：`page` / `pageSize` / `total`（统一变量名）

## 创建/编辑抽屉统一规范（2026-07 用户要求：用侧边抽屉，不影响列表上下文）

### 设计原则

- **禁止**用 `el-dialog`（弹窗卡片）实现创建/编辑功能（用户反馈：内容容易超出卡片范围，导致数据项展示不全）
- **必须**用 `el-drawer`（侧边抽屉）实现所有数据创建/编辑，保留列表上下文
- **禁止**用独立子路由（用户反馈：从列表跳走后列表上下文丢失，破坏 UX）
- 抽屉从右侧弹出，**列表保持可见**（可同时操作筛选、查看其他行）
- 创建/编辑功能由列表页内嵌的 `.app-form-drawer` 实现，不写独立 `.vue` 页面
- 弹窗（el-dialog）仅允许用于「详情查看」「轻量级 inline 操作」「确认提示」三类场景

### 抽屉结构（page-form-drawer-shell 三段式）

```
┌─ el-drawer (.app-form-drawer) ──────────── 抽屉 880px
│  ┌─ .page-form-header (sticky top) ─────┐
│  │  [× 关闭]  创建应用 / 编辑应用         │
│  │  副标题：填写以下信息以创建一个新应用  │
│  └─────────────────────────────────────┘
│  ┌─ .page-form-body (独立滚动) ────────┐
│  │  区块 1：基础信息                      │
│  │  ┌─ .page-form-section ─────────────┐│
│  │  │  [icon]  基础信息    (3 项)       ││
│  │  │  字段 1: [input]                 ││
│  │  │  字段 2: [select]                ││
│  │  └────────────────────────────────┘│
│  │  区块 2：平台与对接                   │
│  │  ...                                 │
│  └─────────────────────────────────────┘
│  ┌─ .page-form-footer (sticky bottom) ─┐
│  │  [取消]                [创建应用]   │
│  └─────────────────────────────────────┘
└──────────────────────────────────────────┘
```

### 抽屉容器规范

- **抽屉尺寸**：720px (默认) / 880px (1280+) / 960px (1600+)
- **方向**：`direction="rtl"`（右侧滑入）
- **挂载**：`modal=true`（带遮罩）/ `modal-class="app-form-drawer-mask"` / `:append-to-body="true"`
- **遮罩**：背景 `rgba(15, 23, 42, 0.32)` + `backdrop-filter: blur(2px)`（保留列表上下文，不全黑）
- **关闭按钮**：`.page-form-header` 左侧 `[× 关闭]` 链接按钮，点击触发 `@close`

### 抽屉内部规范

- `.app-form-drawer .el-drawer__body`：padding 0 / 背景 #F8FAFC / 满高 / `overflow: hidden`（让内部 .page-form-body 独立滚）
- `.page-form-drawer-shell`：满高 / flex column / 背景 #F8FAFC
- `.page-form-body`：`flex: 1` / `overflow-y: auto` / padding 20×24 / 区块 gap 20px
- `.page-form-header`：`flex-shrink: 0` + sticky top + 包含返回按钮 + 标题 + 副标题
- `.page-form-footer`：`flex-shrink: 0` + sticky bottom + 右侧按钮组（取消 + 主按钮）

### 抽屉里的 header / section / footer

继承 `page-form-header` / `page-form-section` / `page-form-footer` 规范（与未来独立页面布局保持一致），仅 margin 调整：
- header / footer 在抽屉内 `margin: 0`（去掉 `margin: 0 -24px`），padding 保持 20×24
- 关闭按钮 `.page-back` 同 page-form 规范（14px / #475569 / hover #2563EB + 箭头左移 2px）

### 字段规范（与 page-form 一致）

- label 字号 **13px** / 字重 **500** / 颜色 #334155 / 距控件 6px
- input/select/textarea 高度 36px / 圆角 8px
- 必填：label 前 `<span class="required-mark">*</span>` 红色 #EF4444
- 帮助文字：`.form-help` 12px / #64748B / 4px margin
- 表单 grid：2 列 (>= 768) / 1 列 (< 768) / gap 20×24

### 底部按钮（抽屉内 footer）

- 取消（左侧）：`el-button` 默认 / 36px / 8px 圆角 / 14px / 关闭抽屉
- 主按钮（右侧）：`el-button type="primary" :loading="submitting"` / 36px / 8px 圆角 / 14px / 500 / 0 20px padding
- 按钮颜色：默认 #2563EB / hover #1D4ED8
- 提交中：loading 旋转 + 禁用 / 成功后：ElMessage 成功 + 关闭抽屉 + `fetchList()` 刷新列表

### 命名与代码

- 抽屉用 `v-model="formDrawerVisible"` / `:title="isEdit ? '编辑应用' : '创建应用'"` 控制
- 模式判断：`const isEdit = ref(false)` + `const openCreate = () => { isEdit.value = false; formDrawerVisible.value = true; resetForm(); }` + `const openEdit = (row) => { isEdit.value = true; formDrawerVisible.value = true; loadEditData(row); }`
- 关闭时 `resetForm()`：清空 reactive form + `formRef.value?.clearValidate()`
- **不要**写独立 `.vue` 文件给 form —— form 写在列表页 `<el-drawer>` 内（用户反馈：避免路由跳走 + 避免重复组件）
- API 路径：创建 `POST /{resource}/create` / 编辑 `PUT /{resource}/update` / 详情 `GET /{resource}/detail?xxxId=...`

### 滚动隔离（重要）

- 抽屉**独立滚动**：drawer body 内部 `overflow-y: auto` / drawer body 外部 `overflow: hidden`
- **禁止**用页面 `body` / `el-main` 滚动 —— 抽屉出现时锁定背景滚动
- 当抽屉高度 > 视口时，`.page-form-body` 独立滚，`.page-form-header` 和 `.page-form-footer` 保持在抽屉内 sticky

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
- 品牌区背景: `linear-gradient(180deg, #0F172A, #1E293B)`（与侧边栏同色系，2色，禁止3色；采用深炭灰不采用深蓝 — 沉稳中性，无品牌色偏向）

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

## 数据看板规范（2026-07 用户要求：dashboard 严格按上中下三段式重构）

数据看板是**特殊页面**——不是纯列表页，是「收入详情 / 数据趋势 / 多维排行」三段式看板。所有时段相关数据均**真实查表**（revenue / impressions），DAU / 预估收益**基于真实字段估算**（前端标注估算公式，避免误导）。

### 整体上中下三段式结构

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header（图标 + 标题 + 副标题 + 刷新）                    │  ← .page-header
├──────────────────────────────────────────────────────────────┤
│  上：Stat Grid（4 个收入详情卡片）                             │  ← .stat-grid.stat-grid--income
│  ┌─ 昨天 ─┐ ┌─ 前天 ─┐ ┌─ 本月 ─┐ ┌─ 上月 ─┐                 │
│  │ ¥XX.XX  │ │ ¥XX.XX  │ │ ¥XXX   │ │ ¥XXX   │                 │
│  │ 展示/DAU│ │ 展示/DAU│ │ 展示/DAU│ │ 展示/DAU│                │
│  │ ↑↓ 较前天│ │    —    │ │ ↑↓ 较上月│ │   —    │                │
│  └─────────┘ └─────────┘ └────────┘ └────────┘                │
├──────────────────────────────────────────────────────────────┤
│  中：数据趋势 Section                                         │  ← .page-card.page-section
│  [维度: 汇总] [指标: 收益] [日期范围: 过去 7 天 ▼]             │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  ECharts 折线图（summary 单线 / 其他维度多线）         │   │
│  │  高度 320px                                            │   │
│  └───────────────────────────────────────────────────────┘   │
│  2024-01-01 至 2024-01-07 · 共 7 天    注：DAU/预估为估算      │
├──────────────────────────────────────────────────────────────┤
│  下：Ranking Grid（6 个排行卡片，3 列 × 2 行）                 │  ← .ranking-grid
│  ┌─ TOP应用 ──────┐ ┌─ TOP广告位 ─────┐ ┌─ TOP广告类型 ──┐  │
│  │ [指标: 收益 ▼] │ │ [指标: 收益 ▼]   │ │ [指标: 收益 ▼] │  │
│  │ 1 应用A ¥XX.XX │ │ 1 位置A ¥XX.XX   │ │ 暂无数据      │  │
│  │ 2 应用B ¥XX.XX │ │ 2 位置B ¥XX.XX   │ │                │  │
│  │ ...            │ │ ...              │ │                │  │
│  └────────────────┘ └─────────────────┘ └────────────────┘  │
│  ┌─ TOP地区 ──────┐ ┌─ TOP广告平台 ──┐ ┌─ TOP系统 ──────┐  │
│  └────────────────┘ └────────────────┘ └────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Page Header

- **必用 .page-header 规范容器**（白底 / 8px 圆角 / 边框 #E2E8F0 / shadow-sm / 14px 20px padding）
- 左侧 `.page-header-left`：
  - 图标徽章 36×36 / 圆角 8 / 背景 #EFF6FF / 颜色 #2563EB / Element Plus Icon `DataAnalysis`
  - 标题组：主标题"数据看板" + 副标题"实时收入 / 趋势 / 多维排行"
- 右侧 `.page-header-actions`：刷新按钮（不含 tab/date range，下移到中段 filter-bar）

### 上：Stat Grid（收入详情·4 个 stat-card）

- 容器：`.stat-grid--income` / `display: grid` / `grid-template-columns: repeat(4, 1fr)` / `gap: var(--space-lg)`
- 卡片：`.stat-card.stat-card--income`（**专用样式**——区别于普通 stat-card）
  - 顶部 **3px 蓝色渐变装饰条**（`linear-gradient(90deg, #2563EB, #60A5FA)`）：让卡片与普通 stat-card 视觉上能区分
  - padding `18px 20px`（比普通 stat-card 略大，容纳副值网格）
  - hover：边框 #BFDBFE + 阴影 `0 4px 12px rgba(37,99,235,0.06)` + `translateY(-1px)`
- 卡片内部结构：
  - `.stat-card__head`：flex 横向，`.stat-card__label`（左）+ `.stat-card__period`（右，11px / #94A3B8 / 日期或日期段）
  - `.stat-card__main`：主值容器，含 `__currency`（¥，14px / 600 / #64748B）+ `__value`（28px / 700 / #0F172A / tabular-nums）
  - `.stat-card__trend`：可选，环比 ↑/↓ 趋势（"较前天"/"较上月"）
    - **仅「昨天」/「本月」**有 trend（前天 / 上月不展示趋势，因对比基准复杂）
  - `.stat-card__sub`：副值网格 `grid-template-columns: repeat(3, 1fr)`
    - 三组：展示 / DAU / 预估
    - `.stat-card__sub-label`：11px / #94A3B8
    - `.stat-card__sub-value`：12px / 600 / #334155 / tabular-nums
- **数据来源**：后端 `GET /api/v1/console/dashboard/overview` 返回 `stats: [{ key, label, period, compareWith, values: { revenue, impressions, dau, estimatedRevenue }, trend }]`
- **响应式**：≥1280px 显示 4 列 / 768-1280px 显示 2 列 / <768px 显示 1 列

### 中：Page Section（数据趋势）

- 容器：`.page-card.page-section` / padding `20px 24px` / flex column / gap 12px
- **Head**（`.page-section__head`）：flex 横向，左标题 + 右 filters
  - 标题：`.page-section__title` / 14px / 600 / #1E293B
  - Filters：`.page-section__filters` / flex + gap 8px
    - `.filter-label`：12px / #64748B / 500
    - `.filter-select`：120px（维度 + 指标 2 个 el-select）
    - `.filter-date`：240px（el-date-picker daterange）
- **Chart 容器**（`.chart-wrapper`）：width 100% / **height 320px** / position relative
  - `.chart-canvas`：width 100% / height 100%
  - 配色：折线 #2563EB / 渐变填充 `rgba(37, 99, 235, 0.10)` / smooth + 圆点
  - 单 series 隐藏 legend，多 series 显示顶部 legend
- **Foot**（`.page-section__foot`）：flex 横向，左时间范围 + 右估算公式说明
  - `.page-section__period`：12px / #64748B / `Calendar` icon + 文本
  - `.page-section__note`：11px / #94A3B8 / 估算公式（DAU = 展示 ÷ 100，预估收益 = 收益 × 1.0）
- **数据来源**：`GET /api/v1/console/dashboard/trend?dimension=&metric=&startDate=&endDate`
  - `dimension=summary` → 单 series（points: [{date, value}])
  - 其他 dimension → 多 series（dates: [] + series: [{name, data: []}])，top 5 实体
- **维度选项**（`.filter-select`）：汇总（默认）/ TOP应用 / TOP广告位 / TOP广告类型 / TOP地区 / TOP广告平台 / TOP系统
- **指标选项**（`.filter-select`）：收益（默认）/ 展示 / DAU / 预估收益
- **日期范围快捷项**（el-date-picker `shortcuts`）：今天 / 昨天 / 过去 7 天 / 过去 14 天 / 过去 30 天 / 自定义

### 下：Ranking Grid（6 个排行卡片）

- 容器：`.ranking-grid` / `display: grid` / `grid-template-columns: repeat(3, 1fr)` / `gap: var(--space-lg)`
- 响应式：≥1280px 显示 3 列 / 768-1280px 显示 2 列 / <768px 显示 1 列
- 卡片：`.page-card.page-rank-card` / padding `16px 20px` / flex column / **min-height 320px**
- 卡片内部结构：
  - `.page-rank-card__head`：flex 横向
    - 标题：`.page-rank-card__title` / 14px / 600 / #1E293B / `Trophy` icon（**琥珀黄 #F59E0B**，仅此处用琥珀色，是 DESIGN.md 唯一例外）+ "TOP {label}"
    - Metric 筛选：`.rank-card__metric` / width 90px / el-select（4 个 metric：收益 / 展示 / DAU / 预估）
  - `.page-rank-card__body`：flex column / gap 6px / max-height 280px / overflow-y auto
    - **滚动条**：4px 宽 / 拇指 #E2E8F0 / 轨道透明（自定义滚动条）
  - 每行 `.rank-row`：
    - grid `22px 1fr 80px 70px`（排名 / 名称 / 进度条 / 数值）
    - padding `6px 0` / hover 背景 #F8FAFC / 4px 圆角
    - 排名 `.rank-row__rank`：11px / 600 / #94A3B8
      - top-1（金）：#F59E0B / 700
      - top-2（银）：#94A3B8 / 700
      - top-3（铜）：#B45309 / 700
    - 名称 `.rank-row__name`：#1E293B / 500 / ellipsis
    - 进度条 `.rank-row__bar-track`：6px 高 / #F1F5F9 / 3px 圆角
    - 进度条填充 `.rank-row__bar-fill`：linear-gradient(90deg, #2563EB, #60A5FA) / 3px 圆角 / transition width 0.2s
    - 数值 `.rank-row__value`：11px / 600 / #334155 / right / tabular-nums
- **空数据**：`.page-rank-card__body` 内 `<el-empty description="暂无数据" :image-size="50" />`
  - 软维度（adType / region / os）后端**直接返回空** ranking（report_daily 表无对应列），前端走空状态

### 关键边界（必须遵守）

1. **ECharts 容器必须有显式高度**——`.chart-wrapper { height: 320px }` 绝不能删
2. **不要给 .page-card.page-section / .page-card.page-rank-card 设 `padding: 0` 或 `background: transparent`**——会让内部内容塌陷
3. **折线图配色严格按 DESIGN.md**——#2563EB + rgba(37,99,235,0.1) 渐变填充（不要用琥珀黄/紫色/绿色等替代，多 series 时用 5 色调色板：#2563EB / #10B981 / #F59E0B / #EF4444 / #8B5CF6）
4. **stat-card--income 必须 hover 有反馈**——边框 #BFDBFE + 阴影 + `translateY(-1px)`
5. **不要在 dashboard 用 Emoji 表情**——用 Element Plus Icon `DataAnalysis` / `CaretTop` / `CaretBottom` / `Calendar` / `Trophy`
6. **DAU / 预估收益必须标注估算公式**——`.page-section__note` 显式写出"DAU = 展示 ÷ 100、预估收益 = 收益 × 1.0（仅占位估算）"
7. **6 个 ranking 卡片并行加载**——避免一个慢接口阻塞其他卡片渲染（`Promise.all`）
8. **Trophy 图标用琥珀色 #F59E0B 是 DESIGN.md 唯一例外**——其他场景仍禁止琥珀色装饰

### 命名与代码规范

- 顶层类：`.page-shell.page-dashboard`
- 三段容器：`.page-header` / `.stat-grid.stat-grid--income` / `.page-card.page-section` / `.ranking-grid` / `.page-card.page-rank-card`
- 内部子元素：
  - 上段：`.stat-card.stat-card--income` / `.stat-card__head` / `.stat-card__label` / `.stat-card__period` / `.stat-card__main` / `.stat-card__currency` / `.stat-card__value` / `.stat-card__trend` / `.stat-card__compare` / `.stat-card__sub` / `.stat-card__sub-item` / `.stat-card__sub-label` / `.stat-card__sub-value`
  - 中段：`.page-section__head` / `.page-section__title` / `.page-section__filters` / `.filter-label` / `.filter-select` / `.filter-date` / `.chart-wrapper` / `.chart-canvas` / `.page-section__foot` / `.page-section__period` / `.page-section__note`
  - 下段：`.page-rank-card__head` / `.page-rank-card__title` / `.rank-card__metric` / `.page-rank-card__body` / `.rank-row` / `.rank-row__rank` / `.rank-row__name` / `.rank-row__bar-track` / `.rank-row__bar-fill` / `.rank-row__value`

