/**
 * Prebuild script for DB migration and seeding.
 *
 * Runs the migrations, then the production seed (`scripts/seed.ts`), which
 * only inserts initial rows that are still missing.
 *
 * Skips both when no DB environment variable is set
 * (POSTGRES_URL_NON_POOLING, POSTGRES_URL, DATABASE_URL) in the environment,
 * `.env.local` or `.env` — the same sources `pnpm db:run-migrate` reads.
 */
import { execSync } from "node:child_process";

import { resolveMigrationDatabaseUrl } from "./_lib/database-url";
import { loadScriptEnv } from "./_lib/load-script-env";

loadScriptEnv();

const hasDbConnection = resolveMigrationDatabaseUrl();

if (!hasDbConnection) {
  console.log(
    "No database connection configured (POSTGRES_URL_NON_POOLING / POSTGRES_URL / DATABASE_URL not set). Skipping DB migration and seed.",
  );
  process.exit(0);
}

try {
  execSync("pnpm db:run-migrate", { stdio: "inherit" });
  execSync("pnpm db:seed", { stdio: "inherit" });
} catch (error) {
  console.error("Database prebuild failed:", error);
  process.exit(1);
}
