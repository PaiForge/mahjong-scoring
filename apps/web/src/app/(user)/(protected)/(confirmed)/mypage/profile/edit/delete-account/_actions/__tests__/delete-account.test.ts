import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const {
  mockEnforceIpRateLimit,
  mockGetOptionalVerifiedUser,
  mockDeleteAccount,
  mockLogActivityEvent,
} = vi.hoisted(() => ({
  mockEnforceIpRateLimit: vi.fn(),
  mockGetOptionalVerifiedUser: vi.fn(),
  mockDeleteAccount: vi.fn(),
  mockLogActivityEvent: vi.fn(),
}));

vi.mock("@/lib/rate-limit-ip", () => ({
  enforceIpRateLimit: mockEnforceIpRateLimit,
}));

vi.mock("@/lib/auth", () => ({
  getOptionalVerifiedUser: mockGetOptionalVerifiedUser,
}));

vi.mock("@/lib/users/delete-account", () => ({
  deleteAccount: mockDeleteAccount,
}));

vi.mock("@/lib/activity-log", () => ({
  logActivityEvent: mockLogActivityEvent,
}));

import { deleteOwnAccount } from "../delete-account";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER = { id: "user-123", email: "user@example.com" };

/** 認証もレートリミットも通過した状態にする */
function authorized() {
  mockEnforceIpRateLimit.mockResolvedValue(undefined);
  mockGetOptionalVerifiedUser.mockResolvedValue(USER);
}

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

      expect(mockGetOptionalVerifiedUser).not.toHaveBeenCalled();
      expect(mockDeleteAccount).not.toHaveBeenCalled();
      expect(mockLogActivityEvent).not.toHaveBeenCalled();
    });

    it("uses the deleteAccount rate limit key", async () => {
      authorized();

      await deleteOwnAccount();

      expect(mockEnforceIpRateLimit).toHaveBeenCalledWith("deleteAccount");
    });
  });

  describe("unauthenticated user", () => {
    it('returns { error: "unauthorized" } when there is no verified user', async () => {
      mockEnforceIpRateLimit.mockResolvedValue(undefined);
      mockGetOptionalVerifiedUser.mockResolvedValue(undefined);

      const result = await deleteOwnAccount();

      expect(result).toEqual({ error: "unauthorized" });
    });

    it("never deletes when unauthenticated", async () => {
      mockEnforceIpRateLimit.mockResolvedValue(undefined);
      mockGetOptionalVerifiedUser.mockResolvedValue(undefined);

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
