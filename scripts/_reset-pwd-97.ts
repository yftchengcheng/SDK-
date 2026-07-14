import { getSupabaseClient } from '../server/utils/supabase-client';
import bcrypt from 'bcryptjs';
const hash = bcrypt.hashSync('Test123456', 10);
console.log('hash:', hash);
const c = getSupabaseClient();
const { data, error } = await c.from('developer').update({ password_hash: hash }).eq('id', 97).select('id,email,password_hash');
console.log('res:', JSON.stringify({ data, error: error?.message }));
