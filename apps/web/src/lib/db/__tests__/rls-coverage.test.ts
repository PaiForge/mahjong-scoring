import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * RLS の不変条件: `schema.ts` が宣言するすべてのテーブルは、
 * `drizzle/supabase/rls_policies.sql` で RLS が有効化されている。
 *
 * Supabase は `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES
 * TO anon, authenticated, service_role` を既定で持つ。つまり新しいテーブルは
 * 作られた瞬間から publishable key だけで PostgREST（`/rest/v1/<table>`）越しに
 * 読み書きできる状態で生まれる。RLS を有効化するまで閉じない。
 *
 * この不変条件が破れると、たとえば `user_roles` のように「管理者かどうか」を
 * 決めるだけの表が全公開になり、一般ユーザーが自分に admin 行を INSERT できる。
 * 実際に 2026-09 の監査でこの状態だった（ローカルの Supabase に対して
 * `GET /rest/v1/user_roles` が匿名で 200 + 全行を返し、`SET ROLE authenticated`
 * での admin 行 INSERT も通ることを実測で確認した）。
 *
 * アプリ自身のクエリは Drizzle の直 DB 接続で RLS をバイパスするため、
 * この穴は画面を触っても一切気づけない。だから静的に検査する。
 *
 * 有効化の宣言だけを見て、ポリシーの中身までは見ない。「何を許すか」は
 * テーブルごとの判断だが、「RLS を有効にし忘れない」は例外のない規約のため。
 */
const DB_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const WEB_ROOT = join(DB_DIR, "..", "..", "..");

const SCHEMA_SQL = readFileSync(join(DB_DIR, "schema.ts"), "utf8");
const RLS_SQL = readFileSync(
  join(WEB_ROOT, "drizzle", "supabase", "rls_policies.sql"),
  "utf8",
);
const GRANTS_SQL = readFileSync(
  join(WEB_ROOT, "drizzle", "supabase", "foreign_keys_and_grants.sql"),
  "utf8",
);

/**
 * クライアントロールに書き込みを許してよい表。
 *
 * ここに無い表への INSERT / UPDATE / DELETE は、サーバー（Drizzle の直 DB 接続）
 * だけが行う。特に challenge_results / challenge_best_scores を足してはいけない
 * — own-row の RLS は「誰の行か」しか見ず「スコアが正しいか」は見ないため、
 * 書き込みを許した時点でリーダーボードと昇級判定の入力が publishable key だけで
 * 捏造できるようになる（2026-09 の監査で実際にこの状態だった）。
 */
const CLIENT_WRITABLE_TABLES: readonly string[] = [
  // 本人のプロフィール。登録・編集はクライアントの Supabase セッションで行う
  "profiles",
  // 章の読了マーク。値は「読んだ」の有無だけで、順位や資格に影響しない
  "learn_chapter_reads",
];

const WRITE_PRIVILEGES = ["INSERT", "UPDATE", "DELETE"] as const;

/** `pgTable("name", ...)` の第 1 引数を集める */
function declaredTables(source: string): string[] {
  return [...source.matchAll(/pgTable\(\s*"([a-z0-9_]+)"/g)].map(
    (match) => match[1]!,
  );
}

/** `ALTER TABLE "name" ENABLE ROW LEVEL SECURITY` の対象を集める */
function rlsEnabledTables(sql: string): Set<string> {
  return new Set(
    [
      ...sql.matchAll(
        /ALTER TABLE\s+"([a-z0-9_]+)"\s+ENABLE ROW LEVEL SECURITY/gi,
      ),
    ].map((match) => match[1]!),
  );
}

describe("RLS coverage", () => {
  const tables = declaredTables(SCHEMA_SQL);
  const enabled = rlsEnabledTables(RLS_SQL);

  it("schema.ts からテーブルを抽出できている", () => {
    // 正規表現が壊れて 0 件になると、以下の検査が素通りしてしまう
    expect(tables.length).toBeGreaterThan(0);
    expect(tables).toContain("user_roles");
  });

  it.each(tables)("%s は RLS が有効化されている", (table) => {
    expect(enabled).toContain(table);
  });

  /**
   * GRANT 文を消しても権限は減らない。Supabase の既定権限が全表に全権限を
   * 付けているため、先に REVOKE していない限り GRANT 文は註釈にすぎない。
   * この一括 REVOKE が消えると、以下の検査も含めて全部が無意味になる。
   */
  it("クライアントロールの既定権限を一括 REVOKE している", () => {
    expect(GRANTS_SQL).toMatch(/REVOKE ALL ON %s FROM anon, authenticated/);
  });

  it.each(WRITE_PRIVILEGES)(
    "%s を許可しているのは許可リストの表だけ",
    (privilege) => {
      const granted = [
        ...GRANTS_SQL.matchAll(
          /^GRANT\s+([A-Z, ]+?)\s+ON TABLE public\.([a-z0-9_]+)\s+TO\s+([a-z, ]+);/gm,
        ),
      ]
        .filter(
          (match) =>
            match[1]!.includes(privilege) &&
            /\b(anon|authenticated)\b/.test(match[3]!),
        )
        .map((match) => match[2]!);

      expect(
        granted.filter((table) => !CLIENT_WRITABLE_TABLES.includes(table)),
      ).toEqual([]);
    },
  );
});
