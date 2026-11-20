import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { requireLocalDatabaseUrl } from "../db/isolated-schema-test-db";
import * as schema from "../db/schema";

let client: ReturnType<typeof postgres> | undefined;
/** 統合テスト専用。一時テーブルを同一接続に閉じ、外部DBへの接続は拒否する。 */
export function challengeTestDb() {
  const raw = requireLocalDatabaseUrl(
    process.env.CHALLENGE_TEST_DATABASE_URL,
    "CHALLENGE_TEST_DATABASE_URL",
  );
  client ??= postgres(raw, { max: 1, prepare: false });
  return drizzle(client, { schema });
}
/** テスト接続を閉じると一時テーブルも破棄される。 */
export async function closeChallengeTestDb() {
  await client?.end();
  client = undefined;
}
