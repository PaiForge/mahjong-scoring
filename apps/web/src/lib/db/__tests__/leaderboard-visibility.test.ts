import { describe, expect, it, vi } from "vitest";

import { PgDialect } from "drizzle-orm/pg-core";

// db は接続を持つだけで、ここで検証するのは SQL の組み立てのみ
vi.mock("../index", () => ({ db: {} }));

import {
  visibleOnLeaderboard,
  visibleProfileJoinSql,
} from "../leaderboard-visibility";

const dialect = new PgDialect();

function render(fragment: Parameters<PgDialect["sqlToQuery"]>[0]) {
  return dialect.sqlToQuery(fragment);
}

describe("visibleOnLeaderboard", () => {
  it("excludes hidden, banned and deleted users", () => {
    const fragment = visibleOnLeaderboard();
    if (fragment === undefined) throw new Error("expected a condition");
    const { sql, params } = render(fragment);

    expect(sql).toContain('"profiles"."hidden_from_leaderboard" = $1');
    expect(sql).toContain('"profiles"."banned_at" is null');
    expect(sql).toContain('"profiles"."deleted_at" is null');
    expect(params).toEqual([false]);
  });
});

describe("visibleProfileJoinSql", () => {
  it.each(["challenge_best_scores", "challenge_results"] as const)(
    "joins profiles on %s.user_id and excludes hidden, banned and deleted users",
    (alias) => {
      const { sql, params } = render(visibleProfileJoinSql(alias));
      const normalized = sql.replace(/\s+/g, " ").trim();

      expect(normalized).toBe(
        `INNER JOIN profiles lb_profile ON lb_profile.id = ${alias}.user_id AND NOT lb_profile.hidden_from_leaderboard AND lb_profile.banned_at IS NULL AND lb_profile.deleted_at IS NULL`,
      );
      // 別名はリテラルを直に埋め込む。プレースホルダを増やしていないことを確かめる
      expect(params).toEqual([]);
    },
  );
});
