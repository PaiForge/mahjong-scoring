import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

import {
  excludedRanksBetter,
  rankingOrder,
  rankingOrderSql,
} from "../ranking-order";
import { challengeBestScores } from "../schema";

/**
 * このファイルは drizzle-orm をモックせず、実際に発行される SQL 文字列を検証する。
 * 順位決定ルールは Drizzle 版・生 SQL 版・UPSERT のタプル比較という3つの表現を
 * 持つため、どれか1つだけがずれる事故を文字列で押さえる。
 */
const dialect = new PgDialect();
const toSql = (fragment: Parameters<PgDialect["sqlToQuery"]>[0]): string =>
  dialect.sqlToQuery(fragment).sql;

describe("rankingOrder", () => {
  it("スコア降順・ミス昇順・所要時間昇順の順で列を並べる", () => {
    expect(rankingOrder(challengeBestScores).map(toSql)).toEqual([
      '"challenge_best_scores"."score" desc',
      '"challenge_best_scores"."incorrect_answers" asc',
      '"challenge_best_scores"."time_taken" asc',
    ]);
  });
});

describe("rankingOrderSql", () => {
  it("別名を省略すると列を修飾しない", () => {
    expect(toSql(rankingOrderSql())).toBe(
      "score DESC, incorrect_answers ASC, time_taken ASC",
    );
  });

  it("別名を渡すと全ての列を修飾する", () => {
    expect(toSql(rankingOrderSql("best"))).toBe(
      "best.score DESC, best.incorrect_answers ASC, best.time_taken ASC",
    );
  });

  it("Drizzle 版と同じ列を同じ向きで並べる", () => {
    const fromDrizzle = rankingOrder(challengeBestScores)
      .map(toSql)
      .map((s) => s.replace(/"/g, "").replace("challenge_best_scores.", ""))
      .join(", ")
      .toUpperCase();
    expect(toSql(rankingOrderSql()).toUpperCase()).toBe(fromDrizzle);
  });

  it("識別子として使えない別名は拒否する", () => {
    expect(() => rankingOrderSql('x"; DROP TABLE users; --')).toThrow();
    expect(() => rankingOrderSql("")).toThrow();
    expect(() => rankingOrderSql("1st")).toThrow();
  });
});

describe("excludedRanksBetter", () => {
  it("昇順の項目は符号を反転して1つのタプル比較にまとめる", () => {
    expect(toSql(excludedRanksBetter(challengeBestScores))).toBe(
      "(EXCLUDED.score, -EXCLUDED.incorrect_answers, -EXCLUDED.time_taken) > " +
        '("challenge_best_scores"."score", -"challenge_best_scores"."incorrect_answers", ' +
        '-"challenge_best_scores"."time_taken")',
    );
  });
});
