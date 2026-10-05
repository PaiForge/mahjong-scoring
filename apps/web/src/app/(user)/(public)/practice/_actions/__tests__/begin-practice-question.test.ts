import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetOptionalUser,
  mockEnforceIpRateLimit,
  mockGetActiveBenefits,
  mockConsumeUserQuota,
  mockReadUserQuota,
  mockCanSign,
  mockReadAnonymous,
  mockWriteAnonymous,
  mockIsPlanOnSale,
} = vi.hoisted(() => ({
  mockGetOptionalUser: vi.fn(),
  mockEnforceIpRateLimit: vi.fn(),
  mockGetActiveBenefits: vi.fn(),
  mockConsumeUserQuota: vi.fn(),
  mockReadUserQuota: vi.fn(),
  mockCanSign: vi.fn(),
  mockReadAnonymous: vi.fn(),
  mockWriteAnonymous: vi.fn(),
  mockIsPlanOnSale: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getOptionalUser: mockGetOptionalUser }));
vi.mock("@/lib/billing/env", () => ({ isPlanOnSale: mockIsPlanOnSale }));
vi.mock("@/lib/rate-limit-ip", () => ({
  enforceIpRateLimit: mockEnforceIpRateLimit,
}));
vi.mock("@/lib/entitlements/has-benefit", () => ({
  getActiveBenefits: mockGetActiveBenefits,
}));
vi.mock("@/lib/practice-quota/consume-user-quota", () => ({
  consumeUserQuota: mockConsumeUserQuota,
}));
vi.mock("@/lib/practice-quota/read-user-quota", () => ({
  readUserQuotaUsage: mockReadUserQuota,
}));
vi.mock("@/lib/practice-quota/anonymous-quota-cookie", () => ({
  canSignAnonymousQuota: mockCanSign,
  readAnonymousQuota: mockReadAnonymous,
  writeAnonymousQuota: mockWriteAnonymous,
}));

import {
  beginPracticeQuestion,
  peekPracticeQuota,
} from "../begin-practice-question";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mockEnforceIpRateLimit.mockResolvedValue(undefined);
  mockGetOptionalUser.mockResolvedValue({ id: "u1" });
  mockGetActiveBenefits.mockResolvedValue(new Set());
  mockCanSign.mockReturnValue(true);
  mockReadAnonymous.mockResolvedValue({ score: 0, "machi-score": 0 });
  mockIsPlanOnSale.mockReturnValue(true);
});

