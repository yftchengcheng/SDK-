import { Client } from 'pg';
const c = new Client({ connectionString: process.env.SUPABASE_DB_URL });
await c.connect();
await c.query("NOTIFY pgrst, 'reload schema'");
await c.end();
console.log('notified');
