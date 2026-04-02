/**
 * Prebuild script for DB migration.
 *
 * Skips migration when no DB environment variable is set
 * (POSTGRES_URL_NON_POOLING, POSTGRES_URL, DATABASE_URL).
 */
import 'dotenv/config';
import { execSync } from 'node:child_process';

const hasDbConnection =
  process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!hasDbConnection) {
  console.log(
    'No database connection configured (POSTGRES_URL_NON_POOLING / POSTGRES_URL / DATABASE_URL not set). Skipping DB migration.'
  );
  process.exit(0);
}

try {
  execSync('pnpm db:run-migrate', { stdio: 'inherit' });
} catch (error) {
  console.error('Database prebuild failed:', error);
  process.exit(1);
}
