import { createIsolatedSchemaTestDb } from "../db/isolated-schema-test-db";

/**
 * 問題の保存の統合テスト用の DB
 * 問題保存テストDB
 *
 * この実行だけの専用スキーマ（{@link createIsolatedSchemaTestDb}。接続先・
 * 環境変数・複数接続の理由はそちら）に `practice_problems` の DDL を流す。
 *
 * このモジュールはテスト専用。
 */

const testDb = createIsolatedSchemaTestDb({
  prefix: "practice_problems",
  migrations: ["20261115230546_create_practice_problems.sql"],
});
const { namespace } = testDb;

/** テスト用スキーマへの接続（最大 4 接続） */
export function practiceProblemsTestDb() {
  return testDb.db();
}

/** 専用スキーマを作り、`practice_problems` の DDL だけを流す */
export async function setupPracticeProblemsTestDb() {
  await testDb.setup();
}

/**
 * Supabase のクライアントロールがあるか（通常の PostgreSQL では RLS のロール検証だけ省く）
 */
export async function hasPracticeProblemsClientRole(): Promise<boolean> {
  const client = testDb.connect();
  const roles =
    await client`SELECT 1 FROM pg_roles WHERE rolname = 'authenticated'`;
  return roles.length > 0;
}

/**
 * 一括 REVOKE より前を再現し、権限のあるクライアントロールでアクセスする
 * 保存問題のRLS検証
 *
 * 専用スキーマ内だけに権限を付ける。ロールはトランザクション内で切り替えるので、
 * プールの次の利用者に持ち越さない。Supabase ローカルの authenticated を使う。
 */
export async function queryPracticeProblemsAsClient(
  operation: "read" | "insert",
) {
  const client = testDb.connect();
  return client.begin(async (connection) => {
    await connection.unsafe(
      `GRANT USAGE ON SCHEMA "${namespace}" TO authenticated`,
    );
    await connection.unsafe(
      `GRANT SELECT, INSERT ON "${namespace}"."practice_problems" TO authenticated`,
    );
    await connection`SET LOCAL ROLE authenticated`;
    if (operation === "read") {
      return connection.unsafe(
        `SELECT * FROM "${namespace}"."practice_problems"`,
      );
    }
    return connection.unsafe(`INSERT INTO "${namespace}"."practice_problems"
      (kind, schema_version, identity_version, content_hash, payload, source)
      VALUES ('agari-score', 1, 1, repeat('0', 64), '{}', 'web')`);
  });
}

/** 行を空にする（テストの間で使う） */
export async function clearPracticeProblemsTestDb() {
  await testDb.clear(["practice_problems"]);
}

/** この実行が作ったスキーマだけを破棄して接続を閉じる */
export async function closePracticeProblemsTestDb() {
  await testDb.close();
}
