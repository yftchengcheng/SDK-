import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.COZE_SUPABASE_URL, process.env.COZE_SUPABASE_SERVICE_ROLE_KEY);
const { data } = await supabase.from('waterfall_config').select('id, placement_id, traffic_group_id, version, config_name, created_at').order('created_at', { ascending: false }).limit(10);
console.log(data);
