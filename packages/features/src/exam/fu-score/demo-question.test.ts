import { describe, expect, it } from "vitest";

import { buildDemoScoreQuestion } from "../../board/demo-score-question";
import { isInRange, scoreDemo } from "../demo-score.fixture";
import { FU_SCORE_EXAM_DEMO_OPTIONS } from "./demo-question";
import { EXAM_GENERATE_OPTIONS } from "./types";

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
