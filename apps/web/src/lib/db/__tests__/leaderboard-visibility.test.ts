import { describe, expect, it, vi } from "vitest";

import { PgDialect } from "drizzle-orm/pg-core";

// db は接続を持つだけで、ここで検証するのは SQL の組み立てのみ
vi.mock("../index", () => ({ db: {} }));

import {
  notHiddenFromLeaderboard,
  visibleProfileJoinSql,
} from "../leaderboard-visibility";

const dialect = new PgDialect();

function render(fragment: Parameters<PgDialect["sqlToQuery"]>[0]) {
  return dialect.sqlToQuery(fragment);
}

describe("notHiddenFromLeaderboard", () => {
  it("compares the profiles column against false", () => {
    const { sql, params } = render(notHiddenFromLeaderboard());

    expect(sql).toContain('"profiles"."hidden_from_leaderboard"');
    expect(params).toEqual([false]);
  });
});

describe("visibleProfileJoinSql", () => {
  it.each(["challenge_best_scores", "challenge_results"] as const)(
    "joins profiles on %s.user_id and excludes hidden users",
    (alias) => {
      const { sql, params } = render(visibleProfileJoinSql(alias));
      const normalized = sql.replace(/\s+/g, " ").trim();

      expect(normalized).toBe(
        `INNER JOIN profiles lb_profile ON lb_profile.id = ${alias}.user_id AND NOT lb_profile.hidden_from_leaderboard`,
      );
      // 別名はリテラルを直に埋め込む。プレースホルダを増やしていないことを確かめる
      expect(params).toEqual([]);
    },
  );
});
