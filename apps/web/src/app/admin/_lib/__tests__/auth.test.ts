import { describe, expect, it, vi, beforeEach } from "vitest";

import type { QueryChainMock } from "@/test/drizzle-mock";

const { mockGetVerifiedUser, holder, mockNotFound } = vi.hoisted(() => ({
  mockGetVerifiedUser: vi.fn(),
  holder: { chain: undefined as unknown as QueryChainMock },
  mockNotFound: vi.fn((): never => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// Mock next/navigation notFound（呼び出しを検知するため throw する）
vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

// 認証は lib/auth の検証付きユーザー取得に委譲しているので、そこをモックする
vi.mock("../../../../lib/auth", () => ({
  getOptionalVerifiedUser: mockGetVerifiedUser,
}));

// Mock the DB module
vi.mock("../../../../lib/db", async () => {
  const { createQueryChain } = await import("@/test/drizzle-mock");
  const { userRoles } = await import("@/test/schema-mock");
  holder.chain = createQueryChain();
  return {
    db: { select: holder.chain.select },
    userRoles,
  };
});

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

import { requireAdmin, requireAdminPage } from "../auth";

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authenticated admin user", () => {
    it("returns userId on success", async () => {
      const userId = "user-123";
      mockGetVerifiedUser.mockResolvedValue({ id: userId });
      holder.chain.limit.mockResolvedValue([{ userId, role: "admin" }]);

      const result = await requireAdmin();

      expect(result).toEqual({ userId });
    });
  });

  describe("unauthenticated user", () => {
    // Supabase の null は getOptionalVerifiedUser が undefined へ正規化するため、
    // この境界に届く「未認証」は undefined の 1 通りだけになる
    it("returns error when user is not logged in", async () => {
      mockGetVerifiedUser.mockResolvedValue(undefined);

      const result = await requireAdmin();

      expect(result).toEqual({ error: "unauthorized" });
    });
  });

  describe("authenticated but non-admin user", () => {
    it('returns error when user has "user" role', async () => {
      mockGetVerifiedUser.mockResolvedValue({ id: "user-456" });
      holder.chain.limit.mockResolvedValue([
        { userId: "user-456", role: "user" },
      ]);

      const result = await requireAdmin();

      expect(result).toEqual({ error: "unauthorized" });
    });

    it("returns error when user has no role record at all", async () => {
      mockGetVerifiedUser.mockResolvedValue({ id: "user-789" });
      holder.chain.limit.mockResolvedValue([]);

      const result = await requireAdmin();

      expect(result).toEqual({ error: "unauthorized" });
    });
  });

  describe("DB query is called correctly for authenticated users", () => {
    it("queries the userRoles table with the correct userId", async () => {
      const userId = "user-abc";
      mockGetVerifiedUser.mockResolvedValue({ id: userId });
      holder.chain.limit.mockResolvedValue([{ userId, role: "admin" }]);

      await requireAdmin();

      expect(holder.chain.select).toHaveBeenCalledOnce();
      expect(holder.chain.from).toHaveBeenCalledOnce();
      expect(holder.chain.where).toHaveBeenCalledOnce();
      expect(holder.chain.limit).toHaveBeenCalledWith(1);
    });

    it("does not query DB when user is not authenticated", async () => {
      mockGetVerifiedUser.mockResolvedValue(undefined);

      await requireAdmin();

      expect(holder.chain.select).not.toHaveBeenCalled();
    });
  });
});

describe("requireAdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the userId without calling notFound for an admin", async () => {
    const userId = "user-123";
    mockGetVerifiedUser.mockResolvedValue({ id: userId });
    holder.chain.limit.mockResolvedValue([{ userId, role: "admin" }]);

    const result = await requireAdminPage();

    expect(result).toBe(userId);
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("calls notFound for a non-admin user", async () => {
    mockGetVerifiedUser.mockResolvedValue({ id: "user-456" });
    holder.chain.limit.mockResolvedValue([
      { userId: "user-456", role: "user" },
    ]);

    await expect(requireAdminPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledOnce();
  });

  it("calls notFound for an unauthenticated user", async () => {
    mockGetVerifiedUser.mockResolvedValue(undefined);

    await expect(requireAdminPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledOnce();
  });
});
