import { describe, expect, it } from "vitest";

import {
  isMobileDailyProblemErrorCode,
  MOBILE_DAILY_PROBLEM_ANSWER_API_PATH,
  MOBILE_DAILY_PROBLEM_API_PATH,
  parseMobileDailyProblemAnswerResponse,
  parseMobileDailyProblemResponse,
} from "./mobile-api";

/** 222m 456p 789s 234s 東東 を 3s の嵌張でツモ（東場・東家） */
const PAYLOAD = {
  hand: {
    closed: [1, 1, 1, 12, 13, 14, 19, 20, 21, 24, 25, 26, 27, 27],
    exposed: [],
  },
  agariHai: 20,
  isTsumo: true,
  jikaze: 27,
  bakaze: 27,
  doraMarkers: [30],
  riichi: null,
};

/** 送信経路（JSON）を通した形にする。アプリが受け取るのはこれ */
function overTheWire(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

describe("パス", () => {
  it("今日の問題と解答の記録のパス", () => {
    expect(MOBILE_DAILY_PROBLEM_API_PATH).toBe("/api/mobile/v1/daily-problem");
    expect(MOBILE_DAILY_PROBLEM_ANSWER_API_PATH).toBe(
      "/api/mobile/v1/daily-problem/answer",
    );
  });
});

describe("parseMobileDailyProblemResponse", () => {
  it("盤面と自分の解答を読む", () => {
    const body = overTheWire({
      day: "2026-11-17",
      problem: { payload: PAYLOAD },
      answer: { isCorrect: true },
    });
    expect(parseMobileDailyProblemResponse(body)).toEqual({
      day: "2026-11-17",
      problem: { payload: PAYLOAD },
      answer: { isCorrect: true },
    });
  });

  it("今日は問題が無い（problem: null）", () => {
    expect(
      parseMobileDailyProblemResponse({
        day: "2026-11-17",
        problem: null,
        answer: null,
      }),
    ).toEqual({ day: "2026-11-17", problem: null, answer: null });
  });

  it("未解答（answer: null）", () => {
    expect(
      parseMobileDailyProblemResponse(
        overTheWire({
          day: "2026-11-17",
          problem: { payload: PAYLOAD },
          answer: null,
        }),
      ),
    ).toEqual({
      day: "2026-11-17",
      problem: { payload: PAYLOAD },
      answer: null,
    });
  });

  it("壊れた盤面は問題なしと取り違えず undefined", () => {
    const broken = { ...PAYLOAD, hand: { closed: [1, 1, 1], exposed: [] } };
    expect(
      parseMobileDailyProblemResponse({
        day: "2026-11-17",
        problem: { payload: broken },
        answer: null,
      }),
    ).toBe(undefined);
    expect(
      parseMobileDailyProblemResponse({
        day: "2026-11-17",
        problem: { payload: "x" },
        answer: null,
      }),
    ).toBe(undefined);
  });

  it("日付キーの形が違えば undefined", () => {
    // 前後に余計な文字が付いた値も、日付キーを含んでいるだけなので通さない
    for (const day of [
      "2026/11/17",
      "2026-11-7",
      "",
      20261117,
      "12026-11-17",
      "2026-11-170",
      "day 2026-11-17",
      "2026-11-17T00:00:00Z",
    ]) {
      expect(
        parseMobileDailyProblemResponse({ day, problem: null, answer: null }),
      ).toBe(undefined);
    }
  });

  it("形が違えば undefined", () => {
    expect(parseMobileDailyProblemResponse(undefined)).toBe(undefined);
    expect(
      parseMobileDailyProblemResponse({ day: "2026-11-17", problem: null }),
    ).toBe(undefined);
    expect(
      parseMobileDailyProblemResponse({
        day: "2026-11-17",
        problem: null,
        answer: { isCorrect: "yes" },
      }),
    ).toBe(undefined);
  });
});

describe("parseMobileDailyProblemAnswerResponse", () => {
  it("記録した後の自分の解答を読む", () => {
    expect(
      parseMobileDailyProblemAnswerResponse({ answer: { isCorrect: false } }),
    ).toEqual({ answer: { isCorrect: false } });
  });

  it("形が違えば undefined", () => {
    expect(parseMobileDailyProblemAnswerResponse({ answer: null })).toBe(
      undefined,
    );
    expect(parseMobileDailyProblemAnswerResponse({})).toBe(undefined);
  });
});

describe("isMobileDailyProblemErrorCode", () => {
  it("日付の失敗と詳細の 2 つの失敗だけを本日の問題の失敗の理由と認める", () => {
    for (const code of ["staleDay", "unsupportedDetail", "invalidDetail"])
      expect(isMobileDailyProblemErrorCode(code)).toBe(true);
    expect(isMobileDailyProblemErrorCode("unauthorized")).toBe(false);
    expect(isMobileDailyProblemErrorCode(undefined)).toBe(false);
  });
});
