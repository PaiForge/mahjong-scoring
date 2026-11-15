import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../db/schema";

/**
 * 問題の保存の統合テスト用の DB
 * 問題保存テストDB
 *
 * `PRACTICE_PROBLEMS_TEST_DATABASE_URL`（ローカルホストの DB だけ）に、この実行
 * だけの専用スキーマを作ってマイグレーションの DDL を流す。アプリの表と
 * マイグレーションの journal には触れない。並行保存を実際の複数接続で確かめる
 * ため、接続を複数持つ（一時テーブルは接続ごとに閉じるので使えない）。
 *
 * このモジュールはテスト専用。
 */

const namespace = `practice_problems_test_${randomUUID().replaceAll("-", "")}`;
let client: ReturnType<typeof postgres> | undefined;

/** テスト用スキーマへの接続（最大 4 接続） */
export function practiceProblemsTestDb() {
  const url = process.env.PRACTICE_PROBLEMS_TEST_DATABASE_URL;
  if (
    !url ||
    !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)
  )
    throw new Error("Local PRACTICE_PROBLEMS_TEST_DATABASE_URL required");
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
