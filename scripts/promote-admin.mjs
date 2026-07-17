import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
const url = execSync('python3 -c "import sys; sys.path.insert(0,\"/app/work\"); from common import COZE_SUPABASE_URL; print(COZE_SUPABASE_URL)"', { encoding: 'utf-8' }).trim();
const key = execSync('python3 -c "import sys; sys.path.insert(0,\"/app/work\"); from common import COZE_SUPABASE_SERVICE_ROLE_KEY; print(COZE_SUPABASE_SERVICE_ROLE_KEY)"', { encoding: 'utf-8' }).trim();
const c = createClient(url, key);
const { data, error } = await c.from('developer').update({ role: 'admin' }).eq('email', 'prd@prd.com').select();
if (error) { console.error(error); process.exit(1); }
console.log('updated:', data?.length, 'rows');
