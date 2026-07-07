# 数据库 Migrations

本目录包含 SDK 聚合系统的数据库 Schema 迁移脚本。

## 执行顺序

在 Supabase 控制台 SQL Editor 中**按文件名顺序**执行：

| 文件 | 说明 |
|------|------|
| `0001_init_schema.sql` | 创建 13 张业务表 + RLS 策略 + 预置 5 家通用广告网络 |
| `0002_seed_demo_data.sql` | 演示数据（1 个开发者 + 2 个应用 + 4 个广告位 + 报表/消息等） |

## 13 张表

| 表名 | 用途 | 关联 |
|------|------|------|
| `developer` | 开发者账号 | - |
| `app` | 应用 | developer |
| `placement` | 广告位 | app |
| `ad_source` | 广告源 | developer |
| `ad_network_def` | 广告网络定义（通用 + 自定义） | developer |
| `waterfall_config` | 瀑布流配置 | placement, traffic_group |
| `waterfall_layer` | 瀑布流层级明细 | waterfall_config, ad_source |
| `traffic_group` | 流量分组 | developer, placement |
| `report_daily` | 日报表聚合 | developer |
| `custom_network_report` | 自定义网络数据 | developer, ad_network_def |
| `app_network_binding` | 应用-网络关联 | app, ad_network_def |
| `custom_adapter_version` | 自定义 Adapter 版本 | ad_network_def |
| `message` | 消息中心 | developer |

## RLS 策略

13 张表全部启用 Row Level Security，通过 `app.current_developer_id` Postgres setting 隔离数据。

**重要**：当前后端使用 `service_role` key 直连，会绕过 RLS。RLS 策略作为安全备份，在切到按用户 JWT 操作时自动生效。

## 演示账号

执行 `0002_seed_demo_data.sql` 后，可用以下账号登录：

- 邮箱：`demo@xinyi.io`
- 密码：`demo123456`

> 注：密码 hash 已硬编码在 SQL 中。如需重新生成，执行 `pnpm tsx scripts/hash-password.ts demo123456`。
