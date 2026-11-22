import { describe, expect, it } from "vitest";

import { rebuildAgariQuestion } from "../archive/rebuild";
import type { AgariProblemPayload } from "../archive/types";
import { extractScoreFacts } from "./facts";

/** 門前リーチのツモ（789m 456p 222s 456s + 22m の雀頭）。標準ルールで 2 翻 30 符 */
const riichiTsumo: AgariProblemPayload = {
  hand: {
    closed: [1, 1, 6, 7, 8, 12, 13, 14, 19, 19, 19, 21, 22, 23],
    exposed: [],
  },
  agariHai: 22,
  isTsumo: true,
  jikaze: 29,
  bakaze: 27,
  doraMarkers: [32],
  riichi: { uraDoraMarkers: [23] },
};

function factsOf(payload: AgariProblemPayload) {
  const question = rebuildAgariQuestion(payload, {});
  if (question.isErr()) throw new Error(question.error);
  return { question: question.value, facts: extractScoreFacts(question.value) };
}

describe("extractScoreFacts", () => {
  it("門前リーチのツモの正解と属性を取り出す", () => {
    const { facts } = factsOf(riichiTsumo);
    expect(facts).toEqual({
      answer: {
        han: 2,
        fu: 30,
        scoreLevel: "Normal",
        yakumanMultiplier: 0,
        payment: { type: "koTsumo", amount: [500, 1000] },
        yaku: [
          { id: "MenzenTsumo", han: 1 },
          { id: "Riichi", han: 1 },
        ],
        doraHan: 0,
        uraDoraHan: 0,
      },
      facets: {
        isTsumo: true,
        isOya: false,
        isMenzen: true,
        isRiichi: true,
        kanCount: 0,
        jikaze: 29,
        bakaze: 27,
        agariHai: 22,
        // 456s の 5s を引いた嵌張（待ち符 2 + ツモ符 2 で 30 符）
        machi: "Kanchan",
      },
    });
  });

  it("ドラ・裏ドラは役に入れず、翻だけを分けて持つ", () => {
    // ドラ表示牌 6s → ドラ 7s、裏ドラ表示牌 1s → 裏ドラ 2s（暗刻で 3 枚）
    const { facts } = factsOf({
      ...riichiTsumo,
      doraMarkers: [23],
      riichi: { uraDoraMarkers: [18] },
    });
    expect(facts?.answer.doraHan).toBe(0);
    expect(facts?.answer.uraDoraHan).toBe(3);
    expect(facts?.answer.yaku.map(({ id }) => id)).toEqual([
      "MenzenTsumo",
      "Riichi",
    ]);
    expect(facts?.answer.han).toBe(5);
  });

  it("役 ID に写せない内訳があれば取り出さない", () => {
    const { question } = factsOf(riichiTsumo);
    expect(
      extractScoreFacts({
        ...question,
        yakuDetails: [...question.yakuDetails, { name: "未知の役", han: 1 }],
      }),
    ).toBeUndefined();
  });
});
