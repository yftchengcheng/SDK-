import { getSupabaseClient } from './utils/supabase-client';

export { getSupabaseClient };
export const db = getSupabaseClient();
