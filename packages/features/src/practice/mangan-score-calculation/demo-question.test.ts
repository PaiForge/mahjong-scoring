import { describe, expect, it } from "vitest";
import { buildScoreQuestion } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";

import { MANGAN_SCORE_CALCULATION_DEMO_QUESTION } from "./demo-question";

const demo = MANGAN_SCORE_CALCULATION_DEMO_QUESTION;

/** デモの盤面（手牌・状況・ドラ・裏ドラ）をそのまま core で採点する */
function scoreDemo(question: ScoreQuestion): ScoreQuestion {
  return buildScoreQuestion({
    tehai: question.tehai,
    agariHai: question.agariHai,
    isTsumo: question.isTsumo,
    bakaze: question.bakaze,
    jikaze: question.jikaze,
    doraMarkers: question.doraMarkers,
    ruleConfig: {},
    riichi: question.isRiichi
      ? { uraDoraMarkers: question.uraDoraMarkers ?? [] }
      : undefined,
  })._unsafeUnwrap();
}

/** 役名と翻数の組を順序に依らず比べられる形にする */
function yakuMultiset(question: ScoreQuestion): readonly string[] {
  return (question.yakuDetails ?? [])
    .map((yaku) => `${yaku.name}:${yaku.han}`)
    .sort();
}

describe("MANGAN_SCORE_CALCULATION_DEMO_QUESTION", () => {
  it("提示する役と翻数は、盤面を core で採点した結果と一致する", () => {
    expect(yakuMultiset(demo)).toEqual(yakuMultiset(scoreDemo(demo)));
  });

  it("提示する役の翻数の合計が 5 翻（満貫）に届く", () => {
    const totalHan = (demo.yakuDetails ?? []).reduce((s, y) => s + y.han, 0);
    expect(totalHan).toBe(5);
    expect(scoreDemo(demo).answer.han).toBe(5);
  });

  it("リーチしている手なので裏ドラ表示牌を持つ", () => {
    expect(demo.isRiichi).toBe(true);
    expect(demo.uraDoraMarkers).toHaveLength(1);
  });
});
