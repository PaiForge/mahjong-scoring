import { defineConfig } from "drizzle-kit";

import { resolveMigrationDatabaseUrl } from "./scripts/_lib/database-url";
import { loadScriptEnv } from "./scripts/_lib/load-script-env";
import { LOCAL_SUPABASE_DATABASE_URL } from "./src/lib/local-supabase";

loadScriptEnv();

const databaseUrl =
  resolveMigrationDatabaseUrl() ?? LOCAL_SUPABASE_DATABASE_URL;

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  migrations: {
    prefix: "timestamp",
  },
});
