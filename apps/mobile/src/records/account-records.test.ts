import { describe, expect, it } from "vitest";

import {
  EMPTY_ACCOUNT_RECORDS,
  acknowledgeAnswer,
  addPendingLessons,
  dropActiveChallenge,
  finishChallenge,
  importGuestLessons,
  purgeUser,
  recordsOf,
  removePendingLessons,
  sendAnswer,
  startChallenge,
} from "./account-records";

const A = "user-a";
const B = "user-b";
const CHALLENGE = {
  attemptId: "attempt-1",
  slug: "jantou-fu",
  variant: "default",
};

describe("チャレンジの預かり", () => {
  it("未確認の回答は、同じ番号の応答を受け取るまで残る", () => {
    let records = startChallenge(EMPTY_ACCOUNT_RECORDS, A, CHALLENGE);
    records = sendAnswer(records, A, "attempt-1", { sequence: 2, answer: 30 });
    records = acknowledgeAnswer(records, A, "attempt-1", 1);
    expect(recordsOf(records, A).active?.pendingAnswer).toEqual({
      sequence: 2,
      answer: 30,
    });

    records = acknowledgeAnswer(records, A, "attempt-1", 2);
    expect(recordsOf(records, A).active).toEqual(CHALLENGE);
  });

  it("終わったら進行中から確定待ちへ移り、同じ ID は重ならない", () => {
    let records = startChallenge(EMPTY_ACCOUNT_RECORDS, A, CHALLENGE);
    records = finishChallenge(records, A, CHALLENGE);
    records = finishChallenge(records, A, CHALLENGE);

    expect(recordsOf(records, A).active).toBeUndefined();
    expect(recordsOf(records, A).pendingFinishes).toEqual([CHALLENGE]);
  });

  it("別のチャレンジの ID では進行中を捨てない", () => {
    const records = dropActiveChallenge(
      startChallenge(EMPTY_ACCOUNT_RECORDS, A, CHALLENGE),
      A,
      "other",
    );
    expect(recordsOf(records, A).active).toEqual(CHALLENGE);
  });

  it("ユーザーごとに分かれ、他のユーザーの預かりに触れない", () => {
    let records = startChallenge(EMPTY_ACCOUNT_RECORDS, A, CHALLENGE);
    records = sendAnswer(records, B, "attempt-1", { sequence: 0, answer: 1 });
    expect(recordsOf(records, A).active?.pendingAnswer).toBeUndefined();
    expect(recordsOf(records, B).active).toBeUndefined();
  });
});

describe("レッスンの未送信", () => {
  it("同じ章は 1 度だけ預け、受け取られた分だけ外す", () => {
    let records = addPendingLessons(EMPTY_ACCOUNT_RECORDS, A, ["a", "b", "a"]);
    records = addPendingLessons(records, A, ["b"]);
    expect(recordsOf(records, A).pendingLessons).toEqual(["a", "b"]);

    records = removePendingLessons(records, A, ["a"]);
    expect(recordsOf(records, A).pendingLessons).toEqual(["b"]);
  });

  it("ゲストの完了は端末で 1 度だけ、最初のアカウントへ取り込む", () => {
    let records = importGuestLessons(EMPTY_ACCOUNT_RECORDS, A, ["a"]);
    records = importGuestLessons(records, B, ["a", "b"]);

    expect(recordsOf(records, A).pendingLessons).toEqual(["a"]);
    expect(recordsOf(records, B).pendingLessons).toEqual([]);
    expect(records.guestLessonsImported).toBe(true);
  });

  it("ゲストの完了が無くても取り込み済みにする", () => {
    const records = importGuestLessons(EMPTY_ACCOUNT_RECORDS, A, []);
    expect(records.guestLessonsImported).toBe(true);
  });
});

describe("purgeUser", () => {
  it("そのユーザーの預かりだけを消し、取り込み済みの印は残す", () => {
    let records = importGuestLessons(EMPTY_ACCOUNT_RECORDS, A, ["a"]);
    records = addPendingLessons(records, B, ["b"]);
    records = purgeUser(records, A);

    expect(records.byUser).toEqual({ [B]: recordsOf(records, B) });
    expect(records.guestLessonsImported).toBe(true);
  });
});
