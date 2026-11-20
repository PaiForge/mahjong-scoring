import { describe, expect, it } from "vitest";

import { buildDemoScoreQuestion } from "../../board/demo-score-question";
import { isInRange, scoreDemo } from "../demo-score.fixture";
import { MANGAN_EXAM_DEMO_OPTIONS } from "./demo-question";
import { EXAM_GENERATE_OPTIONS } from "./types";

describe("MANGAN_EXAM_DEMO_OPTIONS", () => {
  it("試験の点数帯（満貫以上）に入る手を見せる", () => {
    const { answer } = scoreDemo(MANGAN_EXAM_DEMO_OPTIONS);
    for (const range of EXAM_GENERATE_OPTIONS.allowedRanges) {
      expect(isInRange(range, answer.scoreLevel), range).toBe(true);
    }
    expect(answer.han).toBeGreaterThanOrEqual(EXAM_GENERATE_OPTIONS.minHan);
  });

  it("立直・門前清自摸和・断么九・平和・ドラ1 の 5 翻（満貫）を見せる", () => {
    expect(scoreDemo(MANGAN_EXAM_DEMO_OPTIONS).answer.han).toBe(5);
  });

  it("リーチの手なので出題と同じく裏ドラ表示牌を盤面に出す", () => {
    const demo = buildDemoScoreQuestion(MANGAN_EXAM_DEMO_OPTIONS);
    expect(demo.isRiichi).toBe(true);
    expect(demo.uraDoraMarkers?.length).toBeGreaterThan(0);
  });

  it("出題と同じくドラ表示牌を盤面に出す（手牌に乗らなくても表示牌は置く）", () => {
    expect(
      buildDemoScoreQuestion(MANGAN_EXAM_DEMO_OPTIONS).doraMarkers.length,
    ).toBeGreaterThan(0);
  });
});
