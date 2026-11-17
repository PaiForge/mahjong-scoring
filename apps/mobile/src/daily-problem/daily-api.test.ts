import { beforeEach, describe, expect, it, vi } from "vitest";

import { callMobileApi, jsonResponse } from "../test/api-client-mock";

// api-client は React Native を読むので置き換える
vi.mock(
  "../auth/api-client",
  async () => await import("../test/api-client-mock"),
);

import { fetchDailyProblem, sendDailyProblemAnswer } from "./daily-api";

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchDailyProblem", () => {
  it("本人の名義で読み、盤面と自分の解答を返す", async () => {
    const body = {
      day: "2026-11-17",
      problem: { payload: PAYLOAD },
      answer: null,
    };
    callMobileApi.mockResolvedValue(jsonResponse(200, body));

    expect(await fetchDailyProblem("user-a")).toEqual(body);
    expect(callMobileApi).toHaveBeenCalledWith("/api/mobile/v1/daily-problem", {
      asUser: "user-a",
    });
  });

  it("今日は問題が無い日も成功として返す", async () => {
    const body = { day: "2026-11-17", problem: null, answer: null };
    callMobileApi.mockResolvedValue(jsonResponse(200, body));

    expect(await fetchDailyProblem("user-a")).toEqual(body);
  });

  it("盤面が壊れていれば unknown（問題なしと取り違えない）", async () => {
    callMobileApi.mockResolvedValue(
      jsonResponse(200, {
        day: "2026-11-17",
        problem: { payload: { hand: "broken" } },
        answer: null,
      }),
    );

    expect(await fetchDailyProblem("user-a")).toEqual({ error: "unknown" });
  });

  it("送れなかった理由はそのまま返す", async () => {
    callMobileApi.mockResolvedValue("network");

    expect(await fetchDailyProblem("user-a")).toEqual({ error: "network" });
  });
});

describe("sendDailyProblemAnswer", () => {
  it("日付と正誤を本人の名義で送り、記録後の解答を返す", async () => {
    callMobileApi.mockResolvedValue(
      jsonResponse(200, { answer: { isCorrect: false } }),
    );

    expect(await sendDailyProblemAnswer("user-a", "2026-11-17", false)).toEqual(
      { value: { answer: { isCorrect: false } } },
    );
    expect(callMobileApi).toHaveBeenCalledWith(
      "/api/mobile/v1/daily-problem/answer",
      {
        method: "POST",
        body: { day: "2026-11-17", isCorrect: false },
        asUser: "user-a",
      },
    );
  });

  it("日をまたいだ解答（409 staleDay）は staleDay", async () => {
    callMobileApi.mockResolvedValue(jsonResponse(409, { error: "staleDay" }));

    expect(await sendDailyProblemAnswer("user-a", "2026-11-16", true)).toEqual({
      error: "staleDay",
    });
  });

  it("サーバーの一時的な失敗（500）は serverError", async () => {
    callMobileApi.mockResolvedValue(jsonResponse(500, {}));

    expect(await sendDailyProblemAnswer("user-a", "2026-11-17", true)).toEqual({
      error: "serverError",
    });
  });
});
