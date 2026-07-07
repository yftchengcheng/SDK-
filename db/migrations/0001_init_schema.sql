-- =====================================================================
-- 新义SDK聚合系统 - 数据库初始化 (含 RLS 策略)
-- =====================================================================
-- 实际 schema 校对：表名与字段名以 information_schema 为准
-- 上传时间：2026-07-07
-- =====================================================================

-- 清理已存在的表
DROP TABLE IF EXISTS custom_network_report CASCADE;
DROP TABLE IF EXISTS app_network_binding CASCADE;
DROP TABLE IF EXISTS custom_adapter_version CASCADE;
DROP TABLE IF EXISTS ad_network_def CASCADE;
DROP TABLE IF EXISTS message CASCADE;
DROP TABLE IF EXISTS report_daily CASCADE;
DROP TABLE IF EXISTS traffic_group CASCADE;
DROP TABLE IF EXISTS waterfall_layer CASCADE;
DROP TABLE IF EXISTS waterfall_config CASCADE;
DROP TABLE IF EXISTS ad_source CASCADE;
DROP TABLE IF EXISTS placement CASCADE;
DROP TABLE IF EXISTS app CASCADE;
DROP TABLE IF EXISTS developer CASCADE;
DROP TABLE IF EXISTS health_check CASCADE;

