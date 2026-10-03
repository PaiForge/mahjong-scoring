import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/**
 * 開発時の HMR で接続が増え続けないよう、クライアントを globalThis に
 * 1 つだけ保持する。`globalThis` の型を広げずに済むよう `Reflect` で読み書きする
 * （`Reflect.get` の戻り値は any なので、注釈した型に収まる）。
 */
const POSTGRES_CLIENT_KEY = Symbol.for("mahjong-scoring.postgresClient");
const cachedClient: ReturnType<typeof postgres> | undefined = Reflect.get(
  globalThis,
  POSTGRES_CLIENT_KEY,
);

const client = cachedClient ?? postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  Reflect.set(globalThis, POSTGRES_CLIENT_KEY, client);
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