describe("beginPracticeQuestion", () => {
  it("回数制限の対象でない練習名は invalidMenu（レート制限より前に弾く）", async () => {
    expect(await beginPracticeQuestion("jantou-fu")).toEqual({
      error: "invalidMenu",
    });
    expect(mockEnforceIpRateLimit).not.toHaveBeenCalled();
  });

  it("IP レート制限に掛かればそのエラーを返す", async () => {
    mockEnforceIpRateLimit.mockResolvedValue({ error: "rateLimited" });
    expect(await beginPracticeQuestion("score")).toEqual({
      error: "rateLimited",
    });
    expect(mockConsumeUserQuota).not.toHaveBeenCalled();
  });

  describe("Pro を販売していない間（Price ID 未設定）", () => {
    beforeEach(() => {
      mockIsPlanOnSale.mockReturnValue(false);
    });

    it("ログイン済みは数えずに無制限で許可し、特典は本物の判定どおり返す", async () => {
      mockGetActiveBenefits.mockResolvedValue(new Set(["practice_tools"]));

      const result = await beginPracticeQuestion("score");

      expect(result).toEqual({
        success: true,
        allowed: true,
        remaining: "unlimited",
        limit: "unlimited",
        signedIn: true,
        benefits: ["practice_tools"],
      });
      expect(mockConsumeUserQuota).not.toHaveBeenCalled();
    });

    it("未ログインも cookie を触らず無制限で許可", async () => {
      mockGetOptionalUser.mockResolvedValue(undefined);
      mockReadAnonymous.mockResolvedValue({ score: 1, "machi-score": 1 });

      const result = await beginPracticeQuestion("score");

      expect(result).toEqual({
        success: true,
        allowed: true,
        remaining: "unlimited",
        limit: "unlimited",
        signedIn: false,
        benefits: [],
      });
      expect(mockReadAnonymous).not.toHaveBeenCalled();
      expect(mockWriteAnonymous).not.toHaveBeenCalled();
    });

    it("IP レート制限は販売の有無に関わらず先に効く", async () => {
      mockEnforceIpRateLimit.mockResolvedValue({ error: "rateLimited" });
      expect(await beginPracticeQuestion("score")).toEqual({
        error: "rateLimited",
      });
    });
  });

  describe("ログイン済み", () => {
    it("Pro（回数無制限）は消費せず常に許可", async () => {
      mockGetActiveBenefits.mockResolvedValue(
        new Set(["unlimited_practice", "practice_tools"]),
      );

      const result = await beginPracticeQuestion("machi-score");

      expect(result).toEqual({
        success: true,
        allowed: true,
        remaining: "unlimited",
        limit: "unlimited",
        signedIn: true,
        benefits: ["unlimited_practice", "practice_tools"],
      });
      expect(mockConsumeUserQuota).not.toHaveBeenCalled();
    });

    it("無料ユーザーは DB で消費し、残りを返す", async () => {
      mockConsumeUserQuota.mockResolvedValue({ allowed: true, remaining: 2 });

      const result = await beginPracticeQuestion("machi-score");

      expect(result).toEqual({
        success: true,
        allowed: true,
        remaining: 2,
        limit: 3,
        signedIn: true,
        benefits: [],
      });
      expect(mockConsumeUserQuota).toHaveBeenCalledWith(
        "u1",
        "machi-score",
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        3,
      );
      expect(mockReadAnonymous).not.toHaveBeenCalled();
    });

    it("上限到達なら allowed: false", async () => {
      mockConsumeUserQuota.mockResolvedValue({ allowed: false, remaining: 0 });

      const result = await beginPracticeQuestion("score");

      expect(result).toEqual(
        expect.objectContaining({ allowed: false, remaining: 0, limit: 5 }),
      );
    });

    it("DB の失敗は許可して通し、ログを残す（fail-open）", async () => {
      mockConsumeUserQuota.mockRejectedValue(new Error("db down"));

      const result = await beginPracticeQuestion("score");

      expect(result).toEqual(
        expect.objectContaining({ allowed: true, remaining: 5, limit: 5 }),
      );
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("未ログイン", () => {
    beforeEach(() => {
      mockGetOptionalUser.mockResolvedValue(undefined);
    });

    it("署名鍵が無ければ数えずに許可する", async () => {
      mockCanSign.mockReturnValue(false);

      const result = await beginPracticeQuestion("score");

      expect(result).toEqual(
        expect.objectContaining({ allowed: true, signedIn: false }),
      );
      expect(mockWriteAnonymous).not.toHaveBeenCalled();
    });

    it("上限未満なら cookie の回数を 1 増やして許可", async () => {
      mockReadAnonymous.mockResolvedValue({ score: 0, "machi-score": 1 });

      const result = await beginPracticeQuestion("score");

      expect(result).toEqual({
        success: true,
        allowed: true,
        remaining: 0,
        limit: 1,
        signedIn: false,
        benefits: [],
      });
      expect(mockWriteAnonymous).toHaveBeenCalledWith(
        { score: 1, "machi-score": 1 },
        expect.any(Date),
      );
    });

    it("上限に達していれば書かずに不許可", async () => {
      mockReadAnonymous.mockResolvedValue({ score: 1, "machi-score": 0 });

      const result = await beginPracticeQuestion("score");

      expect(result).toEqual(
        expect.objectContaining({ allowed: false, remaining: 0, limit: 1 }),
      );
      expect(mockWriteAnonymous).not.toHaveBeenCalled();
      expect(mockGetActiveBenefits).not.toHaveBeenCalled();
    });
  });
});

describe("peekPracticeQuota", () => {
  it("回数制限の対象でない練習名は invalidMenu", async () => {
    expect(await peekPracticeQuota("jantou-fu")).toEqual({
      error: "invalidMenu",
    });
  });

  it("出題とは別の鍵で IP レート制限を掛ける", async () => {
    mockEnforceIpRateLimit.mockResolvedValue({ error: "rateLimited" });
    expect(await peekPracticeQuota("score")).toEqual({ error: "rateLimited" });
    expect(mockEnforceIpRateLimit).toHaveBeenCalledWith("peekPracticeQuota");
  });

  it("Pro を販売していない間は無制限で、特典は本物の判定どおり", async () => {
    mockIsPlanOnSale.mockReturnValue(false);
    mockGetActiveBenefits.mockResolvedValue(new Set(["practice_tools"]));

    expect(await peekPracticeQuota("score")).toEqual({
      success: true,
      allowed: true,
      remaining: "unlimited",
      limit: "unlimited",
      signedIn: true,
      benefits: ["practice_tools"],
    });
    expect(mockReadUserQuota).not.toHaveBeenCalled();
  });

  it("Pro（回数無制限）は DB を読まずに無制限", async () => {
    mockGetActiveBenefits.mockResolvedValue(new Set(["unlimited_practice"]));

    expect(await peekPracticeQuota("machi-score")).toEqual({
      success: true,
      allowed: true,
      remaining: "unlimited",
      limit: "unlimited",
      signedIn: true,
      benefits: ["unlimited_practice"],
    });
    expect(mockReadUserQuota).not.toHaveBeenCalled();
  });

  it("無料ユーザーは DB を読むだけで消費しない", async () => {
    mockReadUserQuota.mockResolvedValue(1);

    expect(await peekPracticeQuota("machi-score")).toEqual({
      success: true,
      allowed: true,
      remaining: 2,
      limit: 3,
      signedIn: true,
      benefits: [],
    });
    expect(mockReadUserQuota).toHaveBeenCalledWith(
      "u1",
      "machi-score",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
    expect(mockConsumeUserQuota).not.toHaveBeenCalled();
  });

  it("残りが 0 なら allowed: false（次の 1 問は始められない）", async () => {
    mockReadUserQuota.mockResolvedValue(5);
    expect(await peekPracticeQuota("score")).toEqual(
      expect.objectContaining({ allowed: false, remaining: 0, limit: 5 }),
    );
  });

  it("DB の失敗はそのまま投げる（表示の取り直しなので通す必要が無い）", async () => {
    mockReadUserQuota.mockRejectedValue(new Error("db down"));
    await expect(peekPracticeQuota("score")).rejects.toThrow("db down");
  });

  describe("未ログイン", () => {
    beforeEach(() => {
      mockGetOptionalUser.mockResolvedValue(undefined);
    });

    it("cookie を読むだけで書かない", async () => {
      mockReadAnonymous.mockResolvedValue({ score: 1, "machi-score": 0 });

      expect(await peekPracticeQuota("score")).toEqual({
        success: true,
        allowed: false,
        remaining: 0,
        limit: 1,
        signedIn: false,
        benefits: [],
      });
      expect(await peekPracticeQuota("machi-score")).toEqual(
        expect.objectContaining({ allowed: true, remaining: 1, limit: 1 }),
      );
      expect(mockWriteAnonymous).not.toHaveBeenCalled();
    });

    it("署名鍵が無ければ上限そのものを返す", async () => {
      mockCanSign.mockReturnValue(false);
      expect(await peekPracticeQuota("score")).toEqual(
        expect.objectContaining({ allowed: true, remaining: 1 }),
      );
      expect(mockReadAnonymous).not.toHaveBeenCalled();
    });
  });
});
