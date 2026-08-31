import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  mockGetOptionalVerifiedUser,
  mockSaveChallengeResult,
  mockCheckAndGrantRanks,
  mockGetUserRankSlugs,
} = vi.hoisted(() => ({
  mockGetOptionalVerifiedUser: vi.fn(),
  mockSaveChallengeResult: vi.fn(),
  mockCheckAndGrantRanks: vi.fn(),
  mockGetUserRankSlugs: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth", () => ({
  getOptionalVerifiedUser: mockGetOptionalVerifiedUser,
}));

vi.mock("../../../../../../lib/db/save-challenge-result", () => ({
  saveChallengeResult: mockSaveChallengeResult,
}));

vi.mock("../../../../../../lib/db/rank-evaluation", () => ({
  checkAndGrantRanks: mockCheckAndGrantRanks,
}));

vi.mock("../../../../../../lib/db/rank-queries", () => ({
  getUserRankSlugs: mockGetUserRankSlugs,
}));

import { savePracticeResult } from "../save-practice-result";
import type { ChallengeFields } from "../save-practice-result";

const validFields: ChallengeFields = {
  score: 8,
  incorrectAnswers: 2,
  timeTaken: 42,
};

describe("savePracticeResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("unauthenticated user", () => {
    it("returns { success: true, skipped: 'anonymous' } when user is not logged in (undefined)", async () => {
      mockGetOptionalVerifiedUser.mockResolvedValue(undefined);

      const result = await savePracticeResult(
        "jantou_fu",
        "default",
        validFields,
      );

      expect(result).toEqual({ success: true, skipped: "anonymous" });
    });

    it("returns { success: true, skipped: 'anonymous' } when user is null", async () => {
      mockGetOptionalVerifiedUser.mockResolvedValue(null);

      const result = await savePracticeResult(
        "jantou_fu",
        "default",
        validFields,
      );

      expect(result).toEqual({ success: true, skipped: "anonymous" });
    });

    it("does not call saveChallengeResult when unauthenticated", async () => {
      mockGetOptionalVerifiedUser.mockResolvedValue(undefined);

      await savePracticeResult("jantou_fu", "default", validFields);

      expect(mockSaveChallengeResult).not.toHaveBeenCalled();
    });
  });

  describe("invalid menuType", () => {
    it("returns invalid_menu_type for unknown menu type", async () => {
      mockGetOptionalVerifiedUser.mockResolvedValue({ id: "user-123" });

      // Force an invalid value through type assertion (simulating runtime mismatch)
      const result = await savePracticeResult(
        "invalid_type" as "jantou_fu",
        "default",
        validFields,
      );

      expect(result).toEqual({ success: false, error: "invalid_menu_type" });
    });

    it("does not call saveChallengeResult for invalid menuType", async () => {
      mockGetOptionalVerifiedUser.mockResolvedValue({ id: "user-123" });

      await savePracticeResult(
        "not_valid" as "jantou_fu",
        "default",
        validFields,
      );

      expect(mockSaveChallengeResult).not.toHaveBeenCalled();
    });
  });

  describe("exam eligibility guard", () => {
    beforeEach(() => {
      mockGetOptionalVerifiedUser.mockResolvedValue({ id: "user-123" });
      mockSaveChallengeResult.mockResolvedValue({ challengeResultId: "cr-1" });
      mockCheckAndGrantRanks.mockResolvedValue([]);
    });

    it("受験資格のない昇級試験は exam_locked で保存しない", async () => {
      // 無級のユーザーが2級の試験（pinfu_exam）の結果を送ってきた場合
      mockGetUserRankSlugs.mockResolvedValue([]);

      const result = await savePracticeResult(
        "pinfu_exam",
        "default",
        validFields,
      );

      expect(result).toEqual({ success: false, error: "exam_locked" });
      expect(mockSaveChallengeResult).not.toHaveBeenCalled();
    });

    it("次に取る級の試験は保存する", async () => {
      mockGetUserRankSlugs.mockResolvedValue(["kyu-5"]);

      const result = await savePracticeResult(
        "fu_exam",
        "default",
        validFields,
      );

      expect(result).toEqual({
        success: true,
        challengeResultId: "cr-1",
        grantedRanks: [],
      });
    });

    it("達成済みの級の試験は再挑戦として保存する", async () => {
      mockGetUserRankSlugs.mockResolvedValue(["kyu-5"]);

      const result = await savePracticeResult(
        "mangan_exam",
        "default",
        validFields,
      );

      expect(result).toEqual({
        success: true,
        challengeResultId: "cr-1",
        grantedRanks: [],
      });
    });

    it("昇級試験でない練習では段級位を照会しない", async () => {
      await savePracticeResult("jantou_fu", "default", validFields);

      expect(mockGetUserRankSlugs).not.toHaveBeenCalled();
      expect(mockSaveChallengeResult).toHaveBeenCalled();
    });
  });

  describe("successful save", () => {
    beforeEach(() => {
      mockGetOptionalVerifiedUser.mockResolvedValue({ id: "user-123" });
      mockSaveChallengeResult.mockResolvedValue({ challengeResultId: "cr-1" });
      mockCheckAndGrantRanks.mockResolvedValue([]);
      // 既定は無級（mangan_exam を受験できる状態）
      mockGetUserRankSlugs.mockResolvedValue([]);
    });

    it("returns success: true with challengeResultId", async () => {
      const result = await savePracticeResult(
        "jantou_fu",
        "default",
        validFields,
      );

      expect(result).toEqual({
        success: true,
        challengeResultId: "cr-1",
        grantedRanks: [],
      });
    });

    it("昇級試験でない練習では昇級判定を走らせない", async () => {
      // 昇級バナーは必ずその試験の結果画面に出る（無関係な練習の結果画面に
      // 唐突に出ない）ことの保証。判定クエリの節約でもある
      const result = await savePracticeResult(
        "jantou_fu",
        "default",
        validFields,
      );

      expect(mockCheckAndGrantRanks).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        challengeResultId: "cr-1",
        grantedRanks: [],
      });
    });

    it("昇級判定の結果を grantedRanks として返す", async () => {
      mockCheckAndGrantRanks.mockResolvedValue(["kyu-5"]);

      const result = await savePracticeResult(
        "mangan_exam",
        "default",
        validFields,
      );

      expect(result).toEqual({
        success: true,
        challengeResultId: "cr-1",
        grantedRanks: ["kyu-5"],
      });
      expect(mockCheckAndGrantRanks).toHaveBeenCalledWith("user-123");
    });

    it("昇級判定の失敗は保存を壊さない（grantedRanks は空で成功を返す）", async () => {
      mockCheckAndGrantRanks.mockRejectedValue(new Error("db down"));

      const result = await savePracticeResult(
        "mangan_exam",
        "default",
        validFields,
      );

      expect(result).toEqual({
        success: true,
        challengeResultId: "cr-1",
        grantedRanks: [],
      });
    });

    it("calls saveChallengeResult with rounded values", async () => {
      const fieldsWithDecimals: ChallengeFields = {
        score: 8.7,
        incorrectAnswers: 2.3,
        timeTaken: 42.9,
      };

      await savePracticeResult("jantou_fu", "default", fieldsWithDecimals);

      expect(mockSaveChallengeResult).toHaveBeenCalledWith({
        userId: "user-123",
        menuType: "jantou_fu",
        leaderboardKey: "default",
        score: 9,
        incorrectAnswers: 2,
        timeTaken: 43,
      });
    });

    it("passes the correct userId from the authenticated user", async () => {
      mockGetOptionalVerifiedUser.mockResolvedValue({ id: "specific-user-id" });

      await savePracticeResult("machi_fu", "default", validFields);

      expect(mockSaveChallengeResult).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "specific-user-id",
          menuType: "machi_fu",
        }),
      );
    });
  });

  describe("unexpected error handling", () => {
    it("returns unexpected_error when saveChallengeResult throws", async () => {
      mockGetOptionalVerifiedUser.mockResolvedValue({ id: "user-123" });
      mockSaveChallengeResult.mockRejectedValue(
        new Error("DB connection lost"),
      );

      const result = await savePracticeResult(
        "jantou_fu",
        "default",
        validFields,
      );

      expect(result).toEqual({ success: false, error: "unexpected_error" });
    });

    it("returns unexpected_error when createClient throws", async () => {
      mockGetOptionalVerifiedUser.mockRejectedValue(
        new Error("Supabase unavailable"),
      );

      const result = await savePracticeResult(
        "jantou_fu",
        "default",
        validFields,
      );

      expect(result).toEqual({ success: false, error: "unexpected_error" });
    });
  });
});
