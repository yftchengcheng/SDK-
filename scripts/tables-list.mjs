import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('NO ENV'); process.exit(1); }
const c = createClient(url, key);
const { data, error } = await c.from('information_schema.tables').select('table_name').eq('table_schema', 'public').order('table_name');
if (error) { console.error(error); process.exit(1); }
console.log(data.map(t => t.table_name).join('\n'));
