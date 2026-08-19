# 应用管理 — 导出 SDK 预置策略（需求整理 / 待开发）

> 本文档仅做**需求沉淀**，**不进入开发**。  
> 来源：用户 2026-07-22 提供的弹窗截图。  
> 涉及入口：应用管理 → 应用详情 → 「导出 SDK 预置策略」按钮（具体触发位置待定）。

---

## 1. 弹窗入口

- **弹窗标题**：导出 SDK 预置策略
- **宽度**：约 720px（双栏选择器需要横向空间）
- **触发方**：应用管理页 / 应用详情页 / 应用列表行操作
- **关闭方式**：右上 × 关闭、底部「取消」、底部「确定」
- **遮挡关系**：z-index 顶层；点击遮罩**不关闭**（防误触）

---

## 2. 弹窗内容（自上而下）

### 2.1 注意事项（公告式说明）

> 1. 修改 SDK 预置策略后需等待 **15 分钟**完成服务端同步，方可执行导出操作；
> 2. 应用管理支持批量导出策略文件，需确保 **SDK 版本 ≥ 6.4.58** 且与集成版本一致，详情[帮助文档]；
> 3. 常规 / 共享广告位策略须通过聚合管理新建，**共享位须绑定常规广告位**方可导出策略；
> 4. 存在 AB 实验的广告位流量分组将无法在「待确定聚合广告位」中选取；
> 5. 未选择聚合广告位时仍可导出应用策略优化共享位请求，**建议同步导出共享位策略**以确保效果。

实现细节：
- 列表式 5 条，左侧序号、加粗关键名词（15 分钟 / 6.4.58 / 共享位 / 待确定聚合广告位）
- 「帮助文档」做成 `<a href="..." target="_blank">` 文字链
- 整体用淡色背景区块（DESIGN.md 里的 `--color-info-bg`）包裹，区别于表单区

### 2.2 表单区

| 字段 | 控件 | 必填 | 备注 |
|------|------|------|------|
| 请选择聚合 SDK 版本 | 下拉 | ✅ | 候选来自 `app_network_binding` 或单独的 `sdk_version_def` 表（待确认数据源），默认选中该应用已绑定的 SDK 版本 |
| 共享位指定生效应用版本号 | 下拉 | ✅ | 候选项：**不限制 / [semver 列表]**；默认"不限制" |
| 已选择应用 | 卡片列表 | ✅ | 默认带入当前打开弹窗时所在的 app；多选时显示多张卡片 |

「已选择应用」卡片样式（图示）：
- 左侧：app icon（圆角方块，蓝色背景 + 白色首字）
- 中部：app_name（如「新义互动」）
- 下部：`ID: <app_key>` + 「复制」icon
- 卡片右上：× 移除按钮（多选时显示）

### 2.3 双栏聚合广告位选择器

```
┌────────────────────────┐  ┌────────────────────────┐
│ 待确定聚合广告位         │  │ 已确定聚合广告位         │
│  ┌──────────────────┐  │  │  ┌──────────────────┐  │
│  │ 横幅广告          │ →│  │  │ 激励视频          │   │
│  │ app_x / 横幅 / 1 │  │  │  │ app_x / 激励 / 4 │   │
│  └──────────────────┘  │  │  └──────────────────┘  │
│  ┌──────────────────┐  │  │                        │
│  │ 开屏广告         →│  │  │  (空状态：暂无数据)     │
│  │ app_x / 开屏 / 5 │  │  │                        │
│  └──────────────────┘  │  │                        │
└────────────────────────┘  └────────────────────────┘
```

#### 左栏「待确定聚合广告位」

数据源：`placement` 表
- 过滤：`app_key IN (选中应用列表) AND status = 1`
- 排序：按 format 升序，再按 placement_id 升序
- **排除**：所属流量分组存在 AB 实验（`traffic_group.experiment_id IS NOT NULL`）
- 显示：广告位名 / 所属 app / 格式标签 / 状态
- 单击行 → 移动到右栏（不是多选 checkbox 模式）

#### 右栏「已确定聚合广告位」

数据源：左栏选中项
- 单击行 → 移回左栏
- 支持**拖拽排序**（顺序决定导出策略中广告位的优先级）

#### 双栏宽度

- 等宽 1:1
- 整体高度固定 280px，列内滚动
- 两栏之间不画中间按钮（点击即移动，更现代）

#### 空状态

- 左栏无数据：`<el-empty description="暂无可选广告位" />`
- 右栏无数据：`<el-empty description="尚未选择聚合广告位" />`

### 2.4 底部按钮

| 按钮 | 行为 |
|------|------|
| 取消 | 关闭弹窗，丢弃所有选择 |
| 确定 | 提交选中数据 + 触发导出 |

- 「确定」点击后：
  1. 先做表单校验（SDK 版本 + 至少一个应用）
  2. 校验通过 → loading → 调后端 `/app/export-sdk-policy`（路径待定）
  3. 后端返回 `downloadUrl`（对象存储签名 URL / 文件流）
  4. 前端用 **fetch + blob 模式**自动下载（不用 `<a download>`，跨域 download 会被忽略）
  5. 下载完成 → 关闭弹窗 → ElMessage.success('导出成功')
  6. 失败 → ElMessage.error(err.message) + 不关闭弹窗

