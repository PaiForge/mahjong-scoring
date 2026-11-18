import { describe, expect, it } from "vitest";
import { buildScoreQuestion, type ScoreQuestion } from "@mahjong-scoring/core";

import {
  buildDemoScoreQuestion,
  type DemoScoreQuestionOptions,
} from "../../board/demo-score-question";
import { SCORE_EXAM_DEMO_OPTIONS } from "./demo-question";

/**
 * デモの盤面を本番と同じ採点の経路に通す
 *
 * デモの出題は正解を持たない（描画専用）ので、盤面に出る手牌・状況から
 * 出題と同じ `buildScoreQuestion` で採点し直す。
 */
function scoreDemo(options: DemoScoreQuestionOptions): ScoreQuestion {
  const demo = buildDemoScoreQuestion(options);
  return buildScoreQuestion({
    tehai: demo.tehai,
    agariHai: demo.agariHai,
    isTsumo: demo.isTsumo,
    jikaze: demo.jikaze,
    bakaze: demo.bakaze,
    doraMarkers: demo.doraMarkers,
    ruleConfig: { doubleWindJantouFu: 4, kiriageMangan: false },
    riichi: demo.isRiichi
      ? { uraDoraMarkers: demo.uraDoraMarkers ?? [] }
      : undefined,
  })._unsafeUnwrap();
}

describe("SCORE_EXAM_DEMO_OPTIONS", () => {
  it("役牌（發）の 1 翻 40 符を見せる", () => {
    const { answer } = scoreDemo(SCORE_EXAM_DEMO_OPTIONS);
    expect([answer.han, answer.fu]).toEqual([1, 40]);
  });

  it("リーチしない手なので裏ドラ表示牌を盤面に出さない", () => {
    const demo = buildDemoScoreQuestion(SCORE_EXAM_DEMO_OPTIONS);
    expect(demo.isRiichi).toBe(false);
    expect(demo.uraDoraMarkers).toBeUndefined();
  });
});
