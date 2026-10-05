import { describe, expect, it } from "vitest";

import { TRY_QUESTION } from "./try-question";

/**
 * 体験問題の正解が TSDoc に書いた値（子・ロン・1 翻 40 符 = 1300 点）のままか。
 * 牌姿や状況を触ったときに、文言や導線が前提にしている難易度が黙って
 * 変わらないようにする。
 */
describe("TRY_QUESTION", () => {
  it("子の門前ロンで役牌 1 翻 40 符 = 1300 点になる", () => {
    expect(TRY_QUESTION.isTsumo).toBe(false);
    expect(TRY_QUESTION.answer.han).toBe(1);
    expect(TRY_QUESTION.answer.fu).toBe(40);
    expect(TRY_QUESTION.answer.payment).toEqual({ type: "ron", amount: 1300 });
  });

  it("役は役牌（發）だけで、ドラは手牌に乗らない", () => {
    expect(TRY_QUESTION.yakuDetails?.map((yaku) => yaku.name)).toEqual([
      "役牌 發",
    ]);
  });
});
