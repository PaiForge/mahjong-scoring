import { createIsolatedSchemaTestDb } from "../db/isolated-schema-test-db";

/**
 * 問題の報告の統合テスト用の DB
 * 問題報告テストDB
 *
 * この実行だけの専用スキーマ（{@link createIsolatedSchemaTestDb}。接続先・
 * 環境変数・複数接続の理由はそちら）に、退会の受付（`writeAsAccount` が読む）・
 * 保存問題・問題の報告の作成マイグレーションを流す。
 *
 * このモジュールはテスト専用。
 */

const testDb = createIsolatedSchemaTestDb({
  prefix: "problem_reports",
  // 流すマイグレーション（依存の順）
  migrations: [
    "20261008085348_create_account_deletions.sql",
    "20261008222040_add_apple_refresh_tokens.sql",
    "20261115230546_create_practice_problems.sql",
    "20261120214035_create_problem_reports.sql",
  ],
});
const { namespace } = testDb;

/** テスト用スキーマへの接続（最大 4 接続） */
export function problemReportsTestDb() {
  return testDb.db();
}

/** 専用スキーマを作り、マイグレーションの DDL を流す */
export async function setupProblemReportsTestDb() {
  await testDb.setup();
}

/**
 * Supabase のクライアントロールがあるか（通常の PostgreSQL では RLS のロール検証だけ省く）
 */
export async function hasProblemReportsClientRole(): Promise<boolean> {
  const client = testDb.connect();
  const roles =
    await client`SELECT 1 FROM pg_roles WHERE rolname = 'authenticated'`;
  return roles.length > 0;
}

/**
 * 一括 REVOKE より前を再現し、SELECT の権限を持つクライアントロールで報告を読む
 * 問題報告のRLS検証
 *
 * 専用スキーマ内だけに権限を付ける。ロールはトランザクション内で切り替えるので、
 * プールの次の利用者に持ち越さない。Supabase ローカルの authenticated を使う。
 */
export async function readProblemReportsAsClient() {
  const client = testDb.connect();
  return client.begin(async (connection) => {
    await connection.unsafe(
      `GRANT USAGE ON SCHEMA "${namespace}" TO authenticated`,
    );
    await connection.unsafe(
      `GRANT SELECT ON "${namespace}"."problem_reports" TO authenticated`,
    );
    await connection`SET LOCAL ROLE authenticated`;
    return connection.unsafe(`SELECT * FROM "${namespace}"."problem_reports"`);
  });
}

/** 行を空にする（テストの間で使う。参照の向きの順に消す） */
export async function clearProblemReportsTestDb() {
  await testDb.clear([
    "account_deletions",
    "problem_reports",
    "practice_problems",
  ]);
}

/** この実行が作ったスキーマだけを破棄して接続を閉じる */
export async function closeProblemReportsTestDb() {
  await testDb.close();
}
