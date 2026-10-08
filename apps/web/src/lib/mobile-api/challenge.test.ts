import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const {
  mockAuthorize,
  mockBegin,
  mockAnswer,
  mockPause,
  mockFinish,
  mockStatus,
  mockReveal,
} = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockBegin: vi.fn(),
  mockAnswer: vi.fn(),
  mockPause: vi.fn(),
  mockFinish: vi.fn(),
  mockStatus: vi.fn(),
  mockReveal: vi.fn(),
}));

vi.mock("./auth", () => ({ authorizeMobileRequest: mockAuthorize }));
vi.mock("../challenge/attempts", () => ({
  beginAttempt: mockBegin,
  answerAttempt: mockAnswer,
  pauseAttempt: mockPause,
  finishAttempt: mockFinish,
  readAttemptStatus: mockStatus,
  revealExpiredAttempt: mockReveal,
}));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import {
  handleAnswerChallenge,
  handleBeginChallenge,
  handleFinishChallenge,
  handlePauseChallenge,
  handleReadChallenge,
} from "./challenge";

const ATTEMPT_ID = "6f1c2c1e-8a4e-4c3e-9b1a-2d7c0f0e5a11";
const USER_ID = "user-1";

function post(body: unknown): Request {
  return new Request("https://example.test/api/mobile/v1/challenges", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const STATUS = {
  id: ATTEMPT_ID,
  sequence: 1,
  question: { kind: "q" },
  menuType: "jantou_fu",
  variant: "default",
  settings: { renfonpaiAs4Fu: false },
  score: 1,
  incorrectAnswers: 0,
  elapsedMs: 1000,
  remainingMs: 59_000,
  paused: false,
  finished: false,
  outcome: undefined,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorize.mockResolvedValue({
    ok: true,
    user: { id: USER_ID },
    profile: { username: "alice" },
  });
});

describe("handleBeginChallenge", () => {
  const body = {
    id: ATTEMPT_ID,
    menuType: "jantou_fu",
    variant: "default",
    settings: { renfonpaiAs4Fu: false },
  };

  it("アプリが決めた ID でチャレンジを始め、入口を返す", async () => {
    mockBegin.mockResolvedValue({ id: ATTEMPT_ID, sequence: 0, question: {} });

    const response = await handleBeginChallenge(post(body));

    expect(response.status).toBe(200);
    expect(mockBegin).toHaveBeenCalledWith(
      USER_ID,
      "jantou_fu",
      "default",
      { renfonpaiAs4Fu: false },
      ATTEMPT_ID,
    );
  });

  it("認証で弾かれたら、その応答をそのまま返す", async () => {
    mockAuthorize.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    });

    const response = await handleBeginChallenge(post(body));

    expect(response.status).toBe(401);
    expect(mockBegin).not.toHaveBeenCalled();
  });

  it("ID が UUID でなければ 400", async () => {
    const response = await handleBeginChallenge(post({ ...body, id: "x" }));

    expect(response.status).toBe(400);
    expect(mockBegin).not.toHaveBeenCalled();
  });

  it("本文が JSON でなければ 400", async () => {
    const response = await handleBeginChallenge(post("{"));

    expect(response.status).toBe(400);
  });

  it("昇級試験は始めない（アプリに本番の画面が無い）", async () => {
    const response = await handleBeginChallenge(
      post({ ...body, menuType: "fu_exam" }),
    );

    expect(response.status).toBe(422);
    expect(mockBegin).not.toHaveBeenCalled();
  });

  it("同じ ID の行があるのに返らなければ 409 conflict", async () => {
    mockBegin.mockResolvedValue(undefined);
    mockStatus.mockResolvedValue(STATUS);

    const response = await handleBeginChallenge(post(body));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "conflict" });
  });

  it("行も無く始められなければ 422 invalidChallenge", async () => {
    mockBegin.mockResolvedValue(undefined);
    mockStatus.mockResolvedValue(undefined);

    const response = await handleBeginChallenge(post(body));

    expect(response.status).toBe(422);
  });
});

