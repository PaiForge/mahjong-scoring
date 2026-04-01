import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import postgres from 'postgres';
import { fileURLToPath } from 'url';

dotenv.config({ path: ['.env.local', '.env'] });

const __dirname = dirname(fileURLToPath(import.meta.url));

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.log('No database connection configured. Skipping migration.');
  process.exit(0);
}

const client = postgres(connectionString, { prepare: false, max: 1 });
const db = drizzle(client);

async function isSupabaseEnvironment(): Promise<boolean> {
  const result = await client`SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin'`;
  return result.length > 0;
}

async function runForeignKeysAndGrants() {
  const sql = readFileSync(
    join(__dirname, '..', 'drizzle', 'supabase', 'foreign_keys_and_grants.sql'),
    'utf-8'
  );
  await client.unsafe(sql);
}

async function runRlsPolicies() {
  const rlsSql = readFileSync(
    join(__dirname, '..', 'drizzle', 'supabase', 'rls_policies.sql'),
    'utf-8'
  );
  await client.unsafe(rlsSql);
}

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete!');

  if (await isSupabaseEnvironment()) {
    console.log('Applying foreign keys and grants...');
    await runForeignKeysAndGrants();
    console.log('Foreign keys and grants applied!');

    console.log('Applying RLS policies...');
    await runRlsPolicies();
    console.log('RLS policies applied!');
  } else {
    console.log('Local environment detected. Skipping Supabase-only setup.');
  }

  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
