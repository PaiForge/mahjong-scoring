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
        expect.any(Function),
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

  describe("計測ログ", () => {
    /** 直近の `console.info` を JSON として読む */
    function lastLogged(info: ReturnType<typeof vi.spyOn>) {
      const line = info.mock.lastCall?.[0];
      return typeof line === "string" ? JSON.parse(line) : undefined;
    }

    it("採点できたら段階の所要時間と直前の回答の往復時間を 1 行に出す", async () => {
      const info = vi.spyOn(console, "info").mockImplementation(() => {});
      try {
        mockAnswerAttempt.mockImplementation(
          async (
            _user: string,
            _id: string,
            _sequence: number,
            _answer: unknown,
            _receivedAt: number,
            lap: (phase: string) => void,
          ) => {
            lap("lock");
            lap("grade");
            lap("update");
            lap("commit");
            return { correct: true, menuType: "jantou_fu" };
          },
        );

        await answerChallenge("attempt-1", 3, 2, {
          previous: { sequence: 2, roundTripMs: 240 },
        });

        expect(lastLogged(info)).toEqual(
          expect.objectContaining({
            event: "challenge.answer",
            handling: "answered",
            menuType: "jantou_fu",
            sequence: 3,
            first: false,
            lock: expect.any(Number),
            grade: expect.any(Number),
            afterRespondedMs: expect.any(Number),
            totalMs: expect.any(Number),
            previousSequence: 2,
            previousClientRoundTripMs: 240,
          }),
        );
      } finally {
        info.mockRestore();
      }
    });

    it("受け付けなかった回答・期限切れ・未認証・BAN も結果の種別で出す", async () => {
      const info = vi.spyOn(console, "info").mockImplementation(() => {});
      try {
        mockAnswerAttempt.mockResolvedValue(undefined);
        await answerChallenge("attempt-1", 0, 2);
        expect(lastLogged(info)).toMatchObject({
          handling: "rejected",
          first: true,
        });
        expect(lastLogged(info)).not.toHaveProperty("afterRespondedMs");

        mockAnswerAttempt.mockResolvedValue({ expired: true });
        await answerChallenge("attempt-1", 0, 2);
        expect(lastLogged(info)).toMatchObject({ handling: "expired" });

        mockAuthenticateAndCheckBan.mockResolvedValue({
          error: "unauthorized",
        });
        await answerChallenge("attempt-1", 0, 2);
        expect(lastLogged(info)).toMatchObject({ handling: "unauthorized" });

        mockAuthenticateAndCheckBan.mockResolvedValue({ error: "banned" });
        await answerChallenge("attempt-1", 0, 2);
        expect(lastLogged(info)).toMatchObject({ handling: "banned" });
      } finally {
        info.mockRestore();
      }
    });

    it("例外で落ちても通った段階までを failed として出し、例外は投げ直す", async () => {
      const info = vi.spyOn(console, "info").mockImplementation(() => {});
      try {
        // 本物のガードと同じく、通った段階を区切ってから返す
        mockAuthenticateAndCheckBan.mockImplementation(
          async (lap: (phase: string) => void) => {
            lap("auth");
            lap("ban");
            return { user: AUTHENTICATED_USER };
          },
        );
        mockAnswerAttempt.mockImplementation(
          async (
            _user: string,
            _id: string,
            _sequence: number,
            _answer: unknown,
            _receivedAt: number,
            lap: (phase: string) => void,
          ) => {
            lap("lock");
            throw new Error("connection reset");
          },
        );

        await expect(answerChallenge("attempt-1", 4, 2)).rejects.toThrow(
          "connection reset",
        );
        expect(lastLogged(info)).toEqual(
          expect.objectContaining({
            handling: "failed",
            sequence: 4,
            failedPhase: "grade",
            lock: expect.any(Number),
            totalMs: expect.any(Number),
          }),
        );
        expect(lastLogged(info)).not.toHaveProperty("afterRespondedMs");
      } finally {
        info.mockRestore();
      }
    });

    it("申告の往復時間が形を成さなければ欠損として出す", async () => {
      const info = vi.spyOn(console, "info").mockImplementation(() => {});
      try {
        mockAnswerAttempt.mockResolvedValue({ correct: true });
        await answerChallenge("attempt-1", 0, 2, {
          previous: { sequence: 0, roundTripMs: -1 },
        });
        expect(lastLogged(info)).not.toHaveProperty(
          "previousClientRoundTripMs",
        );
        expect(lastLogged(info)).not.toHaveProperty("previousSequence");
      } finally {
        info.mockRestore();
      }
    });
  });
});
