# DESIGN.md - 广告SDK聚合平台

## 气质与意象

B2B 企业级广告数据管理控制台。意象：深夜交易室终端屏幕 —— 信息密度高、层次清晰、操作精准。

## 强制配色组合白名单

以下组合为唯一合法搭配，禁止自由组合：

| 背景色 | 允许的文字色 | 禁止 |
|--------|------------|------|
| `#FFFFFF` 白 | `#111827` 主文字 / `#6B7280` 次文字 / `#2563EB` 链接 | 任何浅灰 |
| `#F9FAFB` 页面底 | `#111827` / `#6B7280` | `#D1D5DB` 等浅灰 |
| `#1E293B` 侧边栏 | `#FFFFFF` 选中 / `#CBD5E1` 未选中 | `#6B7280` 中灰 |
| `#EFF6FF` 主色浅底 | `#1E40AF` / `#2563EB` | `#93C5FD` 浅蓝 |
| `#FEF2F2` 红浅底 | `#991B1B` 深红 | `#FCA5A5` |
| `#F0FDF4` 绿浅底 | `#166534` 深绿 | `#86EFAC` |

最低对比度: 4.5:1 (WCAG AA)

## Element Plus 主题变量覆盖

```css
:root {
  --el-color-primary: #2563EB;
  --el-color-primary-light-3: #60A5FA;
  --el-color-primary-light-5: #93C5FD;
  --el-color-primary-light-7: #BFDBFE;
  --el-color-primary-light-9: #EFF6FF;
  --el-color-primary-dark-2: #1D4ED8;
  --el-color-success: #16A34A;
  --el-color-warning: #EAB308;
  --el-color-danger: #DC2626;
  --el-color-info: #6B7280;
  --el-text-color-primary: #111827;
  --el-text-color-regular: #374151;
  --el-text-color-secondary: #6B7280;
  --el-text-color-placeholder: #9CA3AF;
  --el-text-color-disabled: #D1D5DB;
  --el-border-color: #E5E7EB;
  --el-border-color-light: #F3F4F6;
  --el-bg-color: #FFFFFF;
  --el-bg-color-page: #F9FAFB;
  --el-border-radius-base: 6px;
  --el-border-radius-small: 4px;
  --el-font-family: "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif;
  --el-font-size-base: 14px;
  --el-font-size-small: 13px;
  --el-font-size-large: 16px;
}
```

## 字号枚举绑定

| Token | 值 | 唯一使用场景 |
|-------|-----|------------|
| `--fs-number` | 28px/700 | 仅 Dashboard 指标卡数字 |
| `--fs-page-title` | 20px/600 | 仅页面大标题(1处/页) |
| `--fs-section-title` | 16px/600 | 仅区块/弹窗/卡片标题 |
| `--fs-body` | 14px/400 | 正文/表格/表单(默认) |
| `--fs-small` | 13px/400 | 表格辅助信息/Tag |
| `--fs-caption` | 12px/400 | 时间戳/脚注 |

禁止使用上述之外的字号。

## 间距系统

| Token | 值 | 场景 |
|-------|-----|------|
| `--sp-xs` | 4px | 图标与文字间距 |
| `--sp-sm` | 8px | 表格单元格/Tag内间距 |
| `--sp-md` | 12px | 筛选项/按钮组间距 |
| `--sp-base` | 16px | 卡片间距/表单项间距 |
| `--sp-lg` | 20px | 卡片内边距/页面主内边距 |
| `--sp-xl` | 24px | 区块间距 |

禁止使用上述之外的间距值。

## 标准页面模板

### 模板A - 列表页
- 页头行: 左标题(20px/600) + 右主操作按钮
- 筛选栏: 白色卡片, mb:16px, 水平排列, 右侧查询+重置
- 表格区: 白色卡片, 斑马纹, 固定表头, 操作列右固定
- 分页器: 右对齐, mt:16px

### 模板B - 详情/编辑页
- 面包屑: mb:16px
- 信息卡片: 标题(16px/600) + 分割线 + 描述列表(标签次文字+值主文字)
- 操作区: 标题 + 表格/表单/配置

### 模板C - 表单(弹窗)
- 容器: max-width 560px 居中
- 表单项: 垂直排列, 间距20px
- 标签: 左对齐, 14px, 必填红星
- 输入框: w:100%, h:32px
- 错误: 12px, danger色, 输入框下方4px
- 按钮区: 右对齐, mt:24px

## 组件规范

| 组件 | 规范 |
|------|------|
| 按钮 | primary/danger/default, 圆角6px, h:32px |
| 表格 | 斑马纹, 固定表头, 操作列固定右 |
| Tag | 启用=success, 禁用=info, 审核中=warning, 异常=danger |
| 弹窗 | 居中, min-width:480px, 确认按钮右对齐 |
| 分页 | 右对齐, 显示总数, 默认20条/页 |
| 空状态 | 居中图标 + "暂无数据" |
| 复制 | Token/ID旁放复制图标, 点击ElMessage提示 |

## 数据可视化

| 图表 | 配色 |
|------|------|
| 折线(收益) | `#2563EB` + 渐变填充(0.1透明) |
| 柱状(展示量) | `#3B82F6` + `#10B981` |
| 双轴 | 柱=`#3B82F6`, 线=`#F59E0B` |
| 水平柱(排行) | 渐变深到浅 |

## 交互规范

- 删除: 二次确认弹窗
- Token复制: 点击→成功提示→2秒消失
- 表单校验: 实时+提交校验
- 筛选变化: 自动刷新
- 消息铃铛: 未读红点, >99显示"99+"

## 设计禁忌

- 不使用渐变按钮/背景
- 圆角不超过 8px
- 动画不超过 300ms
- 不用卡通图标(统一Element Plus线性图标)
- 数据密集区不用大面积色块
- 禁止自创字号/间距/颜色组合
