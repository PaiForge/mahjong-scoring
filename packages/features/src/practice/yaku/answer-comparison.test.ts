import { describe, expect, it } from "vitest";
import { HaiKind, parseTehai } from "@mahjong-scoring/core";

import { AnswerOutcome } from "../../results/result-schemas";
import {
  buildYakuComparisonChips,
  restoreYakuQuestion,
} from "./answer-comparison";
import type { YakuQuestionResult } from "./types";

const ORDER = ["立直", "平和", "断么九", "役牌 中"];

describe("buildYakuComparisonChips", () => {
  it("表示順に並べ、選べた役・選び忘れ・余分を判定する", () => {
    expect(
      buildYakuComparisonChips(
        ["断么九", "立直", "平和"],
        ORDER,
        ["立直", "断么九"],
        ["断么九", "平和"],
        AnswerOutcome.Incorrect,
      ),
    ).toEqual([
      { yakuName: "立直", state: "missed" },
      { yakuName: "平和", state: "incorrect" },
      { yakuName: "断么九", state: "correct" },
    ]);
  });

  it("時間切れは成立していた役を成立として出す", () => {
    expect(
      buildYakuComparisonChips(
        ["立直", "断么九"],
        ORDER,
        ["立直", "断么九"],
        undefined,
        AnswerOutcome.TimeUp,
      ),
    ).toEqual([
      { yakuName: "立直", state: "correct" },
      { yakuName: "断么九", state: "correct" },
    ]);
  });

  it("表示順に無い役名は出さない", () => {
    expect(
      buildYakuComparisonChips(["不明"], ORDER, [], [], undefined),
    ).toEqual([]);
  });
});

describe("restoreYakuQuestion", () => {
  /** 保存形式の結果（リーチして裏ドラを持つ問題） */
  const saved: YakuQuestionResult = {
    tehai: "234m567p11122s678s",
    agariHai: "2s",
    bakaze: "1z",
    jikaze: "2z",
    isTsumo: true,
    isRiichi: true,
    doraMarkers: ["3p", "5z"],
    uraDoraMarkers: ["9m"],
    correctYakuNames: ["Tsumo"],
    selectedYakuNames: ["Tsumo"],
    outcome: AnswerOutcome.Correct,
  };

  it("手牌と和了状況に、リーチ・ドラ表示牌・裏ドラ表示牌を足して復元する", () => {
    expect(restoreYakuQuestion(saved)).toEqual({
      tehai: parseTehai(saved.tehai),
      context: {
        agariHai: HaiKind.SouZu2,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        isTsumo: true,
        ruleConfig: undefined,
        isRiichi: true,
        doraMarkers: [HaiKind.PinZu3, HaiKind.Haku],
        uraDoraMarkers: [HaiKind.ManZu9],
      },
    });
  });

  it("リーチしていない問題は裏ドラを持たない", () => {
    const { uraDoraMarkers: _ura, ...withoutUra } = saved;
    const restored = restoreYakuQuestion({ ...withoutUra, isRiichi: false });
    expect(restored?.context.isRiichi).toBe(false);
    expect(restored?.context.uraDoraMarkers).toBeUndefined();
    expect(restored?.context.doraMarkers).toEqual([
      HaiKind.PinZu3,
      HaiKind.Haku,
    ]);
  });

  it("手牌の MPSZ が壊れていれば復元を諦めて undefined を返す", () => {
    expect(restoreYakuQuestion({ ...saved, tehai: "壊れた手牌" })).toBe(
      undefined,
    );
  });
});
