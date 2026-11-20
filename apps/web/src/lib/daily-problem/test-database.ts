import { createHash, randomUUID } from "node:crypto";

import { createIsolatedSchemaTestDb } from "../db/isolated-schema-test-db";

/**
 * 本日の問題の統合テスト用の DB
 * 本日の問題テストDB
 *
 * この実行だけの専用スキーマ（{@link createIsolatedSchemaTestDb}）に、
 * `practice_problems` と本日の問題の 2 表の作成マイグレーションを流す。
 * 並行した選出を実際の複数接続で確かめるため、接続を複数持つ。
 *
 * このモジュールはテスト専用。
 */

const testDb = createIsolatedSchemaTestDb({
  prefix: "daily_problem",
  // 流す作成マイグレーション（依存の順）
  migrations: [
    "20261008085348_create_account_deletions.sql",
    "20261008222040_add_apple_refresh_tokens.sql",
    "20261115230546_create_practice_problems.sql",
    "20261117104232_create_daily_problems.sql",
    "20261117223813_add_daily_problem_visibility.sql",
  ],
});

/** テスト用スキーマへの接続（最大 4 接続） */
export function dailyProblemTestDb() {
  return testDb.db();
}

/** 専用スキーマを作り、3 表の DDL を流す */
export async function setupDailyProblemTestDb() {
  await testDb.setup();
}

/** 行を空にする（テストの間で使う。参照の向きの順に消す） */
export async function clearDailyProblemTestDb() {
  await testDb.clear([
    "account_deletions",
    "daily_problem_answers",
    "daily_problems",
    "practice_problems",
  ]);
}

/** この実行が作ったスキーマだけを破棄して接続を閉じる */
export async function closeDailyProblemTestDb() {
  await testDb.close();
}

/**
 * 保存問題の行を 1 つ入れて ID を返す
 *
 * 同一性のハッシュはテストでは意味を持たないので、行ごとに別の値にする
 * （一意制約に当たらないように）。
 */
export async function insertPracticeProblem(row: {
  readonly kind: "agari-score" | "tenpai-score";
  readonly payload: unknown;
  readonly createdAt: Date;
  readonly schemaVersion?: number;
}): Promise<string> {
  const client = testDb.connect();
  const contentHash = createHash("sha256").update(randomUUID()).digest("hex");
  // 壊れた盤面の行も入れるため、型付きの insert を通さず JSON の文字列で入れる
  const [inserted] = await client`
    INSERT INTO ${client(testDb.namespace)}."practice_problems"
      (kind, schema_version, identity_version, content_hash, payload, source, created_at)
    VALUES (${row.kind}, ${row.schemaVersion ?? 1}, 1, ${contentHash},
      ${JSON.stringify(row.payload)}::jsonb, 'web',
      ${row.createdAt.toISOString()}::timestamptz)
    RETURNING id`;
  const id: unknown = inserted?.id;
  if (typeof id !== "string")
    throw new Error("practice_problems insert failed");
  return id;
}
