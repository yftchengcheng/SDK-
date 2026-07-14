import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.COZE_SUPABASE_URL, process.env.COZE_SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await supabase.from('waterfall_config').select('*').eq('placement_id', '58');
console.log('all:', data?.map(c => ({ id: c.id, tg: c.traffic_group_id, ver: c.version, name: c.config_name, layers: c.layers ? 'Y' : 'N' })));
