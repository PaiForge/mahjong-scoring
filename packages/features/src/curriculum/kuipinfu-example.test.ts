import { describe, expect, it } from "vitest";
import { buildScoreQuestion, HaiKind } from "@mahjong-scoring/core";

import { KUIPINFU_EXAMPLE } from "./kuipinfu-example";

describe("KUIPINFU_EXAMPLE", () => {
  // コラムの本文（積み上げ0符のロンは30符・平和は付かず別の役が要る）を牌姿で裏付ける
  it("ロンすると断么九のみの1翻30符になる", () => {
    const question = buildScoreQuestion({
      ...KUIPINFU_EXAMPLE,
      isTsumo: false,
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Nan,
      doraMarkers: [],
      ruleConfig: {},
    })._unsafeUnwrap();

    expect(question.answer.han).toBe(1);
    expect(question.answer.fu).toBe(30);
    expect((question.yakuDetails ?? []).map((yaku) => yaku.name)).toEqual([
      "断么九",
    ]);
  });
});
