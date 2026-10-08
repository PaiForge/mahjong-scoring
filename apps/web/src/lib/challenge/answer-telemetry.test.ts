import { describe, expect, it, vi } from "vitest";

import {
  createPhaseStopwatch,
  logAnswerTiming,
  parseAnswerObservation,
} from "./answer-telemetry";

describe("createPhaseStopwatch", () => {
  it("段階に入るたびに前の段階を閉じ、所要時間と合計を整数の ms で持つ", () => {
    let now = 1000;
    const stopwatch = createPhaseStopwatch(() => now);
    stopwatch.enter("auth");
    now = 1012.4;
    stopwatch.enter("ban");
    now = 1020;
    stopwatch.enter("lock");
    expect(stopwatch.current).toBe("lock");
    now = 1100.6;
    stopwatch.finish();

    expect(stopwatch.phases).toEqual({ auth: 12, ban: 8, lock: 81 });
    expect(stopwatch.current).toBeUndefined();
    expect(stopwatch.elapsed()).toBe(101);
  });

  it("飛ばした段階は記録に残らず、今いる段階は飛ばした先になる", () => {
    let now = 0;
    const stopwatch = createPhaseStopwatch(() => now);
    stopwatch.enter("lock");
    now = 5;
    // 採点に進まない回答は grade / update を飛ばして commit に入る
    stopwatch.enter("commit");
    expect(stopwatch.current).toBe("commit");
    expect(stopwatch.phases).toEqual({ lock: 5 });
    expect("grade" in stopwatch.phases).toBe(false);
  });

  it("どの段階にもいなければ finish は何もしない", () => {
    const stopwatch = createPhaseStopwatch(() => 0);
    stopwatch.finish();
    expect(stopwatch.phases).toEqual({});
    expect(stopwatch.current).toBeUndefined();
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
        failedPhase: "commit",
        phases: { auth: 30, ban: 4, lock: 6, commit: 2000 },
        totalMs: 2040,
        observation: {},
      });
      expect(JSON.parse(info.mock.calls[0][0])).toEqual({
        event: "challenge.answer",
        handling: "failed",
        sequence: 5,
        first: false,
        totalMs: 2040,
        failedPhase: "commit",
        auth: 30,
        ban: 4,
        lock: 6,
        commit: 2000,
      });
    } finally {
      info.mockRestore();
    }
  });

  it("落ちていない回答では failedPhase を出さない", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      logAnswerTiming({
        handling: "rejected",
        failedPhase: "lock",
        phases: { auth: 1 },
        totalMs: 1,
        observation: {},
      });
      expect(JSON.parse(info.mock.calls[0][0])).not.toHaveProperty(
        "failedPhase",
      );
    } finally {
      info.mockRestore();
    }
  });
});
