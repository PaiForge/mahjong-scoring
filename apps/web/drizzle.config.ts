import { defineConfig } from "drizzle-kit";

import {
  LOCAL_SUPABASE_DATABASE_URL,
  resolveMigrationDatabaseUrl,
} from "./scripts/_lib/database-url";
import { loadScriptEnv } from "./scripts/_lib/load-script-env";

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