-- =====================================================================
-- 1. developer - 开发者表
-- =====================================================================
CREATE TABLE developer (
  developer_id  TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  company_name  TEXT,
  status        SMALLINT DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 2. app - 应用表
-- =====================================================================
CREATE TABLE app (
  id           BIGSERIAL PRIMARY KEY,
  developer_id TEXT NOT NULL REFERENCES developer(developer_id) ON DELETE CASCADE,
  app_key      TEXT NOT NULL,
  app_name     TEXT NOT NULL,
  platform     TEXT NOT NULL,
  package_name TEXT,
  status       SMALLINT DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(developer_id, app_key)
);

-- =====================================================================
-- 3. placement - 广告位表
-- =====================================================================
CREATE TABLE placement (
  id              BIGSERIAL PRIMARY KEY,
  developer_id    TEXT NOT NULL REFERENCES developer(developer_id) ON DELETE CASCADE,
  app_id          BIGINT NOT NULL REFERENCES app(id) ON DELETE CASCADE,
  placement_key   TEXT NOT NULL,
  placement_name  TEXT NOT NULL,
  ad_type         TEXT NOT NULL,
  template_id     TEXT,
  status          SMALLINT DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(developer_id, app_id, placement_key)
);

-- =====================================================================
-- 4. ad_source - 广告源表（开发者配置的）
-- =====================================================================
CREATE TABLE ad_source (
  id           BIGSERIAL PRIMARY KEY,
  developer_id TEXT NOT NULL REFERENCES developer(developer_id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  ad_type      TEXT NOT NULL,
  app_id       TEXT,
  placement_id TEXT,
  status       SMALLINT DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 5. waterfall_config - 瀑布流配置表
-- =====================================================================
CREATE TABLE waterfall_config (
  id           BIGSERIAL PRIMARY KEY,
  developer_id TEXT NOT NULL REFERENCES developer(developer_id) ON DELETE CASCADE,
  placement_id BIGINT NOT NULL REFERENCES placement(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  strategy     TEXT NOT NULL DEFAULT 'priority',
  status       SMALLINT DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 6. waterfall_layer - 瀑布流层级表
-- =====================================================================
CREATE TABLE waterfall_layer (
  id                BIGSERIAL PRIMARY KEY,
  developer_id      TEXT NOT NULL REFERENCES developer(developer_id) ON DELETE CASCADE,
  waterfall_id      BIGINT NOT NULL REFERENCES waterfall_config(id) ON DELETE CASCADE,
  layer_index       INT NOT NULL,
  ad_source_id      BIGINT,
  network_def_id    BIGINT,
  timeout_ms        INT DEFAULT 5000,
  ecpm_floor        NUMERIC(10, 4) DEFAULT 0,
  priority          INT DEFAULT 0,
  status            SMALLINT DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 7. traffic_group - 流量分组表
-- =====================================================================
CREATE TABLE traffic_group (
  id                BIGSERIAL PRIMARY KEY,
  developer_id      TEXT NOT NULL REFERENCES developer(developer_id) ON DELETE CASCADE,
  group_name        TEXT NOT NULL,
  group_code        TEXT NOT NULL,
  percentage        INT DEFAULT 100,
  filter_rules      JSONB DEFAULT '{}'::jsonb,
  status            SMALLINT DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(developer_id, group_code)
);

-- =====================================================================
-- 8. report_daily - 日报表聚合表（SDK 上报）
-- 字段命名遵循原 schema：requests / fills / impressions / clicks / revenue
-- =====================================================================
CREATE TABLE report_daily (
  id           BIGSERIAL PRIMARY KEY,
  developer_id TEXT NOT NULL REFERENCES developer(developer_id) ON DELETE CASCADE,
  app_key      TEXT NOT NULL,
  placement_id TEXT NOT NULL,
  ad_source_id BIGINT,
  stat_date    DATE NOT NULL,
  requests     INTEGER DEFAULT 0,
  fills        INTEGER DEFAULT 0,
  impressions  INTEGER DEFAULT 0,
  clicks       INTEGER DEFAULT 0,
  revenue      NUMERIC(15, 4) DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(developer_id, app_key, placement_id, ad_source_id, stat_date)
);
CREATE INDEX idx_report_daily_date ON report_daily(stat_date);

-- =====================================================================
-- 9. message - 消息中心表
-- =====================================================================
CREATE TABLE message (
  id           BIGSERIAL PRIMARY KEY,
  developer_id TEXT NOT NULL REFERENCES developer(developer_id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  is_read      SMALLINT DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 10. custom_adapter_version - 自定义 Adapter 版本表
-- =====================================================================
CREATE TABLE custom_adapter_version (
  id               BIGSERIAL PRIMARY KEY,
  network_def_id   BIGINT,
  developer_id     TEXT NOT NULL REFERENCES developer(developer_id) ON DELETE CASCADE,
  version          TEXT NOT NULL,
  file_name        TEXT NOT NULL,
  file_url         TEXT NOT NULL,
  file_size        BIGINT,
  file_md5         TEXT,
  sdk_min_version  TEXT,
  changelog        TEXT,
  status           SMALLINT DEFAULT 1, -- 1=pending, 2=approved, 3=rejected
  review_comment   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      TEXT
);

-- =====================================================================
-- 11. custom_network_report - 自定义网络数据上传表
-- 字段命名遵循原 schema：impressions / clicks / revenue
-- =====================================================================
CREATE TABLE custom_network_report (
  id             BIGSERIAL PRIMARY KEY,
  developer_id   TEXT NOT NULL REFERENCES developer(developer_id) ON DELETE CASCADE,
  app_key        TEXT NOT NULL,
  placement_id   TEXT NOT NULL,
  network_def_id BIGINT NOT NULL,
  stat_date      DATE NOT NULL,
  impressions    INTEGER DEFAULT 0,
  clicks         INTEGER DEFAULT 0,
  revenue        NUMERIC(15, 4) DEFAULT 0,
  upload_type    SMALLINT DEFAULT 1, -- 1=api, 2=manual
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(developer_id, app_key, placement_id, network_def_id, stat_date)
);
CREATE INDEX idx_custom_report_date ON custom_network_report(stat_date);

-- =====================================================================
-- 12. app_network_binding - 应用广告网络绑定表
-- =====================================================================
CREATE TABLE app_network_binding (
  id                 BIGSERIAL PRIMARY KEY,
  app_key            TEXT NOT NULL,
  network_def_id     BIGINT NOT NULL,
  adapter_version_id BIGINT,
  network_app_id     TEXT,
  extra_params       JSONB DEFAULT '{}'::jsonb,
  status             SMALLINT DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(app_key, network_def_id)
);

-- =====================================================================
-- 13. ad_network_def - 广告网络定义表
-- =====================================================================
CREATE TABLE ad_network_def (
  id                       BIGSERIAL PRIMARY KEY,
  network_code             TEXT UNIQUE NOT NULL,
  network_name             TEXT NOT NULL,
  network_type             SMALLINT DEFAULT 1,
  adapter_class_init       TEXT,
  adapter_class_banner     TEXT,
  adapter_class_interstitial TEXT,
  adapter_class_rewarded   TEXT,
  adapter_class_native     TEXT,
  adapter_class_splash     TEXT,
  supports_bidding         SMALLINT DEFAULT 0,
  status                   SMALLINT DEFAULT 1,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 14. health_check - 健康检查表（监控 SDK 上报）
-- =====================================================================
CREATE TABLE health_check (
  id           BIGSERIAL PRIMARY KEY,
  developer_id TEXT NOT NULL,
  app_key      TEXT NOT NULL,
  sdk_version  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 索引优化
-- =====================================================================
CREATE INDEX idx_app_developer ON app(developer_id);
CREATE INDEX idx_placement_app ON placement(app_id);
CREATE INDEX idx_waterfall_layer_wid ON waterfall_layer(waterfall_id);
CREATE INDEX idx_traffic_group_dev ON traffic_group(developer_id);
CREATE INDEX idx_message_dev ON message(developer_id, is_read);
CREATE INDEX idx_adapter_dev ON custom_adapter_version(developer_id);
CREATE INDEX idx_app_binding_app ON app_network_binding(app_key);

-- =====================================================================
-- RLS 策略（Row Level Security）- 当前未启用
-- 当前后端使用 service_role key 直连，绕过 RLS
-- 未来需要启用时：先执行 ALTER TABLE ... ENABLE ROW LEVEL SECURITY
-- =====================================================================

-- 完成
COMMENT ON DATABASE postgres IS '新义SDK聚合系统 - 初始化完成 (14 张表)';
