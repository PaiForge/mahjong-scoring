import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockProfileExistsByUserId, mockInsert, mockValues } = vi.hoisted(
  () => ({
    mockProfileExistsByUserId: vi.fn(),
    mockInsert: vi.fn(),
    mockValues: vi.fn(),
  }),
);

vi.mock("@/lib/rate-limit-ip", async () => await import("@/test/auth-mocks"));

vi.mock("@/lib/auth", async () => await import("@/test/auth-mocks"));

vi.mock("@/lib/db/queries", () => ({
  profileExistsByUserId: mockProfileExistsByUserId,
}));

vi.mock("@/lib/db", async () => ({
  db: { insert: mockInsert },
  ...(await import("@/test/schema-mock")),
}));

// validateUsername / extractPgErrorCode は純粋関数なので実物を使い、
// 配線（どのエラーコードがそのまま返るか）まで含めて検証する。
import { profiles } from "@/test/schema-mock";
import {
  AUTHENTICATED_USER as USER,
  mockAuthenticateAndCheckBan,
  mockEnforceIpRateLimit,
  setupAuthorized,
} from "@/test/auth-mocks";

import { registerUsername } from "../register-username";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** 認証もレートリミットも通過し、まだプロフィールが無い状態にする */
function authorized() {
  setupAuthorized();
  mockProfileExistsByUserId.mockResolvedValue(false);
}

/** Drizzle の `db.insert(profiles).values({...})` を模す */
function setupInsertChain() {
  mockValues.mockResolvedValue(undefined);
  mockInsert.mockReturnValue({ values: mockValues });
}

/** postgres の SQLSTATE 付きエラーを作る */
function pgError(code: string): Error {
  return Object.assign(new Error(`pg error ${code}`), { code });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("registerUsername", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupInsertChain();
  });

  describe("rate limit", () => {
    it('returns { error: "rateLimited" } when the IP rate limit is exceeded', async () => {
      mockEnforceIpRateLimit.mockResolvedValue({ error: "rateLimited" });

      const result = await registerUsername("alice");

      expect(result).toEqual({ error: "rateLimited" });
    });

    it("does not read auth or DB when rate limited", async () => {
      mockEnforceIpRateLimit.mockResolvedValue({ error: "rateLimited" });

      await registerUsername("alice");

      expect(mockAuthenticateAndCheckBan).not.toHaveBeenCalled();
      expect(mockProfileExistsByUserId).not.toHaveBeenCalled();
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("uses the username rate limit key", async () => {
      authorized();

      await registerUsername("alice");

      expect(mockEnforceIpRateLimit).toHaveBeenCalledWith("username");
    });
  });

  describe("banned user", () => {
    it('returns { error: "banned" } and performs no write', async () => {
      mockEnforceIpRateLimit.mockResolvedValue(undefined);
      mockAuthenticateAndCheckBan.mockResolvedValue({ error: "banned" });

      const result = await registerUsername("alice");

      expect(result).toEqual({ error: "banned" });
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe("unauthenticated user", () => {
    it('returns { error: "unauthorized" } when there is no verified user', async () => {
      mockEnforceIpRateLimit.mockResolvedValue(undefined);
      mockAuthenticateAndCheckBan.mockResolvedValue({
        error: "unauthorized",
      });

      const result = await registerUsername("alice");

      expect(result).toEqual({ error: "unauthorized" });
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe("username validation", () => {
    it('returns { error: "username_required" } for a blank username', async () => {
      authorized();

      const result = await registerUsername("   ");

      expect(result).toEqual({ error: "username_required" });
      expect(mockProfileExistsByUserId).not.toHaveBeenCalled();
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it.each([
      ["a", "too_short"],
      ["this_is_a_very_long_username_x", "too_long"],
      ["Alice", "invalid_format"],
      ["api", "reserved"],
    ])("returns validateUsername's %s error as-is", async (input, expected) => {
      authorized();

      const result = await registerUsername(input);

      expect(result).toEqual({ error: expected });
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe("already registered", () => {
    it('returns { error: "username_already_set" } when a profile already exists', async () => {
      authorized();
      mockProfileExistsByUserId.mockResolvedValue(true);

      const result = await registerUsername("alice");

      expect(result).toEqual({ error: "username_already_set" });
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("checks existence for the authenticated user", async () => {
      authorized();

      await registerUsername("alice");

      expect(mockProfileExistsByUserId).toHaveBeenCalledWith(USER.id);
    });
  });

  describe("successful registration", () => {
    it("returns { success: true }", async () => {
      authorized();

      const result = await registerUsername("alice", "Alice");

      expect(result).toEqual({ success: true });
    });

    it("inserts into profiles with the authenticated user's id", async () => {
      authorized();

      await registerUsername("alice", "Alice");

      expect(mockInsert).toHaveBeenCalledWith(profiles);
      expect(mockValues).toHaveBeenCalledWith({
        id: USER.id,
        username: "alice",
        displayName: "Alice",
      });
    });

    it("trims surrounding whitespace from username and displayName", async () => {
      authorized();

      await registerUsername("  alice  ", "  Alice  ");

      expect(mockValues).toHaveBeenCalledWith({
        id: USER.id,
        username: "alice",
        displayName: "Alice",
      });
    });

    it("falls back to the username when displayName is omitted", async () => {
      authorized();

      await registerUsername("alice");

      expect(mockValues).toHaveBeenCalledWith({
        id: USER.id,
        username: "alice",
        displayName: "alice",
      });
    });

    it("falls back to the username when displayName is blank", async () => {
      authorized();

      await registerUsername("alice", "   ");

      expect(mockValues).toHaveBeenCalledWith({
        id: USER.id,
        username: "alice",
        displayName: "alice",
      });
    });
  });

  describe("insert failures", () => {
    it('maps a UNIQUE violation (23505) to { error: "username_taken" }', async () => {
      authorized();
      mockValues.mockRejectedValue(pgError("23505"));

      const result = await registerUsername("alice");

      expect(result).toEqual({ error: "username_taken" });
    });

    it("maps a UNIQUE violation wrapped in a generic Error via cause", async () => {
      authorized();
      mockValues.mockRejectedValue(
        new Error("Failed query", { cause: pgError("23505") }),
      );

      const result = await registerUsername("alice");

      expect(result).toEqual({ error: "username_taken" });
    });

    it("rethrows other database errors instead of swallowing them", async () => {
      authorized();
      mockValues.mockRejectedValue(pgError("42P01"));

      await expect(registerUsername("alice")).rejects.toThrow("pg error 42P01");
    });
  });
});
