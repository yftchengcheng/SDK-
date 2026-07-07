-- =====================================================================
-- 0003_hal_schema.sql - 智能客服 HAL 模块
-- =====================================================================
-- 包含 3 张表：hal_session / hal_message / hal_ticket
-- 上传时间：2026-07-07
-- =====================================================================

-- 清理已存在的表（按依赖倒序）
DROP TABLE IF EXISTS hal_message CASCADE;
DROP TABLE IF EXISTS hal_ticket CASCADE;
DROP TABLE IF EXISTS hal_session CASCADE;

-- =====================================================================
-- 1. hal_session - HAL 客服会话
-- =====================================================================
CREATE TABLE hal_session (
  id                BIGSERIAL PRIMARY KEY,
  session_id        TEXT UNIQUE NOT NULL,            -- 会话 ID（uuid）
  developer_id      TEXT NOT NULL,                    -- 所属开发者
  title             VARCHAR(200),                     -- 会话主题（首条消息摘要）
  status            SMALLINT DEFAULT 1,               -- 1=进行中 2=已关闭 3=已升级工单
  human_agent_id    TEXT,                             -- 人工坐席 ID（NULL=纯 HAL）
  message_count     INTEGER DEFAULT 0,                -- 消息数
  unresolved_count  INTEGER DEFAULT 0,                -- 连续未解决计数（用户可标记 / 自动识别）
  started_at        TIMESTAMPTZ DEFAULT now(),
  last_message_at   TIMESTAMPTZ DEFAULT now(),
  closed_at         TIMESTAMPTZ
);

-- =====================================================================
-- 2. hal_message - 会话消息
-- =====================================================================
CREATE TABLE hal_message (
  id              BIGSERIAL PRIMARY KEY,
  message_id      TEXT UNIQUE NOT NULL,              -- 消息 ID
  session_id      TEXT NOT NULL,                     -- 所属会话
  role            VARCHAR(20) NOT NULL,              -- user / hal / agent / system
  content         TEXT NOT NULL,                     -- 消息内容
  helpful         SMALLINT,                          -- 1=有用 0=无用 NULL=未标记
  slack_synced    SMALLINT DEFAULT 0,                -- 1=已同步 Slack
  slack_msg_ts    VARCHAR(50),                       -- Slack 消息时间戳
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 3. hal_ticket - 升级工单
-- =====================================================================
CREATE TABLE hal_ticket (
  id              BIGSERIAL PRIMARY KEY,
  ticket_id       TEXT UNIQUE NOT NULL,              -- 工单 ID
  session_id      TEXT,                              -- 关联会话（可空）
  developer_id    TEXT NOT NULL,                     -- 所属开发者
  title           VARCHAR(200) NOT NULL,             -- 工单标题
  description     TEXT NOT NULL,                     -- 工单描述（含对话摘要）
  priority        SMALLINT DEFAULT 2,                -- 1=低 2=中 3=高 4=加急
  status          SMALLINT DEFAULT 1,                -- 1=待处理 2=处理中 3=已解决 4=已关闭
  assignee        TEXT,                              -- 处理人 / 工程师
  slack_channel   VARCHAR(50),                       -- Slack 频道
  slack_msg_ts    VARCHAR(50),                       -- Slack 工单通知时间戳
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 索引
-- =====================================================================
CREATE INDEX idx_hal_session_dev ON hal_session(developer_id, status);
CREATE INDEX idx hal_session_lastmsg ON hal_session(last_message_at DESC);
CREATE INDEX idx_hal_msg_session ON hal_message(session_id, created_at);
CREATE INDEX idx_hal_ticket_dev ON hal_ticket(developer_id, status);
CREATE INDEX idx_hal_ticket_session ON hal_ticket(session_id);
CREATE INDEX idx_hal_ticket_priority ON hal_ticket(priority, status);

-- =====================================================================
-- RLS 策略（Row Level Security）- 当前未启用
-- 当前后端使用 service_role key 直连，绕过 RLS
-- =====================================================================

-- 完成
COMMENT ON TABLE hal_session IS 'HAL 智能客服会话';
COMMENT ON TABLE hal_message IS 'HAL 会话消息';
COMMENT ON TABLE hal_ticket IS 'HAL 升级工单';
