import { describe, expect, it } from "vitest";
import { dailyAnswerSnapshotSchema } from "./answer-snapshot";

const snapshot = {
  v: 1,
  scoringVersion: 1,
  revision: "selection-build",
  answer: {
    han: 2,
    fu: 40,
    scoreLevel: "Normal",
    yakumanMultiplier: 0,
    payment: { type: "koTsumo", amount: [700, 1300] },
    yaku: [
      { id: "Bakaze", han: 1 },
      { id: "MenzenTsumo", han: 1 },
    ],
    doraHan: 0,
    uraDoraHan: 0,
  },
  facets: {
    isTsumo: true,
    isOya: false,
    isMenzen: true,
    isRiichi: false,
    kanCount: 0,
    jikaze: 28,
    bakaze: 27,
    agariHai: 0,
    machi: "Tanki",
  },
};

describe("選出時スナップショットの保存契約", () => {
  it("子ツモの支払いの内訳と風の引き直しに必要な情報を保つ", () => {
    expect(
      dailyAnswerSnapshotSchema.parse(JSON.parse(JSON.stringify(snapshot))),
    ).toEqual(snapshot);
  });
  it("合計点だけの支払い・未知の版・ドラの役IDを受けない", () => {
    expect(
      dailyAnswerSnapshotSchema.safeParse({
        ...snapshot,
        answer: {
          ...snapshot.answer,
          payment: { type: "koTsumo", amount: 2700 },
        },
      }).success,
    ).toBe(false);
    expect(
      dailyAnswerSnapshotSchema.safeParse({ ...snapshot, v: 2 }).success,
    ).toBe(false);
    expect(
      dailyAnswerSnapshotSchema.safeParse({
        ...snapshot,
        answer: { ...snapshot.answer, yaku: [{ id: "Dora", han: 1 }] },
      }).success,
    ).toBe(false);
  });
});
