import { asc, desc, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/**
 * ランキングの正準ソート順（スコア降順 → ミス昇順 → 所要時間昇順）
 * ランキング順序定義
 *
 * 順位決定ルールの唯一の定義。Drizzle のクエリビルダ・生 SQL・UPSERT の
 * タプル比較という 3 つの表現がいずれもここから導出されるため、順位の
 * 決め方を変えるときに触るのはこの配列だけでよい。
 *
 * `direction` は「良い成績が先に来る向き」を表す。`desc` は値が大きいほど
 * 上位、`asc` は値が小さいほど上位。
 */
const RANKING_ORDER = [
  { key: "score", sqlName: "score", direction: "desc" },
  { key: "incorrectAnswers", sqlName: "incorrect_answers", direction: "asc" },
  { key: "timeTaken", sqlName: "time_taken", direction: "asc" },
] as const;

/** 順位決定に使う列の集合。ランキング対象のテーブル・サブクエリが満たす形 */
export type RankingColumns = {
  readonly [K in (typeof RANKING_ORDER)[number]["key"]]: PgColumn;
};

/**
 * Drizzle の `orderBy` に渡す順序式を返す
 * ランキング順序（Drizzle）
 *
 * @param columns - 順位付け対象のテーブルまたはサブクエリの列
 */
export function rankingOrder(columns: RankingColumns): SQL[] {
  return RANKING_ORDER.map((entry) =>
    entry.direction === "desc"
      ? desc(columns[entry.key])
      : asc(columns[entry.key]),
  );
}

/**
 * 列を修飾する別名として許す形
 *
 * この関数はテーブル別名を生 SQL に直接埋め込むため、呼び出し側が渡せる値を
 * 素の識別子に限る。別名はコード中のリテラルしか想定しておらず、外部入力を
 * 通してはいけない。
 */
const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

/**
 * 生 SQL の `ORDER BY` 句に埋め込む順序式を作る
 * ランキング順序（生 SQL）
 *
 * `ROW_NUMBER() OVER (ORDER BY ...)` や `DISTINCT ON ... ORDER BY` のように
 * Drizzle のクエリビルダで書けない箇所から使う。
 *
 * @param alias - 列を修飾するテーブル名または別名。省略すると修飾しないため、
 *   FROM に関係が1つしかないスコープでしか使えない。結合を含むスコープでは
 *   必ず渡すこと（渡さないと同名の列があったときに実行時エラーになる）。
 */
export function rankingOrderSql(alias?: string): SQL {
  if (alias !== undefined && !SAFE_IDENTIFIER.test(alias)) {
    throw new Error(`ランキング順序の別名として使えません: ${alias}`);
  }
  const qualifier = alias === undefined ? "" : `${alias}.`;

  return sql.join(
    RANKING_ORDER.map((entry) =>
      sql.raw(
        `${qualifier}${entry.sqlName} ${entry.direction === "desc" ? "DESC" : "ASC"}`,
      ),
    ),
    sql`, `,
  );
}

/**
 * UPSERT の `setWhere` 用に、挿入行が既存行より上位かを判定する式を返す
 * ベスト更新判定
 *
 * 各項目を「大きいほど上位」の向きに揃えたタプル同士を比較する。昇順項目は
 * 符号を反転させることで、単一のタプル比較で優先順位付きの判定になる。
 *
 * @param columns - 既存行（更新対象テーブル）の列
 */
export function excludedRanksBetter(columns: RankingColumns): SQL {
  const excluded = RANKING_ORDER.map((entry) =>
    sql.raw(
      entry.direction === "desc"
        ? `EXCLUDED.${entry.sqlName}`
        : `-EXCLUDED.${entry.sqlName}`,
    ),
  );
  const current = RANKING_ORDER.map((entry) =>
    entry.direction === "desc"
      ? sql`${columns[entry.key]}`
      : sql`-${columns[entry.key]}`,
  );

  return sql`(${sql.join(excluded, sql`, `)}) > (${sql.join(current, sql`, `)})`;
}
