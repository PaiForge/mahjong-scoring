import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("./index", () => ({ db: {} }));

const { evaluateRankRequirements } = await import("./rank-evaluation");

/** テスト用の評価コンテキスト（menuType:leaderboardKey → ベストスコア） */
function contextOf(bestScores: Record<string, number>) {
  return {
    getBestScore: (menuType: string, leaderboardKey: string) =>
      bestScores[`${menuType}:${leaderboardKey}`],
  };
}

const KYU5_REQUIREMENT = {
  type: "challenge_score",
  menuType: "mangan_exam",
  leaderboardKey: "default",
  minScore: 10,
} as const;

describe("evaluateRankRequirements", () => {
  it("ベストスコアが閾値以上なら達成", () => {
    const ctx = contextOf({ "mangan_exam:default": 10 });
    expect(evaluateRankRequirements(ctx, [KYU5_REQUIREMENT])).toBe(true);
  });

  it("ベストスコアが閾値未満なら未達成", () => {
    const ctx = contextOf({ "mangan_exam:default": 9 });
    expect(evaluateRankRequirements(ctx, [KYU5_REQUIREMENT])).toBe(false);
  });

  it("記録が無い（未受験）なら未達成", () => {
    const ctx = contextOf({});
    expect(evaluateRankRequirements(ctx, [KYU5_REQUIREMENT])).toBe(false);
  });

  it("別の leaderboardKey の記録では達成にならない", () => {
    const ctx = contextOf({ "mangan_exam:other": 99 });
    expect(evaluateRankRequirements(ctx, [KYU5_REQUIREMENT])).toBe(false);
  });

  it("複数要件は暗黙の AND（1つでも未達成なら未達成）", () => {
    const other = {
      type: "challenge_score",
      menuType: "score_calculation",
      leaderboardKey: "default",
      minScore: 5,
    } as const;
    const ctx = contextOf({ "mangan_exam:default": 12 });
    expect(evaluateRankRequirements(ctx, [KYU5_REQUIREMENT, other])).toBe(
      false,
    );
    const ctxBoth = contextOf({
      "mangan_exam:default": 12,
      "score_calculation:default": 5,
    });
    expect(evaluateRankRequirements(ctxBoth, [KYU5_REQUIREMENT, other])).toBe(
      true,
    );
  });

  it("要件が空なら達成扱い（レジストリ側テストが空要件の登録を防ぐ）", () => {
    expect(evaluateRankRequirements(contextOf({}), [])).toBe(true);
  });
});
