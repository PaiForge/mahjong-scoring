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
  requestAccountDeletion: mockDeleteAccount,
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
    mockDeleteAccount.mockResolvedValue("completed");
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
   * 本人による退会は BAN の対象にしない。受付は冪等なので、退会処理中の
   * 送り直しも通す。どちらも認証ゲートに退会の受付だと伝えて決める。
   */
  it("認証ゲートに退会の受付だと伝える（BAN 中・退会処理中も通す）", async () => {
    authorized();

    await deleteOwnAccount();

    expect(mockAuthenticateAndCheckBan).toHaveBeenCalledWith({
      forAccountDeletion: true,
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
    it('returns { error: "deleteFailed" } when the request could not be accepted', async () => {
      authorized();
      mockDeleteAccount.mockRejectedValue(new Error("db down"));

      const result = await deleteOwnAccount();

      expect(result).toEqual({ error: "deleteFailed" });
    });

    it("does not write an activity log when deletion failed", async () => {
      authorized();
      mockDeleteAccount.mockRejectedValue(new Error("db down"));

      await deleteOwnAccount();

      expect(mockLogActivityEvent).not.toHaveBeenCalled();
    });
  });

  describe("successful deletion", () => {
    it("returns { success: true } with the deletion status", async () => {
      authorized();

      const result = await deleteOwnAccount();

      expect(result).toEqual({ success: true, status: "completed" });
    });

    /**
     * 工程の一部（Storage・Auth）が一時障害で残っても、受付は成立している。
     * 残りはサーバーが再開するので失敗として返さない。
     */
    it("returns pending as a success when some steps remain", async () => {
      authorized();
      mockDeleteAccount.mockResolvedValue("pending");

      const result = await deleteOwnAccount();

      expect(result).toEqual({ success: true, status: "pending" });
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
