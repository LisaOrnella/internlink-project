// Runs the database security tests against a LOCAL PostgreSQL (no Supabase needed).
// Usage:  node scripts/test-sql.mjs                       (uses PGHOST/PGUSER/... env or defaults)
//         PGUSER=postgres PGPASSWORD=secret node scripts/test-sql.mjs
// It creates a throw-away database "internlink_test", applies a tiny stand-in for Supabase's auth/storage
// schemas, then every migration, then the behavioural RLS tests. It never touches other databases.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const db = 'internlink_test';
const psql = (args, opts = {}) => spawnSync('psql', ['-v', 'ON_ERROR_STOP=1', '-q', '-X', ...args], { encoding: 'utf8', ...opts });
const fail = (msg, r) => { console.error(`\n✗ ${msg}\n${r?.stderr ?? ''}${r?.stdout ?? ''}`); process.exit(1); };

let r = psql(['-d', 'postgres', '-c', `drop database if exists ${db}`, '-c', `create database ${db}`]);
if (r.status !== 0) fail('Could not connect to PostgreSQL. Set PGHOST / PGPORT / PGUSER / PGPASSWORD (the user must be allowed to create databases).', r);

const migrations = readdirSync(join(root, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort();
const steps = [join(root, 'tests/sql/00_supabase_stub.sql'), ...migrations.map((f) => join(root, 'supabase/migrations', f)), join(root, 'supabase/seed.sql')];
for (const file of steps) {
  r = psql(['-d', db, '-f', file]);
  if (r.status !== 0) fail(`Failed applying ${file}`, r);
  console.log(`✓ applied ${file.replace(root + '/', '')}`);
}
r = psql(['-d', db, '-t', '-A', '-f', join(root, 'tests/sql/01_rls_workflow.sql')]);
const out = (r.stdout ?? '') + (r.stderr ?? '');
if (r.status !== 0 || !out.includes('ALL RLS TESTS PASSED')) fail('RLS tests failed', r);
console.log('✓ ALL RLS TESTS PASSED');
psql(['-d', 'postgres', '-c', `drop database if exists ${db}`]);
