import { describe, expect, it, vi } from "vitest";

import {
  createPhaseStopwatch,
  logAnswerTiming,
  parseAnswerObservation,
  pendingPhase,
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

describe("pendingPhase", () => {
  it("記録の無い最初の段階が、落ちた場所", () => {
    expect(pendingPhase({})).toBe("auth");
    expect(pendingPhase({ auth: 1, ban: 1 })).toBe("lock");
    expect(
      pendingPhase({ auth: 1, ban: 1, lock: 1, grade: 1, update: 1 }),
    ).toBe("commit");
  });

  it("全段階を通っていれば無い", () => {
    expect(
      pendingPhase({
        auth: 1,
        ban: 1,
        lock: 1,
        grade: 1,
        update: 1,
        commit: 1,
      }),
    ).toBeUndefined();
  });
});

describe("parseAnswerObservation", () => {
  it("問題番号と往復時間が 0 以上の整数のときだけ受け取る", () => {
    expect(
      parseAnswerObservation({ previous: { sequence: 2, roundTripMs: 240 } }),
    ).toEqual({ previous: { sequence: 2, roundTripMs: 240 } });
    expect(
      parseAnswerObservation({ previous: { sequence: 0, roundTripMs: 0 } }),
    ).toEqual({ previous: { sequence: 0, roundTripMs: 0 } });
  });

  it.each([
    ["負の往復時間", { previous: { sequence: 1, roundTripMs: -1 } }],
    ["小数", { previous: { sequence: 1, roundTripMs: 12.5 } }],
    [
      "上限超え",
      { previous: { sequence: 1, roundTripMs: 10 * 60 * 1000 + 1 } },
    ],
    ["文字列", { previous: { sequence: 1, roundTripMs: "240" } }],
    ["問題番号が負", { previous: { sequence: -1, roundTripMs: 240 } }],
    ["問題番号が欠損", { previous: { roundTripMs: 240 } }],
    ["previous が欠損", {}],
    ["previous が undefined", { previous: undefined }],
    ["オブジェクトでない", 240],
    ["null", null],
    ["undefined", undefined],
  ])("%s は欠損として扱い、拒否はしない", (_label, value) => {
    expect(parseAnswerObservation(value)).toEqual({});
  });
});

describe("logAnswerTiming", () => {
  it("採点できた回答は段階・猶予後の時間・直前の往復を 1 行の JSON にまとめる", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      logAnswerTiming({
        handling: "answered",
        menuType: "yaku_han",
        sequence: 3,
        phases: { auth: 40, ban: 5, lock: 7, grade: 2, update: 6, commit: 4 },
        totalMs: 64,
        observation: { previous: { sequence: 2, roundTripMs: 180 } },
      });

      expect(info).toHaveBeenCalledTimes(1);
      expect(JSON.parse(info.mock.calls[0][0])).toEqual({
        event: "challenge.answer",
        handling: "answered",
        menuType: "yaku_han",
        sequence: 3,
        first: false,
        totalMs: 64,
        afterRespondedMs: 10,
        auth: 40,
        ban: 5,
        lock: 7,
        grade: 2,
        update: 6,
        commit: 4,
        previousSequence: 2,
        previousClientRoundTripMs: 180,
      });
    } finally {
      info.mockRestore();
    }
  });

  it("受け付けなかった回答には猶予後の時間を出さず、識別子も載せない", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      logAnswerTiming({
        handling: "rejected",
        sequence: 0,
        phases: { auth: 30, ban: 4, lock: 6, commit: 1 },
        totalMs: 41,
        observation: {},
      });
      expect(JSON.parse(info.mock.calls[0][0])).toEqual({
        event: "challenge.answer",
        handling: "rejected",
        sequence: 0,
        first: true,
        totalMs: 41,
        auth: 30,
        ban: 4,
        lock: 6,
        commit: 1,
      });
    } finally {
      info.mockRestore();
    }
  });

  it("例外で落ちた回答は通った段階と落ちた段階を出す", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      logAnswerTiming({
        handling: "failed",
        sequence: 5,
        phases: { auth: 30, ban: 4 },
        totalMs: 2034,
        observation: {},
      });
      expect(JSON.parse(info.mock.calls[0][0])).toEqual({
        event: "challenge.answer",
        handling: "failed",
        sequence: 5,
        first: false,
        totalMs: 2034,
        failedPhase: "lock",
        auth: 30,
        ban: 4,
      });
    } finally {
      info.mockRestore();
    }
  });
});
