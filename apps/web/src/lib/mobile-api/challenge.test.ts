import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  authorizeAs,
  mockAuthorizeMobileRequest,
} from "@/test/mobile-auth-mock";
import { NextResponse } from "next/server";

const {
  mockBegin,
  mockAnswer,
  mockPause,
  mockFinish,
  mockStatus,
  mockReveal,
  mockExp,
  mockComparison,
  mockRankSlugs,
} = vi.hoisted(() => ({
  mockBegin: vi.fn(),
  mockAnswer: vi.fn(),
  mockPause: vi.fn(),
  mockFinish: vi.fn(),
  mockStatus: vi.fn(),
  mockReveal: vi.fn(),
  mockExp: vi.fn(),
  mockComparison: vi.fn(),
  mockRankSlugs: vi.fn(),
}));

vi.mock("./auth", async () => await import("@/test/mobile-auth-mock"));
vi.mock("../challenge/attempts", () => ({
  beginAttempt: mockBegin,
  answerAttempt: mockAnswer,
  pauseAttempt: mockPause,
  finishAttempt: mockFinish,
  readAttemptStatus: mockStatus,
  revealExpiredAttempt: mockReveal,
}));
vi.mock("../db/save-exp", () => ({
  getExpInfoByChallengeResultId: mockExp,
}));
vi.mock("../db/score-comparison-queries", () => ({
  getScoreComparison: mockComparison,
}));
vi.mock("../db/rank-queries", () => ({ getUserRankSlugs: mockRankSlugs }));
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
  authorizeAs({ userId: USER_ID, username: "alice" });
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
    mockAuthorizeMobileRequest.mockResolvedValue({
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

  it("昇級試験も同じ入口で始める", async () => {
    mockBegin.mockResolvedValue({ id: ATTEMPT_ID, sequence: 0, question: {} });

    const response = await handleBeginChallenge(
      post({ ...body, menuType: "fu_exam" }),
    );

    expect(response.status).toBe(200);
    expect(mockBegin).toHaveBeenCalledWith(
      USER_ID,
      "fu_exam",
      "default",
      { renfonpaiAs4Fu: false },
      ATTEMPT_ID,
    );
  });

  it("受験資格の無い昇級試験は 403 examLocked", async () => {
    mockBegin.mockResolvedValue(undefined);
    mockStatus.mockResolvedValue(undefined);
    // 5級（満貫）を持たずに 4級（符）の試験を受けようとした
    mockRankSlugs.mockResolvedValue([]);

    const response = await handleBeginChallenge(
      post({ ...body, menuType: "fu_exam" }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "examLocked" });
  });

  it("練習なら受験資格を読まない", async () => {
    mockBegin.mockResolvedValue(undefined);
    mockStatus.mockResolvedValue(undefined);

    await handleBeginChallenge(post(body));

    expect(mockRankSlugs).not.toHaveBeenCalled();
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
    mockAuthorizeMobileRequest.mockImplementation(async () => {
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

  const EXP = {
    earnedExp: 12,
    totalExp: 340,
    level: 3,
    levelUp: false,
    progressPercent: 40,
  };

  const RECORDED = {
    challengeResultId: "result-1",
    menuType: "jantou_fu",
    variant: "default",
  };

  const run = (score: number, incorrectAnswers = 1) => ({
    score,
    incorrectAnswers,
    timeTaken: 60,
  });

  it("記録した成績の ID・付いた経験値・過去の記録との比較を返す", async () => {
    mockFinish.mockResolvedValue(RECORDED);
    mockExp.mockResolvedValue(EXP);
    mockComparison.mockResolvedValue({
      current: run(7),
      previousBest: run(6),
      previousLast: run(4),
    });

    const response = await handleFinishChallenge(request(), ATTEMPT_ID);

    expect(await response.json()).toEqual({
      challengeResultId: "result-1",
      exp: EXP,
      comparison: {
        status: "newBest",
        currentScore: 7,
        previousBestScore: 6,
        previousLastScore: 4,
        diffFromLast: 3,
      },
    });
    expect(mockFinish).toHaveBeenCalledWith(USER_ID, ATTEMPT_ID, false);
    expect(mockExp).toHaveBeenCalledWith(USER_ID, "result-1");
    // 比べるのは今回と同じ土俵（練習種別とバリアント）の記録
    expect(mockComparison).toHaveBeenCalledWith(
      USER_ID,
      "jantou_fu",
      "default",
      "result-1",
    );
  });

  it("初めての記録は比較に過去の値を持たない", async () => {
    mockFinish.mockResolvedValue(RECORDED);
    mockExp.mockResolvedValue(undefined);
    mockComparison.mockResolvedValue({
      current: run(5),
      previousBest: undefined,
      previousLast: undefined,
    });

    const response = await handleFinishChallenge(request(), ATTEMPT_ID);

    expect(await response.json()).toEqual({
      challengeResultId: "result-1",
      comparison: { status: "first", currentScore: 5 },
    });
  });

  it("経験値・比較を読めなくても確定は成功にする（記録は済んでいる）", async () => {
    mockFinish.mockResolvedValue(RECORDED);
    mockExp.mockRejectedValue(new Error("db down"));
    mockComparison.mockRejectedValue(new Error("db down"));

    const response = await handleFinishChallenge(request(), ATTEMPT_ID);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ challengeResultId: "result-1" });
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

  it("昇級試験は合否を判定し、付与した段級位を返す", async () => {
    mockFinish
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ grantedRanks: ["kyu-5"] });
    mockStatus.mockResolvedValue({
      ...STATUS,
      menuType: "fu_exam",
      finished: true,
    });

    const response = await handleFinishChallenge(request(), ATTEMPT_ID);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ grantedRanks: ["kyu-5"] });
    expect(mockFinish).toHaveBeenLastCalledWith(USER_ID, ATTEMPT_ID, true);
    expect(mockExp).not.toHaveBeenCalled();
  });

  it("まだ終わっていない昇級試験は 409 notFinished", async () => {
    mockFinish.mockResolvedValue(undefined);
    mockStatus.mockResolvedValue({ ...STATUS, menuType: "fu_exam" });

    const response = await handleFinishChallenge(request(), ATTEMPT_ID);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "notFinished" });
  });

  it("DB の失敗は 500（送り直してよい）", async () => {
    mockFinish.mockRejectedValue(new Error("db down"));

    const response = await handleFinishChallenge(request(), ATTEMPT_ID);

    expect(response.status).toBe(500);
  });
});
