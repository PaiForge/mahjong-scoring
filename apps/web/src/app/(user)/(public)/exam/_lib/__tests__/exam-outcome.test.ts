import { describe, expect, it } from "vitest";

import { evaluateExamOutcome } from "../exam-outcome";

/** 満貫試験の条件（合格ライン 10 問 / 制限時間 60 秒） */
const MANGAN = { minScore: 10, timeLimitSec: 60 } as const;

describe("evaluateExamOutcome", () => {
  it("合格ラインちょうどで合格し、あと 0 問", () => {
    const o = evaluateExamOutcome({
      ...MANGAN,
      correct: 10,
      total: 10,
      elapsedMs: 60_000,
    });

    expect(o.passed).toBe(true);
    expect(o.remaining).toBe(0);
    expect(o.showRequiredPace).toBe(false);
  });

  it("合格ラインに達したあとの誤答は合否に影響しない", () => {
    const o = evaluateExamOutcome({
      ...MANGAN,
      correct: 10,
      total: 11,
      elapsedMs: 50_000,
    });

    expect(o.passed).toBe(true);
    expect(o.ending).toBe("mistake");
  });

  it("誤答で終わった不合格は、あと N 問だけを出しペースは出さない", () => {
    // 3 問を 15 秒で解いて 4 問目で誤答: 1 問 5 秒は合格ペース以内だが敗因は正確さ
    const o = evaluateExamOutcome({
      ...MANGAN,
      correct: 3,
      total: 4,
      elapsedMs: 15_000,
    });

    expect(o.passed).toBe(false);
    expect(o.remaining).toBe(7);
    expect(o.ending).toBe("mistake");
    expect(o.showRequiredPace).toBe(false);
  });

  it("時間切れの不合格は、合格ペースと今回のペースを並べる", () => {
    const o = evaluateExamOutcome({
      ...MANGAN,
      correct: 8,
      total: 8,
      elapsedMs: 60_000,
    });

    expect(o.passed).toBe(false);
    expect(o.remaining).toBe(2);
    expect(o.ending).toBe("time");
    expect(o.showRequiredPace).toBe(true);
    expect(o.requiredPaceSeconds).toBe(6);
    expect(o.averageSeconds).toBe(7.5);
  });

  it("1 問も答えずに時間切れなら平均秒数を持たない", () => {
    const o = evaluateExamOutcome({
      ...MANGAN,
      correct: 0,
      total: 0,
      elapsedMs: 60_000,
    });

    expect(o.averageSeconds).toBeUndefined();
    expect(o.ending).toBe("time");
    expect(o.remaining).toBe(10);
  });
});
