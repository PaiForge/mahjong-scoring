import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * 統合テストの接続先がローカルホストの DB であることを確かめる
 * テストDBのローカル確認
 *
 * 統合テストはスキーマを作って消し、行を入れて消す。接続先を取り違えて外部の
 * DB に流さないよう、ホストがローカル（`localhost` / `127.0.0.1` / `[::1]`）で
 * なければ接続する前に止める。未設定も同じ扱い。
 *
 * @param url - 環境変数から読んだ接続文字列
 * @param envName - その環境変数の名前（エラーの文言に出す）
 * @returns 確かめた接続文字列
 * @throws 未設定、またはホストがローカルでないとき
 */
export function requireLocalDatabaseUrl(
  url: string | undefined,
  envName: string,
): string {
  if (
    !url ||
    !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)
  )
    throw new Error(`Local ${envName} required`);
  return url;
}

/**
 * 専用スキーマを使う統合テスト用 DB の指定
 * 専用スキーマテストDBの指定
 */
export interface IsolatedSchemaTestDbOptions {
  /** スキーマ名の接頭辞（`<prefix>_test_<実行ごとの乱数>` になる） */
  readonly prefix: string;
  /** 流すマイグレーション（`drizzle/` 直下のファイル名。依存の順） */
  readonly migrations: readonly string[];
}

/**
 * この実行だけの専用スキーマを持つ、統合テスト用の DB を作る
 * 専用スキーマテストDB
 *
 * `BILLING_TEST_DATABASE_URL`（ローカルホストの DB だけ）に専用スキーマを作り、
 * 指定したマイグレーションの DDL を `"public".` をそのスキーマに読み替えて流す。
 * アプリの表とマイグレーションの journal には触れない。ロックの競合や並行した
 * 書き込みを実際の複数接続で確かめるため、接続を複数持つ（一時テーブルは接続ごとに
 * 閉じるので使えない）。
 *
 * 環境変数はどのテストも同じものを使う。turbo の `test` タスクが通す変数が
 * これと `CHALLENGE_TEST_DATABASE_URL` だけのため。スキーマ名は実行ごと・
 * 呼び出しごとに別なので、別の統合テストと並んで走っても衝突しない。
 *
 * 接続は最初に使ったときに開く（未設定の環境でこのモジュールを読み込んだだけでは
 * 止まらない。統合テストは変数が無ければ `describe.skipIf` で飛ばす）。
 *
 * このモジュールはテスト専用。
 */
export function createIsolatedSchemaTestDb({
  prefix,
  migrations,
}: IsolatedSchemaTestDbOptions) {
  const namespace = `${prefix}_test_${randomUUID().replaceAll("-", "")}`;
  let client: ReturnType<typeof postgres> | undefined;

  /** 専用スキーマを検索パスにした接続（最大 4 接続）。無ければ開く */
  function connect() {
    const url = requireLocalDatabaseUrl(
      process.env.BILLING_TEST_DATABASE_URL,
      "BILLING_TEST_DATABASE_URL",
    );
    client ??= postgres(url, {
      max: 4,
      prepare: false,
      connection: { search_path: namespace },
    });
    return client;
  }

  return {
    /** 専用スキーマの名前（表を素の SQL で指すときに使う） */
    namespace,
    /** 素の SQL を流す接続。無ければ開く */
    connect,
    /** Drizzle のクライアント。接続が無ければ開く */
    db() {
      return drizzle(connect(), { schema });
    },
    /** 専用スキーマを作り、マイグレーションの DDL を流す */
    async setup() {
      const connection = connect();
      await connection.unsafe(`CREATE SCHEMA "${namespace}"`);
      for (const name of migrations) {
        const ddl = await readFile(
          new URL(`../../../drizzle/${name}`, import.meta.url),
          "utf8",
        );
        await connection.unsafe(ddl.replaceAll('"public".', `"${namespace}".`));
      }
    },
    /**
     * 表の行を空にする（テストの間で使う）。接続を開いていなければ何もしない
     *
     * @param tables - 空にする表（参照の向きの順）
     */
    async clear(tables: readonly string[]) {
      for (const table of tables) {
        await client?.unsafe(`DELETE FROM "${namespace}"."${table}"`);
      }
    },
    /** この実行が作ったスキーマだけを破棄して接続を閉じる */
    async close() {
      if (client) {
        await client.unsafe(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
        await client.end();
        client = undefined;
      }
    },
  };
}
