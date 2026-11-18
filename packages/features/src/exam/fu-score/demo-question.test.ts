import { describe, expect, it } from "vitest";
import { buildScoreQuestion, type ScoreQuestion } from "@mahjong-scoring/core";
import { ScoreLevel } from "@mahjong-scoring/core/core/constants";

import {
  buildDemoScoreQuestion,
  type DemoScoreQuestionOptions,
} from "../../board/demo-score-question";
import { FU_SCORE_EXAM_DEMO_OPTIONS } from "./demo-question";
import { EXAM_GENERATE_OPTIONS } from "./types";

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

/** 点数区分が出題の点数帯（`allowedRanges` の 1 つ）に入るか */
function isInRange(range: string, scoreLevel: string): boolean {
  if (range === "nonMangan") return scoreLevel === ScoreLevel.Normal;
  if (range === "manganPlus") return scoreLevel !== ScoreLevel.Normal;
  return false;
}

describe("FU_SCORE_EXAM_DEMO_OPTIONS", () => {
  it("試験の点数帯（満貫未満）に入る手を見せる", () => {
    const { answer } = scoreDemo(FU_SCORE_EXAM_DEMO_OPTIONS);
    for (const range of EXAM_GENERATE_OPTIONS.allowedRanges) {
      expect(isInRange(range, answer.scoreLevel), range).toBe(true);
    }
  });

  it("試験が出題する符の手を見せる", () => {
    expect(EXAM_GENERATE_OPTIONS.allowedFu).toContain(
      scoreDemo(FU_SCORE_EXAM_DEMO_OPTIONS).answer.fu,
    );
  });

  it("役牌（發）の 1 翻 40 符を見せる", () => {
    const { answer } = scoreDemo(FU_SCORE_EXAM_DEMO_OPTIONS);
    expect([answer.han, answer.fu]).toEqual([1, 40]);
  });

  it("リーチしない手なので裏ドラ表示牌を盤面に出さない", () => {
    const demo = buildDemoScoreQuestion(FU_SCORE_EXAM_DEMO_OPTIONS);
    expect(demo.isRiichi).toBe(false);
    expect(demo.uraDoraMarkers).toBeUndefined();
  });

  it("出題と同じくドラ表示牌を盤面に出す（手牌に乗らなくても表示牌は置く）", () => {
    expect(
      buildDemoScoreQuestion(FU_SCORE_EXAM_DEMO_OPTIONS).doraMarkers.length,
    ).toBeGreaterThan(0);
  });
});