describe("handleAnswerChallenge", () => {
  it("受け取った時刻を認証より前に取って渡す", async () => {
    let authorizedAt = 0;
    mockAuthorize.mockImplementation(async () => {
      authorizedAt = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { ok: true, user: { id: USER_ID }, profile: undefined };
    });
    mockAnswer.mockResolvedValue({ expired: true });

    await handleAnswerChallenge(post({ sequence: 0, answer: 30 }), ATTEMPT_ID);

    const receivedAt = mockAnswer.mock.calls[0]?.[4];
    expect(receivedAt).toBeLessThanOrEqual(authorizedAt);
  });

  it("受け付けなかったとき、行があれば 409 conflict", async () => {
    mockAnswer.mockResolvedValue(undefined);
    mockStatus.mockResolvedValue(STATUS);

    const response = await handleAnswerChallenge(
      post({ sequence: 0, answer: 30 }),
      ATTEMPT_ID,
    );

    expect(response.status).toBe(409);
  });

  it("受け付けなかったとき、行が無ければ 404", async () => {
    mockAnswer.mockResolvedValue(undefined);
    mockStatus.mockResolvedValue(undefined);

    const response = await handleAnswerChallenge(
      post({ sequence: 0, answer: 30 }),
      ATTEMPT_ID,
    );

    expect(response.status).toBe(404);
  });

  it("大きすぎる回答は読まずに 400", async () => {
    const response = await handleAnswerChallenge(
      post({ sequence: 0, answer: "x".repeat(9000) }),
      ATTEMPT_ID,
    );

    expect(response.status).toBe(400);
    expect(mockAnswer).not.toHaveBeenCalled();
  });
});

describe("handlePauseChallenge", () => {
  it("記録できたら 200", async () => {
    mockPause.mockResolvedValue(true);

    const response = await handlePauseChallenge(
      post({ paused: true }),
      ATTEMPT_ID,
    );

    expect(response.status).toBe(200);
    expect(mockPause).toHaveBeenCalledWith(USER_ID, ATTEMPT_ID, true);
  });
});

describe("handleReadChallenge", () => {
  it("確定の結果は載せず、契約の項目だけを返す", async () => {
    mockStatus.mockResolvedValue({ ...STATUS, outcome: { grantedRanks: [] } });

    const response = await handleReadChallenge(
      new Request("https://example.test"),
      ATTEMPT_ID,
    );

    const body: unknown = await response.json();
    expect(body).not.toHaveProperty("outcome");
    expect(body).toMatchObject({ remainingMs: 59_000, finished: false });
  });

  it("他人の・存在しない ID は 404", async () => {
    mockStatus.mockResolvedValue(undefined);

    const response = await handleReadChallenge(
      new Request("https://example.test"),
      ATTEMPT_ID,
    );

    expect(response.status).toBe(404);
  });
});

describe("handleFinishChallenge", () => {
  const request = () => post({});

  it("記録した成績の ID を返す", async () => {
    mockFinish.mockResolvedValue({ challengeResultId: "result-1" });

    const response = await handleFinishChallenge(request(), ATTEMPT_ID);

    expect(await response.json()).toEqual({ challengeResultId: "result-1" });
    expect(mockFinish).toHaveBeenCalledWith(USER_ID, ATTEMPT_ID, false);
  });

  it("まだ終わっていなければ 409 notFinished", async () => {
    mockFinish.mockResolvedValue(undefined);
    mockStatus.mockResolvedValue(STATUS);

    const response = await handleFinishChallenge(request(), ATTEMPT_ID);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "notFinished" });
  });

  it("確定済みで記録が無い（1 問も答えていない）なら 422", async () => {
    mockFinish.mockResolvedValue(undefined);
    mockStatus.mockResolvedValue({ ...STATUS, finished: true });

    const response = await handleFinishChallenge(request(), ATTEMPT_ID);

    expect(response.status).toBe(422);
  });

  it("DB の失敗は 500（送り直してよい）", async () => {
    mockFinish.mockRejectedValue(new Error("db down"));

    const response = await handleFinishChallenge(request(), ATTEMPT_ID);

    expect(response.status).toBe(500);
  });
});
