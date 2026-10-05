import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTHENTICATED_USER,
  mockAuthenticateAndCheckBan,
  mockEnforceIpRateLimit,
  setupAuthorized,
} from "@/test/auth-mocks";

const { mockBeginAttempt, mockAnswerAttempt } = vi.hoisted(() => ({
  mockBeginAttempt: vi.fn(),
  mockAnswerAttempt: vi.fn(),
}));

vi.mock("../rate-limit-ip", async () => await import("@/test/auth-mocks"));
vi.mock("../auth", async () => await import("@/test/auth-mocks"));
vi.mock("./attempts", () => ({
  beginAttempt: mockBeginAttempt,
  answerAttempt: mockAnswerAttempt,
  pauseAttempt: vi.fn(),
  revealExpiredAttempt: vi.fn(),
}));

import { answerChallenge, beginChallenge } from "./actions";

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
        1_000_000,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("未認証なら採点に進まない", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "unauthorized" });

    expect(await answerChallenge("attempt-1", 0, 2)).toBeUndefined();
    expect(mockAnswerAttempt).not.toHaveBeenCalled();
  });
});
