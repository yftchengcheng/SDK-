import { getSupabaseClient } from './utils/supabase-client';

export { getSupabaseClient };
export const db = getSupabaseClient();

/**
 * 在 SQL 会话中临时设置 current_developer_id，用于 RLS 隔离。
 *
 * 当前架构：service_role key 默认 BYPASSRLS，RLS 不会生效。
 * 未来切换到 non-superuser 角色 + anon key + JWT 时，本函数将自动生效。
 *
 * 调用时机：每个 HTTP 请求处理开始时（已在 authMiddleware 之后）。
 */
export async function setSessionDeveloperId(developerId: string): Promise<void> {
  // Supabase JS 客户端不直接暴露 SET LOCAL，使用 RPC 调用
  // 创建一个轻量函数 set_app_developer_id(varchar) 即可触发
  try {
    await db.rpc('set_app_developer_id', { p_developer_id: developerId });
  } catch {
    // RPC 不存在时静默（migration 0005 启用 RLS 时才需要这个函数）
  }
}
