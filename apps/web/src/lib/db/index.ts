import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const globalForDb = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
};

const client =
  globalForDb.postgresClient ?? postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });

export * from "./schema";

/**
 * トランザクション内で使うクライアント
 * トランザクションクライアント
 *
 * `db.transaction(async (tx) => ...)` の tx の型。Drizzle が型を
 * 公開していないためコールバック引数から導出する。
 */
export type TransactionClient = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];
