import { describe, expect, it, vi } from "vitest";

import {
  createPhaseStopwatch,
  logAnswerTiming,
  parseAnswerObservation,
} from "./answer-telemetry";

describe("createPhaseStopwatch", () => {
  it("区切りごとの所要時間と合計を整数の ms で持つ", () => {
    let now = 1000;
    const stopwatch = createPhaseStopwatch(() => now);
    now = 1012.4;
    stopwatch.lap("auth");
    now = 1020;
    stopwatch.lap("ban");
    now = 1100.6;
    stopwatch.lap("lock");

    expect(stopwatch.phases).toEqual({ auth: 12, ban: 8, lock: 81 });
    expect(stopwatch.elapsed()).toBe(101);
  });

  it("通らなかった段階は持たない", () => {
    const stopwatch = createPhaseStopwatch(() => 0);
    stopwatch.lap("auth");
    expect(stopwatch.phases).toEqual({ auth: 0 });
    expect("commit" in stopwatch.phases).toBe(false);
  });
});

describe("parseAnswerObservation", () => {
  it("0 以上の整数の往復時間だけを受け取る", () => {
    expect(parseAnswerObservation({ previousRoundTripMs: 240 })).toEqual({
      previousRoundTripMs: 240,
    });
    expect(parseAnswerObservation({ previousRoundTripMs: 0 })).toEqual({
      previousRoundTripMs: 0,
    });
  });

  it.each([
    ["負の値", { previousRoundTripMs: -1 }],
    ["小数", { previousRoundTripMs: 12.5 }],
    ["上限超え", { previousRoundTripMs: 10 * 60 * 1000 + 1 }],
    ["文字列", { previousRoundTripMs: "240" }],
    ["欠損", {}],
    ["オブジェクトでない", 240],
    ["null", null],
    ["undefined", undefined],
  ])("%s は欠損として扱い、拒否はしない", (_label, value) => {
    expect(parseAnswerObservation(value)).toEqual({});
  });
});

describe("logAnswerTiming", () => {
  it("1 行の JSON に段階・結果・申告値をまとめ、起点より後の時間を足し込む", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      logAnswerTiming({
        handling: "answered",
        menuType: "yaku_han",
        sequence: 0,
        phases: { auth: 40, ban: 5, lock: 7, grade: 2, update: 6, commit: 4 },
        totalMs: 64,
        observation: { previousRoundTripMs: 180 },
      });

      expect(info).toHaveBeenCalledTimes(1);
      expect(JSON.parse(info.mock.calls[0][0])).toEqual({
        event: "challenge.answer",
        handling: "answered",
        menuType: "yaku_han",
        sequence: 0,
        first: true,
        totalMs: 64,
        afterRespondedMs: 10,
        auth: 40,
        ban: 5,
        lock: 7,
        grade: 2,
        update: 6,
        commit: 4,
        clientRoundTripMs: 180,
      });
    } finally {
      info.mockRestore();
    }
  });

  it("ユーザーや挑戦を特定する値は載せない", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      logAnswerTiming({
        handling: "rejected",
        phases: {},
        totalMs: 3,
        observation: {},
      });
      expect(JSON.parse(info.mock.calls[0][0])).toEqual({
        event: "challenge.answer",
        handling: "rejected",
        first: false,
        totalMs: 3,
        afterRespondedMs: 0,
      });
    } finally {
      info.mockRestore();
    }
  });
});
