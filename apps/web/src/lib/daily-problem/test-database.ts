import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../db/schema";

/**
 * 本日の問題の統合テスト用の DB
 * 本日の問題テストDB
 *
 * 問題の保存の統合テスト（`lib/practice-problems/test-database.ts`）と同じ作法:
 * `BILLING_TEST_DATABASE_URL`（ローカルホストの DB だけ）に、この実行だけの
 * 専用スキーマを作り、`practice_problems` と本日の問題の 2 表の作成マイグレーションを
 * 流す。アプリの表とマイグレーションの journal には触れない。並行した選出を実際の
 * 複数接続で確かめるため、接続を複数持つ。
 *
 * このモジュールはテスト専用。
 */

const namespace = `daily_problem_test_${randomUUID().replaceAll("-", "")}`;
let client: ReturnType<typeof postgres> | undefined;

/** 流す作成マイグレーション（依存の順） */
const MIGRATIONS = [
  "20261008085348_create_account_deletions.sql",
  "20261008222040_add_apple_refresh_tokens.sql",
  "20261115230546_create_practice_problems.sql",
  "20261117104232_create_daily_problems.sql",
] as const;

/** テスト用スキーマへの接続（最大 4 接続） */
export function dailyProblemTestDb() {
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

/** 専用スキーマを作り、3 表の DDL を流す */
export async function setupDailyProblemTestDb() {
  dailyProblemTestDb();
  if (!client) throw new Error("Test DB not initialized");
  await client.unsafe(`CREATE SCHEMA "${namespace}"`);
  for (const file of MIGRATIONS) {
    const ddl = await readFile(
      new URL(`../../../drizzle/${file}`, import.meta.url),
      "utf8",
    );
    await client.unsafe(ddl.replaceAll('"public".', `"${namespace}".`));
  }
}

/** 行を空にする（テストの間で使う。参照の向きの順に消す） */
export async function clearDailyProblemTestDb() {
  await client?.unsafe(`DELETE FROM "${namespace}"."account_deletions"`);
  await client?.unsafe(`DELETE FROM "${namespace}"."daily_problem_answers"`);
  await client?.unsafe(`DELETE FROM "${namespace}"."daily_problems"`);
  await client?.unsafe(`DELETE FROM "${namespace}"."practice_problems"`);
}

/** この実行が作ったスキーマだけを破棄して接続を閉じる */
export async function closeDailyProblemTestDb() {
  if (client) {
    await client.unsafe(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
    await client.end();
    client = undefined;
  }
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
  dailyProblemTestDb();
  if (!client) throw new Error("Test DB not initialized");
  const contentHash = createHash("sha256").update(randomUUID()).digest("hex");
  // 壊れた盤面の行も入れるため、型付きの insert を通さず JSON の文字列で入れる
  const [inserted] = await client`
    INSERT INTO ${client(namespace)}."practice_problems"
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
