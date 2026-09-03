import { describe, it, expect } from "vitest";
import type { ScoreResult } from "@pai-forge/riichi-mahjong";
import { alignYakumanScore, applyKiriageMangan } from "./calculator";
import { ScoreLevel } from "../core/constants";

describe("applyKiriageMangan", () => {
  it("30符4翻の子ロンを満貫の8000点に切り上げる", () => {
    const result: ScoreResult = {
      han: 4,
      fu: 30,
      scoreLevel: ScoreLevel.Normal,
      payment: { type: "ron", amount: 7700 },
      yakumanMultiplier: 0,
    };
    expect(
      applyKiriageMangan(result, { isTsumo: false, isOya: false }),
    ).toEqual({
      han: 4,
      fu: 30,
      scoreLevel: ScoreLevel.Mangan,
      payment: { type: "ron", amount: 8000 },
      yakumanMultiplier: 0,
    });
  });

  it("60符3翻の親ロンを満貫の12000点に切り上げる", () => {
    const result: ScoreResult = {
      han: 3,
      fu: 60,
      scoreLevel: ScoreLevel.Normal,
      payment: { type: "ron", amount: 11600 },
      yakumanMultiplier: 0,
    };
    expect(applyKiriageMangan(result, { isTsumo: false, isOya: true })).toEqual(
      {
        han: 3,
        fu: 60,
        scoreLevel: ScoreLevel.Mangan,
        payment: { type: "ron", amount: 12000 },
        yakumanMultiplier: 0,
      },
    );
  });

  it("30符4翻の子ツモを2000/4000に切り上げる", () => {
    const result: ScoreResult = {
      han: 4,
      fu: 30,
      scoreLevel: ScoreLevel.Normal,
      payment: { type: "koTsumo", amount: [2000, 3900] },
      yakumanMultiplier: 0,
    };
    expect(applyKiriageMangan(result, { isTsumo: true, isOya: false })).toEqual(
      {
        han: 4,
        fu: 30,
        scoreLevel: ScoreLevel.Mangan,
        payment: { type: "koTsumo", amount: [2000, 4000] },
        yakumanMultiplier: 0,
      },
    );
  });

  it("30符4翻の親ツモを4000オールに切り上げる", () => {
    const result: ScoreResult = {
      han: 4,
      fu: 30,
      scoreLevel: ScoreLevel.Normal,
      payment: { type: "oyaTsumo", amount: 3900 },
      yakumanMultiplier: 0,
    };
    expect(applyKiriageMangan(result, { isTsumo: true, isOya: true })).toEqual({
      han: 4,
      fu: 30,
      scoreLevel: ScoreLevel.Mangan,
      payment: { type: "oyaTsumo", amount: 4000 },
      yakumanMultiplier: 0,
    });
  });

  it("基本符が1920に満たない結果（30符3翻）はそのまま返す", () => {
    const result: ScoreResult = {
      han: 3,
      fu: 30,
      scoreLevel: ScoreLevel.Normal,
      payment: { type: "ron", amount: 3900 },
      yakumanMultiplier: 0,
    };
    expect(applyKiriageMangan(result, { isTsumo: false, isOya: false })).toBe(
      result,
    );
  });

  it("すでに満貫以上の結果はそのまま返す", () => {
    const result: ScoreResult = {
      han: 5,
      fu: 30,
      scoreLevel: ScoreLevel.Mangan,
      payment: { type: "ron", amount: 8000 },
      yakumanMultiplier: 0,
    };
    expect(applyKiriageMangan(result, { isTsumo: false, isOya: false })).toBe(
      result,
    );
  });
});

describe("alignYakumanScore", () => {
  it("数え（役満役なし）で26翻以上に達した結果を役満の32000点に丸める", () => {
    const result: ScoreResult = {
      han: 26,
      fu: 40,
      scoreLevel: ScoreLevel.DoubleYakuman,
      payment: { type: "ron", amount: 64000 },
      yakumanMultiplier: 0,
    };
    expect(alignYakumanScore(result, { isTsumo: false, isOya: false })).toEqual(
      {
        // 翻・符は丸めない（役の内訳は実際の翻数のまま残す）
        han: 26,
        fu: 40,
        scoreLevel: ScoreLevel.Yakuman,
        payment: { type: "ron", amount: 32000 },
        yakumanMultiplier: 0,
      },
    );
  });

  it("役満1つ分（複合の合算なし等）は後付けの翻で26翻を超えても32000点に揃える", () => {
    // 複合役満（字一色13+大三元13）に役牌照合の翻が乗り、翻数由来の
    // 再計算でダブル役満の支払いに流れたケース
    const result: ScoreResult = {
      han: 29,
      fu: 50,
      scoreLevel: ScoreLevel.DoubleYakuman,
      payment: { type: "koTsumo", amount: [16000, 32000] },
      yakumanMultiplier: 1,
    };
    expect(alignYakumanScore(result, { isTsumo: true, isOya: false })).toEqual({
      han: 29,
      fu: 50,
      scoreLevel: ScoreLevel.Yakuman,
      payment: { type: "koTsumo", amount: [8000, 16000] },
      yakumanMultiplier: 1,
    });
  });

  it("役満2つ分（ダブル役満）の支払いを役満単位から組み立てる", () => {
    const result: ScoreResult = {
      han: 26,
      fu: 40,
      scoreLevel: ScoreLevel.DoubleYakuman,
      payment: { type: "ron", amount: 64000 },
      yakumanMultiplier: 2,
    };
    expect(alignYakumanScore(result, { isTsumo: false, isOya: true })).toEqual({
      han: 26,
      fu: 40,
      scoreLevel: ScoreLevel.DoubleYakuman,
      payment: { type: "ron", amount: 96000 },
      yakumanMultiplier: 2,
    });
  });

  it("役満1つ分・役満止まりの結果は内容が変わらない", () => {
    const result: ScoreResult = {
      han: 13,
      fu: 40,
      scoreLevel: ScoreLevel.Yakuman,
      payment: { type: "ron", amount: 32000 },
      yakumanMultiplier: 1,
    };
    expect(alignYakumanScore(result, { isTsumo: false, isOya: false })).toEqual(
      result,
    );
  });

  it("役満未満の結果はそのまま返す", () => {
    const result: ScoreResult = {
      han: 5,
      fu: 30,
      scoreLevel: ScoreLevel.Mangan,
      payment: { type: "ron", amount: 8000 },
      yakumanMultiplier: 0,
    };
    expect(alignYakumanScore(result, { isTsumo: false, isOya: false })).toBe(
      result,
    );
  });
});
