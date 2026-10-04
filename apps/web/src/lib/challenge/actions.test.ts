import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTHENTICATED_USER,
  mockAuthenticateAndCheckBan,
  mockEnforceIpRateLimit,
  setupAuthorized,
} from "@/test/auth-mocks";

const { mockBeginAttempt } = vi.hoisted(() => ({
  mockBeginAttempt: vi.fn(),
}));

vi.mock("../rate-limit-ip", async () => await import("@/test/auth-mocks"));
vi.mock("../auth", async () => await import("@/test/auth-mocks"));
vi.mock("./attempts", () => ({
  beginAttempt: mockBeginAttempt,
  answerAttempt: vi.fn(),
  pauseAttempt: vi.fn(),
  revealExpiredAttempt: vi.fn(),
}));

import { beginChallenge } from "./actions";

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
