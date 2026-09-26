import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";

let client: ReturnType<typeof postgres> | undefined;
/** 統合テスト専用。一時テーブルを同一接続に閉じ、外部DBへの接続は拒否する。 */
export function challengeTestDb() {
  const raw = process.env.CHALLENGE_TEST_DATABASE_URL;
  if (
    !raw ||
    !["localhost", "127.0.0.1", "[::1]"].includes(new URL(raw).hostname)
  )
    throw new Error("Local CHALLENGE_TEST_DATABASE_URL required");
  client ??= postgres(raw, { max: 1, prepare: false });
  return drizzle(client, { schema });
}
/** テスト接続を閉じると一時テーブルも破棄される。 */
export async function closeChallengeTestDb() {
  await client?.end();
  client = undefined;
}
