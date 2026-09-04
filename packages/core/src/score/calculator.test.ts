import { describe, it, expect } from "vitest";
import type { ScoreResult } from "@pai-forge/riichi-mahjong";
import { isKiriageManganTarget, recalculateScore } from "./calculator";
import { ScoreLevel } from "../core/constants";

function makeResult(overrides: Partial<ScoreResult>): ScoreResult {
  return {
    han: 1,
    fu: 30,
    scoreLevel: ScoreLevel.Normal,
    payment: { type: "ron", amount: 1000 },
    yakumanMultiplier: 0,
    ...overrides,
  };
}

describe("recalculateScore", () => {
  it("翻数だけを変えて点数を引き直す（符はそのまま）", () => {
    const result = recalculateScore(makeResult({ han: 1, fu: 40 }), 3, {
      isTsumo: false,
      isOya: false,
    });
    expect(result).toEqual({
      han: 3,
      fu: 40,
      scoreLevel: ScoreLevel.Normal,
      payment: { type: "ron", amount: 5200 },
      yakumanMultiplier: 0,
    });
  });

  it("切り上げ満貫の設定を渡すと 30符4翻 が満貫になる", () => {
    const result = recalculateScore(makeResult({ han: 3, fu: 30 }), 4, {
      isTsumo: true,
      isOya: false,
      ruleConfig: { kiriageMangan: true },
    });
    expect(result.scoreLevel).toBe(ScoreLevel.Mangan);
    expect(result.payment).toEqual({ type: "koTsumo", amount: [2000, 4000] });
  });

  it("設定なしでは 30符4翻 は満貫にならない", () => {
    const result = recalculateScore(makeResult({ han: 3, fu: 30 }), 4, {
      isTsumo: false,
      isOya: true,
    });
    expect(result.scoreLevel).toBe(ScoreLevel.Normal);
    expect(result.payment).toEqual({ type: "ron", amount: 11600 });
  });

  it("役満役を含む手は後付けの翻で 26翻 を超えても役満1つ分に留まる", () => {
    // 複合役満（字一色13+大三元13）に役牌照合の翻が乗ったケース。
    // 複合の合算が無効なら役満単位は 1 のまま
    const result = recalculateScore(
      makeResult({ han: 26, fu: 50, yakumanMultiplier: 1 }),
      29,
      { isTsumo: true, isOya: false },
    );
    expect(result).toEqual({
      han: 29,
      fu: 50,
      scoreLevel: ScoreLevel.Yakuman,
      payment: { type: "koTsumo", amount: [8000, 16000] },
      yakumanMultiplier: 1,
    });
  });

  it("役満2つ分（ダブル役満）の支払いは役満単位から組み立てる", () => {
    const result = recalculateScore(
      makeResult({ han: 26, fu: 40, yakumanMultiplier: 2 }),
      27,
      { isTsumo: false, isOya: true },
    );
    expect(result.scoreLevel).toBe(ScoreLevel.DoubleYakuman);
    expect(result.payment).toEqual({ type: "ron", amount: 96000 });
    expect(result.yakumanMultiplier).toBe(2);
  });

  it("数え（役満役なし）は 26翻 に達しても役満止まり", () => {
    const result = recalculateScore(makeResult({ han: 25, fu: 40 }), 26, {
      isTsumo: false,
      isOya: false,
    });
    expect(result.scoreLevel).toBe(ScoreLevel.Yakuman);
    expect(result.payment).toEqual({ type: "ron", amount: 32000 });
  });
});

describe("isKiriageManganTarget", () => {
  it.each([
    [4, 30],
    [3, 60],
  ] as const)("%i翻%i符 は切り上げ満貫の境界", (han, fu) => {
    expect(isKiriageManganTarget(makeResult({ han, fu }))).toBe(true);
  });

  it("切り上げ満貫を適用済み（区分が満貫）の結果でも境界と判定する", () => {
    expect(
      isKiriageManganTarget(
        makeResult({
          han: 4,
          fu: 30,
          scoreLevel: ScoreLevel.Mangan,
          payment: { type: "ron", amount: 8000 },
        }),
      ),
    ).toBe(true);
  });

  it.each([
    [3, 30],
    [4, 40],
    [5, 30],
    [2, 25],
  ] as const)("%i翻%i符 は境界ではない", (han, fu) => {
    expect(isKiriageManganTarget(makeResult({ han, fu }))).toBe(false);
  });

  it("役満役を含む手は境界ではない", () => {
    expect(
      isKiriageManganTarget(
        makeResult({
          han: 13,
          fu: 30,
          scoreLevel: ScoreLevel.Yakuman,
          yakumanMultiplier: 1,
        }),
      ),
    ).toBe(false);
  });
});
