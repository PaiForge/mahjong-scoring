import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../db/schema";

/**
 * 問題の保存の統合テスト用の DB
 * 問題保存テストDB
 *
 * `BILLING_TEST_DATABASE_URL`（ローカルホストの DB だけ）に、この実行
 * だけの専用スキーマを作ってマイグレーションの DDL を流す。アプリの表と
 * マイグレーションの journal には触れない。並行保存を実際の複数接続で確かめる
 * ため、接続を複数持つ（一時テーブルは接続ごとに閉じるので使えない）。
 *
 * 環境変数は課金の統合テスト（`lib/billing/test-database.ts`）と同じものを使う。
 * 専用スキーマを作る同じ作法のテストで、turbo の `test` タスクが通す変数も
 * これと `CHALLENGE_TEST_DATABASE_URL` だけ。スキーマ名は実行ごとに別なので、
 * 課金のテストと並んで走っても衝突しない。
 *
 * このモジュールはテスト専用。
 */

const namespace = `practice_problems_test_${randomUUID().replaceAll("-", "")}`;
let client: ReturnType<typeof postgres> | undefined;

/** テスト用スキーマへの接続（最大 4 接続） */
export function practiceProblemsTestDb() {
  const url = process.env.BILLING_TEST_DATABASE_URL;
  if (
    !url ||
    !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)
  )
    throw new Error("Local BILLING_TEST_DATABASE_URL required");
  client ??= postgres(url, {
    max: 4,
    prepare: false,
    connection: { search_path: namespace },
  });
  return drizzle(client, { schema });
}

/** 専用スキーマを作り、`practice_problems` の DDL だけを流す */
export async function setupPracticeProblemsTestDb() {
  practiceProblemsTestDb();
  if (!client) throw new Error("Test DB not initialized");
  await client.unsafe(`CREATE SCHEMA "${namespace}"`);
  const ddl = await readFile(
    new URL(
      "../../../drizzle/20261115230546_create_practice_problems.sql",
      import.meta.url,
    ),
    "utf8",
  );
  await client.unsafe(ddl.replaceAll('"public".', `"${namespace}".`));
}

/**
 * Supabase のクライアントロールがあるか（通常の PostgreSQL では RLS のロール検証だけ省く）
 */
export async function hasPracticeProblemsClientRole(): Promise<boolean> {
  practiceProblemsTestDb();
  if (!client) throw new Error("Test DB not initialized");
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
  practiceProblemsTestDb();
  if (!client) throw new Error("Test DB not initialized");
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
  await client?.unsafe(`DELETE FROM "${namespace}"."practice_problems"`);
}

/** この実行が作ったスキーマだけを破棄して接続を閉じる */
export async function closePracticeProblemsTestDb() {
  if (client) {
    await client.unsafe(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
    await client.end();
    client = undefined;
  }
}
