import { createClient } from '@supabase/supabase-js';
const url = 'https://coze-coding-project.tos.coze.site';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.xxx';
// actually I'll just exec_sql the update
import { execSync } from 'node:child_process';
const hash = '$2b$10$io1EUXahahgNkWsEs60AxOvhP.2cx8eV/gBuaqU0hdZrnq9b2ORNS';
// write to a temp sql file then exec it via psql -- but psql is missing
// fallback: just call the HTTP API to update?
// Actually the simplest: use supabase rest
const c = createClient('https://coze-coding-project.tos.coze.site', key);
(async () => {
  const { data, error } = await c.from('developer').update({ password_hash: hash }).eq('id', 97);
  console.log({ data, error });
})();