---

## 3. 数据模型（待建 / 需确认）

| 表 | 字段 | 类型 | 用途 |
|----|------|------|------|
| `placement` | `sdk_version_min` | VARCHAR(16) | 弹窗校验"SDK 版本 ≥ 6.4.58"（如未建） |
| `placement` | `is_shared` | BOOLEAN | 共享位标识（"共享位须绑定常规广告位"） |
| `placement` | `bind_regular_placement_id` | VARCHAR | 共享位绑定的常规广告位 |
| `traffic_group` | `experiment_id` | VARCHAR | AB 实验标识（"存在 AB 实验则排除"） |
| `app` | `sdk_version` | VARCHAR(16) | 应用级 SDK 版本（"已绑定的 SDK 版本"下拉默认） |
| `app` | `effect_version` | VARCHAR(16) | 共享位生效版本（"共享位指定生效应用版本号"候选） |

> 上述字段**当前不一定存在**；开发前需在 Supabase 控制台核对并建表。

---

## 4. 接口设计（草案）

### 4.1 下拉数据接口

| 接口 | 方法 | 入参 | 出参 |
|------|------|------|------|
| `/console/app/sdk-versions` | GET | — | `[{ value, label, isMin: boolean }]` |
| `/console/app/effect-versions` | GET | `appKey` | `[{ value, label }]`（含"不限制"） |
| `/console/placement/candidates` | GET | `appKeys: string[]` | `[{ id, placementId, name, appKey, format, status, isShared }]` |

### 4.2 导出接口

| 接口 | 方法 | 入参 | 出参 |
|------|------|------|------|
| `/console/app/export-sdk-policy` | POST | `{ sdkVersion, effectVersion, appKeys: string[], placementIds: string[] }` | `{ downloadUrl: string, filename: string, expiresAt: number }` |

后端逻辑：
1. 校验 SDK 版本 ≥ 6.4.58（硬编码常量）
2. 校验 placementIds 全部属于 appKeys
3. 校验 placementIds 中没有 AB 实验的流量分组
4. 校验共享位必须绑定常规广告位
5. 生成 zip（每个 app 一个 json）→ 上传对象存储 → 返回签名 URL
6. 签名 URL 有效期 1 小时

---

## 5. UI/UX 细则

- **弹窗宽度**：720px（双栏需要横向空间）
- **行间距**：表单字段 16px；表单与双栏之间 24px
- **注意事项**：淡蓝底（`--color-info-bg`）+ 左侧 4px 蓝色竖条（DESIGN.md 警告样式）
- **空状态**：用 `<el-empty>` 标准组件
- **SDK 版本下拉**：
  - 选项 label = `6.6.22`
  - value = 字符串 `6.6.22`
  - 不可手动输入（`el-select` 非 `el-input` 模式）
- **确定按钮 loading**：调接口期间 spinner 旋转 + 文案「导出中...」

---

## 6. 设计禁忌

- ❌ 双栏中间加左右箭头按钮（点击行移动更现代）
- ❌ 用 `<a download>` 直接下载跨域 URL（会被浏览器忽略）
- ❌ 「确定」按钮点击后立刻关闭弹窗（要等接口返回 + 触发下载后再关）
- ❌ 共享位没绑定常规广告位时还允许导出（应禁用 / 提示）
- ❌ AB 实验的 placement 还在「待确定聚合广告位」里露出（必须 filter 掉）
- ❌ 在前端硬编码 `6.4.58`（从后端常量接口 / DB 读）

---

## 7. 开发步骤（待用户确认后启动）

1. **DB 准备**：建上述新字段（如未建）；加 AB 实验字段默认 NULL
2. **后端**：
   - 3 个下拉数据接口（sdk-versions / effect-versions / placement candidates）
   - 1 个导出接口（generate zip + 对象存储 + 签名 URL）
3. **前端**：
   - `src/views/app/components/ExportSdkPolicyDialog.vue`（新组件）
   - `src/views/app/Index.vue` / `AppDrawer.vue` 加触发按钮
   - `src/utils/download.ts` 通用 fetch+blob 下载工具
4. **联调**：从 `dashboard-test@demo.com` 登录 → 选「开心消消乐」+ 选 2 个 placement + 选 SDK 6.6.22 + 导出 → 验证 zip 下载 + 内容正确
5. **回归**：ts-check / lint / 静态检查 + 5 个接口冒烟

---

## 8. 待用户确认事项

- [ ] SDK 版本下拉数据源（DB 常量表 vs 后端硬编码 vs 调聚合管理接口）
- [ ] 共享位「绑定常规广告位」的 UI 入口在哪（是否要新加个 dialog / 表单字段？）
- [ ] 「不限制」选项是默认还是置顶
- [ ] 多应用导出时 zip 内文件名规则（按 app_name / app_key / 其他）
- [ ] 对象存储桶名 / 路径规则（`adtalos/sdk-policy/{developer_id}/{timestamp}.zip`？）
- [ ] 「帮助文档」链接的目标 URL
