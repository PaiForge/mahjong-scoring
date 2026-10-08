import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockDeleteAccount, mockLogActivityEvent } = vi.hoisted(() => ({
  mockDeleteAccount: vi.fn(),
  mockLogActivityEvent: vi.fn(),
}));

vi.mock("@/lib/rate-limit-ip", async () => await import("@/test/auth-mocks"));

vi.mock("@/lib/auth", async () => await import("@/test/auth-mocks"));

vi.mock("@/lib/users/delete-account", () => ({
  deleteAccount: mockDeleteAccount,
}));

vi.mock("@/lib/activity-log", () => ({
  logActivityEvent: mockLogActivityEvent,
}));

import {
  AUTHENTICATED_USER as USER,
  mockAuthenticateAndCheckBan,
  mockEnforceIpRateLimit,
  setupAuthorized,
} from "@/test/auth-mocks";

import { deleteOwnAccount } from "../delete-account";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** 認証もレートリミットも通過した状態にする */
const authorized = setupAuthorized;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("deleteOwnAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteAccount.mockResolvedValue({ success: true });
  });

  describe("rate limit", () => {
    it('returns { error: "rateLimited" } when the IP rate limit is exceeded', async () => {
      mockEnforceIpRateLimit.mockResolvedValue({ error: "rateLimited" });

      const result = await deleteOwnAccount();

      expect(result).toEqual({ error: "rateLimited" });
    });

    it("does not read auth or delete anything when rate limited", async () => {
      mockEnforceIpRateLimit.mockResolvedValue({ error: "rateLimited" });

      await deleteOwnAccount();

      expect(mockAuthenticateAndCheckBan).not.toHaveBeenCalled();
      expect(mockDeleteAccount).not.toHaveBeenCalled();
      expect(mockLogActivityEvent).not.toHaveBeenCalled();
    });

    it("uses the deleteAccount rate limit key", async () => {
      authorized();

      await deleteOwnAccount();

      expect(mockEnforceIpRateLimit).toHaveBeenCalledWith("deleteAccount");
    });
  });

  /**
   * 退会は Auth の削除を最後に行うので、そこで失敗した人は退会済みの
   * プロフィールのままログインしている。やり直しを認証ゲートで弾かない。
   */
  it("退会済みのプロフィールでも通す（途中で失敗した退会のやり直し）", async () => {
    authorized();

    await deleteOwnAccount();

    expect(mockAuthenticateAndCheckBan).toHaveBeenCalledWith({
      allowDeleted: true,
    });
    expect(mockDeleteAccount).toHaveBeenCalledWith(USER.id);
  });

  describe("banned user", () => {
    it('returns { error: "banned" } and performs no write', async () => {
      mockEnforceIpRateLimit.mockResolvedValue(undefined);
      mockAuthenticateAndCheckBan.mockResolvedValue({ error: "banned" });

      const result = await deleteOwnAccount();

      expect(result).toEqual({ error: "banned" });
      expect(mockDeleteAccount).not.toHaveBeenCalled();
    });
  });

  describe("unauthenticated user", () => {
    it('returns { error: "unauthorized" } when there is no verified user', async () => {
      mockEnforceIpRateLimit.mockResolvedValue(undefined);
      mockAuthenticateAndCheckBan.mockResolvedValue({
        error: "unauthorized",
      });

      const result = await deleteOwnAccount();

      expect(result).toEqual({ error: "unauthorized" });
    });

    it("never deletes when unauthenticated", async () => {
      mockEnforceIpRateLimit.mockResolvedValue(undefined);
      mockAuthenticateAndCheckBan.mockResolvedValue({
        error: "unauthorized",
      });

      await deleteOwnAccount();

      expect(mockDeleteAccount).not.toHaveBeenCalled();
      expect(mockLogActivityEvent).not.toHaveBeenCalled();
    });
  });

  describe("deletion failure", () => {
    it("passes the deleteAccount error through unchanged", async () => {
      authorized();
      mockDeleteAccount.mockResolvedValue({ error: "deleteFailed" });

      const result = await deleteOwnAccount();

      expect(result).toEqual({ error: "deleteFailed" });
    });

    it("does not write an activity log when deletion failed", async () => {
      authorized();
      mockDeleteAccount.mockResolvedValue({ error: "deleteFailed" });

      await deleteOwnAccount();

      expect(mockLogActivityEvent).not.toHaveBeenCalled();
    });
  });

  describe("successful deletion", () => {
    it("returns { success: true }", async () => {
      authorized();

      const result = await deleteOwnAccount();

      expect(result).toEqual({ success: true });
    });

    it("deletes the authenticated user's account", async () => {
      authorized();

      await deleteOwnAccount();

      expect(mockDeleteAccount).toHaveBeenCalledWith(USER.id);
    });

    it("writes a delete_account activity log for that user", async () => {
      authorized();

      await deleteOwnAccount();

      expect(mockLogActivityEvent).toHaveBeenCalledWith({
        userId: USER.id,
        action: "delete_account",
        targetType: "user",
        targetId: USER.id,
      });
    });
  });
});
