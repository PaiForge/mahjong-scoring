import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTHENTICATED_USER,
  mockAuthenticateAndCheckBan,
  mockEnforceIpRateLimit,
  mockEnforceUserRateLimit,
  mockIsVerifiedUserUnavailable,
  setupAuthorized,
} from "@/test/auth-mocks";

const { mockBeginAttempt, mockAnswerAttempt, mockRevealExpiredAttempt } =
  vi.hoisted(() => ({
    mockBeginAttempt: vi.fn(),
    mockAnswerAttempt: vi.fn(),
    mockRevealExpiredAttempt: vi.fn(),
  }));

vi.mock("../rate-limit-ip", async () => await import("@/test/auth-mocks"));
vi.mock("../auth", async () => await import("@/test/auth-mocks"));
vi.mock("../log-error", async () => await import("@/test/log-error-mock"));
vi.mock("./attempts", () => ({
  beginAttempt: mockBeginAttempt,
  answerAttempt: mockAnswerAttempt,
  pauseAttempt: vi.fn(),
  revealExpiredAttempt: mockRevealExpiredAttempt,
}));

import {
  answerChallenge,
  beginChallenge,
  revealExpiredChallenge,
} from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  setupAuthorized();
  mockBeginAttempt.mockResolvedValue({ id: "attempt-1" });
});

describe("beginChallenge", () => {
  it("ログイン済みなら枠を数えてから挑戦を作る", async () => {
    expect(await beginChallenge("jantou_fu", "default", {})).toEqual({
      attempt: { id: "attempt-1" },
    });
    expect(mockEnforceIpRateLimit).toHaveBeenCalledWith("beginChallenge");
    expect(mockBeginAttempt).toHaveBeenCalledWith(
      AUTHENTICATED_USER.id,
      "jantou_fu",
      "default",
      {},
    );
  });

  it("枠を超えたら rateLimited で挑戦を作らない", async () => {
    mockEnforceIpRateLimit.mockResolvedValue({ error: "rateLimited" });

    expect(await beginChallenge("jantou_fu", "default", {})).toEqual({
      error: "rateLimited",
    });
    expect(mockBeginAttempt).not.toHaveBeenCalled();
  });

  it("未認証は枠を数えずに unauthorized（非記録モードへ落とす）", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "unauthorized" });

    expect(await beginChallenge("jantou_fu", "default", {})).toEqual({
      error: "unauthorized",
    });
    expect(mockEnforceIpRateLimit).not.toHaveBeenCalled();
    expect(mockBeginAttempt).not.toHaveBeenCalled();
  });

  it("認証サーバーの不通は未ログインと区別し、非記録モードへ落とさない", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "unauthorized" });
    mockIsVerifiedUserUnavailable.mockResolvedValue(true);

    expect(await beginChallenge("jantou_fu", "default", {})).toEqual({
      error: "authUnavailable",
    });
    expect(mockBeginAttempt).not.toHaveBeenCalled();
  });
});

describe("answerChallenge", () => {
  it("受け取った時刻を本人確認より前に取り、採点へ渡す", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(1_000_000);
      // 本人確認に 50ms 掛かっても、受け取った時刻はその前のまま
      mockAuthenticateAndCheckBan.mockImplementation(async () => {
        vi.advanceTimersByTime(50);
        return { user: AUTHENTICATED_USER };
      });
      mockAnswerAttempt.mockResolvedValue({ correct: true });

      expect(await answerChallenge("attempt-1", 0, 2)).toEqual({
        correct: true,
      });
      expect(mockAnswerAttempt).toHaveBeenCalledWith(
        AUTHENTICATED_USER.id,
        "attempt-1",
        0,
        2,
        { receivedAt: 1_000_000 },
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("ログイン済みならアカウント単位の回答の枠を数えてから採点する", async () => {
    mockAnswerAttempt.mockResolvedValue({ correct: true });

    expect(await answerChallenge("attempt-1", 0, 2)).toEqual({
      correct: true,
    });
    expect(mockEnforceUserRateLimit).toHaveBeenCalledWith(
      AUTHENTICATED_USER.id,
      "answerChallenge",
    );
    // IP では数えない（共有 NAT の回答を巻き添えにしない）
    expect(mockEnforceIpRateLimit).not.toHaveBeenCalled();
  });

  it("枠を超えたら rateLimited で、行には触れない", async () => {
    mockEnforceUserRateLimit.mockReturnValue({ error: "rateLimited" });

    expect(await answerChallenge("attempt-1", 0, 2)).toEqual({
      error: "rateLimited",
    });
    expect(mockAnswerAttempt).not.toHaveBeenCalled();
  });

  it("未認証なら unauthorized で採点に進まない", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "unauthorized" });

    expect(await answerChallenge("attempt-1", 0, 2)).toEqual({
      error: "unauthorized",
    });
    expect(mockAnswerAttempt).not.toHaveBeenCalled();
    expect(mockEnforceUserRateLimit).not.toHaveBeenCalled();
  });

  it("認証サーバーの不通は authUnavailable（送り直せる）", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "unauthorized" });
    mockIsVerifiedUserUnavailable.mockResolvedValue(true);

    expect(await answerChallenge("attempt-1", 0, 2)).toEqual({
      error: "authUnavailable",
    });
    expect(mockAnswerAttempt).not.toHaveBeenCalled();
  });

  it("BAN は banned", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "banned" });

    expect(await answerChallenge("attempt-1", 0, 2)).toEqual({
      error: "banned",
    });
  });

  it("挑戦が受け付けなかった回答は rejected", async () => {
    mockAnswerAttempt.mockResolvedValue(undefined);

    expect(await answerChallenge("attempt-1", 0, 2)).toEqual({
      error: "rejected",
    });
  });

  it("採点の例外は unexpectedError に畳んで記録する", async () => {
    mockAnswerAttempt.mockRejectedValue(new Error("db down"));
    const { logExternalError } = await import("../log-error");

    expect(await answerChallenge("attempt-1", 0, 2)).toEqual({
      error: "unexpectedError",
    });
    expect(logExternalError).toHaveBeenCalledWith(
      "answerChallenge",
      "answer failed",
      expect.any(Error),
    );
  });
});

describe("revealExpiredChallenge", () => {
  it("読めた結果はそのまま返し、枠は数えない", async () => {
    mockRevealExpiredAttempt.mockResolvedValue({ remainingMs: 1_200 });

    expect(await revealExpiredChallenge("attempt-1")).toEqual({
      remainingMs: 1_200,
    });
    expect(mockEnforceUserRateLimit).not.toHaveBeenCalled();
    expect(mockEnforceIpRateLimit).not.toHaveBeenCalled();
  });

  it("返せなかったら rejected", async () => {
    mockRevealExpiredAttempt.mockResolvedValue(undefined);

    expect(await revealExpiredChallenge("attempt-1")).toEqual({
      error: "rejected",
    });
  });

  it("認証サーバーの不通は authUnavailable", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "unauthorized" });
    mockIsVerifiedUserUnavailable.mockResolvedValue(true);

    expect(await revealExpiredChallenge("attempt-1")).toEqual({
      error: "authUnavailable",
    });
    expect(mockRevealExpiredAttempt).not.toHaveBeenCalled();
  });

  it("読み出しの例外は unexpectedError に畳む", async () => {
    mockRevealExpiredAttempt.mockRejectedValue(new Error("db down"));

    expect(await revealExpiredChallenge("attempt-1")).toEqual({
      error: "unexpectedError",
    });
  });
});
