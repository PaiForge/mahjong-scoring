import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("./index", () => ({ db: {} }));

const { evaluateRankRequirements, selectGrantableRank } =
  await import("./rank-evaluation");

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

describe("selectGrantableRank", () => {
  it("次の級の要件を満たしていればその1件を返す", () => {
    const ctx = contextOf({ "mangan_exam:default": 10 });
    expect(selectGrantableRank([], ctx)?.slug).toBe("kyu-5");
  });

  it("次の級の要件未達なら何も返さない", () => {
    const ctx = contextOf({ "mangan_exam:default": 9 });
    expect(selectGrantableRank([], ctx)).toBeUndefined();
  });

  it("上位の試験の合格スコアがあっても飛び級しない", () => {
    // 無級のまま2級の試験（pinfu_exam）に合格点を積んでも何も付与されない
    const ctx = contextOf({ "pinfu_exam:default": 99 });
    expect(selectGrantableRank([], ctx)).toBeUndefined();
    // 5級を持っていても、次（4級）を飛ばして3級は付与されない
    const ctx2 = contextOf({ "chiitoitsu_exam:default": 99 });
    expect(selectGrantableRank(["kyu-5"], ctx2)).toBeUndefined();
  });

  it("全試験の合格スコアがあっても付与は次の級の1件だけ", () => {
    const ctx = contextOf({
      "mangan_exam:default": 99,
      "fu_exam:default": 99,
      "chiitoitsu_exam:default": 99,
      "pinfu_exam:default": 99,
      "fu_score_exam:default": 99,
    });
    expect(selectGrantableRank([], ctx)?.slug).toBe("kyu-5");
    expect(selectGrantableRank(["kyu-5"], ctx)?.slug).toBe("kyu-4");
  });

  it("飛び番で保持していても、次は最下位の未達成（飛ばした級）", () => {
    const ctx = contextOf({ "fu_exam:default": 99 });
    expect(selectGrantableRank(["kyu-5", "kyu-2"], ctx)?.slug).toBe("kyu-4");
  });

  it("全ランク達成済みなら何も返さない", () => {
    const ctx = contextOf({ "mangan_exam:default": 99 });
    expect(
      selectGrantableRank(["kyu-5", "kyu-4", "kyu-3", "kyu-2", "kyu-1"], ctx),
    ).toBeUndefined();
  });
});
