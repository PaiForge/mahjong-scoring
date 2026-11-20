import { describe, expect, it } from "vitest";

import { buildDemoScoreQuestion } from "../../board/demo-score-question";
import { scoreDemo } from "../demo-score.fixture";
import { SCORE_EXAM_DEMO_OPTIONS } from "./demo-question";

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

  it("出題と同じくドラ表示牌を盤面に出す（手牌に乗らなくても表示牌は置く）", () => {
    expect(
      buildDemoScoreQuestion(SCORE_EXAM_DEMO_OPTIONS).doraMarkers.length,
    ).toBeGreaterThan(0);
  });
});
