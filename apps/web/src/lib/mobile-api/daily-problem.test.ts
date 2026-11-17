// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  authorizeAs,
  mockAuthorizeMobileRequest,
} from "@/test/mobile-auth-mock";
import { mobileJson } from "./response";

const { mockGetDailyProblem, mockReadAnswer, mockRecordAnswer } = vi.hoisted(
  () => ({
    mockGetDailyProblem: vi.fn(),
    mockReadAnswer: vi.fn(),
    mockRecordAnswer: vi.fn(),
  }),
);

vi.mock("./auth", async () => await import("@/test/mobile-auth-mock"));
vi.mock("../daily-problem/today", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getDailyProblem: mockGetDailyProblem,
}));
vi.mock("../daily-problem/answers", () => ({
  readDailyProblemAnswer: mockReadAnswer,
  recordDailyProblemAnswer: mockRecordAnswer,
}));
vi.mock("../log-error", async () => await import("@/test/log-error-mock"));

import {
  handleReadDailyProblem,
  handleRecordDailyProblemAnswer,
} from "./daily-problem";
import { postJsonRequest } from "@/test/request";

// 2026-11-17 01:00 JST（UTC では前日）。日付キーが JST で決まることを兼ねて確かめる
const NOW = new Date("2026-11-16T16:00:00Z");
const TODAY = "2026-11-17";
const PAYLOAD = { kind: "agari", marker: "payload" };

function getRequest(): Request {
  return new Request("https://example.test/api/mobile/v1/daily-problem");
}

function answerRequest(body: unknown): Request {
  return postJsonRequest(
    "https://example.test/api/mobile/v1/daily-problem/answer",
    body,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.stubEnv("DAILY_PROBLEM_DISABLED", "");
  authorizeAs({ userId: "user-1", username: "alice" });
  mockGetDailyProblem.mockResolvedValue({ day: TODAY, payload: PAYLOAD });
  mockReadAnswer.mockResolvedValue(undefined);
  mockRecordAnswer.mockResolvedValue({
    kind: "recorded",
    answer: { isCorrect: true },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("handleReadDailyProblem", () => {
  it("今日（JST）の問題とトークンの本人の解答を返す", async () => {
    mockReadAnswer.mockResolvedValue({ isCorrect: false });

    const response = await handleReadDailyProblem(getRequest());

    expect(response.status).toBe(200);
    expect(mockReadAnswer).toHaveBeenCalledWith("user-1", TODAY);
    expect(await response.json()).toEqual({
      day: TODAY,
      problem: { payload: PAYLOAD },
      answer: { isCorrect: false },
    });
  });

  it("未解答なら answer は null", async () => {
    const response = await handleReadDailyProblem(getRequest());

    expect(await response.json()).toMatchObject({ answer: null });
  });

  it("問題が無い日も 200 で problem は null", async () => {
    mockGetDailyProblem.mockResolvedValue(undefined);

    const response = await handleReadDailyProblem(getRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      day: TODAY,
      problem: null,
      answer: null,
    });
  });

  it("ユーザー名を決める前でも読める", async () => {
    authorizeAs({ userId: "user-1" });

    const response = await handleReadDailyProblem(getRequest());

    expect(response.status).toBe(200);
  });

  it("認証で拒否されたらその応答を返し、DB を読まない", async () => {
    mockAuthorizeMobileRequest.mockResolvedValue({
      ok: false,
      response: mobileJson({ error: "unauthorized" }, { status: 401 }),
    });

    const response = await handleReadDailyProblem(getRequest());

    expect(response.status).toBe(401);
    expect(mockGetDailyProblem).not.toHaveBeenCalled();
    expect(mockReadAnswer).not.toHaveBeenCalled();
  });

  it("DB の失敗は 500 serverError", async () => {
    mockGetDailyProblem.mockRejectedValue(new Error("db down"));

    const response = await handleReadDailyProblem(getRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "serverError" });
  });
});

describe("handleRecordDailyProblemAnswer", () => {
  it("トークンの本人の正誤を記録し、保存された解答を返す", async () => {
    const response = await handleRecordDailyProblemAnswer(
      answerRequest({ day: TODAY, isCorrect: true }),
    );

    expect(response.status).toBe(200);
    expect(mockRecordAnswer).toHaveBeenCalledWith(
      "user-1",
      TODAY,
      true,
      expect.any(Date),
    );
    expect(await response.json()).toEqual({ answer: { isCorrect: true } });
  });

  it("解き直しで送られても保存されている最初の解答を返す", async () => {
    mockRecordAnswer.mockResolvedValue({
      kind: "recorded",
      answer: { isCorrect: false },
    });

    const response = await handleRecordDailyProblemAnswer(
      answerRequest({ day: TODAY, isCorrect: true }),
    );

    expect(await response.json()).toEqual({ answer: { isCorrect: false } });
  });

  it("日付をまたいだ解答・問題の無い日は 409 staleDay", async () => {
    mockRecordAnswer.mockResolvedValue({ kind: "staleDay" });

    const response = await handleRecordDailyProblemAnswer(
      answerRequest({ day: "2026-11-16", isCorrect: true }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "staleDay" });
  });

  it("止めている間は記録せず 409 staleDay", async () => {
    vi.stubEnv("DAILY_PROBLEM_DISABLED", "1");

    const response = await handleRecordDailyProblemAnswer(
      answerRequest({ day: TODAY, isCorrect: true }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "staleDay" });
    expect(mockRecordAnswer).not.toHaveBeenCalled();
  });

  it("ユーザー名を決める前でも記録できる", async () => {
    authorizeAs({ userId: "user-1" });

    const response = await handleRecordDailyProblemAnswer(
      answerRequest({ day: TODAY, isCorrect: true }),
    );

    expect(response.status).toBe(200);
  });

  it.each([
    ["正誤が無い", { day: TODAY }],
    ["正誤が真偽値でない", { day: TODAY, isCorrect: "yes" }],
    ["日付の形が違う", { day: "2026/11/17", isCorrect: true }],
    ["壊れた JSON", "{"],
  ])("本文の形が違えば記録せず 400（%s）", async (_, body) => {
    const response = await handleRecordDailyProblemAnswer(answerRequest(body));

    expect(response.status).toBe(400);
    expect(mockRecordAnswer).not.toHaveBeenCalled();
  });

  it("本文に userId を混ぜても誰の解答かはトークンで決める", async () => {
    await handleRecordDailyProblemAnswer(
      answerRequest({ day: TODAY, isCorrect: true, userId: "user-2" }),
    );

    expect(mockRecordAnswer).toHaveBeenCalledWith(
      "user-1",
      TODAY,
      true,
      expect.any(Date),
    );
  });

  it("DB の失敗は 500 serverError", async () => {
    mockRecordAnswer.mockRejectedValue(new Error("db down"));

    const response = await handleRecordDailyProblemAnswer(
      answerRequest({ day: TODAY, isCorrect: true }),
    );

    expect(response.status).toBe(500);
  });
});
