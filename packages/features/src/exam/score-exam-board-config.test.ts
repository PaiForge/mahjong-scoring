import { describe, expect, it } from "vitest";

import { EXAM_BOARD_CONFIG as CHIITOITSU_EXAM_BOARD_CONFIG } from "./chiitoitsu/types";
import { scoreExamQuestionGenerator } from "./score-exam-board-config";

describe("scoreExamQuestionGenerator", () => {
  it("盤面と同じ出題条件で問題を作る", () => {
    const question = scoreExamQuestionGenerator(CHIITOITSU_EXAM_BOARD_CONFIG)();
    expect(question?.yakuDetails.map((yaku) => yaku.name)).toContain("七対子");
  });

  it("試行回数の予算を盤面と同じ値から取る（予算 0 なら作らない）", () => {
    const generate = scoreExamQuestionGenerator({
      ...CHIITOITSU_EXAM_BOARD_CONFIG,
      maxRetries: 0,
    });
    expect(generate()).toBeUndefined();
  });
});
