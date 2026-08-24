import { describe, it, expect } from "vitest";
import type { ScoreResult } from "@pai-forge/riichi-mahjong";
import { applyKiriageMangan } from "./calculator";
import { ScoreLevel } from "../core/constants";

describe("applyKiriageMangan", () => {
  it("30符4翻の子ロンを満貫の8000点に切り上げる", () => {
    const result: ScoreResult = {
      han: 4,
      fu: 30,
      scoreLevel: ScoreLevel.Normal,
      payment: { type: "ron", amount: 7700 },
    };
    expect(
      applyKiriageMangan(result, { isTsumo: false, isOya: false }),
    ).toEqual({
      han: 4,
      fu: 30,
      scoreLevel: ScoreLevel.Mangan,
      payment: { type: "ron", amount: 8000 },
    });
  });

  it("60符3翻の親ロンを満貫の12000点に切り上げる", () => {
    const result: ScoreResult = {
      han: 3,
      fu: 60,
      scoreLevel: ScoreLevel.Normal,
      payment: { type: "ron", amount: 11600 },
    };
    expect(applyKiriageMangan(result, { isTsumo: false, isOya: true })).toEqual(
      {
        han: 3,
        fu: 60,
        scoreLevel: ScoreLevel.Mangan,
        payment: { type: "ron", amount: 12000 },
      },
    );
  });

  it("30符4翻の子ツモを2000/4000に切り上げる", () => {
    const result: ScoreResult = {
      han: 4,
      fu: 30,
      scoreLevel: ScoreLevel.Normal,
      payment: { type: "koTsumo", amount: [2000, 3900] },
    };
    expect(applyKiriageMangan(result, { isTsumo: true, isOya: false })).toEqual(
      {
        han: 4,
        fu: 30,
        scoreLevel: ScoreLevel.Mangan,
        payment: { type: "koTsumo", amount: [2000, 4000] },
      },
    );
  });

  it("30符4翻の親ツモを4000オールに切り上げる", () => {
    const result: ScoreResult = {
      han: 4,
      fu: 30,
      scoreLevel: ScoreLevel.Normal,
      payment: { type: "oyaTsumo", amount: 3900 },
    };
    expect(applyKiriageMangan(result, { isTsumo: true, isOya: true })).toEqual({
      han: 4,
      fu: 30,
      scoreLevel: ScoreLevel.Mangan,
      payment: { type: "oyaTsumo", amount: 4000 },
    });
  });

  it("基本符が1920に満たない結果（30符3翻）はそのまま返す", () => {
    const result: ScoreResult = {
      han: 3,
      fu: 30,
      scoreLevel: ScoreLevel.Normal,
      payment: { type: "ron", amount: 3900 },
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
    };
    expect(applyKiriageMangan(result, { isTsumo: false, isOya: false })).toBe(
      result,
    );
  });
});
