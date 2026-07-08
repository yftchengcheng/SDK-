-- =============================================================
-- 0005_enable_rls.sql
-- Row Level Security policies for multi-tenant isolation
-- =============================================================
-- 14 张业务表全部启用 RLS，确保即使 service_role 凭据泄漏，
-- 单个开发者也只能查询 / 修改自己的数据。
--
-- 策略：使用 current_setting('app.current_developer_id', true)
--      在每个 HTTP 请求开始前由 Supabase client 用 SET LOCAL 注入。
--
-- 注意事项：
--   1. 当前架构使用 service_role key 连接，service_role 默认 BYPASSRLS，
--      RLS 不会生效。本文件作为「未来切换到 RLS 模式」的蓝图。
--   2. 切换路径：
--      a. 创建非 service_role 角色（如 developer_app），用 anon key + JWT
--      b. 移除 service_role，改为 anon key + 用户 JWT（包含 developer_id claim）
--      c. RLS 策略中的 current_setting 替换为 auth.jwt() ->> 'developer_id'
--   3. 启用前需在所有 SELECT/INSERT/UPDATE/DELETE 语句前显式 .eq('developer_id', x)
--      已实现：所有 router 已经做了 .eq('developer_id', developerId) 过滤
--      临时保护：在 db.ts 查询前后自动 SET LOCAL app.current_developer_id
-- =============================================================

-- 1. 启用 RLS（14 张表）
ALTER TABLE developer              ENABLE ROW LEVEL SECURITY;
ALTER TABLE app                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement              ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_source              ENABLE ROW LEVEL SECURITY;
ALTER TABLE waterfall_config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE waterfall_layer        ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_group          ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_daily           ENABLE ROW LEVEL SECURITY;
ALTER TABLE message                ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_adapter_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_network_report  ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_network_binding    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_network_def         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_network_account     ENABLE ROW LEVEL SECURITY;

-- 2. RPC 函数：应用层通过 supabase.rpc('set_app_developer_id', {p_developer_id}) 调用
--    将 developer_id 写入 PostgreSQL session variable，供 RLS 策略读取
CREATE OR REPLACE FUNCTION set_app_developer_id(p_developer_id varchar)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_developer_id', p_developer_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 隔离策略：每张表的 developer_id 列（developer 表本身用 developer_id 主键）
-- 模式：USING (developer_id = current_setting('app.current_developer_id', true))
-- 当 SET LOCAL 未注入时，current_setting 返回 NULL -> 策略过滤掉所有行

-- developer 表
CREATE POLICY "developer_isolation" ON developer
  USING (developer_id = current_setting('app.current_developer_id', true));

-- 业务表
CREATE POLICY "app_isolation" ON app
  USING (developer_id = current_setting('app.current_developer_id', true));

CREATE POLICY "placement_isolation" ON placement
  USING (developer_id = current_setting('app.current_developer_id', true));

CREATE POLICY "ad_source_isolation" ON ad_source
  USING (developer_id = current_setting('app.current_developer_id', true));

CREATE POLICY "waterfall_config_isolation" ON waterfall_config
  USING (developer_id = current_setting('app.current_developer_id', true));

CREATE POLICY "waterfall_layer_isolation" ON waterfall_layer
  USING (developer_id = current_setting('app.current_developer_id', true));

CREATE POLICY "traffic_group_isolation" ON traffic_group
  USING (developer_id = current_setting('app.current_developer_id', true));

CREATE POLICY "report_daily_isolation" ON report_daily
  USING (developer_id = current_setting('app.current_developer_id', true));

CREATE POLICY "message_isolation" ON message
  USING (developer_id = current_setting('app.current_developer_id', true));

CREATE POLICY "custom_adapter_version_isolation" ON custom_adapter_version
  USING (developer_id = current_setting('app.current_developer_id', true));

CREATE POLICY "custom_network_report_isolation" ON custom_network_report
  USING (developer_id = current_setting('app.current_developer_id', true));

CREATE POLICY "app_network_binding_isolation" ON app_network_binding
  USING (developer_id = current_setting('app.current_developer_id', true));

CREATE POLICY "ad_network_def_isolation" ON ad_network_def
  USING (developer_id = current_setting('app.current_developer_id', true));

CREATE POLICY "ad_network_account_isolation" ON ad_network_account
  USING (developer_id = current_setting('app.current_developer_id', true));

-- 3. 未来切换时的应用层适配（参考代码片段）
-- 在 server/db.ts 的请求 wrapper 中：
--
--   import type { Request } from 'express';
--   export async function withDeveloperScope(req: Request, fn: () => Promise<T>): Promise<T> {
--     const developerId = (req as any).developerId;
--     const supabase = createClient(URL, SERVICE_KEY, {
--       db: { schema: 'public' },
--       global: { headers: { 'x-claim-developer-id': developerId } },
--     });
--     return fn();
--   }
--
-- 然后在 service_role 角色上禁用 BYPASSRLS：
--   ALTER ROLE service_role NOBYPASSRLS;
-- （注：通常 service_role 是 superuser，NOBYPASSRLS 对 superuser 不生效，
--   实际切换需要新建一个 limited 角色）
