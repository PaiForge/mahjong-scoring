import { describe, expect, it } from "vitest";

import { deriveRecordView } from "../derive-record-view";

const current = { score: 10, incorrectAnswers: 1, timeTaken: 60 };

describe("deriveRecordView", () => {
  it("過去の記録が無ければ初回として扱う", () => {
    const view = deriveRecordView({
      current,
      previousBest: undefined,
      previousLast: undefined,
    });

    expect(view.status).toBe("first");
    expect(view.currentScore).toBe(10);
    expect(view.diffFromLast).toBeUndefined();
  });

  it("これまでのベストを上回れば自己ベスト更新", () => {
    const view = deriveRecordView({
      current,
      previousBest: { score: 9, incorrectAnswers: 0, timeTaken: 50 },
      previousLast: { score: 8, incorrectAnswers: 2, timeTaken: 55 },
    });

    expect(view.status).toBe("newBest");
    expect(view.diffFromLast).toBe(2);
  });

  // スコアが同点でもミスが少なければ challenge_best_scores は更新される。
  // バッジの条件がスコアだけだと、更新された回にバッジが出ないことになる
  it("同点でもミスが少なければ自己ベスト更新", () => {
    const view = deriveRecordView({
      current,
      previousBest: { score: 10, incorrectAnswers: 2, timeTaken: 50 },
      previousLast: undefined,
    });

    expect(view.status).toBe("newBest");
  });

  it("ベストに届かなければバッジを出さない", () => {
    const view = deriveRecordView({
      current,
      previousBest: { score: 12, incorrectAnswers: 0, timeTaken: 50 },
      previousLast: { score: 12, incorrectAnswers: 0, timeTaken: 50 },
    });

    expect(view.status).toBe("none");
    expect(view.diffFromLast).toBe(-2);
  });

  it("今回の記録を特定できなければ過去記録だけを返す", () => {
    const view = deriveRecordView({
      current: undefined,
      previousBest: { score: 12, incorrectAnswers: 0, timeTaken: 50 },
      previousLast: { score: 8, incorrectAnswers: 2, timeTaken: 55 },
    });

    expect(view.status).toBe("none");
    expect(view.currentScore).toBeUndefined();
    expect(view.previousBestScore).toBe(12);
    expect(view.previousLastScore).toBe(8);
    expect(view.diffFromLast).toBeUndefined();
  });

  // 訊けた上で 1 件も無かった場合。取得失敗はここへ来ず、行ごと断りに
  // 差し替わる（`RecordSection` が分ける）
  it("記録が 1 件も無ければ全項目 undefined で返す", () => {
    expect(
      deriveRecordView({
        current: undefined,
        previousBest: undefined,
        previousLast: undefined,
      }),
    ).toEqual({
      status: "none",
      currentScore: undefined,
      previousBestScore: undefined,
      previousLastScore: undefined,
      diffFromLast: undefined,
    });
  });
});
