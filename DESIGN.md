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

## 数据看板规范（2026-07 用户要求：dashboard 严格按 page-shell 规范重构）

数据看板是**特殊页面**——不是纯列表页，是「KPI 概览 + 趋势图 + 排名列表」三段式看板。

### 整体三段式结构

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header（图标 + 标题 + 副标题 + 时间筛选 + 刷新）          │  ← .page-header
├──────────────────────────────────────────────────────────────┤
│  Stat Grid（4 个统计卡片）                                    │  ← .stat-grid
├──────────────────────────────────────────────────────────────┤
│  Chart Card（ECharts 趋势图，高度固定 280px）                  │  ← .page-card.page-chart-card
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  List Grid（3 个排名/告警列表）                               │  ← .list-grid
│  ┌── .page-card.page-list-card ──┐  ┌── ... ──┐  ┌── ... ──┐ │
│  │  广告源对比                    │  │ 广告位收益排行 │ │ 异常告警 │ │
│  └───────────────────────────────┘  └──────────┘  └──────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Page Header

- **必用 .page-header 规范容器**（白底 / 8px 圆角 / 边框 #E2E8F0 / shadow-sm / 14px 20px padding）
- 左侧 `.page-header-left`：
  - 图标徽章 36×36 / 圆角 8 / 背景 #EFF6FF / 颜色 #2563EB / Element Plus Icon `DataAnalysis` 或 `DataLine`
  - 标题组：主标题"数据看板" + 副标题"今日 / 本周 / 本月聚合数据"
- 右侧 `.page-header-actions`：时间 tab（7/14/30 天）+ 日期范围选择 + 刷新按钮

### Stat Grid（KPI 卡片）

- 容器：`.stat-grid` / `display: grid` / `grid-template-columns: repeat(4, 1fr)` / `gap: var(--space-lg)`
- 卡片：复用 DESIGN.md **Stat Card 规范**（`.stat-card` / 白底 / 8px 圆角 / 边框 #E2E8F0 / padding 16px / hover 边框 #BFDBFE + 阴影）
- 卡片内部结构：
  - `.stat-card__label`：12px / #94A3B8
  - `.stat-card__value`：18px / 700 / #0F172A / letter-spacing -0.01em
  - `.stat-card__trend`：可选，显示环比 ↑/↓ 趋势
  - `.stat-card__compare`：可选，trend 右侧的对比基准文案（如"较昨日"），11px / #94A3B8 / 字重 500 / 同行尾部 / 间距 4px
    - **来源**：后端 `dashboard.overview` 接口返回的 `trendCompareWith` 字段
    - **目的**：让用户明确知道百分比是与哪个时间点对比
- **响应式**：≥1280px 显示 4 列 / 1024-1280px 显示 2 列 / <1024px 显示 1 列

### Chart Card（趋势图）

- 容器：`.page-card.page-chart-card`（直接用 .page-card 规范）
  - **卡片内边距**：`padding: 20px 24px`（避免 ECharts / 标题贴卡片边，是数据看板的硬规范）
  - 内部保留 padding 20px（**不要**为消除 padding 而设 `padding: 0`，否则 ECharts 容器会失去呼吸空间）
  - 背景保持 #FFFFFF（**不要**设 `background: transparent`）
- 标题：`.chart-title` / 14px / 600 / #1E293B / **padding: 0**（左右内边距由外层 .page-chart-card 提供）/ margin-bottom: 12px / **border-bottom: 1px solid #F1F5F9** / padding-bottom: 12px（分隔标题与图表）
- ECharts 容器 `.chart-canvas`：
  - **必须**显式 `width: 100%; height: 280px`（ECharts svg 渲染的硬性要求，autoresize 模式依赖父容器显式高度）
  - 使用 `vue-echarts` 的 `<VChart autoresize :init-options="{ renderer: 'svg' }" />`
  - 折线颜色 #2563EB / 渐变填充 `rgba(37, 99, 235, 0.1)` / 圆滑曲线 `smooth: true`
  - 左侧**预留 60px** 给 y 轴标签、底部**预留 40px** 给 x 轴标签（避免轴标签被裁）
- 空数据：`<el-empty description="暂无趋势数据" :image-size="60" />`

### List Grid（排名/告警列表）

- 容器：`.list-grid` / `display: grid` / `grid-template-columns: repeat(3, 1fr)` / `gap: var(--space-lg)`
- 卡片：`.page-card.page-list-card`（直接用 .page-card 规范）
  - **卡片内边距**：`padding: 20px 24px`（避免 list-row / 标题贴卡片边）
  - 背景 #FFFFFF
- 卡片内部结构：
  - `.list-title`：14px / 600 / #1E293B / **padding: 0**（左右由外层 .page-list-card 提供）/ **margin-bottom: 12px** / **border-bottom: 1px solid #F1F5F9** / padding-bottom: 12px
  - `.list-body`：flex column / gap 8px / padding: 0
  - 每行 `.list-row`：
    - `display: grid` / `grid-template-columns: 24px 1fr 100px 100px`
    - **padding: 8px 4px**（左右 4px 内边距，让 rank 编号与名称之间有呼吸空间，不贴卡片边）
    - 排名 `.row-rank`：20×20 / 4px 圆角 / #F1F5F9 背景 / #475569 文字 / 11px / 600
    - 排名异常 `.row-rank.warn`：#FEE2E2 背景 / #991B1B 文字
    - 名称 `.row-name`：#334155 / ellipsis 截断
    - 进度条 `.row-bar-track`：6px 高 / #F1F5F9 背景 / 3px 圆角
    - 进度条填充 `.row-bar-fill`：linear-gradient(90deg, #3B82F6, #1D4ED8) / 3px 圆角 / transition width 0.3s
    - 数值 `.row-value`：#334155 / 500 / right / tabular-nums
- 空数据：`<el-empty description="暂无数据" :image-size="50" />`

### 关键边界（必须遵守）

1. **ECharts 容器必须有显式高度**——`.chart-canvas { height: 280px }` 绝不能删
2. **不要给 .page-card.page-chart-card / .page-card.page-list-card 设 `padding: 0` 或 `background: transparent`**——会让内部内容塌陷
3. **折线图配色严格按 DESIGN.md**——#2563EB + rgba(37,99,235,0.1) 渐变填充（不要用琥珀黄/紫色/绿色等替代）
4. **stat-card 必须 hover 有反馈**——边框 #BFDBFE + 阴影 `0 2px 8px rgba(37,99,235,0.06)`
5. **不要在 dashboard 用 Emoji 表情**——用 Element Plus Icon `DataAnalysis` / `CaretTop`（↑）/`CaretBottom`（↓）

### 命名与代码规范

- 顶层类：`.page-shell.page-dashboard`
- 三段容器：`.page-header` / `.stat-grid` / `.page-card.page-chart-card` / `.list-grid` / `.page-card.page-list-card`
- 内部子元素：`.stat-card` / `.stat-card__label` / `.stat-card__value` / `.stat-card__trend` / `.stat-card__compare` / `.chart-title` / `.chart-canvas` / `.list-title` / `.list-body` / `.list-row` / `.row-rank` / `.row-name` / `.row-bar-track` / `.row-bar-fill` / `.row-value`

